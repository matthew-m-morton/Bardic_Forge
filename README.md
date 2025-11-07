# Bardic Forge 🎵

A desktop audio player and manager built with Electron, Node.js, and SQLite.

## Features

- 🎵 Play MP3 audio files with full playback controls
- 📁 Organize music with playlists
- 🔍 Search and filter your music library
- ✏️ Edit song metadata (ID3 tags)
- 🔄 Convert various audio formats to MP3
- 🎯 Automatic duplicate detection
- 📊 View songs by Artists, Albums, or All Songs
- 🎨 Clean, dark-themed user interface

## Project Structure

```
bardic-forge/
├── main.js                      # Electron main process
├── preload.js                   # IPC bridge (security)
├── package.json                 # Dependencies & scripts
│
├── src/
│   ├── renderer/                # Frontend (UI)
│   │   ├── index.html          # Main window
│   │   ├── styles.css          # Styling
│   │   └── renderer.js         # UI logic
│   │
│   ├── database/                # Database layer
│   │   ├── db.js               # SQLite operations
│   │   └── schema.sql          # Database schema
│   │
│   ├── audio/                   # Audio processing
│   │   ├── converter.js        # FFmpeg conversion
│   │   ├── metadata.js         # ID3 tag reading/writing
│   │   └── player.js           # Audio player class
│   │
│   └── utils/                   # Helper functions
│       ├── hash.js             # Bardic ID generation
│       ├── fileScanner.js      # Folder scanning
│       └── duplicateDetector.js # Duplicate detection
│
└── music/                       # Default music folder
```

## How to Run

### Development Mode
```bash
npm start
```

### Development with Auto-Reload
```bash
npm run dev
```

## Database Schema

### Songs Table
- `song_id` (TEXT) - Unique hash ID stored in TXXX:BARDIC_ID tag
- `file_path` - Path to MP3 file
- `title`, `artist`, `album` - Metadata
- `duration` - Length in seconds
- `file_size` - Size in bytes
- `track_number`, `year`, `genre`
- `date_added`, `date_modified`

### Playlists Table
- `playlist_id` - Auto-increment ID
- `playlist_name`
- `date_created`, `date_modified`

### Playlist_Songs (Junction Table)
- Links playlists to songs
- Tracks song order in playlist

### Settings Table
- Key-value pairs for app settings

## Import Workflow

1. User selects audio files
2. Files converted to MP3 with ID3v2 tags
3. Generate hash from (duration + filesize + title)
4. Check for existing TXXX:BARDIC_ID tag
5. Write Bardic ID to file and database
6. Handle duplicates with user confirmation

## Key Technologies

- **Electron** - Desktop app framework
- **better-sqlite3** - Fast SQLite database
- **fluent-ffmpeg** - Audio conversion
- **node-id3** - ID3 tag manipulation
- **music-metadata** - Read audio metadata
- **string-similarity** - Fuzzy duplicate matching

## Next Steps for Development

### Immediate TODOs:
1. Implement full import workflow with progress tracking
2. Add metadata editing modal functionality
3. Implement duplicate comparison UI
4. Add album art display
5. Implement folder relocation feature

### Future Enhancements:
- Album/Artist grouping views
- Advanced search filters
- Keyboard shortcuts
- Drag-and-drop file import
- Export playlists
- Themes (light/dark)
- Equalizer
- Lyrics display

## Development Notes

### IPC Communication
- Main process handles file system, database, and audio conversion
- Renderer process handles UI and user interactions
- `preload.js` exposes safe APIs via `window.electronAPI`

### Security
- Context isolation enabled
- Node integration disabled in renderer
- All Node.js operations go through IPC

### Audio Playback
- Uses HTML5 Audio API in renderer
- File paths use `file://` protocol
- Playback state managed by `AudioPlayer` class

## Troubleshooting

### Database not initializing
- Check that `src/database/schema.sql` exists
- Ensure userData directory is writable

### Audio files won't play
- Verify files are valid MP3 format
- Check file path permissions
- Look for errors in DevTools console

### FFmpeg conversion fails
- Ensure ffmpeg-static installed correctly
- Check file format is supported

## License

ISC

## Author

Matthew Morton with help from claude

---

Built with ❤️ for organizing and enjoying music collections