// Initialize audio player
const player = new AudioPlayer();

// State
let currentView = 'songs';
let allSongs = [];
let filteredSongs = [];
let playlists = [];
let selectedSongs = new Set();
let currentPlaylist = null;

// DOM Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const metadataModal = document.getElementById('metadataModal');
const closeMetadataBtn = document.getElementById('closeMetadataBtn');
const createPlaylistModal = document.getElementById('createPlaylistModal');
const closePlaylistModalBtn = document.getElementById('closePlaylistModalBtn');
const createPlaylistForm = document.getElementById('createPlaylistForm');
const playlistNameInput = document.getElementById('playlistNameInput');
const cancelPlaylistBtn = document.getElementById('cancelPlaylistBtn');
const addToPlaylistModal = document.getElementById('addToPlaylistModal');
const closeAddToPlaylistBtn = document.getElementById('closeAddToPlaylistBtn');
const cancelAddToPlaylistBtn = document.getElementById('cancelAddToPlaylistBtn');
const playlistSelectionList = document.getElementById('playlistSelectionList');
const addToPlaylistMessage = document.getElementById('addToPlaylistMessage');
const songTableBody = document.getElementById('songTableBody');
const playlistList = document.getElementById('playlistList');
const searchBox = document.getElementById('searchBox');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const actionPanel = document.getElementById('actionPanel');
const selectedCount = document.getElementById('selectedCount');
const playlistBanner = document.getElementById('playlistBanner');

// Initialize app
async function initApp() {
  try {
    // Initialize database
    await window.electronAPI.db.init();
    
    // Load songs and playlists
    await loadSongs();
    await loadPlaylists();
    
    // Setup event listeners
    setupEventListeners();
    setupPlayerCallbacks();
    
    // Set default view
    switchView('songs');
    
    console.log('Bardic Forge initialized!');
  } catch (error) {
    console.error('Error initializing app:', error);
    alert('Failed to initialize Bardic Forge. Please restart the application.');
  }
}

// Load all songs from database
async function loadSongs() {
  try {
    const result = await window.electronAPI.db.getSongs();
    if (result.success) {
      allSongs = result.songs || [];
      filteredSongs = [...allSongs];
      renderSongs();
    }
  } catch (error) {
    console.error('Error loading songs:', error);
  }
}

// Load playlists
async function loadPlaylists() {
  try {
    const result = await window.electronAPI.db.getPlaylists();
    console.log('Load playlists result:', result);
    if (result.success) {
      playlists = result.playlists || [];
      console.log('Loaded playlists:', playlists);
      renderPlaylists();
    }
  } catch (error) {
    console.error('Error loading playlists:', error);
  }
}

// Render songs in table
function renderSongs() {
  songTableBody.innerHTML = '';
  
  if (filteredSongs.length === 0) {
    songTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #666;">No songs found</td></tr>';
    return;
  }
  
  filteredSongs.forEach((song, index) => {
    const row = document.createElement('tr');
    row.dataset.songId = song.song_id;
    
    const isSelected = selectedSongs.has(song.song_id);
    if (isSelected) row.classList.add('selected');
    
    const duration = formatDuration(song.duration);
    
    row.innerHTML = `
      <td class="checkbox-col"><input type="checkbox" class="song-checkbox" ${isSelected ? 'checked' : ''}></td>
      <td class="number-col">${index + 1}</td>
      <td class="title-col">${escapeHtml(song.title || 'Unknown')}</td>
      <td class="artist-col">${escapeHtml(song.artist || 'Unknown Artist')}</td>
      <td class="album-col">${escapeHtml(song.album || 'Unknown Album')}</td>
      <td class="length-col">${duration}</td>
    `;
    
    // Row click - play song
    row.addEventListener('click', (e) => {
      if (!e.target.classList.contains('song-checkbox')) {
        playSong(song, index);
      }
    });
    
    // Checkbox click
    const checkbox = row.querySelector('.song-checkbox');
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSongSelection(song.song_id);
    });
    
    // Right-click context menu
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e, song);
    });
    
    songTableBody.appendChild(row);
  });
  
  updateActionPanel();
}

// Render playlists in sidebar
function renderPlaylists() {
  playlistList.innerHTML = '';
  
  playlists.forEach(playlist => {
    const item = document.createElement('div');
    item.className = 'nav-item';
    item.dataset.playlistId = playlist.playlist_id;
    item.innerHTML = `
      <span class="nav-icon">📋</span>
      <span class="nav-label">${escapeHtml(playlist.playlist_name)}</span>
    `;
    
    item.addEventListener('click', () => {
      switchView('playlist', playlist.playlist_id);
    });
    
    playlistList.appendChild(item);
  });
}

// Switch view
async function switchView(view, playlistId = null) {
  currentView = view;
  currentPlaylist = null;
  
  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Update view title
  const viewTitle = document.getElementById('viewTitle');
  
  if (view === 'songs') {
    document.querySelector('[data-view="songs"]').classList.add('active');
    viewTitle.textContent = 'Songs';
    playlistBanner.style.display = 'none';
    filteredSongs = [...allSongs];
    renderSongs();
  } else if (view === 'albums') {
    document.querySelector('[data-view="albums"]').classList.add('active');
    viewTitle.textContent = 'Albums';
    playlistBanner.style.display = 'none';
    // TODO: Group by albums
    filteredSongs = [...allSongs];
    renderSongs();
  } else if (view === 'artists') {
    document.querySelector('[data-view="artists"]').classList.add('active');
    viewTitle.textContent = 'Artists';
    playlistBanner.style.display = 'none';
    // TODO: Group by artists
    filteredSongs = [...allSongs];
    renderSongs();
  } else if (view === 'playlist' && playlistId) {
    const playlist = playlists.find(p => p.playlist_id === playlistId);
    if (playlist) {
      currentPlaylist = playlist;
      document.querySelector(`[data-playlist-id="${playlistId}"]`).classList.add('active');
      viewTitle.textContent = playlist.playlist_name;
      
      // Show playlist banner
      playlistBanner.style.display = 'flex';
      document.getElementById('bannerPlaylistName').textContent = playlist.playlist_name;
      
      // Load playlist songs
      const result = await window.electronAPI.db.getPlaylistSongs(playlistId);
      if (result.success) {
        filteredSongs = result.songs || [];
        const totalDuration = filteredSongs.reduce((sum, song) => sum + (song.duration || 0), 0);
        document.getElementById('bannerPlaylistStats').textContent = 
          `${filteredSongs.length} songs • ${formatDuration(totalDuration)} total`;
        renderSongs();
      }
    }
  }
  
  clearSelection();
}

// Play a song
function playSong(song, index) {
  player.setPlaylist(filteredSongs);
  player.playSongAtIndex(index);
  updateNowPlaying(song);
}

// Update now playing display
function updateNowPlaying(song) {
  if (song) {
    document.getElementById('nowPlayingTitle').textContent = song.title || 'Unknown';
    document.getElementById('nowPlayingArtist').textContent = song.artist || 'Unknown Artist';
    document.getElementById('playBtn').textContent = '⏸';
  }
}

// Format duration seconds to MM:SS
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Toggle song selection
function toggleSongSelection(songId) {
  if (selectedSongs.has(songId)) {
    selectedSongs.delete(songId);
  } else {
    selectedSongs.add(songId);
  }
  renderSongs();
}

// Clear selection
function clearSelection() {
  selectedSongs.clear();
  selectAllCheckbox.checked = false;
  renderSongs();
}

// Update action panel
function updateActionPanel() {
  const count = selectedSongs.size;
  
  if (count > 0) {
    actionPanel.style.display = 'flex';
    selectedCount.textContent = `${count} song${count > 1 ? 's' : ''} selected`;
  } else {
    actionPanel.style.display = 'none';
  }
}

// Show context menu (simple version)
function showContextMenu(event, song) {
  // TODO: Implement proper context menu
  console.log('Context menu for:', song.title);
}

// Search songs
function searchSongs(query) {
  if (!query) {
    filteredSongs = [...allSongs];
  } else {
    const lowerQuery = query.toLowerCase();
    filteredSongs = allSongs.filter(song => 
      (song.title && song.title.toLowerCase().includes(lowerQuery)) ||
      (song.artist && song.artist.toLowerCase().includes(lowerQuery)) ||
      (song.album && song.album.toLowerCase().includes(lowerQuery))
    );
  }
  renderSongs();
}

// Setup player callbacks
function setupPlayerCallbacks() {
  player.onPlay(() => {
    document.getElementById('playBtn').textContent = '⏸';
  });

  player.onPause(() => {
    document.getElementById('playBtn').textContent = '▶';
  });

  player.onTimeUpdate((data) => {
    document.getElementById('currentTime').textContent = formatDuration(Math.floor(data.currentTime));
    document.getElementById('totalTime').textContent = formatDuration(Math.floor(data.duration));
    document.getElementById('progressBar').value = data.percent || 0;
  });

  player.onLoaded((data) => {
    // Update now playing display when a new song loads (next/previous buttons)
    if (player.currentSong) {
      updateNowPlaying(player.currentSong);
    }
  });

  player.onEnded(() => {
    console.log('Song ended');
  });
}

// Setup event listeners
function setupEventListeners() {
  // Settings modal
  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
  });
  
  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
  });
  
  // Close modals on outside click
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('active');
    }
  });
  
  metadataModal.addEventListener('click', (e) => {
    if (e.target === metadataModal) {
      metadataModal.classList.remove('active');
    }
  });
  
  // Navigation
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => {
      switchView(item.dataset.view);
    });
  });
  
  // Search
  searchBox.addEventListener('input', (e) => {
    searchSongs(e.target.value);
  });
  
  // Select all
  selectAllCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      filteredSongs.forEach(song => selectedSongs.add(song.song_id));
    } else {
      clearSelection();
    }
    renderSongs();
  });
  
  // Playback controls
  document.getElementById('playBtn').addEventListener('click', () => {
    player.togglePlayPause();
  });
  
  document.getElementById('prevBtn').addEventListener('click', () => {
    player.previous();
  });
  
  document.getElementById('nextBtn').addEventListener('click', () => {
    player.next();
  });
  
  document.getElementById('shuffleBtn').addEventListener('click', (e) => {
    const isShuffleOn = player.toggleShuffle();
    e.target.classList.toggle('active', isShuffleOn);
  });
  
  document.getElementById('repeatBtn').addEventListener('click', (e) => {
    const mode = player.cycleRepeat();
    e.target.classList.toggle('active', mode !== 'none');
  });
  
  // Progress bar
  document.getElementById('progressBar').addEventListener('input', (e) => {
    player.seekPercent(e.target.value);
  });
  
  // Add playlist - open modal
  document.getElementById('addPlaylistBtn').addEventListener('click', () => {
    playlistNameInput.value = '';
    createPlaylistModal.classList.add('active');
    playlistNameInput.focus();
  });

  // Create playlist form submission
  createPlaylistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = playlistNameInput.value.trim();
    if (name) {
      console.log('Creating playlist:', name);
      const result = await window.electronAPI.db.createPlaylist(name);
      console.log('Create playlist result:', result);
      if (result.success) {
        console.log('Playlist created successfully, reloading playlists...');
        await loadPlaylists();
        createPlaylistModal.classList.remove('active');
        playlistNameInput.value = '';
      } else {
        console.error('Failed to create playlist:', result.error);
      }
    }
  });

  // Close playlist modal
  closePlaylistModalBtn.addEventListener('click', () => {
    createPlaylistModal.classList.remove('active');
  });

  cancelPlaylistBtn.addEventListener('click', () => {
    createPlaylistModal.classList.remove('active');
  });

  // Close playlist modal on outside click
  createPlaylistModal.addEventListener('click', (e) => {
    if (e.target === createPlaylistModal) {
      createPlaylistModal.classList.remove('active');
    }
  });
  
  // Settings actions
  document.getElementById('importFilesBtn').addEventListener('click', importFiles);
  document.getElementById('exitAppBtn').addEventListener('click', () => {
    window.electronAPI.quitApp();
  });
  
  // Action panel
  document.getElementById('compareBtn').addEventListener('click', compareSelected);
  document.getElementById('addToPlaylistBtn').addEventListener('click', showAddToPlaylistModal);
  document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);

  // Add to playlist modal handlers
  closeAddToPlaylistBtn.addEventListener('click', () => {
    addToPlaylistModal.classList.remove('active');
  });

  cancelAddToPlaylistBtn.addEventListener('click', () => {
    addToPlaylistModal.classList.remove('active');
  });

  addToPlaylistModal.addEventListener('click', (e) => {
    if (e.target === addToPlaylistModal) {
      addToPlaylistModal.classList.remove('active');
    }
  });
}

// Import files
async function importFiles() {
  try {
    // Select files
    const files = await window.electronAPI.selectMusicFiles();
    if (!files || files.length === 0) {
      return;
    }

    // Get info about files
    const info = await window.electronAPI.import.getInfo(files);

    if (!info.canImport) {
      alert('No MP3 files found in selection. Currently only MP3 files are supported.');
      return;
    }

    if (info.unsupportedFiles > 0) {
      const proceed = confirm(
        `Found ${info.mp3Files} MP3 file(s) and ${info.unsupportedFiles} unsupported file(s).\n\n` +
        `Only MP3 files will be imported. Continue?`
      );
      if (!proceed) return;
    }

    // Show progress
    console.log(`Importing ${info.mp3Files} MP3 file(s)...`);

    // Setup progress listener
    const progressHandler = (progress) => {
      if (progress.status === 'processing') {
        console.log(`[${progress.current}/${progress.total}] Importing: ${progress.file}`);
      } else if (progress.status === 'complete') {
        console.log('Import complete!', progress.results);
      }
    };
    window.electronAPI.import.onProgress(progressHandler);

    // Import files
    const result = await window.electronAPI.import.importMP3Files(info.files);

    // Remove progress listener
    window.electronAPI.import.removeProgressListener(progressHandler);

    if (result.success) {
      const res = result.results;
      alert(
        `Import Complete!\n\n` +
        `✅ Imported: ${res.imported}\n` +
        `⏭️  Skipped (duplicates): ${res.skipped}\n` +
        `❌ Failed: ${res.failed}`
      );

      // Reload songs to show newly imported ones
      await loadSongs();

      // Close settings modal
      settingsModal.classList.remove('active');
    } else {
      alert(`Import failed: ${result.error}`);
    }

  } catch (error) {
    console.error('Import error:', error);
    alert(`Import failed: ${error.message}`);
  }
}

// Compare selected songs
function compareSelected() {
  if (selectedSongs.size < 2 || selectedSongs.size > 4) {
    alert('Please select 2-4 songs to compare');
    return;
  }
  // TODO: Implement comparison modal
  console.log('Comparing:', selectedSongs);
}

// Delete selected songs
// Show add to playlist modal
function showAddToPlaylistModal() {
  if (selectedSongs.size === 0) {
    alert('Please select at least one song');
    return;
  }

  if (playlists.length === 0) {
    alert('No playlists available. Create a playlist first!');
    return;
  }

  // Update message
  addToPlaylistMessage.textContent = `Add ${selectedSongs.size} song(s) to playlist:`;

  // Populate playlist selection
  playlistSelectionList.innerHTML = '';
  playlists.forEach(playlist => {
    const btn = document.createElement('button');
    btn.className = 'btn primary';
    btn.style.width = '100%';
    btn.style.marginBottom = '10px';
    btn.textContent = playlist.playlist_name;
    btn.addEventListener('click', async () => {
      await addSongsToPlaylist(playlist.playlist_id, playlist.playlist_name);
    });
    playlistSelectionList.appendChild(btn);
  });

  // Show modal
  addToPlaylistModal.classList.add('active');
}

// Add selected songs to a playlist
async function addSongsToPlaylist(playlistId, playlistName) {
  let successCount = 0;
  let failCount = 0;

  for (const songId of selectedSongs) {
    const result = await window.electronAPI.db.addSongToPlaylist(playlistId, songId);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
      console.error(`Failed to add song ${songId} to playlist:`, result.error);
    }
  }

  // Close modal
  addToPlaylistModal.classList.remove('active');

  // Show result
  if (failCount === 0) {
    alert(`Successfully added ${successCount} song(s) to "${playlistName}"`);
  } else {
    alert(`Added ${successCount} song(s), failed to add ${failCount} song(s) to "${playlistName}"`);
  }

  // Clear selection
  clearSelection();
}

async function deleteSelected() {
  if (selectedSongs.size === 0) return;

  const confirmed = confirm(`Delete ${selectedSongs.size} song(s)?`);
  if (!confirmed) return;

  for (const songId of selectedSongs) {
    await window.electronAPI.db.deleteSong(songId);
  }

  clearSelection();
  await loadSongs();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}