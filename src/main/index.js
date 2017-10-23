import {app, BrowserWindow, Menu} from 'electron';
import path from 'path';
import {menuTemplate} from './menu';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  const index = `file://${app.getAppPath()}/static/index.html`;
  // Create the browser window.
  win = new BrowserWindow({
    width: 800, height: 600,
    icon: path.join(app.getAppPath(), 'static', 'icons', 'icon.png'),
    webPreferences: {
      webSecurity: false,
    },
    show: false,
  });

  // and load the index.html of the app.
  win.loadURL(index);

  // since the BrowserWindow event ready-to-show currently does not fire
  // we use dom-ready to load files given as arguments
  win.webContents.once('did-finish-load', () => {
    win.show();
    if (process.argv.length >= 2) {
      let openFilePath = process.argv[1];
      console.log(openFilePath);
      win.webContents.send('file-opened', openFilePath);
      win.setTitle(openFilePath);
    }
  });


  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
  const menu = Menu.buildFromTemplate(menuTemplate(win));
  Menu.setApplicationMenu(menu);
});


// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});
