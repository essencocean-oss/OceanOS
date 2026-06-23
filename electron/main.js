const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

let win = null;

function createWindow () {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'OceanOS',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  win.on('closed', function () {
    win = null;
  });
}

app.whenReady().then(function () {
  createWindow();
  globalShortcut.register('CommandOrControl+Shift+H', function () {
    if (win) {
      if (win.isVisible()) win.hide();
      else win.show();
    }
  });
  app.setLoginItemSettings({ openAtLogin: false });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
