document.addEventListener('DOMContentLoaded', () => {

    // --- Dynamic Guest Name ---
    // Check if we are in preview mode (hash #preview instead of query string for local file:// support)
    const isPreview = window.location.hash === '#preview';
    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('to') || 'Valued Guest';
    document.getElementById('guest-name').textContent = guestName;

    // --- Open Invitation Logic ---
    const openBtn = document.getElementById('open-btn');
    const cover = document.getElementById('cover');
    const mainContent = document.getElementById('main-content');
    const bgMusic = document.getElementById('bg-music');
    const musicPlayer = document.querySelector('.record-anim');
    
    let isPlaying = false;

    // --- Audio Fade Helper ---
    function fadeAudio(audio, targetVolume, duration) {
        if (audio.fadeInterval) clearInterval(audio.fadeInterval);
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = (targetVolume - audio.volume) / steps;
        
        let currentStep = 0;
        audio.fadeInterval = setInterval(() => {
            currentStep++;
            let newVolume = audio.volume + volumeStep;
            if (newVolume > 1) newVolume = 1;
            if (newVolume < 0) newVolume = 0;
            audio.volume = newVolume;
            
            if (currentStep >= steps) {
                clearInterval(audio.fadeInterval);
                audio.volume = targetVolume;
                if (targetVolume === 0) {
                    audio.pause();
                }
            }
        }, stepTime);
    }

    openBtn.addEventListener('click', () => {
        cover.classList.add('hide');
        mainContent.classList.remove('hidden');
        
        if(bgMusic.getAttribute('src')) {
            bgMusic.volume = 0;
            bgMusic.play().then(() => {
                fadeAudio(bgMusic, 1, 1500); // 1.5s fade in
                isPlaying = true;
                musicPlayer.classList.add('playing');
            }).catch(e => console.log('Audio error:', e));
        }

        setTimeout(() => {
            const elements = document.querySelectorAll('.fade-in-up, .scale-in, .rotate-in');
            elements.forEach(el => observer.observe(el));
        }, 500);
    });

    if (isPreview) {
        cover.style.display = 'none';
        mainContent.classList.remove('hidden');
        setTimeout(() => {
            const elementsToAnimate = document.querySelectorAll('.fade-in-up, .scale-in, .rotate-in');
            elementsToAnimate.forEach(el => observer.observe(el));
            
            // Simulated native scrolling for catalog previews
            setInterval(() => {
                window.scrollBy(0, 1.5);
                if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 5) {
                    window.scrollTo(0, 0);
                }
            }, 20); // 50fps smooth scroll
        }, 100);
    }

    // --- Music Toggle ---
    document.getElementById('music-player').addEventListener('click', () => {
        if (isPreview) return;
        if (!bgMusic.getAttribute('src')) return;
        if (isPlaying) {
            fadeAudio(bgMusic, 0, 1000); // 1s fade out
            musicPlayer.classList.remove('playing');
        } else {
            bgMusic.play().then(() => {
                fadeAudio(bgMusic, 1, 1000); // 1s fade in
                musicPlayer.classList.add('playing');
            });
        }
        isPlaying = !isPlaying;
    });

    // --- Scroll Reveal Animations ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    // --- Countdown Timer ---
    const weddingDate = new Date('Dec 12, 2026 08:00:00').getTime();

    const countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        if (distance < 0) {
            clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').innerText = String(days).padStart(2, '0');
        document.getElementById('hours').innerText = String(hours).padStart(2, '0');
        document.getElementById('minutes').innerText = String(minutes).padStart(2, '0');
        document.getElementById('seconds').innerText = String(seconds).padStart(2, '0');
    }, 1000);

});
