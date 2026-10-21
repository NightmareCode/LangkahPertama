/* Langkah Pertama · RSVP + Ucapan (modul dikongsi tema 1-8)
 * Bahagian: <section id="kehadiran" data-endpoint="https://script.google.com/macros/s/<id>/exec" data-slug="<slug>">
 * Tersembunyi (atribut hidden / data-lp-rsvp) = modul tidak berbuat apa-apa, tiada permintaan rangkaian.
 *
 * Adapter (semua memulangkan Promise):
 *   hantarRsvp({nama, kehadiran:'ya'|'tidak'|'mungkin', pax, rid, catatan}) -> {ok, dikemaskini?}
 *   hantarUcapan({nama, ucapan})         -> {ok, papar?}
 *   senaraiUcapan()                      -> [{nama, ucapan, masa}]   SATU-SATUNYA data awam
 *   buka()                               -> {ok}  ping "kad dibuka" (hanya jika data-kaunter="1"; sekali sehari / peranti)
 * Data RSVP tidak pernah dibaca semula oleh pelayar; ia hanya dalam Google Sheet pasangan.
 * Serasi: markup lama (tanpa pilihan Mungkin / medan catatan) tetap berfungsi; jawapan tersimpan lama {hadir:true|false} dibaca.
 * CSP: connect-src https://script.google.com https://script.googleusercontent.com
 */
(function (global) {
  'use strict';
  var HAD = { nama: 60, ucapanNama: 40, ucapan: 300, paxMin: 1, paxMax: 10, catatan: 100 };
  var KEHADIRAN = { ya: 1, tidak: 1, mungkin: 1 };
  var ENDPOINT_RE = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{10,}\/exec$/;
  var SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var MESEJ = {
    NAMA_TIDAK_SAH: ['nama', 'Sila masukkan nama anda (sekurang-kurangnya 2 huruf).'],
    NAMA_TERLALU_PANJANG: ['nama', 'Nama terlalu panjang.'],
    HADIR_TIDAK_SAH: ['hadir', 'Sila pilih sama ada anda hadir atau tidak.'],
    PAX_TIDAK_SAH: ['pax', 'Bilangan tetamu mestilah antara 1 hingga 10 orang.'],
    CATATAN_TERLALU_PANJANG: ['catatan', 'Catatan terlalu panjang (maksimum 100 aksara).'],
    UCAPAN_KOSONG: ['ucapan', 'Sila tulis ucapan anda.'],
    UCAPAN_TERLALU_PANJANG: ['ucapan', 'Ucapan terlalu panjang (maksimum 300 aksara).'],
    RSVP_DITUTUP: ['umum', 'Tempoh pengesahan kehadiran telah tamat. Terima kasih.'],
    KAD_TIDAK_AKTIF: ['umum', 'Kad ini tidak menerima jawapan buat masa ini.'],
    TERLALU_KERAP: ['umum', 'Terlalu banyak cubaan. Sila cuba lagi sebentar lagi.'],
    SIBUK: ['umum', 'Sistem sibuk. Sila cuba lagi.']
  };

  function bersih(s, max) {
    return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, ' ')
      .replace(/\s+/g, ' ').trim().slice(0, max);
  }
  function simpan(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function ambil(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function ridBaru() {
    var a = new Uint8Array(12), s = '';
    (global.crypto || {}).getRandomValues ? global.crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.random() * 256; });
    for (var i = 0; i < a.length; i++) s += ('0' + a[i].toString(16)).slice(-2);
    return s;                                                  /* 24 aksara hex, sepadan RID_RE pelayan */
  }

  function fetchJson(url, opt) {
    var ctl = global.AbortController ? new AbortController() : null, t = ctl && setTimeout(function () { ctl.abort(); }, 20000);
    if (ctl) opt.signal = ctl.signal;
    return fetch(url, opt).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .finally(function () { if (t) clearTimeout(t); });
  }

  var adapters = {
    appsScript: function (cfg) {
      function post(body) {
        body.slug = cfg.slug;
        /* text/plain = "simple request": tiada CORS preflight ke Apps Script */
        return fetchJson(cfg.endpoint, { method: 'POST', redirect: 'follow', credentials: 'omit',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
      }
      return {
        hantarRsvp: function (r) { return post({ action: 'rsvp', nama: r.nama, hadir: r.kehadiran, pax: r.kehadiran === 'ya' ? r.pax : 0, rid: r.rid, catatan: r.catatan || '', laman_web: '' }); },
        buka: function () { return post({ action: 'buka' }); },
        hantarUcapan: function (u) { return post({ action: 'ucapan', nama: u.nama, ucapan: u.ucapan, laman_web: '' }); },
        senaraiUcapan: function () {
          return fetchJson(cfg.endpoint + '?action=ucapan&slug=' + encodeURIComponent(cfg.slug), { method: 'GET', credentials: 'omit' })
            .then(function (j) { if (!j || !j.ok) throw new Error((j && j.ralat) || 'ralat'); return j.ucapan || []; });
        }
      };
    },
    /* Pratonton luar talian: localStorage pelayar ini sahaja (tiada rangkaian) */
    demo: function (cfg) {
      var k = 'lp-rsvp-demo:' + cfg.slug;
      function d() { return ambil(k) || { rsvp: [], ucapan: [] }; }
      return {
        hantarRsvp: function (r) { var x = d(); x.rsvp = x.rsvp.filter(function (y) { return y.rid !== r.rid; }); x.rsvp.push(Object.assign({ masa: new Date().toISOString() }, r)); simpan(k, x); return Promise.resolve({ ok: true }); },
        hantarUcapan: function (u) { var x = d(); x.ucapan.push({ nama: u.nama, ucapan: u.ucapan, masa: new Date().toISOString() }); simpan(k, x); return Promise.resolve({ ok: true, papar: true }); },
        buka: function () { var x = d(); x.buka = (x.buka || 0) + 1; simpan(k, x); return Promise.resolve({ ok: true }); },
        senaraiUcapan: function () { return Promise.resolve(d().ucapan.slice().reverse()); }
      };
    }
  };

  function sahRsvp(f) {
    var e = {}, nama = bersih(f.nama, 500), catatan = bersih(f.catatan, 500);
    if (nama.length < 2) e.nama = MESEJ.NAMA_TIDAK_SAH[1];
    else if (nama.length > HAD.nama) e.nama = 'Nama terlalu panjang (maksimum ' + HAD.nama + ' aksara).';
    if (!KEHADIRAN.hasOwnProperty(f.hadir)) e.hadir = 'Sila pilih jawapan kehadiran anda.';
    var ps = String(f.pax == null ? '' : f.pax).trim(), pax = parseInt(ps, 10);
    if (f.hadir === 'ya' && (!/^\d{1,2}$/.test(ps) || pax < HAD.paxMin || pax > HAD.paxMax)) e.pax = MESEJ.PAX_TIDAK_SAH[1];
    if (catatan.length > HAD.catatan) e.catatan = MESEJ.CATATAN_TERLALU_PANJANG[1];
    return { ralat: e, data: { nama: nama, kehadiran: f.hadir, pax: f.hadir === 'ya' ? pax : 0, catatan: catatan } };
  }
  /* jawapan tersimpan: format lama {hadir:true|false} -> {kehadiran:'ya'|'tidak'} */
  function normalJawapan(s) {
    if (!s || typeof s !== 'object') return null;
    var k = KEHADIRAN.hasOwnProperty(s.kehadiran) ? s.kehadiran : (s.hadir === true ? 'ya' : s.hadir === false ? 'tidak' : '');
    if (!k) return null;
    return { rid: s.rid, nama: s.nama, kehadiran: k, pax: k === 'ya' ? s.pax : 0, catatan: typeof s.catatan === 'string' ? s.catatan : '' };
  }
  function sahUcapan(f) {
    var e = {}, nama = bersih(f.nama, 500), u = bersih(f.ucapan, 2000);
    if (nama.length < 2) e.nama = MESEJ.NAMA_TIDAK_SAH[1];
    else if (nama.length > HAD.ucapanNama) e.nama = 'Nama terlalu panjang (maksimum ' + HAD.ucapanNama + ' aksara).';
    if (u.length < 2) e.ucapan = MESEJ.UCAPAN_KOSONG[1];
    else if (u.length > HAD.ucapan) e.ucapan = 'Ucapan terlalu panjang (maksimum ' + HAD.ucapan + ' aksara).';
    return { ralat: e, data: { nama: nama, ucapan: u } };
  }
  function ralatPelayan(res) {
    var m = res && MESEJ[res.ralat], o = {};
    o[m ? m[0] : 'umum'] = m ? m[1] : 'Maaf, berlaku ralat. Sila cuba lagi.';
    return o;
  }

  global.LPRsvp = { HAD: HAD, ENDPOINT_RE: ENDPOINT_RE, SLUG_RE: SLUG_RE, adapters: adapters, sahRsvp: sahRsvp,
    sahUcapan: sahUcapan, bersih: bersih, ralatPelayan: ralatPelayan, ridBaru: ridBaru, normalJawapan: normalJawapan,
    buat: function (cfg) { var a = adapters[cfg.adapter || 'appsScript']; if (!a) throw new Error('Adapter tidak dikenali'); return a(cfg); } };
})(window);

/* ---------------- UI tetamu ---------------- */
(function () {
  'use strict';
  var root = document.getElementById('kehadiran');
  if (!root || root.hidden || root.hasAttribute('data-lp-rsvp')) return;     /* tersembunyi di demo awam */
  var R = window.LPRsvp, slug = root.getAttribute('data-slug') || '', endpoint = root.getAttribute('data-endpoint') || '';
  var adapter = root.getAttribute('data-adapter') || 'appsScript';
  if (!R.SLUG_RE.test(slug) || (adapter === 'appsScript' && !R.ENDPOINT_RE.test(endpoint))) {
    root.hidden = true; return;                                                /* konfigurasi rosak: jangan tunjuk borang mati */
  }
  var api = R.buat({ adapter: adapter, endpoint: endpoint, slug: slug });
  var KUNCI = 'lp-rsvp:' + slug;
  var BULAN = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  function $(id) { return document.getElementById(id); }
  function jawapanLama() { try { return R.normalJawapan(JSON.parse(localStorage.getItem(KUNCI) || 'null')); } catch (e) { return null; } }

  /* ---- kaunter buka (pilihan): sekali sehari setiap peranti, tidak pernah mengganggu tetamu ---- */
  if (root.getAttribute('data-kaunter') === '1' && api.buka) {
    var KB = 'lp-buka:' + slug, hari = new Date().toISOString().slice(0, 10), akhir = null;
    try { akhir = localStorage.getItem(KB); } catch (x) {}
    if (akhir !== hari) {
      try { localStorage.setItem(KB, hari); } catch (x) {}
      setTimeout(function () { api.buka().catch(function () {}); }, 1500);
    }
  }

  function tunjukRalat(form, ralat) {
    var first = null;
    form.querySelectorAll('[data-ralat]').forEach(function (p) {
      var k = p.getAttribute('data-ralat'), msg = ralat[k] || '';
      p.textContent = msg; p.hidden = !msg;
      var inp = form.querySelector('[data-medan="' + k + '"]');
      if (inp) { if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
      if (msg && !first) first = inp || p;
    });
    if (first) { if (first.tabIndex < 0 && !/^(INPUT|TEXTAREA|BUTTON)$/.test(first.tagName)) first.setAttribute('tabindex', '-1'); first.focus(); }
    return !first;
  }
  function sibuk(form, ya) {
    var b = form.querySelector('[type="submit"]');
    if (!b.getAttribute('data-asal')) b.setAttribute('data-asal', b.textContent);
    b.disabled = ya; b.setAttribute('aria-busy', ya ? 'true' : 'false');
    b.textContent = ya ? 'Menghantar…' : b.getAttribute('data-asal');
  }
  function jebak(form) { var h = form.querySelector('.lp-hp input'); return h && h.value.trim() !== ''; }

  /* ---- RSVP ---- */
  var fr = $('borang-rsvp'), paxWrap = $('rsvp-pax-wrap'), paxIn = $('rsvp-pax'), done = $('rsvp-selesai');
  var catIn = $('rsvp-catatan'), catKira = $('rsvp-catatan-kiraan');          /* pilihan: markup lama tiada */
  function kemasCatatan() { if (catIn && catKira) { var n = catIn.value.length; catKira.textContent = n + ' / ' + R.HAD.catatan; catKira.classList.toggle('lebih', n > R.HAD.catatan); } }
  if (catIn) { catIn.addEventListener('input', kemasCatatan); kemasCatatan(); }
  function segerakPax() {
    var h = fr.querySelector('input[name="hadir"]:checked'), ya = !!h && h.value === 'ya';
    paxWrap.hidden = !ya; paxIn.disabled = !ya; if (ya && !paxIn.value) paxIn.value = '1';
  }
  fr.addEventListener('change', function (e) { if (e.target.name === 'hadir') segerakPax(); });
  root.querySelectorAll('[data-pax]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = parseInt(paxIn.value, 10) || 1;
      paxIn.value = Math.min(R.HAD.paxMax, Math.max(R.HAD.paxMin, v + parseInt(b.getAttribute('data-pax'), 10)));
    });
  });
  function paparSelesai(s, dikemaskini) {
    fr.hidden = true; done.hidden = false;
    done.querySelector('[data-isi="tajuk"]').textContent = 'Terima kasih, ' + s.nama + '!';
    var tambah = dikemaskini ? ' (Jawapan dikemas kini.)' : '';
    done.querySelector('[data-isi="ringkas"]').textContent = s.kehadiran === 'ya'
      ? 'Kehadiran anda direkodkan: ' + s.pax + ' orang.' + tambah
      : s.kehadiran === 'mungkin'
        ? 'Jawapan anda direkodkan: mungkin hadir. Sila kemas kini jawapan apabila sudah pasti.' + tambah
        : 'Jawapan anda direkodkan: tidak dapat hadir. Doa anda amat dihargai.' + tambah;
  }
  segerakPax();
  var lama = jawapanLama();
  if (lama && lama.rid && lama.nama) paparSelesai(lama, false);
  fr.addEventListener('submit', function (e) {
    e.preventDefault();
    var h = fr.querySelector('input[name="hadir"]:checked');
    var s = R.sahRsvp({ nama: fr.elements.nama.value, hadir: h ? h.value : '', pax: paxIn.value, catatan: catIn ? catIn.value : '' });
    if (!tunjukRalat(fr, s.ralat)) return;
    if (jebak(fr)) { paparSelesai(s.data, false); done.focus(); return; }       /* honeypot: pura-pura berjaya */
    var simpanan = jawapanLama();
    s.data.rid = (simpanan && simpanan.rid) || R.ridBaru();
    sibuk(fr, true);
    api.hantarRsvp(s.data).then(function (res) {
      sibuk(fr, false);
      if (!res || !res.ok) { tunjukRalat(fr, R.ralatPelayan(res)); return; }
      try { localStorage.setItem(KUNCI, JSON.stringify({ rid: s.data.rid, nama: s.data.nama, kehadiran: s.data.kehadiran, pax: s.data.pax, catatan: s.data.catatan })); } catch (x) {}
      paparSelesai(s.data, res.dikemaskini); done.focus();
    }).catch(function () { sibuk(fr, false); tunjukRalat(fr, { umum: 'Maaf, sambungan gagal. Sila semak internet anda dan cuba lagi.' }); });
  });
  $('rsvp-ubah').addEventListener('click', function () {
    var s = jawapanLama();
    if (s) {
      fr.elements.nama.value = s.nama || '';
      var r = fr.querySelector('input[name="hadir"][value="' + s.kehadiran + '"]'); if (r) r.checked = true;
      paxIn.value = s.kehadiran === 'ya' ? s.pax : ''; segerakPax();
      if (catIn) { catIn.value = s.catatan || ''; kemasCatatan(); }
    }
    done.hidden = true; fr.hidden = false; fr.elements.nama.focus();
  });

  /* ---- Ucapan ---- */
  var fu = $('borang-ucapan'), ta = $('ucapan-teks'), kira = $('ucapan-kiraan'), wall = $('dinding-ucapan');
  var kosong = $('ucapan-kosong'), jumlah = $('ucapan-jumlah'), lagi = $('ucapan-lagi'), senarai = [], ditunjuk = 0, LANGKAH = 20;
  function kemasKira() { var n = ta.value.length; kira.textContent = n + ' / ' + R.HAD.ucapan; kira.classList.toggle('lebih', n > R.HAD.ucapan); }
  ta.addEventListener('input', kemasKira); kemasKira();
  function tarikh(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear(); }
  function item(u) {
    var li = document.createElement('li'), b = document.createElement('p'), n = document.createElement('p');
    b.className = 'lp-ucapan-teks'; b.textContent = u.ucapan;            /* textContent: tiada HTML tetamu */
    n.className = 'lp-ucapan-nama'; n.textContent = '— ' + u.nama;
    var t = tarikh(u.masa); if (t) { var sp = document.createElement('span'); sp.className = 'lp-ucapan-masa'; sp.textContent = ' · ' + t; n.appendChild(sp); }
    li.appendChild(b); li.appendChild(n); return li;
  }
  function lukis(tambah) {
    var hingga = Math.min(senarai.length, ditunjuk + (tambah || 0));
    for (var i = ditunjuk; i < hingga; i++) wall.appendChild(item(senarai[i]));
    ditunjuk = hingga;
    kosong.hidden = senarai.length > 0;
    jumlah.textContent = senarai.length ? senarai.length + ' ucapan' : '';
    lagi.hidden = ditunjuk >= senarai.length;
  }
  lagi.addEventListener('click', function () { lukis(LANGKAH); });
  var dimuat = false;
  function muat() {
    if (dimuat) return; dimuat = true;
    kosong.textContent = 'Memuatkan ucapan…'; kosong.hidden = false;
    api.senaraiUcapan().then(function (list) {
      senarai = (list || []).filter(function (u) { return u && u.nama && u.ucapan; }); wall.textContent = ''; ditunjuk = 0;
      kosong.textContent = 'Belum ada ucapan. Jadilah yang pertama!'; lukis(LANGKAH);
    }).catch(function () { kosong.textContent = 'Ucapan tidak dapat dimuatkan buat masa ini.'; kosong.hidden = false; });
  }
  /* Muat dinding hanya bila tetamu menghampiri bahagian ini (jimat kuota Apps Script) */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { if (en.some(function (x) { return x.isIntersecting; })) { io.disconnect(); muat(); } }, { rootMargin: '800px 0px' });
    io.observe(root);
  } else { muat(); }

  fu.addEventListener('submit', function (e) {
    e.preventDefault();
    var s = R.sahUcapan({ nama: fu.elements.nama.value, ucapan: ta.value });
    if (!tunjukRalat(fu, s.ralat)) return;
    var st = $('ucapan-status');
    function ok(papar) {
      fu.reset(); kemasKira();
      st.textContent = papar ? 'Terima kasih! Ucapan anda telah ditambah.' : 'Terima kasih! Ucapan anda akan dipaparkan selepas disemak.';
      st.hidden = false;
      if (papar) {
        senarai.unshift({ nama: s.data.nama, ucapan: s.data.ucapan, masa: new Date().toISOString() });
        wall.insertBefore(item(senarai[0]), wall.firstChild); ditunjuk++; lukis(0);
      }
    }
    if (jebak(fu)) { ok(true); return; }
    sibuk(fu, true); st.hidden = true;
    api.hantarUcapan(s.data).then(function (res) {
      sibuk(fu, false);
      if (!res || !res.ok) { tunjukRalat(fu, R.ralatPelayan(res)); return; }
      ok(res.papar !== false);
    }).catch(function () { sibuk(fu, false); tunjukRalat(fu, { umum: 'Maaf, sambungan gagal. Sila semak internet anda dan cuba lagi.' }); });
  });
})();
