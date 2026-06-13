(async function() {
    const config = window.app.getConfig();
    const drinkBtn = document.getElementById('drink-btn');
    const reminderTextEl = document.getElementById('reminder-text');
    const mainImage = document.getElementById('main-image');

    reminderTextEl.innerText = config.reminderText || 'Time to Hydrate!';
    mainImage.src = config.image || 'HYDRATE.png';

    function playSynthesized(freq) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    }

    const playAlert = async () => {
        if (config.silent) return;
        const type = config.soundType || 'original';
        
        if (type === 'original') playSynthesized(440);
        else if (type === 'chime') playSynthesized(880);
        else if (type === 'pulse') playSynthesized(220);
        else {
            const soundSrc = (type === 'custom') ? config.sound : `/${type}.mp3`;
            const audio = new Audio(soundSrc);
            audio.volume = 0.4;
            audio.play().catch(e => console.error("Audio failed:", e));
        }
    };

    if (config.focus) {
        if (drinkBtn) drinkBtn.style.display = 'none';
        setTimeout(async () => {
            await window.app.startTimer();
            window.app.loadView('status.html');
        }, 4000);
    }

    if (drinkBtn) {
        drinkBtn.onclick = async () => {
            await window.app.startTimer();
            window.app.loadView('status.html');
        };
    }

    const cog = document.getElementById('options-cog');
    if (cog) {
        cog.onclick = () => {
            window.app.loadView('options.html');
        };
    }

    playAlert();
})();
