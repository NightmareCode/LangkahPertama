/* RSVP + Ucapan (Langkah Pertama) — lapisan adapter boleh tukar.
 * Antara muka adapter (semua kembalikan Promise):
 *   hantarRsvp({nama, hadir, pax})  -> {ok:true}
 *   hantarUcapan({nama, ucapan})     -> {ok:true}
 *   senaraiUcapan()                  -> [{nama, ucapan, masa}]   (SATU-SATUNYA data awam)
 * Adapter 'demo' = localStorage pelayar ini sahaja. Paparan pasangan (pasangan.html) membaca
 * data RSVP penuh HANYA dalam mod demo; dalam versi sebenar senarai RSVP dibaca terus dari
 * Google Sheet milik pasangan dan TIDAK pernah dihantar ke pelayar tetamu.
 */
(function (global) {
  'use strict';
  var HAD = { nama: 60, ucapanNama: 40, ucapan: 300, paxMin: 1, paxMax: 10 };

  function kunci(id) { return 'lp-rsvp:' + id; }
  function baca(id) {
    try { var d = JSON.parse(localStorage.getItem(kunci(id)) || '{}'); return { rsvp: d.rsvp || [], ucapan: d.ucapan || [] }; }
    catch (e) { return { rsvp: [], ucapan: [] }; }
  }
  function tulis(id, d) { localStorage.setItem(kunci(id), JSON.stringify(d)); }
  function bersih(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }

  var adapters = {
    demo: function (cfg) {
      var id = cfg.kadId;
      return {
        nama: 'demo',
        hantarRsvp: function (r) {
          var d = baca(id), mine = localStorage.getItem(kunci(id) + ':saya');
          var row = { id: mine || ('r' + Date.now().toString(36)), nama: r.nama, hadir: r.hadir, pax: r.hadir ? r.pax : 0, masa: new Date().toISOString() };
          d.rsvp = d.rsvp.filter(function (x) { return x.id !== row.id; }); d.rsvp.push(row);
          tulis(id, d); localStorage.setItem(kunci(id) + ':saya', row.id);
          return Promise.resolve({ ok: true, dikemaskini: !!mine });
        },
        hantarUcapan: function (u) {
          var d = baca(id); d.ucapan.push({ nama: u.nama, ucapan: u.ucapan, masa: new Date().toISOString() });
          tulis(id, d); return Promise.resolve({ ok: true });
        },
        senaraiUcapan: function () {
          return Promise.resolve(baca(id).ucapan.map(function (u) { return { nama: u.nama, ucapan: u.ucapan, masa: u.masa }; }).reverse());
        },
        /* demo sahaja: paparan pasangan */
        _semua: function () { return baca(id); },
        _padam: function () { localStorage.removeItem(kunci(id)); localStorage.removeItem(kunci(id) + ':saya'); }
      };
    },
    /* Lakaran adapter Apps Script (TIDAK aktif; tiada URL dikonfigurasi).
       Perlu CSP: connect-src https://script.google.com https://script.googleusercontent.com */
    appsScript: function (cfg) {
      function post(jenis, data) {
        if (!cfg.url) return Promise.reject(new Error('URL Apps Script belum dikonfigurasi'));
        return fetch(cfg.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ jenis: jenis, kad: cfg.kadId, data: data }) }).then(function (r) { return r.json(); });
      }
      return {
        nama: 'appsScript',
        hantarRsvp: function (r) { return post('rsvp', r); },
        hantarUcapan: function (u) { return post('ucapan', u); },
        senaraiUcapan: function () {
          if (!cfg.url) return Promise.reject(new Error('URL Apps Script belum dikonfigurasi'));
          return fetch(cfg.url + '?kad=' + encodeURIComponent(cfg.kadId)).then(function (r) { return r.json(); }).then(function (j) { return j.ucapan || []; });
        }
      };
    }
  };

  function sahRsvp(f) {
    var e = {}, nama = bersih(f.nama, HAD.nama + 1);
    if (nama.length < 2) e.nama = 'Sila masukkan nama anda (sekurang-kurangnya 2 huruf).';
    else if (nama.length > HAD.nama) e.nama = 'Nama terlalu panjang (maksimum ' + HAD.nama + ' aksara).';
    if (f.hadir !== 'ya' && f.hadir !== 'tidak') e.hadir = 'Sila pilih sama ada anda hadir atau tidak.';
    var pax = parseInt(f.pax, 10);
    if (f.hadir === 'ya' && (!/^\d+$/.test(String(f.pax).trim()) || pax < HAD.paxMin || pax > HAD.paxMax)) e.pax = 'Bilangan tetamu mestilah antara ' + HAD.paxMin + ' hingga ' + HAD.paxMax + ' orang.';
    return { ralat: e, data: { nama: nama, hadir: f.hadir === 'ya', pax: f.hadir === 'ya' ? pax : 0 } };
  }
  function sahUcapan(f) {
    var e = {}, nama = bersih(f.nama, HAD.ucapanNama + 1), u = bersih(f.ucapan, HAD.ucapan + 1);
    if (nama.length < 2) e.nama = 'Sila masukkan nama anda (sekurang-kurangnya 2 huruf).';
    else if (nama.length > HAD.ucapanNama) e.nama = 'Nama terlalu panjang (maksimum ' + HAD.ucapanNama + ' aksara).';
    if (u.length < 2) e.ucapan = 'Sila tulis ucapan anda.';
    else if (u.length > HAD.ucapan) e.ucapan = 'Ucapan terlalu panjang (maksimum ' + HAD.ucapan + ' aksara).';
    return { ralat: e, data: { nama: nama, ucapan: u } };
  }

  global.LPRsvp = { adapters: adapters, HAD: HAD, sahRsvp: sahRsvp, sahUcapan: sahUcapan, bersih: bersih,
    buat: function (cfg) { var a = adapters[cfg.adapter || 'demo']; if (!a) throw new Error('Adapter tidak dikenali'); return a(cfg); } };
})(window);

/* ---------------- UI tetamu (hanya jika borang wujud) ---------------- */
(function () {
  'use strict';
  var root = document.getElementById('kehadiran'); if (!root) return;
  var R = window.LPRsvp, api = R.buat({ adapter: root.getAttribute('data-adapter') || 'demo', kadId: root.getAttribute('data-kad') });

  function tunjukRalat(form, ralat) {
    var first = null;
    form.querySelectorAll('[data-ralat]').forEach(function (p) {
      var k = p.getAttribute('data-ralat'), msg = ralat[k] || '';
      p.textContent = msg; p.hidden = !msg;
      var inp = form.querySelector('[data-medan="' + k + '"]');
      if (inp) { if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
      if (msg && !first) first = form.querySelector('[data-medan="' + k + '"]') || form.querySelector('[name="' + k + '"]');
    });
    if (first) first.focus();
    return !first;
  }
  function jebak(form) { var h = form.querySelector('.lp-hp input'); return h && h.value.trim() !== ''; }

  /* RSVP */
  var fr = document.getElementById('borang-rsvp'), paxWrap = document.getElementById('rsvp-pax-wrap'), paxIn = document.getElementById('rsvp-pax');
  function segerakPax() {
    var ya = fr.querySelector('input[name="hadir"]:checked'); ya = ya && ya.value === 'ya';
    paxWrap.hidden = !ya; paxIn.disabled = !ya; if (ya && !paxIn.value) paxIn.value = '1';
  }
  fr.addEventListener('change', function (e) { if (e.target.name === 'hadir') segerakPax(); });
  document.querySelectorAll('[data-pax]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = parseInt(paxIn.value, 10) || 1; v = Math.min(R.HAD.paxMax, Math.max(R.HAD.paxMin, v + parseInt(b.getAttribute('data-pax'), 10)));
      paxIn.value = v; paxIn.dispatchEvent(new Event('input'));
    });
  });
  segerakPax();
  fr.addEventListener('submit', function (e) {
    e.preventDefault();
    var h = fr.querySelector('input[name="hadir"]:checked');
    var s = R.sahRsvp({ nama: fr.nama.value, hadir: h ? h.value : '', pax: paxIn.value });
    if (!tunjukRalat(fr, s.ralat)) return;
    var done = document.getElementById('rsvp-selesai');
    var tamat = function (res) {
      fr.hidden = true; done.hidden = false;
      done.querySelector('[data-isi="tajuk"]').textContent = 'Terima kasih, ' + s.data.nama + '!';
      done.querySelector('[data-isi="ringkas"]').textContent = s.data.hadir
        ? 'Kehadiran anda direkodkan: ' + s.data.pax + ' orang.' + (res && res.dikemaskini ? ' (Jawapan dikemas kini.)' : '')
        : 'Jawapan anda direkodkan: tidak dapat hadir. Doa anda amat dihargai.';
      done.focus();
    };
    if (jebak(fr)) { tamat({}); return; }               /* honeypot: pura-pura berjaya, tiada simpanan */
    api.hantarRsvp(s.data).then(tamat).catch(function () { tunjukRalat(fr, { nama: 'Maaf, jawapan tidak dapat dihantar. Cuba lagi.' }); });
  });
  document.getElementById('rsvp-ubah').addEventListener('click', function () {
    document.getElementById('rsvp-selesai').hidden = true; fr.hidden = false; fr.nama.focus();
  });

  /* Ucapan */
  var fu = document.getElementById('borang-ucapan'), ta = document.getElementById('ucapan-teks'), kira = document.getElementById('ucapan-kiraan'), wall = document.getElementById('dinding-ucapan');
  function kemasKira() { var n = ta.value.length; kira.textContent = n + ' / ' + R.HAD.ucapan; kira.classList.toggle('lebih', n > R.HAD.ucapan); }
  ta.addEventListener('input', kemasKira); kemasKira();
  function lukis() {
    api.senaraiUcapan().then(function (list) {
      wall.innerHTML = '';
      document.getElementById('ucapan-kosong').hidden = list.length > 0;
      document.getElementById('ucapan-jumlah').textContent = list.length ? list.length + ' ucapan' : '';
      list.forEach(function (u) {
        var li = document.createElement('li'), b = document.createElement('p'), n = document.createElement('p');
        b.className = 'lp-ucapan-teks'; b.textContent = u.ucapan;          /* textContent: tiada HTML tetamu */
        n.className = 'lp-ucapan-nama'; n.textContent = '— ' + u.nama;
        li.appendChild(b); li.appendChild(n); wall.appendChild(li);
      });
    });
  }
  fu.addEventListener('submit', function (e) {
    e.preventDefault();
    var s = R.sahUcapan({ nama: fu.nama.value, ucapan: ta.value });
    if (!tunjukRalat(fu, s.ralat)) return;
    var st = document.getElementById('ucapan-status');
    var ok = function () { fu.reset(); kemasKira(); st.textContent = 'Terima kasih! Ucapan anda telah ditambah.'; st.hidden = false; lukis(); };
    if (jebak(fu)) { ok(); return; }
    api.hantarUcapan(s.data).then(ok).catch(function () { st.textContent = 'Maaf, ucapan tidak dapat dihantar. Cuba lagi.'; st.hidden = false; });
  });
  lukis();
})();
