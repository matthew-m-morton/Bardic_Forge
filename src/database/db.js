const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

// Initialize database
function initDatabase(appPath) {
  try {
    const dbPath = path.join(appPath, 'bardic_forge.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better performance
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    
    console.log('Database initialized successfully at:', dbPath);
    return { success: true, path: dbPath };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error: error.message };
  }
}

// Song Operations
function getAllSongs(filters = {}) {
  try {
    let query = 'SELECT * FROM songs';
    const conditions = [];
    const params = [];
    
    if (filters.artist) {
      conditions.push('artist LIKE ?');
      params.push(`%${filters.artist}%`);
    }
    if (filters.album) {
      conditions.push('album LIKE ?');
      params.push(`%${filters.album}%`);
    }
    if (filters.genre) {
      conditions.push('genre LIKE ?');
      params.push(`%${filters.genre}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY title ASC';
    
    const stmt = db.prepare(query);
    const songs = stmt.all(...params);
    return { success: true, songs };
  } catch (error) {
    console.error('Error getting songs:', error);
    return { success: false, error: error.message };
  }
}

function getSongById(songId) {
  try {
    const stmt = db.prepare('SELECT * FROM songs WHERE song_id = ?');
    const song = stmt.get(songId);
    return { success: true, song };
  } catch (error) {
    console.error('Error getting song:', error);
    return { success: false, error: error.message };
  }
}

function addSong(song) {
  try {
    const stmt = db.prepare(`
      INSERT INTO songs (
        song_id, file_path, original_file_path, original_format,
        title, artist, album, duration, file_size,
        track_number, year, genre
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      song.song_id,
      song.file_path,
      song.original_file_path || null,
      song.original_format || null,
      song.title,
      song.artist,
      song.album,
      song.duration,
      song.file_size,
      song.track_number || null,
      song.year || null,
      song.genre || null
    );
    
    return { success: true, changes: info.changes };
  } catch (error) {
    console.error('Error adding song:', error);
    return { success: false, error: error.message };
  }
}

function updateSong(songId, updates) {
  try {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const stmt = db.prepare(`
      UPDATE songs 
      SET ${fields}, date_modified = CURRENT_TIMESTAMP 
      WHERE song_id = ?
    `);
    
    const info = stmt.run(...values, songId);
    return { success: true, changes: info.changes };
  } catch (error) {
    console.error('Error updating song:', error);
    return { success: false, error: error.message };
  }
}

function deleteSong(songId) {
  try {
    const stmt = db.prepare('DELETE FROM songs WHERE song_id = ?');
    const info = stmt.run(songId);
    return { success: true, changes: info.changes };
  } catch (error) {
    console.error('Error deleting song:', error);
    return { success: false, error: error.message };
  }
}

// Playlist Operations
function getAllPlaylists() {
  try {
    const stmt = db.prepare('SELECT * FROM playlists ORDER BY playlist_name ASC');
    const playlists = stmt.all();
    return { success: true, playlists };
  } catch (error) {
    console.error('Error getting playlists:', error);
    return { success: false, error: error.message };
  }
}

function getPlaylistById(playlistId) {
  try {
    const stmt = db.prepare('SELECT * FROM playlists WHERE playlist_id = ?');
    const playlist = stmt.get(playlistId);
    return { success: true, playlist };
  } catch (error) {
    console.error('Error getting playlist:', error);
    return { success: false, error: error.message };
  }
}

function createPlaylist(name) {
  try {
    const stmt = db.prepare('INSERT INTO playlists (playlist_name) VALUES (?)');
    const info = stmt.run(name);
    return { success: true, playlistId: info.lastInsertRowid };
  } catch (error) {
    console.error('Error creating playlist:', error);
    return { success: false, error: error.message };
  }
}

function updatePlaylist(playlistId, updates) {
  try {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const stmt = db.prepare(`
      UPDATE playlists 
      SET ${fields}, date_modified = CURRENT_TIMESTAMP 
      WHERE playlist_id = ?
    `);
    
    const info = stmt.run(...values, playlistId);
    return { success: true, changes: info.changes };
  } catch (error) {
    console.error('Error updating playlist:', error);
    return { success: false, error: error.message };
  }
}

function deletePlaylist(playlistId) {
  try {
    const stmt = db.prepare('DELETE FROM playlists WHERE playlist_id = ?');
    const info = stmt.run(playlistId);
    return { success: true, changes: info.changes };
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return { success: false, error: error.message };
  }
}

// Playlist-Song Operations
function addSongToPlaylist(playlistId, songId) {
  try {
    // Get the next position
    const posStmt = db.prepare('SELECT MAX(position) as maxPos FROM playlist_songs WHERE playlist_id = ?');
    const result = posStmt.get(playlistId);
    const nextPosition = (result.maxPos || 0) + 1;
    
    const stmt = db.prepare(`
      INSERT INTO playlist_songs (playlist_id, song_id, position) 
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(playlistId, songId, nextPosition);
    return { success: true, changes: info.changes };
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    return { success: false, error: error.message };
  }
}

function removeSongFromPlaylist(playlistId, songId) {
  try {
    const stmt = db.prepare('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?');
    const info = stmt.run(playlistId, songId);
    
    // Reorder remaining songs
    const reorderStmt = db.prepare(`
      UPDATE playlist_songs 
      SET position = position - 1 
      WHERE playlist_id = ? AND position > (
        SELECT position FROM playlist_songs WHERE playlist_id = ? AND song_id = ?
      )
    `);
    reorderStmt.run(playlistId, playlistId, songId);
    
    return { success: true, changes: info.changes };
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    return { success: false, error: error.message };
  }
}

function getPlaylistSongs(playlistId) {
  try {
    const stmt = db.prepare(`
      SELECT s.*, ps.position 
      FROM songs s
      JOIN playlist_songs ps ON s.song_id = ps.song_id
      WHERE ps.playlist_id = ?
      ORDER BY ps.position ASC
    `);
    const songs = stmt.all(playlistId);
    return { success: true, songs };
  } catch (error) {
    console.error('Error getting playlist songs:', error);
    return { success: false, error: error.message };
  }
}

// Search Operations
function searchSongs(query) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM songs 
      WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
      ORDER BY title ASC
    `);
    const searchTerm = `%${query}%`;
    const songs = stmt.all(searchTerm, searchTerm, searchTerm);
    return { success: true, songs };
  } catch (error) {
    console.error('Error searching songs:', error);
    return { success: false, error: error.message };
  }
}

function findDuplicates() {
  try {
    const stmt = db.prepare(`
      SELECT title, artist, COUNT(*) as count, GROUP_CONCAT(song_id) as song_ids
      FROM songs
      GROUP BY LOWER(title), LOWER(artist)
      HAVING count > 1
      ORDER BY title ASC
    `);
    const duplicates = stmt.all();
    return { success: true, duplicates };
  } catch (error) {
    console.error('Error finding duplicates:', error);
    return { success: false, error: error.message };
  }
}

// Settings Operations
function getSetting(key) {
  try {
    const stmt = db.prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
    const result = stmt.get(key);
    return { success: true, value: result ? result.setting_value : null };
  } catch (error) {
    console.error('Error getting setting:', error);
    return { success: false, error: error.message };
  }
}

function setSetting(key, value) {
  try {
    const stmt = db.prepare(`
      INSERT INTO settings (setting_key, setting_value) 
      VALUES (?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?
    `);
    const info = stmt.run(key, value, value);
    return { success: true, changes: info.changes };
  } catch (error) {
    console.error('Error setting setting:', error);
    return { success: false, error: error.message };
  }
}

// Close database
function closeDatabase() {
  if (db) {
    db.close();
    console.log('Database closed');
  }
}

module.exports = {
  initDatabase,
  getAllSongs,
  getSongById,
  addSong,
  updateSong,
  deleteSong,
  getAllPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getPlaylistSongs,
  searchSongs,
  findDuplicates,
  getSetting,
  setSetting,
  closeDatabase
};