/**
 * Clear Test Data Script
 * This script removes all songs and playlists from the database
 * Run with: node scripts/clearTestData.js
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

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
  console.error('❌ Database not found!');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  This will delete ALL songs and playlists. Are you sure? (yes/no): ', async (answer) => {
  if (answer.toLowerCase() === 'yes') {
    try {
      // Initialize sql.js
      const SQL = await initSqlJs();

      // Load database
      const buffer = fs.readFileSync(DB_PATH);
      const db = new SQL.Database(buffer);

      // Get counts before deletion
      const songStmt = db.prepare('SELECT COUNT(*) as count FROM songs');
      songStmt.step();
      const songCount = songStmt.getAsObject().count;
      songStmt.free();

      const playlistStmt = db.prepare('SELECT COUNT(*) as count FROM playlists');
      playlistStmt.step();
      const playlistCount = playlistStmt.getAsObject().count;
      playlistStmt.free();

      // Clear tables
      db.run('DELETE FROM playlist_songs');
      db.run('DELETE FROM playlists');
      db.run('DELETE FROM songs');

      // Save database
      const data = db.export();
      const outputBuffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, outputBuffer);

      db.close();

      console.log('\n' + '='.repeat(50));
      console.log('✅ Database cleared successfully!');
      console.log(`   Deleted ${songCount} songs`);
      console.log(`   Deleted ${playlistCount} playlists`);
      console.log('='.repeat(50));
    } catch (error) {
      console.error('❌ Error clearing database:', error);
    }
  } else {
    console.log('Cancelled. No data was deleted.');
  }

  rl.close();
});
