# Testing Guide - Bardic Forge

This guide will help you test Bardic Forge with sample data before building the full import system.

## Setup Test Scripts

### 1. Create Scripts Folder

```bash
mkdir scripts
```

### 2. Copy Test Scripts

Copy these three scripts into the `scripts/` folder:
- `addTestData.js` - Adds sample songs to database
- `clearTestData.js` - Removes all data from database
- `viewDatabase.js` - Shows what's in the database

## Testing Workflow

### Step 1: Run the App Once

First, run the app to create the database:

```bash
npm start
```

Then close it. This creates the database file at:
- **Windows**: `C:\Users\YourName\AppData\Roaming\bardic_forge\bardic_forge.db`
- **Mac**: `~/Library/Application Support/bardic_forge/bardic_forge.db`
- **Linux**: `~/.config/bardic_forge/bardic_forge.db`

### Step 2: Add Test Data

```bash
node scripts/addTestData.js
```

This will add 8 test songs to your database with these details:
- Various artists (Fantasy Orchestra, Medieval Minstrels, Epic Composer)
- Multiple albums
- Different genres (Soundtrack, Folk, Orchestral, Ambient)
- Durations ranging from 2-5 minutes

**Expected output:**
```
✅ Added: Epic Battle Theme by Fantasy Orchestra
✅ Added: Tavern Song by Medieval Minstrels
...
✨ Test data added successfully!
   Added: 8 songs
```

### Step 3: View Database Contents

```bash
node scripts/viewDatabase.js
```

This shows all songs, playlists, and settings in your database.

### Step 4: Start the App and Test

```bash
npm start
```

## What to Test

### ✅ UI and Navigation

1. **Songs View**
   - [ ] Should see 8 test songs in the table
   - [ ] Click different songs - rows should highlight
   - [ ] Numbers should show 1-8
   - [ ] All metadata visible (Title, Artist, Album, Length)

2. **Search**
   - [ ] Type "Epic" → Should filter to 2 songs
   - [ ] Type "Orchestra" → Should filter to 3 songs
   - [ ] Clear search → All 8 songs return

3. **Albums View**
   - [ ] Click "Albums" in sidebar
   - [ ] Should see songs (grouped by album would be nice, but for now all songs is fine)

4. **Artists View**
   - [ ] Click "Artists" in sidebar
   - [ ] Should see songs (grouped by artist would be nice, but for now all songs is fine)

5. **Playlists**
   - [ ] Click "+ New Playlist"
   - [ ] Enter name "Test Playlist"
   - [ ] Should appear in sidebar under Playlists
   - [ ] Click the playlist → Should show empty playlist view
   - [ ] Playlist banner should show "0 songs • 0:00 total"

### ✅ Selection System

1. **Checkbox Selection**
   - [ ] Click checkbox on first song → Should check
   - [ ] Click another checkbox → Both should be checked
   - [ ] Action panel should appear at bottom
   - [ ] Should say "2 songs selected"

2. **Select All**
   - [ ] Click checkbox in header → All songs selected
   - [ ] Action panel should say "8 songs selected"
   - [ ] Uncheck header → All deselected, action panel hides

3. **Selection Actions**
   - [ ] Select 2-4 songs
   - [ ] "Compare Selected" button should be enabled
   - [ ] Click it → Should log to console (feature not implemented yet)

### ✅ Playback Controls

**Note:** Playback won't actually work yet because the test songs don't point to real MP3 files. But the UI should respond:

1. **Play Button**
   - [ ] Click play button → Should change to pause icon (⏸)
   - [ ] Console may show error about file not found (expected)

2. **Next/Previous**
   - [ ] Click next button → Should attempt to play next song
   - [ ] Click previous button → Should attempt to play previous song

3. **Extra Controls**
   - [ ] Click shuffle button (🔀) → Should toggle active state (green)
   - [ ] Click repeat button (🔁) → Should toggle active state
   - [ ] Progress bar should be visible (won't move without real audio)

### ✅ Settings Modal

1. **Open Settings**
   - [ ] Click gear icon (⚙️) in top-left
   - [ ] Settings modal should appear with sections:
     - Library Management
     - Duplicate Management
     - Audio Settings
     - Exit button

2. **Settings Options**
   - [ ] Click "Import Songs/Folders" → File dialog should open (won't do anything yet)
   - [ ] Change bitrate dropdown → Should change
   - [ ] Close modal (X button or click outside) → Modal closes

### ✅ Now Playing Display

1. **Song Info**
   - [ ] Bottom of sidebar should show "No song playing"
   - [ ] Album art placeholder should show ♪ symbol
   - [ ] Time displays should show 0:00 / 0:00

### ✅ DevTools Console

Open DevTools (F12) and check:
- [ ] No red error messages on startup
- [ ] Should see "Bardic Forge initialized!"
- [ ] Should see "Database initialized successfully"
- [ ] When clicking things, appropriate logs should appear

## Testing with Real MP3 Files (Optional)

If you want to test actual playback:

1. **Add Real MP3s to music folder**
   ```bash
   # Copy any MP3 file to music/
   copy "path\to\your\song.mp3" music\test_song_1.mp3
   ```

2. **Update file_path in database**
   - Use a database viewer or
   - Modify `addTestData.js` to use actual file paths
   - Re-run the script

3. **Test Playback**
   - Click a song in the table
   - Should actually play audio!
   - Progress bar should move
   - Time should update

## Cleanup

### Clear All Test Data

```bash
node scripts/clearTestData.js
```

Type `yes` when prompted. This removes all songs and playlists.

### Start Fresh

1. Clear test data
2. Close the app
3. Delete database file manually if needed
4. Run app again to recreate database

## Troubleshooting

### Songs Not Showing Up

1. Check database was created:
   ```bash
   node scripts/viewDatabase.js
   ```

2. Verify songs were added:
   - Should see 8 songs listed
   - If not, run `addTestData.js` again

3. Restart the app

### Selection Not Working

- Check DevTools console for errors
- Make sure you're clicking the checkbox, not the row
- Try refreshing by switching views

### Playback Errors

**Expected!** Test data points to fake files. Errors like:
- "Failed to load audio"
- "File not found"
- "Network error"

These are normal without real MP3 files.

### Database Locked Error

- Close all instances of the app
- Close any database viewers
- Try again

## What's Working vs. What's Not

### ✅ Should Work:
- All UI elements display
- Navigation between views
- Search and filtering
- Selection system
- Playlist creation
- Modal dialogs
- Settings options
- UI state changes (button states, active views)

### ❌ Won't Work Yet:
- Actual audio playback (no real files)
- Importing new music
- Editing metadata
- Duplicate comparison UI
- Adding songs to playlists (UI exists, logic not connected)
- Album art display
- Volume control

## Next Steps After Testing

Once you've verified everything works:

1. **Report what works** ✅
2. **Report any bugs** 🐛
3. **Choose next feature** to implement:
   - Import workflow (most important)
   - Metadata editing
   - Playlist song management
   - Duplicate comparison UI

---

## Quick Reference

**Add test data:**
```bash
node scripts/addTestData.js
```

**View database:**
```bash
node scripts/viewDatabase.js
```

**Clear database:**
```bash
node scripts/clearTestData.js
```

**Run app:**
```bash
npm start
```

**Run app with DevTools:**
```bash
npm run dev
```

---

Happy testing! 🎵 Let me know what works and what doesn't!