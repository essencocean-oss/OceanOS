const { app, BrowserWindow, Tray, Menu, globalShortcut, Notification } = require('electron');
const path = require('path');

let win = null;
let tray = null;

function createWindow () {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'HermesOS',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.loadFile(path.join(__dirname, '..', 'ui', 'index.html'));
  win.on('close', function (e) {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray () {
  try {
    tray = new Tray(path.join(__dirname, '..', 'ui', 'icon.png'));
  } catch (e) {
    console.log('Tray icon not found, skipping tray.');
    return;
  }  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show HermesOS', click: function () { win.show(); } },
    { label: 'Quit', click: function () { app.isQuitting = true; app.quit(); } }
  ]);
  tray.setToolTip('HermesOS');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', function () { win.show(); });
}

app.whenReady().then(function () {
  createWindow();
  createTray();
  globalShortcut.register('CommandOrControl+Shift+H', function () {
    if (win.isVisible()) win.hide();
    else win.show();
  });
  app.setLoginItemSettings({ openAtLogin: true });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
