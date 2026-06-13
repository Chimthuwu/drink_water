const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let tray = null;
let popupWindow = null;
let statusWindow = null;
let setupWindow = null;
let optionsWindow = null;
let reminderTimer = null;
let nextAlarmTime = 0;

const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return { 
        interval: 20, silent: false, focus: false, sound: null, image: null,
        autoLaunch: false, reminderText: 'Time to Hydrate!', soundType: 'original'
    };
}

let config = loadConfig();

function saveConfig(newConfig) {
    config = newConfig;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    app.setLoginItemSettings({
        openAtLogin: config.autoLaunch,
        path: app.getPath('exe')
    });
}

function startTimer() {
    if (reminderTimer) clearTimeout(reminderTimer);
    const durationMs = config.interval * 60 * 1000;
    nextAlarmTime = Date.now() + durationMs;
    reminderTimer = setTimeout(showReminder, durationMs);
}

function showReminder() {
    if (popupWindow) popupWindow.close();
    popupWindow = new BrowserWindow({
        width: 500, height: 600,
        webPreferences: { nodeIntegration: true, contextIsolation: false },
        frame: false, resizable: true, alwaysOnTop: true, transparent: true
    });
    popupWindow.loadFile('reminder.html');
    popupWindow.on('closed', () => popupWindow = null);
}

function showStatus() {
    if (statusWindow) { statusWindow.focus(); return; }
    statusWindow = new BrowserWindow({
        width: 500, height: 500,
        webPreferences: { nodeIntegration: true, contextIsolation: false },
        frame: false, resizable: true, alwaysOnTop: true, transparent: true
    });
    statusWindow.loadFile('status.html');
    statusWindow.on('closed', () => statusWindow = null);
}

function showSetup() {
    if (setupWindow) { setupWindow.focus(); return; }
    setupWindow = new BrowserWindow({
        width: 500, height: 450,
        webPreferences: { nodeIntegration: true, contextIsolation: false },
        frame: false, resizable: true, alwaysOnTop: true, transparent: true
    });
    setupWindow.loadFile('setup.html');
    setupWindow.on('closed', () => setupWindow = null);
}

function showOptions() {
    if (optionsWindow) { optionsWindow.focus(); return; }
    optionsWindow = new BrowserWindow({
        width: 500, height: 750,
        webPreferences: { nodeIntegration: true, contextIsolation: false },
        frame: false, resizable: true, alwaysOnTop: true, transparent: true
    });
    optionsWindow.loadFile('options.html');
    optionsWindow.on('closed', () => optionsWindow = null);
}

app.on('ready', () => {
    const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png'));
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Reminder Now', click: showReminder },
        { label: 'Status Timer', click: showStatus },
        { label: 'Settings', click: showOptions },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
    ]);
    tray.setToolTip('Drink Water');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', showStatus);

    if (!fs.existsSync(configPath)) showSetup();
    else { startTimer(); showStatus(); }
});

app.on('window-all-closed', (e) => { e.preventDefault(); });

ipcMain.on('get-config', (event) => { event.returnValue = config; });
ipcMain.on('get-time-left', (event) => { event.returnValue = Math.max(0, nextAlarmTime - Date.now()); });
ipcMain.on('save-config', (event, newConfig) => { saveConfig(newConfig); startTimer(); });
ipcMain.on('open-options', showOptions);
ipcMain.on('open-status', showStatus);
ipcMain.on('open-reminder', showReminder);
ipcMain.on('acknowledge', () => { if (popupWindow) popupWindow.close(); startTimer(); showStatus(); });
ipcMain.on('close-window', (event) => { BrowserWindow.fromWebContents(event.sender).close(); });
ipcMain.on('minimize-window', (event) => { BrowserWindow.fromWebContents(event.sender).minimize(); });

ipcMain.on('select-image', (event) => {
    const { dialog } = require('electron');
    const result = dialog.showOpenDialogSync({
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }]
    });
    if (result && result.length > 0) {
        event.reply('selected-image', result[0]);
    }
});
