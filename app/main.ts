import {app, BrowserWindow, screen, Menu, ipcMain, dialog} from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let win: BrowserWindow = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    icon: '../dist/assets/icons/favicon.png',
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve),
      contextIsolation: false,  // false if you want to run e2e test with Spectron
    },
  });

  let pageURL = '';
  if (serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
       // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);
    pageURL = url.href;
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  win.webContents.session.setSpellCheckerLanguages(['en-US', 'de']);

  win.webContents.on('will-navigate', (event, url) => {
    if (url.indexOf('?code=') >= 0) {
      event.preventDefault();
      win.loadURL(pageURL);
      setTimeout(() => {
        win.webContents.send('oncode', url.substring(url.indexOf('?code=')+6));
      }, 1000);
    } 
  });

  win.webContents.on('will-redirect', (event, url) => {
    if (url.indexOf('?code=') >= 0) {
      event.preventDefault();
      win.webContents.send('oncode', url.substring(url.indexOf('?code=')+6));
    } 
  });

  const temp = [];
  temp.push({
    label: 'File',
    submenu: [
      { label: 'Save', accelerator: 'Ctrl+S', click: () => { win.webContents.send('OnSave'); } },
      { label: 'Download Project', click: () => { win.webContents.send('OnDownloadProject'); } },
      { label: 'Import Project', click: () => { 
          dialog.showOpenDialog(win, { filters: [ { extensions: ['ttmp'], name: 'TTModeler Project' }], properties: [ 'openFile' ] }).then(result => {
            if (result.filePaths.length >= 1) {
              let data = fs.readFileSync(result.filePaths[0], 'utf-8');
              win.webContents.send('OnImportFile', data, result.filePaths[0]);
            }
          });
        } 
      },
      { label: 'Close Project', click: () => { win.webContents.send('OnCloseProject'); } },
      { role: 'quit', label: '&Quit', accelerator: 'Ctrl+Q', click: () => { app.quit(); } }
    ]
  });
  temp.push({
    label: 'View',
    submenu: [
      { label: 'Reload', accelerator: 'Ctrl+R', click: (item, focusedWindow) => { focusedWindow.reload(); } },
      { label: 'Full Screen', accelerator: 'F11', click: (item, focusedWindow) => { focusedWindow.setFullScreen(!focusedWindow.isFullScreen()); } },
      { label: 'Minimize', 'role': 'minimize', accelerator: 'Ctrl+M' },
      { label: 'Toggle Developer Tools', accelerator: 'Ctrl+Shift+I', click: (item, focusedWindow) => { focusedWindow.webContents.toggleDevTools(); } }
    ]
  });

  const menu = Menu.buildFromTemplate(temp);
  Menu.setApplicationMenu(menu);

  if (process.argv.length >= 2) {
    let openFilePath = process.argv[1];
    const data = fs.readFileSync(openFilePath, 'utf-8');
    ipcMain.on('OnMyReady', () => {
      win.webContents.send('OnImportFile', data, openFilePath);
    });
  }

  ipcMain.on('ExistFiles', (event, files: string[]) => {
    const existingFiles = [];
    files.forEach(file => {
      try {
        fs.accessSync(file, fs.constants.W_OK | fs.constants.R_OK);
        existingFiles.push(file);
      }
      catch {
      }
    });
    win.webContents.send('OnExistingFiles', existingFiles);
  });
  ipcMain.on('ReadFile', (event, path) => {
    const data = fs.readFileSync(path, 'utf-8');
    win.webContents.send('OnReadFile', data);
  });
  ipcMain.on('SaveFile', (event, path, content) => {
    fs.writeFileSync(path, content);
    win.webContents.send('OnSaveFile', true);
  });
  ipcMain.on('SaveFileAs', (event, path, content) => {
    const newPath = dialog.showSaveDialogSync(win, { defaultPath: path });
    if (newPath) fs.writeFileSync(newPath, content);
    win.webContents.send('OnSaveFileAs', newPath);
  });

  ipcMain.on('OnCloseApp', () => {
    console.log('exit');
    app.exit();
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
