let nextAlarmTime = 0;
let reminderTimer = null;
let currentView = "";
let config = {
    interval: 20, silent: false, focus: false, sound: null, image: null,
    autoLaunch: false, reminderText: 'Time to Hydrate!', soundType: 'original'
};

// Persistence Engine
async function loadConfig() {
    try {
        let data = await Neutralino.storage.getData('config');
        config = JSON.parse(data);
        return false;
    } catch (e) {
        return true;
    }
}

async function startTimer() {
    if (reminderTimer) clearTimeout(reminderTimer);
    await loadConfig();
    const durationMs = config.interval * 60 * 1000;
    nextAlarmTime = Date.now() + durationMs;
    // Persist nextAlarmTime in case of reboot/crash
    await Neutralino.storage.setData('nextAlarmTime', nextAlarmTime.toString());
    reminderTimer = setTimeout(triggerReminder, durationMs);
}

async function triggerReminder() {
    await Neutralino.window.unhide();
    await Neutralino.window.focus();
    loadView('reminder.html');
}

// Global SPA Router
async function loadView(viewName) {
    currentView = viewName;
    const container = document.getElementById('app-container');
    
    // Set sizing BEFORE injection to avoid clipping
    if (viewName === 'options.html') await Neutralino.window.setSize({width: 500, height: 780});
    else if (viewName === 'status.html') await Neutralino.window.setSize({width: 500, height: 480});
    else if (viewName === 'reminder.html') await Neutralino.window.setSize({width: 500, height: 600});

    try {
        const response = await fetch(viewName);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Clean up previous view scripts if any
        const oldScripts = document.querySelectorAll('.view-script');
        oldScripts.forEach(s => s.remove());

        container.innerHTML = doc.body.innerHTML;

        // Manually execute scripts from the view
        const scripts = doc.body.querySelectorAll('script');
        for (const script of scripts) {
            const newScript = document.createElement('script');
            newScript.className = 'view-script'; // Mark for cleanup
            if (script.src) newScript.src = script.getAttribute('src');
            else newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
        }
    } catch (e) {
        console.error("SPA Loader error:", e);
    }
}

// Initial App Boot
async function init() {
    Neutralino.init();
    const isFirstRun = await loadConfig();

    // Tray Menu (Pure Neutralino)
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
            case "status": await loadView('status.html'); await Neutralino.window.unhide(); break;
            case "settings": await loadView('options.html'); await Neutralino.window.unhide(); break;
            case "quit": Neutralino.app.exit(); break;
        }
    });

    Neutralino.events.on("windowClose", () => {
        Neutralino.window.hide();
    });

    // Expose Internal API to Views
    window.app = {
        loadView, 
        startTimer, 
        saveConfig: async (cfg) => {
            config = cfg;
            await Neutralino.storage.setData('config', JSON.stringify(cfg));
        },
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
