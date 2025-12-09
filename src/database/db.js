const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;
let dbPath = null;

// Save database to file
function saveDatabase() {
  if (db && dbPath) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }
}

// Initialize database
async function initDatabase(appPath) {
  try {
    dbPath = path.join(appPath, 'bardic_forge.db');

    // Ensure directory exists
    if (!fs.existsSync(appPath)) {
      fs.mkdirSync(appPath, { recursive: true });
    }

    // Initialize sql.js
    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
      console.log('Loaded existing database from:', dbPath);
    } else {
      db = new SQL.Database();
      console.log('Created new database at:', dbPath);
    }

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);

    // Save the database
    saveDatabase();

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
    const params = {};

    if (filters.artist) {
      conditions.push('artist LIKE :artist');
      params[':artist'] = `%${filters.artist}%`;
    }
    if (filters.album) {
      conditions.push('album LIKE :album');
      params[':album'] = `%${filters.album}%`;
    }
    if (filters.genre) {
      conditions.push('genre LIKE :genre');
      params[':genre'] = `%${filters.genre}%`;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY title ASC';

    const stmt = db.prepare(query);
    stmt.bind(params);

    const songs = [];
    while (stmt.step()) {
      songs.push(stmt.getAsObject());
    }
    stmt.free();

    return { success: true, songs };
  } catch (error) {
    console.error('Error getting songs:', error);
    return { success: false, error: error.message };
  }
}

function getSongById(songId) {
  try {
    const stmt = db.prepare('SELECT * FROM songs WHERE song_id = :id');
    stmt.bind({ ':id': songId });

    let song = null;
    if (stmt.step()) {
      song = stmt.getAsObject();
    }
    stmt.free();

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

    stmt.run([
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
    ]);
    stmt.free();

    saveDatabase();
    return { success: true, changes: 1 };
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

    stmt.run([...values, songId]);
    stmt.free();

    saveDatabase();
    return { success: true, changes: 1 };
  } catch (error) {
    console.error('Error updating song:', error);
    return { success: false, error: error.message };
  }
}

function deleteSong(songId) {
  try {
    const stmt = db.prepare('DELETE FROM songs WHERE song_id = ?');
    stmt.run([songId]);
    stmt.free();

    saveDatabase();
    return { success: true, changes: 1 };
  } catch (error) {
    console.error('Error deleting song:', error);
    return { success: false, error: error.message };
  }
}

// Playlist Operations
function getAllPlaylists() {
  try {
    const stmt = db.prepare('SELECT * FROM playlists ORDER BY playlist_name ASC');

    const playlists = [];
    while (stmt.step()) {
      playlists.push(stmt.getAsObject());
    }
    stmt.free();

    return { success: true, playlists };
  } catch (error) {
    console.error('Error getting playlists:', error);
    return { success: false, error: error.message };
  }
}

function getPlaylistById(playlistId) {
  try {
    const stmt = db.prepare('SELECT * FROM playlists WHERE playlist_id = ?');
    stmt.bind([playlistId]);

    let playlist = null;
    if (stmt.step()) {
      playlist = stmt.getAsObject();
    }
    stmt.free();

    return { success: true, playlist };
  } catch (error) {
    console.error('Error getting playlist:', error);
    return { success: false, error: error.message };
  }
}

function createPlaylist(name) {
  try {
    const stmt = db.prepare('INSERT INTO playlists (playlist_name) VALUES (?)');
    stmt.run([name]);
    stmt.free();

    // Get the last inserted ID
    const idStmt = db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const result = idStmt.getAsObject();
    idStmt.free();

    saveDatabase();
    return { success: true, playlistId: result.id };
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

    stmt.run([...values, playlistId]);
    stmt.free();

    saveDatabase();
    return { success: true, changes: 1 };
  } catch (error) {
    console.error('Error updating playlist:', error);
    return { success: false, error: error.message };
  }
}

function deletePlaylist(playlistId) {
  try {
    const stmt = db.prepare('DELETE FROM playlists WHERE playlist_id = ?');
    stmt.run([playlistId]);
    stmt.free();

    saveDatabase();
    return { success: true, changes: 1 };
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
    posStmt.bind([playlistId]);
    posStmt.step();
    const result = posStmt.getAsObject();
    posStmt.free();

    const nextPosition = (result.maxPos || 0) + 1;

    const stmt = db.prepare(`
      INSERT INTO playlist_songs (playlist_id, song_id, position)
      VALUES (?, ?, ?)
    `);
    stmt.run([playlistId, songId, nextPosition]);
    stmt.free();

    saveDatabase();
    return { success: true, changes: 1 };
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    return { success: false, error: error.message };
  }
}

function removeSongFromPlaylist(playlistId, songId) {
  try {
    const stmt = db.prepare('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?');
    stmt.run([playlistId, songId]);
    stmt.free();

    saveDatabase();
    return { success: true, changes: 1 };
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
    stmt.bind([playlistId]);

    const songs = [];
    while (stmt.step()) {
      songs.push(stmt.getAsObject());
    }
    stmt.free();

    return { success: true, songs };
  } catch (error) {
    console.error('Error getting playlist songs:', error);
    return { success: false, error: error.message };
  }
}

function updateSongPositionInPlaylist(playlistId, songId, newPosition) {
  try {
    const stmt = db.prepare(`
      UPDATE playlist_songs
      SET position = ?
      WHERE playlist_id = ? AND song_id = ?
    `);
    stmt.run([newPosition, playlistId, songId]);
    stmt.free();

    saveDatabase();
    return { success: true };
  } catch (error) {
    console.error('Error updating song position:', error);
    return { success: false, error: error.message };
  }
}

function reorderPlaylistSongs(playlistId, songIds) {
  try {
    // Update all positions based on the new order
    songIds.forEach((songId, index) => {
      const stmt = db.prepare(`
        UPDATE playlist_songs
        SET position = ?
        WHERE playlist_id = ? AND song_id = ?
      `);
      stmt.run([index + 1, playlistId, songId]);
      stmt.free();
    });

    saveDatabase();
    return { success: true };
  } catch (error) {
    console.error('Error reordering playlist songs:', error);
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
    stmt.bind([searchTerm, searchTerm, searchTerm]);

    const songs = [];
    while (stmt.step()) {
      songs.push(stmt.getAsObject());
    }
    stmt.free();

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

    const duplicates = [];
    while (stmt.step()) {
      duplicates.push(stmt.getAsObject());
    }
    stmt.free();

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
    stmt.bind([key]);

    let value = null;
    if (stmt.step()) {
      const result = stmt.getAsObject();
      value = result.setting_value;
    }
    stmt.free();

    return { success: true, value };
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
    stmt.run([key, value, value]);
    stmt.free();

    saveDatabase();
    return { success: true, changes: 1 };
  } catch (error) {
    console.error('Error setting setting:', error);
    return { success: false, error: error.message };
  }
}

// Close database
function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
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
  updateSongPositionInPlaylist,
  reorderPlaylistSongs,
  searchSongs,
  findDuplicates,
  getSetting,
  setSetting,
  closeDatabase
};
