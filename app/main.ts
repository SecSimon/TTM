import {app, BrowserWindow, screen, Menu, ipcMain, dialog} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
const Store = require('electron-store');
const store = new Store();

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

  win.setBounds(store.get('bounds'));
  win.on('close', () => {
    store.set('bounds', win.getBounds());
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  win.webContents.session.setSpellCheckerLanguages(['en-US', 'de']);

  let rendererIsReady = false;

  win.webContents.on('will-navigate', (event, url) => {
    if (url.indexOf('?code=') >= 0) {
      event.preventDefault();
      win.loadURL(pageURL);
      const action = () => { win.webContents.send('oncode', url.substring(url.indexOf('?code=')+6)); };
      if (rendererIsReady) action();
      else ipcMain.on('RendererReady', () => action());
    } 
  });

  win.webContents.on('will-redirect', (event, url) => {
    if (url.indexOf('?code=') >= 0) {
      event.preventDefault();
      const action = () => { win.webContents.send('oncode', url.substring(url.indexOf('?code=')+6)); };
      if (rendererIsReady) action();
      else ipcMain.on('RendererReady', () => action());
    } 
  });

  const temp = [];
  temp.push({
    label: 'File',
    submenu: [
      { label: 'New', accelerator: 'Ctrl+N', click: () => { win.webContents.send('OnNew'); } },
      { label: 'Open', accelerator: 'Ctrl+O', click: () => { 
          dialog.showOpenDialog(win, { filters: [ { extensions: ['ttmp','ttmc'], name: 'TTModeler Project/Configuration' }, { extensions: ['ttmp'], name: 'TTModeler Project' }, { extensions: ['ttmc'], name: 'TTModeler Configuration' }], properties: [ 'openFile' ] }).then(result => {
            if (result.filePaths.length >= 1) {
              const data = fs.readFileSync(result.filePaths[0], 'utf-8');
              win.webContents.send('OnOpenFile', data, result.filePaths[0]);
            }
          });
        } 
      },
      { label: 'Save', accelerator: 'Ctrl+S', click: () => { win.webContents.send('OnSave'); } },
      { label: 'Save As', accelerator: 'Ctrl+Shift+S', click: () => { win.webContents.send('OnSaveAs'); } },
      { label: 'Local Download', click: () => { win.webContents.send('OnLocalDownload'); } },
      { label: 'Close File', click: () => { win.webContents.send('OnCloseFile'); } },
      { role: 'quit', label: '&Quit', accelerator: 'Ctrl+Q', click: () => { app.quit(); } }
    ]
  });
  temp.push({
    label: 'View',
    submenu: [
      //{ label: 'Reload', accelerator: 'Ctrl+R', click: (item, focusedWindow) => { focusedWindow.reload(); } },
      { label: 'Full Screen', accelerator: 'F11', click: (item, focusedWindow) => { focusedWindow.setFullScreen(!focusedWindow.isFullScreen()); } },
      { label: 'Minimize', 'role': 'minimize', accelerator: 'Ctrl+M' },
      { label: 'Toggle Developer Tools', accelerator: 'Ctrl+Shift+I', click: (item, focusedWindow) => { focusedWindow.webContents.toggleDevTools(); } }
    ]
  });

  const menu = Menu.buildFromTemplate(temp);
  Menu.setApplicationMenu(menu);

  ipcMain.on('RendererReady', () => {
    rendererIsReady = true;
  });

  if (process.argv.length >= 2) {
    const openFilePath = process.argv[1];
    try {
      const data = fs.readFileSync(openFilePath, 'utf-8');
      const action = () => { win.webContents.send('OnOpenFile', data, openFilePath); };
      if (rendererIsReady) action();
      else ipcMain.on('RendererReady', () => action());
    } 
    catch {
    }
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
    win.webContents.send('ExistFilesCallback', existingFiles);
  });
  ipcMain.on('ReadFile', (event, path) => {
    const data = fs.readFileSync(path, 'utf-8');
    win.webContents.send('ReadFileCallback', data, path);
  });
  ipcMain.on('SaveFile', (event, path, content) => {
    fs.writeFileSync(path, content);
    win.webContents.send('SaveFileCallback', path);
  });
  ipcMain.on('SaveFileAs', (event, path, content) => {
    const newPath = dialog.showSaveDialogSync(win, { defaultPath: path });
    if (newPath) fs.writeFileSync(newPath, content);
    win.webContents.send('SaveFileCallback', newPath);
  });
  ipcMain.on('DeleteFile', (event, path) => {
    fs.rmSync(path);
  });

  ipcMain.on('OnCloseApp', () => {
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
