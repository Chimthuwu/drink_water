(async function() {
    const config = window.app.getConfig();

    const loadValues = () => {
        document.getElementById('autoLaunch').checked = config.autoLaunch || false;
        document.getElementById('silent').checked = config.silent || false;
        document.getElementById('focus').checked = config.focus || false;
        document.getElementById('interval').value = config.interval || 20;
        document.getElementById('reminderText').value = config.reminderText || 'Time to Hydrate!';

        const soundTypeSelect = document.getElementById('soundType');
        soundTypeSelect.value = config.soundType || (config.sound ? 'custom' : 'original');
        
        const customSoundControls = document.getElementById('custom-sound-controls');
        const updateSoundControls = () => {
            customSoundControls.style.display = (soundTypeSelect.value === 'custom') ? 'block' : 'none';
        };
        soundTypeSelect.onchange = updateSoundControls;
        updateSoundControls();

        const imagePreview = document.getElementById('image-preview');
        if (config.image) imagePreview.src = config.image;

        const soundNameEl = document.getElementById('sound-name');
        if (config.sound) soundNameEl.innerText = config.sound.split(/[\\/]/).pop();
    };

    loadValues();

    window.selectImage = async () => {
        let entries = await Neutralino.os.showOpenDialog('Select Image', {
            filters: [{name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif']}]
        });
        if (entries && entries.length > 0) {
            config.image = entries[0];
            document.getElementById('image-preview').src = entries[0];
        }
    };

    window.selectSound = async () => {
        let entries = await Neutralino.os.showOpenDialog('Select Sound', {
            filters: [{name: 'Audio', extensions: ['mp3', 'wav', 'ogg']}]
        });
        if (entries && entries.length > 0) {
            config.sound = entries[0];
            document.getElementById('sound-name').innerText = entries[0].split(/[\\/]/).pop();
        }
    };

    document.getElementById('preview-sound').onclick = () => {
        const type = document.getElementById('soundType').value;
        if (type === 'original') playSynthesized(440);
        else if (type === 'chime') playSynthesized(880);
        else if (type === 'pulse') playSynthesized(220);
        else {
            const soundSrc = (type === 'custom') ? config.sound : `/${type}.mp3`;
            const audio = new Audio(soundSrc);
            audio.volume = 0.4;
            audio.play().catch(e => console.error("Sound preview failed:", e));
        }
    };

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

    document.getElementById('clear-image').onclick = (e) => {
        e.stopPropagation();
        config.image = null;
        document.getElementById('image-preview').src = 'HYDRATE.png';
    };

    document.getElementById('save').onclick = async () => {
        const newConfig = {
            autoLaunch: document.getElementById('autoLaunch').checked,
            silent: document.getElementById('silent').checked,
            focus: document.getElementById('focus').checked,
            interval: parseInt(document.getElementById('interval').value) || 20,
            reminderText: document.getElementById('reminderText').value || 'Time to Hydrate!',
            soundType: document.getElementById('soundType').value,
            sound: config.sound,
            image: config.image
        };
        await window.app.saveConfig(newConfig);
        await window.app.startTimer();
        window.app.loadView('status.html');
    };

    document.getElementById('close-btn').onclick = () => {
        window.app.loadView('status.html');
    };
})();
