/**
 * View Database Script
 * This script shows all songs and playlists in the database
 * Run with: node scripts/viewDatabase.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.env.APPDATA || process.env.HOME, 'bardic_forge', 'bardic_forge.db');

console.log('Database path:', DB_PATH);

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Database not found! Please run the app first.');
  process.exit(1);
}

const db = new Database(DB_PATH);

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

try {
  // Get all songs
  const songs = db.prepare('SELECT * FROM songs ORDER BY title').all();
  
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
  const playlists = db.prepare('SELECT * FROM playlists ORDER BY playlist_name').all();
  
  console.log('='.repeat(70));
  console.log('📋 PLAYLISTS IN DATABASE');
  console.log('='.repeat(70));
  
  if (playlists.length === 0) {
    console.log('No playlists found. Create one in the app!');
  } else {
    console.log(`Found ${playlists.length} playlists:\n`);
    
    for (const playlist of playlists) {
      const playlistSongs = db.prepare(`
        SELECT COUNT(*) as count 
        FROM playlist_songs 
        WHERE playlist_id = ?
      `).get(playlist.playlist_id);
      
      console.log(`• ${playlist.playlist_name}`);
      console.log(`  ID: ${playlist.playlist_id}`);
      console.log(`  Songs: ${playlistSongs.count}`);
      console.log(`  Created: ${playlist.date_created}`);
      console.log('');
    }
  }
  
  // Get settings
  const settings = db.prepare('SELECT * FROM settings').all();
  
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
  
} catch (error) {
  console.error('❌ Error reading database:', error);
} finally {
  db.close();
}