function updateTimer() {
    const timeLeftEl = document.getElementById('time-left');
    if (!timeLeftEl) return;

    const nextAlarmTime = window.app.getNextAlarmTime();
    const timeLeftMs = Math.max(0, nextAlarmTime - Date.now());
    
    if (timeLeftMs <= 0) {
        timeLeftEl.innerText = "00:00";
        return;
    }
    
    const totalSeconds = Math.floor(timeLeftMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    timeLeftEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Clear any existing intervals to prevent memory leaks during SPA swaps
if (window.statusInterval) clearInterval(window.statusInterval);

updateTimer();
window.statusInterval = setInterval(updateTimer, 1000);

const settingsBtn = document.getElementById('settings-btn');
if (settingsBtn) {
    settingsBtn.onclick = () => {
        clearInterval(window.statusInterval);
        window.app.loadView('options.html');
    };
}
