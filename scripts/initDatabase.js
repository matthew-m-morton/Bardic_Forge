/**
 * Initialize Database Script
 * This script manually creates the database if the app hasn't done it yet
 * Run with: node scripts/initDatabase.js
 */

const Database = require('better-sqlite3');
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

const userDataPath = getUserDataPath();
const dbPath = path.join(userDataPath, 'bardic_forge.db');

console.log('User data directory:', userDataPath);
console.log('Database path:', dbPath);

// Create userData directory if it doesn't exist
if (!fs.existsSync(userDataPath)) {
  console.log('Creating user data directory...');
  fs.mkdirSync(userDataPath, { recursive: true });
  console.log('✅ Directory created');
}

// Check if database already exists
if (fs.existsSync(dbPath)) {
  console.log('⚠️  Database already exists at:', dbPath);
  console.log('    No need to initialize.');
  process.exit(0);
}

// Create database
console.log('\nCreating database...');
const db = new Database(dbPath);

// Read schema
const schemaPath = path.join(__dirname, '..', 'src', 'database', 'schema.sql');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Schema file not found at:', schemaPath);
  console.error('   Make sure src/database/schema.sql exists');
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf8');

try {
  // Execute schema
  db.exec(schema);
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  
  console.log('✅ Database created successfully!');
  console.log('   Location:', dbPath);
  console.log('\nTables created:');
  
  // List tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`   - ${table.name} (${count.count} rows)`);
  });
  
  console.log('\nYou can now:');
  console.log('1. Run: node scripts/addTestData.js');
  console.log('2. Then: npm start');
  
} catch (error) {
  console.error('❌ Error creating database:', error);
} finally {
  db.close();
}