let nextAlarmTime = 0;
let reminderTimer = null;
let currentView = "";
let config = {
    interval: 20,
    silent: false,
    focus: false,
    sound: null,
    image: null,
    autoLaunch: false,
    reminderText: 'Time to Hydrate!',
    soundType: 'original'
};

// Persistence functions
async function loadConfig() {
    try {
        let data = await Neutralino.storage.getData('config');
        config = JSON.parse(data);
        return false;
    } catch (e) {
        return true;
    }
}

async function saveConfig(newConfig) {
    config = newConfig;
    await Neutralino.storage.setData('config', JSON.stringify(config));
}

// Timer Engine
async function startTimer() {
    if (reminderTimer) clearTimeout(reminderTimer);
    await loadConfig();
    nextAlarmTime = Date.now() + (config.interval * 60 * 1000);
    await Neutralino.storage.setData('nextAlarmTime', nextAlarmTime.toString());
    reminderTimer = setTimeout(triggerReminder, config.interval * 60 * 1000);
}

async function triggerReminder() {
    await Neutralino.window.unhide();
    await Neutralino.window.focus();
    loadView('reminder.html');
}

// View Loader (SPA logic)
async function loadView(viewName) {
    currentView = viewName;
    const container = document.getElementById('app-container');
    try {
        const response = await fetch(viewName);
        const html = await response.text();
        
        // Extract only the body content to inject
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bodyContent = doc.body.innerHTML;
        
        container.innerHTML = bodyContent;

        // Manually execute scripts found in the injected HTML
        const scripts = doc.body.querySelectorAll('script');
        for (const script of scripts) {
            const newScript = document.createElement('script');
            if (script.src) {
                // Adjust path for resources
                newScript.src = script.getAttribute('src');
            } else {
                newScript.textContent = script.textContent;
            }
            document.body.appendChild(newScript);
        }
    } catch (e) {
        console.error("View load failed:", e);
    }
}

// Initialize Application
async function init() {
    Neutralino.init();
    const isFirstRun = await loadConfig();

    // Setup System Tray
    let tray = {
        icon: "/resources/icon.png",
        menuItems: [
            {id: "show", text: "Show Reminder Now"},
            {id: "status", text: "Status Timer"},
            {id: "settings", text: "Settings"},
            {text: "-"},
            {id: "quit", text: "Quit"}
        ]
    };
    await Neutralino.os.setTray(tray);

    Neutralino.events.on("trayMenuItemClicked", async (event) => {
        switch(event.detail.id) {
            case "show": await triggerReminder(); break;
            case "status": loadView('status.html'); await Neutralino.window.unhide(); break;
            case "settings": loadView('options.html'); await Neutralino.window.unhide(); break;
            case "quit": Neutralino.app.exit(); break;
        }
    });

    Neutralino.events.on("windowClose", () => {
        Neutralino.window.hide();
    });

    // Expose functions to UI
    window.app = {
        loadView: loadView,
        startTimer: startTimer,
        saveConfig: saveConfig,
        getConfig: () => config,
        getNextAlarmTime: () => nextAlarmTime
    };

    if (isFirstRun) {
        loadView('setup.html');
    } else {
        await startTimer();
        loadView('status.html');
    }
}

init();
