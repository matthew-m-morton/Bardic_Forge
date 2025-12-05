/**
 * View Database Script
 * This script shows all songs and playlists in the database
 * Run with: node scripts/viewDatabase.js
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Determine userData directory based on OS
function getUserDataPath() {
  const appName = 'bardic_forge';

  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA, appName);
  } else if (process.platform === 'darwin') {
    return path.join(process.env.HOME, 'Library', 'Application Support', appName);
  } else {
    return path.join(process.env.HOME, '.config', appName);
  }
}

const DB_PATH = path.join(getUserDataPath(), 'bardic_forge.db');

console.log('Database path:', DB_PATH);

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Database not found! Please run the app first.');
  process.exit(1);
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function viewDatabase() {
  try {
    // Initialize sql.js
    const SQL = await initSqlJs();

    // Load database
    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);

    // Get all songs
    const songsStmt = db.prepare('SELECT * FROM songs ORDER BY title');
    const songs = [];
    while (songsStmt.step()) {
      songs.push(songsStmt.getAsObject());
    }
    songsStmt.free();

    console.log('\n' + '='.repeat(70));
    console.log('📀 SONGS IN DATABASE');
    console.log('='.repeat(70));

    if (songs.length === 0) {
      console.log('No songs found. Run addTestData.js to add test songs.');
    } else {
      console.log(`Found ${songs.length} songs:\n`);

      songs.forEach((song, index) => {
        console.log(`${index + 1}. ${song.title}`);
        console.log(`   Artist: ${song.artist || 'Unknown'}`);
        console.log(`   Album: ${song.album || 'Unknown'}`);
        console.log(`   Duration: ${formatDuration(song.duration)}`);
        console.log(`   Genre: ${song.genre || 'N/A'}`);
        console.log(`   ID: ${song.song_id}`);
        console.log('');
      });
    }

    // Get all playlists
    const playlistsStmt = db.prepare('SELECT * FROM playlists ORDER BY playlist_name');
    const playlists = [];
    while (playlistsStmt.step()) {
      playlists.push(playlistsStmt.getAsObject());
    }
    playlistsStmt.free();

    console.log('='.repeat(70));
    console.log('📋 PLAYLISTS IN DATABASE');
    console.log('='.repeat(70));

    if (playlists.length === 0) {
      console.log('No playlists found. Create one in the app!');
    } else {
      console.log(`Found ${playlists.length} playlists:\n`);

      for (const playlist of playlists) {
        const countStmt = db.prepare(`
          SELECT COUNT(*) as count
          FROM playlist_songs
          WHERE playlist_id = ?
        `);
        countStmt.bind([playlist.playlist_id]);
        countStmt.step();
        const playlistSongs = countStmt.getAsObject();
        countStmt.free();

        console.log(`• ${playlist.playlist_name}`);
        console.log(`  ID: ${playlist.playlist_id}`);
        console.log(`  Songs: ${playlistSongs.count}`);
        console.log(`  Created: ${playlist.date_created}`);
        console.log('');
      }
    }

    // Get settings
    const settingsStmt = db.prepare('SELECT * FROM settings');
    const settings = [];
    while (settingsStmt.step()) {
      settings.push(settingsStmt.getAsObject());
    }
    settingsStmt.free();

    console.log('='.repeat(70));
    console.log('⚙️  SETTINGS');
    console.log('='.repeat(70));

    if (settings.length === 0) {
      console.log('No settings found.');
    } else {
      settings.forEach(setting => {
        console.log(`${setting.setting_key}: ${setting.setting_value}`);
      });
    }

    console.log('\n' + '='.repeat(70));

    db.close();

  } catch (error) {
    console.error('❌ Error reading database:', error);
  }
}

viewDatabase();
