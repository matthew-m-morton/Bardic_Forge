/**
 * Clear Test Data Script
 * This script removes all songs and playlists from the database
 * Run with: node scripts/clearTestData.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const DB_PATH = path.join(process.env.APPDATA || process.env.HOME, 'bardic_forge', 'bardic_forge.db');

console.log('Database path:', DB_PATH);

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Database not found!');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  This will delete ALL songs and playlists. Are you sure? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    const db = new Database(DB_PATH);
    
    try {
      // Get counts before deletion
      const songCount = db.prepare('SELECT COUNT(*) as count FROM songs').get().count;
      const playlistCount = db.prepare('SELECT COUNT(*) as count FROM playlists').get().count;
      
      // Clear tables
      db.prepare('DELETE FROM playlist_songs').run();
      db.prepare('DELETE FROM playlists').run();
      db.prepare('DELETE FROM songs').run();
      
      console.log('\n' + '='.repeat(50));
      console.log('✅ Database cleared successfully!');
      console.log(`   Deleted ${songCount} songs`);
      console.log(`   Deleted ${playlistCount} playlists`);
      console.log('='.repeat(50));
    } catch (error) {
      console.error('❌ Error clearing database:', error);
    } finally {
      db.close();
    }
  } else {
    console.log('Cancelled. No data was deleted.');
  }
  
  rl.close();
});