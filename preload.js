const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog APIs
  selectMusicFiles: () => ipcRenderer.invoke('dialog:selectMusicFiles'),
  selectMusicFolder: () => ipcRenderer.invoke('dialog:selectMusicFolder'),
  
  // App APIs
  getAppPath: (name) => ipcRenderer.invoke('app:getPath', name),
  getMusicFolder: () => ipcRenderer.invoke('app:getMusicFolder'),
  quitApp: () => ipcRenderer.invoke('app:quit'),
  
  // File System APIs
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),
  fileExists: (filePath) => ipcRenderer.invoke('fs:exists', filePath),
  getFileStats: (filePath) => ipcRenderer.invoke('fs:stats', filePath),
  
  // Database APIs (to be implemented)
  db: {
    init: () => ipcRenderer.invoke('db:init'),
    getSongs: (filters) => ipcRenderer.invoke('db:getSongs', filters),
    getSongById: (id) => ipcRenderer.invoke('db:getSongById', id),
    addSong: (song) => ipcRenderer.invoke('db:addSong', song),
    updateSong: (id, updates) => ipcRenderer.invoke('db:updateSong', id, updates),
    deleteSong: (id) => ipcRenderer.invoke('db:deleteSong', id),
    
    getPlaylists: () => ipcRenderer.invoke('db:getPlaylists'),
    getPlaylistById: (id) => ipcRenderer.invoke('db:getPlaylistById', id),
    createPlaylist: (name) => ipcRenderer.invoke('db:createPlaylist', name),
    updatePlaylist: (id, updates) => ipcRenderer.invoke('db:updatePlaylist', id, updates),
    deletePlaylist: (id) => ipcRenderer.invoke('db:deletePlaylist', id),
    
    addSongToPlaylist: (playlistId, songId) => ipcRenderer.invoke('db:addSongToPlaylist', playlistId, songId),
    removeSongFromPlaylist: (playlistId, songId) => ipcRenderer.invoke('db:removeSongFromPlaylist', playlistId, songId),
    getPlaylistSongs: (playlistId) => ipcRenderer.invoke('db:getPlaylistSongs', playlistId),
    
    searchSongs: (query) => ipcRenderer.invoke('db:searchSongs', query),
    findDuplicates: () => ipcRenderer.invoke('db:findDuplicates'),
    
    getSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
    setSetting: (key, value) => ipcRenderer.invoke('db:setSetting', key, value)
  },
  
  // Audio Processing APIs (to be implemented)
  audio: {
    convertToMP3: (filePath, outputPath, bitrate) => ipcRenderer.invoke('audio:convertToMP3', filePath, outputPath, bitrate),
    readMetadata: (filePath) => ipcRenderer.invoke('audio:readMetadata', filePath),
    writeMetadata: (filePath, metadata) => ipcRenderer.invoke('audio:writeMetadata', filePath, metadata),
    readBardicId: (filePath) => ipcRenderer.invoke('audio:readBardicId', filePath),
    writeBardicId: (filePath, id) => ipcRenderer.invoke('audio:writeBardicId', filePath, id),
    getDuration: (filePath) => ipcRenderer.invoke('audio:getDuration', filePath)
  },
  
  // Import APIs (to be implemented)
  import: {
    importFiles: (filePaths, keepOriginal, bitrate) => ipcRenderer.invoke('import:files', filePaths, keepOriginal, bitrate),
    scanFolder: (folderPath) => ipcRenderer.invoke('import:scanFolder', folderPath),
    onProgress: (callback) => ipcRenderer.on('import:progress', (event, data) => callback(data)),
    onComplete: (callback) => ipcRenderer.on('import:complete', (event, data) => callback(data)),
    onError: (callback) => ipcRenderer.on('import:error', (event, data) => callback(data))
  }
});

console.log('Preload script loaded successfully!');