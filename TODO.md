# Bardic Forge - Development Checklist

## 🔴 Critical Issues (Blocking)

- [ ] **Fix database initialization** - Database not being created on app start
  - Check `main.js` database init code
  - Verify userData path is correct
  - Ensure schema.sql is being read properly
  - Test that database file is created

## 🟡 Phase 1: Core Functionality

### Database & Testing
- [x] Verify database initialization works
- [x] Run test scripts successfully
- [x] Add sample data and verify it displays
- [x] Test all CRUD operations

### Import Workflow (Priority)
- [x] File selection dialog working
- [x] Audio format detection
- [ ] FFmpeg conversion (non-MP3 → MP3)
- [ ] ID3v1 → ID3v2 upgrade
- [x] Metadata reading from files
- [x] Bardic ID generation
- [x] Check for existing Bardic ID in files
- [x] Database collision detection
- [x] Write Bardic ID to file
- [x] Insert song into database
- [x] Progress bar updates
- [x] Detailed log output
- [ ] Keep/delete original file option
- [x] Batch import support
- [x] Error handling

### Duplicate Handling
- [ ] Duplicate comparison modal UI
- [ ] Side-by-side metadata display (2-4 songs)
- [ ] Keep Both / Keep Existing / Keep New options
- [ ] Delete duplicate functionality

## 🟢 Phase 2: Essential Features

### Metadata Editing
- [ ] Edit metadata modal form submission
- [ ] Update database on save
- [ ] Write changes to MP3 file
- [ ] Auto-update date_modified
- [ ] Validation (required fields)

### Playlist Management
- [x] Add songs to playlist (via "Add to Playlist" button)
- [x] Remove songs from playlist
- [x] Reorder songs in playlist (up/down arrows)
- [ ] Reorder songs in playlist (drag-and-drop)
- [x] Rename playlist
- [ ] Delete playlist
- [ ] Play playlist from start

### Playback
- [x] Play song on row click
- [x] Now playing display updates
- [x] Progress bar tracks playback
- [x] Next/Previous buttons work
- [x] Shuffle mode works
- [x] Repeat modes (none/one/all)
- [x] Volume control slider
- [x] Mute button

## 🔵 Phase 3: Polish & UX

### Views & Organization
- [ ] Group songs by Album view
- [ ] Group songs by Artist view
- [x] Album art extraction from files
- [x] Album art display in sidebar (now-playing area)
- [ ] Album art in song rows (optional)

### Search & Filter
- [ ] Advanced search (by artist, album, year, genre)
- [ ] Filter by genre dropdown
- [x] Sort columns (click header to sort)
- [x] Reverse sort order (click again)
- [ ] Search results highlighting

### Duplicate Detection
- [ ] Manual duplicate comparison (2-4 songs)
- [ ] Automatic duplicate finder
- [ ] Fuzzy match suggestions
- [ ] Batch duplicate handling

### Settings
- [ ] Relocate music folder
- [ ] Scan folder for new songs
- [ ] Bitrate selection persists
- [ ] Theme toggle (dark/light)
- [ ] Export settings
- [ ] Import settings

## 🟣 Phase 4: Advanced Features

### Context Menus
- [ ] Right-click on song → Edit metadata
- [ ] Right-click on song → Add to playlist
- [ ] Right-click on song → Delete
- [ ] Right-click on song → Show in folder
- [ ] Right-click on playlist → Rename/Delete

### Keyboard Shortcuts
- [ ] Space - Play/Pause
- [ ] Ctrl+F - Focus search
- [ ] Ctrl+A - Select all
- [ ] Delete - Delete selected
- [ ] Arrow keys - Navigate songs
- [ ] Enter - Play selected song

### UI Enhancements
- [ ] Drag and drop files into app
- [ ] Toast notifications (song added, etc.)
- [ ] Loading spinners
- [ ] Empty state messages
- [ ] Tooltips on buttons
- [ ] Confirmation dialogs

### Performance
- [ ] Lazy load large song lists
- [ ] Virtual scrolling for 1000+ songs
- [ ] Optimize database queries
- [ ] Cache album art
- [ ] Debounce search input

## 🎨 Nice to Have

- [ ] Visualizer during playback
- [ ] Lyrics display (if in tags)
- [ ] Equalizer
- [ ] Export playlists (M3U, etc.)
- [ ] Import playlists
- [ ] Song ratings (1-5 stars)
- [ ] Play count tracking
- [ ] Last played timestamp
- [ ] Smart playlists (auto-generated)
- [ ] Crossfade between songs
- [ ] Gapless playback
- [ ] Mini player mode
- [ ] System tray integration
- [ ] Discord Rich Presence
- [ ] Last.fm scrobbling

## 🐛 Known Issues

- [ ] Database not initializing on first run
- [ ] (Add more as discovered)

## 📝 Documentation

- [x] README.md
- [x] SETUP_GUIDE.md
- [x] TESTING_GUIDE.md
- [ ] API documentation
- [ ] User guide
- [ ] Contributing guidelines

## 🚀 Release Preparation

- [ ] App icon design
- [ ] Build scripts for distribution
- [ ] Windows installer
- [ ] Mac DMG
- [ ] Linux AppImage
- [ ] Auto-updater
- [ ] Crash reporting
- [ ] Analytics (optional)

---

## Current Sprint Focus

**Sprint 1: Get Database Working & Test**
1. Fix database initialization
2. Test with sample data
3. Verify all UI components work

**Sprint 2: Import Workflow**
1. Implement file selection
2. Build conversion pipeline
3. Add progress tracking
4. Handle duplicates

**Sprint 3: Complete Core Features**
1. Metadata editing
2. Playlist management
3. Playback improvements