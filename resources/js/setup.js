(function() {
    const goBtn = document.getElementById('go-btn');
    if (goBtn) {
        goBtn.onclick = async () => {
            const interval = document.getElementById('interval').value;
            const config = {
                interval: parseInt(interval) || 20,
                silent: false,
                focus: false,
                autoLaunch: false,
                reminderText: 'Time to Hydrate!',
                soundType: 'original',
                image: 'HYDRATE.png'
            };
            
            await window.app.saveConfig(config);
            await window.app.startTimer();
            window.app.loadView('status.html');
        };
    }
})();
