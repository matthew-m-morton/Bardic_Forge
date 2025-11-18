# Bardic Forge - Setup Guide

## Step-by-Step Instructions

### 1. Copy All Files

Copy the following files from the artifacts into your VS Code project:

#### Root Level Files:
- `.gitignore` → (root)
- `README.md` → (root)
- `main.js` → (root)
- `preload.js` → (root)

#### Create Folders and Copy Files:

**src/database/**
- `db.js`
- `schema.sql`

**src/audio/**
- `converter.js`
- `metadata.js`
- `player.js`

**src/utils/**
- `hash.js`
- `fileScanner.js`
- `duplicateDetector.js`

**src/renderer/**
- `index.html`
- `styles.css`
- `renderer.js`

### 2. Create Missing Folders

In your terminal:
```bash
mkdir -p assets/icons
mkdir -p src/renderer
mkdir -p src/database
mkdir -p src/audio
mkdir -p src/utils
```

### 3. Update package.json

Your package.json should already be correct, but verify these fields:
```json
{
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev"
  }
}
```

### 4. Add .gitkeep to music folder

```bash
cd music
type nul > .gitkeep
cd ..
```

Or manually create an empty file called `.gitkeep` in the music folder.

### 5. Verify All Files Exist

Your folder structure should now look like:
```
BARDIC_FORGE/
├── .git/
├── .gitignore
├── README.md
├── main.js
├── preload.js
├── package.json
├── package-lock.json
├── node_modules/
├── music/
│   └── .gitkeep
├── assets/
│   └── icons/
└── src/
    ├── renderer/
    │   ├── index.html
    │   ├── styles.css
    │   └── renderer.js
    ├── database/
    │   ├── db.js
    │   └── schema.sql
    ├── audio/
    │   ├── converter.js
    │   ├── metadata.js
    │   └── player.js
    └── utils/
        ├── hash.js
        ├── fileScanner.js
        └── duplicateDetector.js
```

### 6. Test the Application

Run the app:
```bash
npm start
```

Or with auto-reload:
```bash
npm run dev
```

### 7. First Run Checklist

When the app opens, you should see:
- ✅ A window with dark theme
- ✅ Sidebar with "Songs", "Albums", "Artists", "Playlists"
- ✅ Main content area (empty song table)
- ✅ Album art and playback controls at bottom of sidebar
- ✅ No errors in the DevTools console (F12)

### 8. Database Verification

Check that the database was created:
1. The app should create `bardic_forge.db` in your user data folder
2. Windows: `%APPDATA%\bardic_forge\`
3. Open DevTools (F12) and check console for "Database initialized successfully"

### 9. Testing Basic Features

Try these actions:
1. Click the ⚙️ (gear) icon in top-left → Settings should open
2. Close settings modal
3. Click "Songs", "Albums", "Artists" in sidebar → Views should switch
4. Click "+ New Playlist" → Prompt should appear

### 10. If Something Doesn't Work

**Check DevTools Console (F12):**
- Look for error messages in red
- Common issues:
  - File paths incorrect
  - Database file missing
  - Missing dependencies

**Common Fixes:**
- Restart the app
- Delete `bardic_forge.db` and restart
- Check that all files are in correct locations
- Verify node_modules is complete: `npm install`

---

## Next Development Steps

Once everything is working, you can:

1. **Add test MP3 files** to the `music/` folder
2. **Manually add songs to database** (we'll implement import next)
3. **Test playback** with sample files
4. **Implement import workflow** (next major feature)

---

## Git Workflow

To commit your initial project:

```bash
git add .
git commit -m "Initial Bardic Forge setup - core functionality"
git push origin main
```

---

## Development Mode Tips

**Running with DevTools:**
```bash
npm run dev
```
This will:
- Open DevTools automatically
- Enable hot-reload on file changes
- Show detailed console logs

**Testing Database Queries:**
In DevTools console:
```javascript
// Get all songs
await window.electronAPI.db.getSongs()

// Create a playlist
await window.electronAPI.db.createPlaylist("Test Playlist")

// Get all playlists
await window.electronAPI.db.getPlaylists()
```

---

## Troubleshooting

### App won't start
- Check package.json `main` field points to `main.js`
- Verify all dependencies installed: `npm list`
- Try: `npm install` then `npm start`

### Black/blank window
- Check DevTools console for errors
- Verify `src/renderer/index.html` exists
- Check file paths in `main.js`

### Database errors
- Delete existing `bardic_forge.db` 
- Verify `src/database/schema.sql` exists
- Check file permissions

### FFmpeg errors
- Verify `ffmpeg-static` installed: `npm list ffmpeg-static`
- Reinstall if needed: `npm install ffmpeg-static`

---

## Ready to Code!

Your Bardic Forge foundation is now complete! The app has:
- ✅ Working database
- ✅ Complete UI structure
- ✅ Audio player foundation
- ✅ Playlist management
- ✅ Navigation and views

**Next features to implement:**
1. Full import workflow with conversion
2. Metadata editing
3. Duplicate detection UI
4. Album art display
5. More playback features

Happy coding! 🎵