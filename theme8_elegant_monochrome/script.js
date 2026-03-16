document.addEventListener("DOMContentLoaded", () => {

    // --- 1. Audio and Preview Logic ---
    const bgMusic = document.getElementById("bg-music");
    const musicControl = document.getElementById("music-control");
    const isPreview = window.location.hash === "#preview";
    
    if (isPreview) {
        document.getElementById('cover-page').style.display = 'none';
        document.getElementById('main-content').classList.remove('hidden');
        document.body.style.overflow = "auto";
        if(musicControl) musicControl.style.display = 'none';

        let scrollPos = 0;
        const scrollMax = document.body.scrollHeight - window.innerHeight;
        setInterval(() => {
            if (scrollPos >= scrollMax) {
                scrollPos = 0;
            } else {
                scrollPos += 2; 
            }
            window.scrollTo(0, scrollPos);
        }, 30);
    } else {
        document.body.style.overflow = "hidden";
    }

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
                if (targetVolume === 0) audio.pause();
            }
        }, stepTime);
    }

    // --- 2. Cover Page Logic ---
    const openBtn = document.getElementById("open-btn");
    if (openBtn && !isPreview) {
        openBtn.addEventListener("click", () => {
            const coverPage = document.getElementById("cover-page");
            coverPage.classList.add("hide");
            
            setTimeout(() => {
                coverPage.style.display = "none";
                document.getElementById("main-content").classList.remove("hidden");
                document.body.style.overflow = "auto";
                
                bgMusic.volume = 0;
                bgMusic.play().then(() => {
                    fadeAudio(bgMusic, 1, 1500);
                    if(musicControl) musicControl.classList.add("playing");
                }).catch(e => console.log("Audio autoplay prevented by browser"));
                
                checkAnimations();
            }, 1000);
        });
    }

    // --- 3. Music Control ---
    if (musicControl && !isPreview) {
        musicControl.addEventListener("click", () => {
            if (bgMusic.paused) {
                bgMusic.volume = 0;
                bgMusic.play().then(() => {
                    fadeAudio(bgMusic, 1, 1000);
                    musicControl.classList.add("playing");
                });
            } else {
                fadeAudio(bgMusic, 0, 1000);
                musicControl.classList.remove("playing");
            }
        });
    }

    // --- 4. Scroll Animations ---
    const animatedElements = document.querySelectorAll(".slide-in, .slide-in-left, .slide-in-right");
    
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                animationObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => {
        animationObserver.observe(el);
    });

    function checkAnimations() {
        animatedElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add("visible");
            }
        });
    }

    // --- 5. Countdown Timer ---
    const targetDate = new Date("December 12, 2026 08:00:00").getTime();

    const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            clearInterval(timerInterval);
            const cd = document.querySelector(".countdown-mono");
            if(cd) cd.innerHTML = "<p style='font-family:var(--font-serif); font-size:24px; letter-spacing:5px;'>HARI BAHAGIA</p>";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("days").innerText = days.toString().padStart(2, '0');
        document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
        document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
        document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');
    }, 1000);

});
