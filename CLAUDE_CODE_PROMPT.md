# Bardic Forge - Claude Code Context

I'm working on **Bardic Forge**, a desktop audio player and music library manager built with Electron, Node.js, and SQLite. Here's the complete context:

## Project Overview

**Bardic Forge** is an Electron desktop application that:
- Plays MP3 audio files with full playback controls
- Manages a music library with database storage
- Organizes music into playlists
- Converts various audio formats to MP3 with ID3v2 tags
- Detects and manages duplicate songs
- Allows metadata editing that writes to both database and audio files

## Technology Stack

- **Electron**: Desktop app framework
- **Node.js**: Backend logic
- **better-sqlite3**: Fast SQLite database
- **fluent-ffmpeg** + **ffmpeg-static**: Audio conversion
- **node-id3**: ID3v2 tag manipulation
- **music-metadata**: Read audio file metadata
- **string-similarity**: Fuzzy duplicate matching
- HTML/CSS/JavaScript: Frontend UI

## Project Structure

```
bardic-forge/
├── main.js                      # Electron main process (IPC handlers, database connections)
├── preload.js                   # Security bridge between main and renderer
├── package.json                 # Dependencies and scripts
│
├── src/
│   ├── renderer/                # Frontend UI
│   │   ├── index.html          # Main window layout
│   │   ├── styles.css          # Dark theme styling
│   │   └── renderer.js         # UI logic, state management, player integration
│   │
│   ├── database/                # Database layer
│   │   ├── db.js               # All SQLite CRUD operations
│   │   └── schema.sql          # Database schema definitions
│   │
│   ├── audio/                   # Audio processing
│   │   ├── converter.js        # FFmpeg audio conversion to MP3
│   │   ├── metadata.js         # Read/write ID3 tags
│   │   └── player.js           # AudioPlayer class for playback
│   │
│   └── utils/                   # Helper functions
│       ├── hash.js             # Generate Bardic ID (unique song identifier)
│       ├── fileScanner.js      # Scan folders for audio files
│       └── duplicateDetector.js # Fuzzy matching for duplicate detection
│
├── scripts/                     # Test/utility scripts
│   ├── initDatabase.js         # Manually create database
│   ├── addTestData.js          # Add sample songs for testing
│   ├── clearTestData.js        # Clear all data from database
│   └── viewDatabase.js         # Display database contents
│
└── music/                       # Default music folder (user's library)
```

## Database Schema

### Songs Table
```sql
- song_id (TEXT, PRIMARY KEY) - Unique hash from (duration + filesize + title)
- file_path (TEXT) - Absolute path to MP3 file
- original_file_path (TEXT) - Path to original file if converted
- original_format (TEXT) - Original format (FLAC, WAV, etc.)
- title, artist, album (TEXT)
- duration (INTEGER) - Seconds
- file_size (INTEGER) - Bytes
- track_number, year (INTEGER)
- genre (TEXT)
- date_added, date_modified (DATETIME)
```

### Playlists Table
```sql
- playlist_id (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- playlist_name (TEXT)
- date_created, date_modified (DATETIME)
```

### Playlist_Songs (Junction Table)
```sql
- id (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- playlist_id (INTEGER, FK)
- song_id (TEXT, FK)
- position (INTEGER) - Order in playlist
- date_added (DATETIME)
```

### Settings Table
```sql
- setting_key (TEXT, PRIMARY KEY)
- setting_value (TEXT)
```

Default settings: music_folder_path, conversion_bitrate, theme, volume

## Key Design Decisions

### 1. Unique Song ID System (Bardic ID)
- Generated from: `hash(duration + filesize + title)`
- Stored as **TXXX:BARDIC_ID** custom ID3v2 tag in MP3 files
- Survives file moves and metadata edits
- Prevents duplicates

### 2. Import Workflow (NOT YET IMPLEMENTED)
The planned workflow:
1. User selects files/folders
2. Convert to MP3 with ID3v2 (if needed)
3. Read metadata
4. Check for existing TXXX:BARDIC_ID tag
5. If no tag: generate hash, check for collision in database
6. If collision: show duplicate comparison UI
7. Write Bardic ID to file and database
8. User chooses to keep/delete original files

### 3. Metadata Editing
When user edits metadata:
- Update database immediately
- Write changes to MP3 file ID3v2 tags
- Update `date_modified` automatically
- Fields: title, artist, album, year, genre, track_number

### 4. Duplicate Detection
Three approaches:
- **Exact match**: Title + Artist identical
- **Fuzzy match**: Uses string-similarity library (threshold 0.8)
- **Manual comparison**: User selects 2-4 songs, sees side-by-side metadata

### 5. Security (Electron Best Practices)
- `contextIsolation: true`
- `nodeIntegration: false`
- All Node.js operations go through IPC in preload.js
- Renderer process uses `window.electronAPI.*` for backend access

## Current Status

### ✅ What's Working:
- App launches with full UI
- Database schema and CRUD operations
- Navigation between views (Songs/Albums/Artists/Playlists)
- Playlist creation
- Song search and filtering
- Selection system (checkboxes)
- Settings modal
- AudioPlayer class (HTML5 Audio)
- All helper utilities (hash, file scanner, duplicate detector)

### ❌ Not Yet Implemented:
- **Database initialization is failing** (current issue)
- Import workflow with conversion
- Metadata editing form submission
- Duplicate comparison UI
- Adding songs to playlists
- Album art extraction/display
- Relocate music folder feature
- Volume control UI

## Current Problem

**Database is not being created when app starts.** The `db.initDatabase()` is called in main.js but the database file is not being created at the expected location:
- Windows: `%APPDATA%/bardic_forge/bardic_forge.db`

Need to debug why the database initialization is failing.

## UI Design (Dark Theme)

- Dark background (#1a1a1a)
- Sidebar with navigation and player controls
- Main content area with song table
- Settings modal with gear icon (⚙️)
- Checkboxes for multi-select
- Progress bar at bottom for imports
- Spotify-inspired aesthetic

## Development Commands

```bash
npm start          # Run app
npm run dev        # Run with DevTools and auto-reload
```

## What I Need Help With

1. **Fix database initialization** - Database not being created on app start
2. After that's fixed: **Test with sample data** using the scripts in `scripts/` folder
3. Then: **Implement the import workflow** as the next major feature

## Important Notes

- All file paths must be absolute
- Audio playback uses `file://` protocol
- Database uses Write-Ahead Logging (WAL) mode
- Import progress should show detailed logs
- User must confirm before deleting duplicate songs
- Max 4 songs in comparison view (table-based layout)

---

This is a comprehensive desktop music player. The foundation is built, but we need to get the database working and then implement the core import feature.