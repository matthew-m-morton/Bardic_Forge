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
    if (result.success) {
      playlists = result.playlists || [];
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
  
  // Add playlist
  document.getElementById('addPlaylistBtn').addEventListener('click', async () => {
    const name = prompt('Enter playlist name:');
    if (name) {
      const result = await window.electronAPI.db.createPlaylist(name);
      if (result.success) {
        await loadPlaylists();
      }
    }
  });
  
  // Settings actions
  document.getElementById('importFilesBtn').addEventListener('click', importFiles);
  document.getElementById('exitAppBtn').addEventListener('click', () => {
    window.electronAPI.quitApp();
  });
  
  // Action panel
  document.getElementById('compareBtn').addEventListener('click', compareSelected);
  document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
}

// Import files
async function importFiles() {
  const files = await window.electronAPI.selectMusicFiles();
  if (files && files.length > 0) {
    console.log('Importing files:', files);
    // TODO: Implement import workflow
    alert(`Selected ${files.length} files. Import functionality coming soon!`);
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