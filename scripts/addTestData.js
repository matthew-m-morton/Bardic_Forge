/**
 * Test Data Script
 * This script adds sample songs to the database for testing
 * Run with: node scripts/addTestData.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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
  console.error('Database not found! Please run the app first to create the database.');
  process.exit(1);
}

const db = new Database(DB_PATH);

// Helper function to generate a simple test ID
function generateTestId(title) {
  return crypto.createHash('md5').update(title + Date.now()).digest('hex').substring(0, 32);
}

// Sample test songs
const testSongs = [
  {
    title: 'Epic Battle Theme',
    artist: 'Fantasy Orchestra',
    album: 'Adventures in Sound',
    duration: 245,
    file_size: 5242880,
    track_number: 1,
    year: 2023,
    genre: 'Soundtrack',
    file_path: path.join(__dirname, '..', 'music', 'test_song_1.mp3')
  },
  {
    title: 'Tavern Song',
    artist: 'Medieval Minstrels',
    album: 'Songs of the Inn',
    duration: 180,
    file_size: 4194304,
    track_number: 3,
    year: 2022,
    genre: 'Folk',
    file_path: path.join(__dirname, '..', 'music', 'test_song_2.mp3')
  },
  {
    title: 'Dragon\'s Lair',
    artist: 'Epic Composer',
    album: 'Legendary Creatures',
    duration: 312,
    file_size: 7340032,
    track_number: 5,
    year: 2023,
    genre: 'Orchestral',
    file_path: path.join(__dirname, '..', 'music', 'test_song_3.mp3')
  },
  {
    title: 'Forest Melody',
    artist: 'Nature Sounds',
    album: 'Peaceful Places',
    duration: 210,
    file_size: 5000000,
    track_number: 2,
    year: 2021,
    genre: 'Ambient',
    file_path: path.join(__dirname, '..', 'music', 'test_song_4.mp3')
  },
  {
    title: 'Victory March',
    artist: 'Fantasy Orchestra',
    album: 'Adventures in Sound',
    duration: 195,
    file_size: 4500000,
    track_number: 2,
    year: 2023,
    genre: 'Soundtrack',
    file_path: path.join(__dirname, '..', 'music', 'test_song_5.mp3')
  },
  {
    title: 'Mystic Woods',
    artist: 'Epic Composer',
    album: 'Legendary Creatures',
    duration: 267,
    file_size: 6200000,
    track_number: 3,
    year: 2023,
    genre: 'Orchestral',
    file_path: path.join(__dirname, '..', 'music', 'test_song_6.mp3')
  },
  {
    title: 'Campfire Stories',
    artist: 'Medieval Minstrels',
    album: 'Songs of the Inn',
    duration: 156,
    file_size: 3800000,
    track_number: 1,
    year: 2022,
    genre: 'Folk',
    file_path: path.join(__dirname, '..', 'music', 'test_song_7.mp3')
  },
  {
    title: 'Ancient Ruins',
    artist: 'Fantasy Orchestra',
    album: 'Mysterious Places',
    duration: 289,
    file_size: 6700000,
    track_number: 1,
    year: 2024,
    genre: 'Soundtrack',
    file_path: path.join(__dirname, '..', 'music', 'test_song_8.mp3')
  }
];

// Insert test songs
try {
  const insertStmt = db.prepare(`
    INSERT INTO songs (
      song_id, file_path, title, artist, album, 
      duration, file_size, track_number, year, genre
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let added = 0;
  let skipped = 0;

  for (const song of testSongs) {
    const songId = generateTestId(song.title);
    
    // Check if song already exists
    const existing = db.prepare('SELECT song_id FROM songs WHERE title = ? AND artist = ?')
      .get(song.title, song.artist);
    
    if (existing) {
      console.log(`⏭️  Skipped: ${song.title} (already exists)`);
      skipped++;
      continue;
    }
    
    insertStmt.run(
      songId,
      song.file_path,
      song.title,
      song.artist,
      song.album,
      song.duration,
      song.file_size,
      song.track_number,
      song.year,
      song.genre
    );
    
    console.log(`✅ Added: ${song.title} by ${song.artist}`);
    added++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✨ Test data added successfully!`);
  console.log(`   Added: ${added} songs`);
  console.log(`   Skipped: ${skipped} songs (already existed)`);
  console.log('='.repeat(50));
  console.log('\nYou can now:');
  console.log('1. Start Bardic Forge: npm start');
  console.log('2. View your test songs in the Songs view');
  console.log('3. Test playback, playlists, and search');
  console.log('\nNote: Playback will only work if you have actual MP3 files');
  console.log('      in the music/ folder with matching names.');

} catch (error) {
  console.error('❌ Error adding test data:', error);
} finally {
  db.close();
}