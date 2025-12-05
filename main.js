const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Enable auto-reload for development
if (process.argv.includes('--dev')) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (err) {
    console.log('Electron reload not available');
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'assets/icons/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'src/renderer/index.html'));

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize app
app.whenReady().then(async () => {
  try {
    // Create music folder if it doesn't exist
    const musicFolder = path.join(__dirname, 'music');
    if (!fs.existsSync(musicFolder)) {
      fs.mkdirSync(musicFolder, { recursive: true });
      fs.writeFileSync(path.join(musicFolder, '.gitkeep'), '');
    }

    // Initialize database BEFORE creating window
    const userDataPath = app.getPath('userData');
    console.log('Initializing database at:', userDataPath);
    const dbResult = await db.initDatabase(userDataPath);

    if (!dbResult.success) {
      console.error('❌ Database failed to initialize:', dbResult.error);
    } else {
      console.log('✅ Database initialized successfully at:', dbResult.path);
    }

    // Now create the window
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// File Dialog - Select Music Files
ipcMain.handle('dialog:selectMusicFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac', 'wma'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result.filePaths;
});

// File Dialog - Select Music Folder
ipcMain.handle('dialog:selectMusicFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

// Get App Path
ipcMain.handle('app:getPath', (event, name) => {
  return app.getPath(name);
});

// Get Music Folder Path
ipcMain.handle('app:getMusicFolder', () => {
  return path.join(__dirname, 'music');
});

// Quit App
ipcMain.handle('app:quit', () => {
  app.quit();
});

// Read File
ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Write File
ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Check if file exists
ipcMain.handle('fs:exists', async (event, filePath) => {
  return fs.existsSync(filePath);
});

// Get file stats
ipcMain.handle('fs:stats', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return { 
      success: true, 
      stats: {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Database handlers
const db = require('./src/database/db');

// Database IPC Handlers
ipcMain.handle('db:init', async () => {
  const userDataPath = app.getPath('userData');
  return await db.initDatabase(userDataPath);
});

ipcMain.handle('db:getSongs', async (event, filters) => {
  return db.getAllSongs(filters);
});

ipcMain.handle('db:getSongById', async (event, id) => {
  return db.getSongById(id);
});

ipcMain.handle('db:addSong', async (event, song) => {
  return db.addSong(song);
});

ipcMain.handle('db:updateSong', async (event, id, updates) => {
  return db.updateSong(id, updates);
});

ipcMain.handle('db:deleteSong', async (event, id) => {
  return db.deleteSong(id);
});

ipcMain.handle('db:getPlaylists', async () => {
  return db.getAllPlaylists();
});

ipcMain.handle('db:getPlaylistById', async (event, id) => {
  return db.getPlaylistById(id);
});

ipcMain.handle('db:createPlaylist', async (event, name) => {
  return db.createPlaylist(name);
});

ipcMain.handle('db:updatePlaylist', async (event, id, updates) => {
  return db.updatePlaylist(id, updates);
});

ipcMain.handle('db:deletePlaylist', async (event, id) => {
  return db.deletePlaylist(id);
});

ipcMain.handle('db:addSongToPlaylist', async (event, playlistId, songId) => {
  return db.addSongToPlaylist(playlistId, songId);
});

ipcMain.handle('db:removeSongFromPlaylist', async (event, playlistId, songId) => {
  return db.removeSongFromPlaylist(playlistId, songId);
});

ipcMain.handle('db:getPlaylistSongs', async (event, playlistId) => {
  return db.getPlaylistSongs(playlistId);
});

ipcMain.handle('db:searchSongs', async (event, query) => {
  return db.searchSongs(query);
});

ipcMain.handle('db:findDuplicates', async () => {
  return db.findDuplicates();
});

ipcMain.handle('db:getSetting', async (event, key) => {
  return db.getSetting(key);
});

ipcMain.handle('db:setSetting', async (event, key, value) => {
  return db.setSetting(key, value);
});

// Cleanup on app quit
app.on('before-quit', () => {
  db.closeDatabase();
});

console.log('Bardic Forge started successfully!');