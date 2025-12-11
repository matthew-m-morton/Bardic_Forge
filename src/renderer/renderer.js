// Initialize audio player
const player = new AudioPlayer();

// State
let currentView = 'songs';
let allSongs = [];
let filteredSongs = [];
let playlists = [];
let selectedSongs = new Set();
let currentPlaylist = null;
let sortColumn = null; // Current column being sorted
let sortDirection = 'asc'; // 'asc' or 'desc'
let expandedSections = new Set(); // Track which album/artist sections are expanded

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
const editPlaylistNameModal = document.getElementById('editPlaylistNameModal');
const closeEditPlaylistNameBtn = document.getElementById('closeEditPlaylistNameBtn');
const editPlaylistNameForm = document.getElementById('editPlaylistNameForm');
const editPlaylistNameInput = document.getElementById('editPlaylistNameInput');
const cancelEditPlaylistNameBtn = document.getElementById('cancelEditPlaylistNameBtn');
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

  // Helper function to get sort indicator
  const getSortIndicator = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  // Update table header based on view
  const tableHeader = document.querySelector('.song-table thead tr');
  if (currentPlaylist) {
    // Playlist view - add reorder column (no sorting in playlist view)
    tableHeader.innerHTML = `
      <th class="checkbox-col"><input type="checkbox" id="selectAllCheckbox"></th>
      <th class="reorder-col"></th>
      <th class="number-col">#</th>
      <th class="title-col">Name</th>
      <th class="artist-col">Artist</th>
      <th class="album-col">Album</th>
      <th class="length-col">Length</th>
    `;
  } else {
    // Normal view - sortable columns
    tableHeader.innerHTML = `
      <th class="checkbox-col"><input type="checkbox" id="selectAllCheckbox"></th>
      <th class="number-col">#</th>
      <th class="title-col sortable" data-sort="title">Name${getSortIndicator('title')}</th>
      <th class="artist-col sortable" data-sort="artist">Artist${getSortIndicator('artist')}</th>
      <th class="album-col sortable" data-sort="album">Album${getSortIndicator('album')}</th>
      <th class="length-col sortable" data-sort="duration">Length${getSortIndicator('duration')}</th>
    `;

    // Add click handlers to sortable headers
    tableHeader.querySelectorAll('.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const column = th.dataset.sort;
        sortSongs(column);
      });
    });
  }

  // Re-wire select all checkbox after recreating it
  const newSelectAllCheckbox = document.getElementById('selectAllCheckbox');
  newSelectAllCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      filteredSongs.forEach(song => selectedSongs.add(song.song_id));
    } else {
      clearSelection();
    }
    renderSongs();
  });

  if (filteredSongs.length === 0) {
    const colspan = currentPlaylist ? 7 : 6;
    songTableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; padding: 40px; color: #666;">No songs found</td></tr>`;
    return;
  }

  filteredSongs.forEach((song, index) => {
    const row = document.createElement('tr');
    row.dataset.songId = song.song_id;
    row.dataset.index = index;

    const isSelected = selectedSongs.has(song.song_id);
    if (isSelected) row.classList.add('selected');

    const duration = formatDuration(song.duration);

    // Build row HTML based on whether we're in playlist view
    let rowHTML = `
      <td class="checkbox-col"><input type="checkbox" class="song-checkbox" ${isSelected ? 'checked' : ''}></td>
    `;

    // Add reorder controls if in playlist view
    if (currentPlaylist) {
      rowHTML += `
        <td class="reorder-col">
          <button class="reorder-btn" data-direction="up" ${index === 0 ? 'disabled' : ''} title="Move up">▲</button>
          <button class="reorder-btn" data-direction="down" ${index === filteredSongs.length - 1 ? 'disabled' : ''} title="Move down">▼</button>
        </td>
      `;
    }

    rowHTML += `
      <td class="number-col">${index + 1}</td>
      <td class="title-col">${escapeHtml(song.title || 'Unknown')}</td>
      <td class="artist-col">${escapeHtml(song.artist || 'Unknown Artist')}</td>
      <td class="album-col">${escapeHtml(song.album || 'Unknown Album')}</td>
      <td class="length-col">${duration}</td>
    `;

    row.innerHTML = rowHTML;

    // Row click - play song
    row.addEventListener('click', (e) => {
      if (!e.target.classList.contains('song-checkbox') && !e.target.classList.contains('reorder-btn')) {
        playSong(song, index);
      }
    });

    // Checkbox click
    const checkbox = row.querySelector('.song-checkbox');
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSongSelection(song.song_id);
    });

    // Reorder button clicks
    if (currentPlaylist) {
      const reorderBtns = row.querySelectorAll('.reorder-btn');
      reorderBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const direction = btn.dataset.direction;
          await reorderSong(index, direction);
        });
      });
    }

    // Right-click context menu
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e, song);
    });

    songTableBody.appendChild(row);
  });

  updateActionPanel();

  // Reapply highlighting to currently playing song if it exists
  if (player.currentSong && player.isPlaying) {
    highlightCurrentSong(player.currentSong.song_id);
  }
}

// Group songs by a field (album or artist)
function groupSongsBy(songs, field) {
  console.log(`📊 groupSongsBy called - field: "${field}", songs count: ${songs.length}`);
  const grouped = {};

  songs.forEach(song => {
    const key = song[field] || 'Unknown';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(song);
  });

  console.log(`📊 Grouped into ${Object.keys(grouped).length} groups:`, Object.keys(grouped));

  // Sort groups alphabetically and sort songs within each group
  const sortedGroups = {};
  Object.keys(grouped).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .forEach(key => {
      sortedGroups[key] = grouped[key].sort((a, b) => {
        // Sort by track number if grouping by album, otherwise by title
        if (field === 'album') {
          const trackA = a.track_number || 999;
          const trackB = b.track_number || 999;
          if (trackA !== trackB) return trackA - trackB;
        }
        return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase());
      });
    });

  return sortedGroups;
}

// Render grouped view (albums or artists)
function renderGroupedView(groupField) {
  console.log(`🎨 renderGroupedView called - groupField: "${groupField}"`);
  console.log(`🎨 filteredSongs.length: ${filteredSongs.length}`);
  console.log(`🎨 expandedSections:`, Array.from(expandedSections));

  songTableBody.innerHTML = '';

  // Update table header for grouped view (no sortable columns)
  const tableHeader = document.querySelector('.song-table thead tr');
  tableHeader.innerHTML = `
    <th class="checkbox-col"><input type="checkbox" id="selectAllCheckbox"></th>
    <th class="number-col">#</th>
    <th class="title-col">Name</th>
    <th class="artist-col">Artist</th>
    <th class="album-col">Album</th>
    <th class="length-col">Length</th>
  `;

  // Re-wire select all checkbox
  const newSelectAllCheckbox = document.getElementById('selectAllCheckbox');
  newSelectAllCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      filteredSongs.forEach(song => selectedSongs.add(song.song_id));
    } else {
      clearSelection();
    }
    renderGroupedView(groupField);
  });

  const grouped = groupSongsBy(filteredSongs, groupField);
  const groupKeys = Object.keys(grouped);
  console.log(`🎨 Total groups to render: ${groupKeys.length}`);

  if (groupKeys.length === 0) {
    console.log('⚠️ No groups found, showing empty state');
    songTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #666;">No songs found</td></tr>';
    return;
  }

  groupKeys.forEach(groupName => {
    const songs = grouped[groupName];
    const isExpanded = expandedSections.has(groupName);

    // Create group header row
    const headerRow = document.createElement('tr');
    headerRow.className = 'group-header';
    headerRow.dataset.groupName = groupName;

    const arrow = isExpanded ? '▼' : '▶';
    const label = groupField === 'album' ? 'Album' : 'Artist';

    headerRow.innerHTML = `
      <td colspan="6" class="group-header-cell">
        <span class="group-arrow">${arrow}</span>
        <span class="group-name">${escapeHtml(groupName)}</span>
        <span class="group-count">${songs.length} song${songs.length !== 1 ? 's' : ''}</span>
      </td>
    `;

    // Click to toggle expand/collapse
    headerRow.addEventListener('click', () => {
      toggleGroupExpansion(groupName, groupField);
    });

    songTableBody.appendChild(headerRow);

    // Add songs in this group (if expanded)
    if (isExpanded) {
      songs.forEach((song, index) => {
        const row = document.createElement('tr');
        row.className = 'group-song-row';
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
            // Find the actual index in filteredSongs array
            const actualIndex = filteredSongs.findIndex(s => s.song_id === song.song_id);
            playSong(song, actualIndex);
          }
        });

        // Checkbox click
        const checkbox = row.querySelector('.song-checkbox');
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleSongSelection(song.song_id);
        });

        songTableBody.appendChild(row);
      });
    }
  });

  updateActionPanel();

  // Reapply highlighting to currently playing song if it exists
  if (player.currentSong && player.isPlaying) {
    highlightCurrentSong(player.currentSong.song_id);
  }
}

// Render playlists view (show all playlists with stats)
async function renderPlaylistsView() {
  console.log('📋 renderPlaylistsView called, playlists count:', playlists.length);
  songTableBody.innerHTML = '';

  // Update table header for playlists view
  const tableHeader = document.querySelector('.song-table thead tr');
  tableHeader.innerHTML = `
    <th class="checkbox-col"></th>
    <th class="number-col">#</th>
    <th class="title-col">Playlist Name</th>
    <th class="artist-col">Songs</th>
    <th class="album-col">Created</th>
    <th class="length-col">Duration</th>
  `;

  if (playlists.length === 0) {
    songTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #666;">No playlists yet. Create one to get started!</td></tr>';
    return;
  }

  // Get stats for each playlist
  for (let i = 0; i < playlists.length; i++) {
    const playlist = playlists[i];
    const result = await window.electronAPI.db.getPlaylistSongs(playlist.playlist_id);

    let songCount = 0;
    let totalDuration = 0;

    if (result.success && result.songs) {
      songCount = result.songs.length;
      totalDuration = result.songs.reduce((sum, song) => sum + (song.duration || 0), 0);
    }

    const row = document.createElement('tr');
    row.dataset.playlistId = playlist.playlist_id;
    row.style.cursor = 'pointer';

    const createdDate = playlist.created_at ? new Date(playlist.created_at).toLocaleDateString() : 'Unknown';

    row.innerHTML = `
      <td class="checkbox-col"></td>
      <td class="number-col">${i + 1}</td>
      <td class="title-col">${escapeHtml(playlist.playlist_name)}</td>
      <td class="artist-col">${songCount} song${songCount !== 1 ? 's' : ''}</td>
      <td class="album-col">${createdDate}</td>
      <td class="length-col">${formatDuration(totalDuration)}</td>
    `;

    // Click to open playlist
    row.addEventListener('click', () => {
      switchView('playlist', playlist.playlist_id);
    });

    // Hover effect
    row.addEventListener('mouseenter', () => {
      row.style.backgroundColor = '#2a2a2a';
    });
    row.addEventListener('mouseleave', () => {
      row.style.backgroundColor = '';
    });

    songTableBody.appendChild(row);
  }

  console.log(`📋 Rendered ${playlists.length} playlists`);
}

// Toggle group expansion
function toggleGroupExpansion(groupName, groupField) {
  const wasExpanded = expandedSections.has(groupName);
  if (wasExpanded) {
    expandedSections.delete(groupName);
    console.log(`➖ Collapsed group: "${groupName}"`);
  } else {
    expandedSections.add(groupName);
    console.log(`➕ Expanded group: "${groupName}"`);
  }

  console.log(`🔄 Total expanded sections:`, Array.from(expandedSections));

  // Re-render the grouped view
  renderGroupedView(groupField);
}

// Sort songs by column
function sortSongs(column) {
  // If clicking the same column, toggle direction
  if (sortColumn === column) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    // New column, default to ascending
    sortColumn = column;
    sortDirection = 'asc';
  }

  // Sort the filtered songs array
  filteredSongs.sort((a, b) => {
    let aVal, bVal;

    switch (column) {
      case 'title':
        aVal = (a.title || 'Unknown').toLowerCase();
        bVal = (b.title || 'Unknown').toLowerCase();
        break;
      case 'artist':
        aVal = (a.artist || 'Unknown Artist').toLowerCase();
        bVal = (b.artist || 'Unknown Artist').toLowerCase();
        break;
      case 'album':
        aVal = (a.album || 'Unknown Album').toLowerCase();
        bVal = (b.album || 'Unknown Album').toLowerCase();
        break;
      case 'duration':
        aVal = a.duration || 0;
        bVal = b.duration || 0;
        break;
      default:
        return 0;
    }

    // Compare values
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Re-render the table
  renderSongs();
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
  console.log('🔄 switchView called with:', view, playlistId);
  currentView = view;
  currentPlaylist = null;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Update view title
  const viewTitle = document.getElementById('viewTitle');

  if (view === 'songs') {
    console.log('📋 Switching to Songs view');
    document.querySelector('[data-view="songs"]').classList.add('active');
    viewTitle.textContent = 'Songs';
    playlistBanner.style.display = 'none';
    filteredSongs = [...allSongs];
    renderSongs();
  } else if (view === 'albums') {
    console.log('💿 Switching to Albums view, filteredSongs count:', allSongs.length);
    document.querySelector('[data-view="albums"]').classList.add('active');
    viewTitle.textContent = 'Albums';
    playlistBanner.style.display = 'none';
    filteredSongs = [...allSongs];
    renderGroupedView('album');
  } else if (view === 'artists') {
    console.log('🎤 Switching to Artists view, filteredSongs count:', allSongs.length);
    document.querySelector('[data-view="artists"]').classList.add('active');
    viewTitle.textContent = 'Artists';
    playlistBanner.style.display = 'none';
    filteredSongs = [...allSongs];
    renderGroupedView('artist');
  } else if (view === 'playlists') {
    console.log('📋 Switching to Playlists view');
    document.querySelector('[data-view="playlists"]').classList.add('active');
    viewTitle.textContent = 'Playlists';
    playlistBanner.style.display = 'none';
    await renderPlaylistsView();
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
async function updateNowPlaying(song) {
  if (song) {
    document.getElementById('nowPlayingTitle').textContent = song.title || 'Unknown';
    document.getElementById('nowPlayingArtist').textContent = song.artist || 'Unknown Artist';
    document.getElementById('playBtn').textContent = '⏸';

    // Fetch and display album art
    await updateAlbumArt(song.file_path);

    // Highlight currently playing song in the table
    highlightCurrentSong(song.song_id);
  }
}

// Update album art display
async function updateAlbumArt(filePath) {
  const albumArtElement = document.getElementById('albumArt');

  try {
    const result = await window.electronAPI.metadata.getAlbumArt(filePath);

    if (result.success && result.data) {
      // Display album art as background image
      albumArtElement.style.backgroundImage = `url('${result.data}')`;
      albumArtElement.style.backgroundSize = 'cover';
      albumArtElement.style.backgroundPosition = 'center';
      albumArtElement.innerHTML = ''; // Remove placeholder
    } else {
      // Show placeholder if no album art
      resetAlbumArt();
    }
  } catch (error) {
    console.error('Error loading album art:', error);
    resetAlbumArt();
  }
}

// Reset album art to placeholder
function resetAlbumArt() {
  const albumArtElement = document.getElementById('albumArt');
  albumArtElement.style.backgroundImage = '';
  albumArtElement.innerHTML = '<span class="album-placeholder">♪</span>';
}

// Highlight the currently playing song
function highlightCurrentSong(songId) {
  // Remove previous highlight
  document.querySelectorAll('tr.now-playing').forEach(row => {
    row.classList.remove('now-playing');
  });

  // Add highlight to current song
  const currentRow = document.querySelector(`tr[data-song-id="${songId}"]`);
  if (currentRow) {
    currentRow.classList.add('now-playing');
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

  // Re-render based on current view
  if (currentView === 'albums') {
    renderGroupedView('album');
  } else if (currentView === 'artists') {
    renderGroupedView('artist');
  } else if (currentView === 'playlists') {
    renderPlaylistsView();
  } else {
    renderSongs();
  }
}

// Update action panel
function updateActionPanel() {
  const count = selectedSongs.size;

  if (count > 0) {
    actionPanel.style.display = 'flex';
    selectedCount.textContent = `${count} song${count > 1 ? 's' : ''} selected`;

    // Show/hide "Remove from Playlist" button based on current view
    const removeFromPlaylistBtn = document.getElementById('removeFromPlaylistBtn');
    if (currentPlaylist) {
      removeFromPlaylistBtn.style.display = 'inline-block';
    } else {
      removeFromPlaylistBtn.style.display = 'none';
    }
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

  player.onLoaded(async (data) => {
    // Update now playing display when a new song loads (next/previous buttons)
    if (player.currentSong) {
      await updateNowPlaying(player.currentSong);
    }
  });

  player.onEnded(() => {
    console.log('Song ended');
    // If playback has stopped (reached end of playlist with no repeat), clear highlighting
    setTimeout(() => {
      if (!player.isPlaying) {
        document.querySelectorAll('tr.now-playing').forEach(row => {
          row.classList.remove('now-playing');
        });
      }
    }, 100);
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
    // Toggle strikethrough when shuffle is off
    e.target.style.textDecoration = isShuffleOn ? 'none' : 'line-through';
  });

  document.getElementById('repeatBtn').addEventListener('click', (e) => {
    const mode = player.cycleRepeat();
    e.target.classList.toggle('active', mode !== 'none');
    // Update icon based on repeat mode
    if (mode === 'none') {
      e.target.textContent = '🔁';
      e.target.style.textDecoration = 'line-through';
    } else if (mode === 'all') {
      e.target.textContent = '🔁';
      e.target.style.textDecoration = 'none';
    } else if (mode === 'one') {
      e.target.textContent = '🔂';
      e.target.style.textDecoration = 'none';
    }
  });

  // Volume controls
  let previousVolume = 100;
  const volumeBtn = document.getElementById('volumeBtn');
  const volumeSlider = document.getElementById('volumeSlider');

  function updateVolumeIcon(volume) {
    if (volume === 0) {
      volumeBtn.textContent = '🔇'; // Muted
    } else if (volume <= 33) {
      volumeBtn.textContent = '🔈'; // Low
    } else if (volume <= 66) {
      volumeBtn.textContent = '🔉'; // Medium
    } else {
      volumeBtn.textContent = '🔊'; // High
    }
  }

  // Volume button click - mute/unmute
  volumeBtn.addEventListener('click', () => {
    const currentVolume = player.getVolume();
    if (currentVolume > 0) {
      previousVolume = currentVolume;
      player.setVolume(0);
      volumeSlider.value = 0;
      updateVolumeIcon(0);
    } else {
      player.setVolume(previousVolume);
      volumeSlider.value = previousVolume;
      updateVolumeIcon(previousVolume);
    }
  });

  // Volume slider input
  volumeSlider.addEventListener('input', (e) => {
    const volume = parseInt(e.target.value);
    player.setVolume(volume);
    updateVolumeIcon(volume);
    if (volume > 0) {
      previousVolume = volume;
    }
  });

  // Initialize volume
  const initialVolume = player.getVolume();
  volumeSlider.value = initialVolume;
  updateVolumeIcon(initialVolume);

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
  document.getElementById('removeFromPlaylistBtn').addEventListener('click', removeFromPlaylist);
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

  // Edit playlist name modal handlers
  document.getElementById('editPlaylistNameBtn').addEventListener('click', () => {
    if (currentPlaylist) {
      editPlaylistNameInput.value = currentPlaylist.playlist_name;
      editPlaylistNameModal.classList.add('active');
      editPlaylistNameInput.focus();
      editPlaylistNameInput.select();
    }
  });

  editPlaylistNameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = editPlaylistNameInput.value.trim();
    if (newName && currentPlaylist) {
      const result = await window.electronAPI.db.updatePlaylist(currentPlaylist.playlist_id, { playlist_name: newName });
      if (result.success) {
        // Update local state
        currentPlaylist.playlist_name = newName;
        const playlistIndex = playlists.findIndex(p => p.playlist_id === currentPlaylist.playlist_id);
        if (playlistIndex !== -1) {
          playlists[playlistIndex].playlist_name = newName;
        }

        // Update UI
        document.getElementById('bannerPlaylistName').textContent = newName;
        document.getElementById('viewTitle').textContent = newName;
        renderPlaylists();
        editPlaylistNameModal.classList.remove('active');
      } else {
        alert('Failed to update playlist name: ' + result.error);
      }
    }
  });

  closeEditPlaylistNameBtn.addEventListener('click', () => {
    editPlaylistNameModal.classList.remove('active');
  });

  cancelEditPlaylistNameBtn.addEventListener('click', () => {
    editPlaylistNameModal.classList.remove('active');
  });

  editPlaylistNameModal.addEventListener('click', (e) => {
    if (e.target === editPlaylistNameModal) {
      editPlaylistNameModal.classList.remove('active');
    }
  });

  // Comparison modal event listeners
  const comparisonModal = document.getElementById('comparisonModal');
  const closeComparisonBtn = document.getElementById('closeComparisonBtn');
  const doneComparisonBtn = document.getElementById('doneComparisonBtn');
  const cancelComparisonBtn = document.getElementById('cancelComparisonBtn');

  closeComparisonBtn.addEventListener('click', async () => {
    stopAllComparisonPlayback();
    comparisonModal.classList.remove('active');
    await loadSongs();
    clearSelection();
  });

  doneComparisonBtn.addEventListener('click', async () => {
    stopAllComparisonPlayback();
    comparisonModal.classList.remove('active');
    await loadSongs();
    clearSelection();
  });

  cancelComparisonBtn.addEventListener('click', () => {
    stopAllComparisonPlayback();
    comparisonModal.classList.remove('active');
  });

  comparisonModal.addEventListener('click', (e) => {
    if (e.target === comparisonModal) {
      stopAllComparisonPlayback();
      comparisonModal.classList.remove('active');
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

  // Get the selected song objects
  const songsToCompare = allSongs.filter(song => selectedSongs.has(song.song_id));

  if (songsToCompare.length < 2) {
    alert('Could not find selected songs');
    return;
  }

  showComparisonModal(songsToCompare);
}

// Show comparison modal with songs
async function showComparisonModal(songs) {
  const modal = document.getElementById('comparisonModal');
  const table = document.getElementById('comparisonTable');
  const title = document.getElementById('comparisonTitle');

  title.textContent = `Manual Duplicate Comparison (${songs.length} songs selected)`;

  // Get additional metadata for each song
  const songsWithMeta = await Promise.all(songs.map(async (song) => {
    // Count songs in album
    const albumSongCount = allSongs.filter(s =>
      (s.album || 'Unknown') === (song.album || 'Unknown')
    ).length;

    // Check if song has album art
    let hasPicture = false;
    try {
      const artResult = await window.electronAPI.metadata.getAlbumArt(song.file_path);
      hasPicture = artResult.success && artResult.data;
    } catch (err) {
      hasPicture = false;
    }

    return {
      ...song,
      albumSongCount,
      hasPicture
    };
  }));

  // Build comparison table
  const tableContainer = table.parentElement;
  tableContainer.innerHTML = buildComparisonTable(songsWithMeta);

  // Add delete button event listeners
  songsWithMeta.forEach((song, index) => {
    const deleteBtn = document.getElementById(`deleteComparisonSong${index}`);
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (confirm(`Delete "${song.title}"?`)) {
          await window.electronAPI.db.deleteSong(song.song_id);

          // Remove song from comparison
          songsWithMeta.splice(index, 1);

          if (songsWithMeta.length < 2) {
            // Close modal if less than 2 songs remain
            modal.classList.remove('active');
            await loadSongs();
            clearSelection();
          } else {
            // Rebuild table
            await showComparisonModal(songsWithMeta);
          }
        }
      });
    }
  });

  // Setup playback controls for each song
  setupComparisonPlayback(songsWithMeta);

  modal.classList.add('active');
}

// Build comparison table HTML
function buildComparisonTable(songs) {
  const fields = [
    { key: 'title', label: 'Title' },
    { key: 'artist', label: 'Artist' },
    { key: 'album', label: 'Album' },
    { key: 'albumSongCount', label: 'Songs in Album' },
    { key: 'duration', label: 'Duration', format: (val) => formatDuration(val) },
    { key: 'year', label: 'Year' },
    { key: 'genre', label: 'Genre' },
    { key: 'track_number', label: 'Track #' },
    { key: 'file_size', label: 'File Size', format: (val) => formatFileSize(val) },
    { key: 'format', label: 'Format' },
    { key: 'bitrate', label: 'Bitrate', format: (val) => val ? `${val} kbps` : 'Unknown' },
    { key: 'hasPicture', label: 'Has Picture', format: (val) => val ? 'Yes' : 'No' },
    { key: 'file_path', label: 'File Path', isPath: true },
    { key: 'date_added', label: 'Date Added', format: (val) => val ? new Date(val).toLocaleDateString() : 'Unknown' }
  ];

  let html = '<table class="comparison-table" id="comparisonTable">';
  html += '<thead><tr><th class="field-column">Field</th>';

  // Header row with song numbers
  songs.forEach((_, index) => {
    html += `<th class="song-column">Song ${index + 1}</th>`;
  });
  html += '</tr></thead><tbody>';

  // Data rows
  fields.forEach(field => {
    html += '<tr>';
    html += `<td class="field-column">${field.label}</td>`;

    // Get values for this field across all songs
    const values = songs.map(song => {
      let value = song[field.key];
      if (field.format && value !== undefined && value !== null) {
        value = field.format(value);
      }
      return value || 'Unknown';
    });

    // Check if values differ (for highlighting)
    const allSame = values.every(v => v === values[0]);

    songs.forEach((song, index) => {
      const value = values[index];
      const highlightClass = !allSame && field.key !== 'file_path' ? 'highlight-different' : '';
      const pathClass = field.isPath ? 'file-path-cell' : '';
      html += `<td class="${highlightClass} ${pathClass}" title="${field.isPath ? value : ''}">${escapeHtml(String(value))}</td>`;
    });

    html += '</tr>';
  });

  // Playback row
  html += '<tr><td class="field-column">Playback</td>';
  songs.forEach((_, index) => {
    html += `
      <td>
        <div class="comparison-playback-controls">
          <button class="comparison-play-btn" id="comparisonPlayBtn${index}" title="Play">▶</button>
          <div class="comparison-progress-container">
            <span class="comparison-time" id="comparisonCurrentTime${index}">0:00</span>
            <input type="range" class="comparison-progress" id="comparisonProgress${index}" min="0" max="100" value="0">
            <span class="comparison-time" id="comparisonTotalTime${index}">0:00</span>
          </div>
        </div>
      </td>
    `;
  });
  html += '</tr>';

  html += '</tbody>';

  // Close the table and add action buttons in a grid-aligned structure
  html += '</table>';
  html += '<div class="comparison-actions-grid">';
  html += '<div class="action-spacer"></div>'; // Spacer for the "Field" column
  songs.forEach((_, index) => {
    html += `<button class="comparison-delete-btn" id="deleteComparisonSong${index}">Delete</button>`;
  });
  html += '</div>';

  return html;
}

// Store comparison audio players
const comparisonPlayers = [];

// Stop all comparison playback
function stopAllComparisonPlayback() {
  comparisonPlayers.forEach(p => {
    if (p.audio) {
      p.audio.pause();
      p.audio.currentTime = 0;
      p.audio.src = '';
    }
  });
  comparisonPlayers.length = 0;
}

// Setup playback controls for comparison songs
function setupComparisonPlayback(songs) {
  // Clear any existing players
  comparisonPlayers.forEach(p => {
    if (p.audio) {
      p.audio.pause();
      p.audio.src = '';
    }
  });
  comparisonPlayers.length = 0;

  songs.forEach((song, index) => {
    const playBtn = document.getElementById(`comparisonPlayBtn${index}`);
    const progressBar = document.getElementById(`comparisonProgress${index}`);
    const currentTimeEl = document.getElementById(`comparisonCurrentTime${index}`);
    const totalTimeEl = document.getElementById(`comparisonTotalTime${index}`);

    if (!playBtn || !progressBar) return;

    // Create audio element for this song
    const audio = new Audio(song.file_path);

    const playerState = {
      audio,
      isPlaying: false,
      song,
      index,
      playBtn,
      progressBar,
      currentTimeEl,
      totalTimeEl
    };

    comparisonPlayers.push(playerState);

    // Play button click
    playBtn.addEventListener('click', () => {
      if (playerState.isPlaying) {
        audio.pause();
        playerState.isPlaying = false;
        playBtn.textContent = '▶';
      } else {
        audio.play();
        playerState.isPlaying = true;
        playBtn.textContent = '⏸';
      }
    });

    // Time update
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressBar.value = percent;
        if (currentTimeEl) currentTimeEl.textContent = formatDuration(Math.floor(audio.currentTime));
      }
    });

    // Loaded metadata - set total time
    audio.addEventListener('loadedmetadata', () => {
      if (totalTimeEl) totalTimeEl.textContent = formatDuration(Math.floor(audio.duration));
    });

    // Progress bar seek
    progressBar.addEventListener('input', (e) => {
      const percent = parseFloat(e.target.value);
      audio.currentTime = (percent / 100) * audio.duration;
    });

    // Ended
    audio.addEventListener('ended', () => {
      playerState.isPlaying = false;
      playBtn.textContent = '▶';
      progressBar.value = 0;
      if (currentTimeEl) currentTimeEl.textContent = '0:00';
    });

    // Pause event
    audio.addEventListener('pause', () => {
      playerState.isPlaying = false;
      playBtn.textContent = '▶';
    });

    // Play event
    audio.addEventListener('play', () => {
      playerState.isPlaying = true;
      playBtn.textContent = '⏸';
    });
  });
}

// Format file size
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return 'Unknown';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Delete selected songs
// Show add to playlist modal
function showAddToPlaylistModal() {
  console.log('Add to Playlist button clicked!');
  console.log('Selected songs:', selectedSongs);
  console.log('Available playlists:', playlists);

  if (selectedSongs.size === 0) {
    console.warn('No songs selected');
    alert('Please select at least one song');
    return;
  }

  if (playlists.length === 0) {
    console.warn('No playlists available');
    alert('No playlists available. Create a playlist first!');
    return;
  }

  console.log('Opening add to playlist modal...');

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

  console.log('Playlist buttons created:', playlists.length);

  // Show modal
  addToPlaylistModal.classList.add('active');
  console.log('Modal should now be visible. Modal element:', addToPlaylistModal);
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

// Remove songs from playlist
async function removeFromPlaylist() {
  if (!currentPlaylist || selectedSongs.size === 0) return;

  const confirmed = confirm(`Remove ${selectedSongs.size} song(s) from "${currentPlaylist.playlist_name}"?`);
  if (!confirmed) return;

  let successCount = 0;
  let failCount = 0;

  for (const songId of selectedSongs) {
    const result = await window.electronAPI.db.removeSongFromPlaylist(currentPlaylist.playlist_id, songId);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
      console.error(`Failed to remove song ${songId}:`, result.error);
    }
  }

  // Show result
  if (failCount > 0) {
    alert(`Removed ${successCount} song(s), failed to remove ${failCount} song(s)`);
  }

  // Clear selection and reload playlist
  clearSelection();
  await switchView('playlist', currentPlaylist.playlist_id);
}

// Reorder song in playlist
async function reorderSong(currentIndex, direction) {
  if (!currentPlaylist) return;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  // Validate target index
  if (targetIndex < 0 || targetIndex >= filteredSongs.length) return;

  const song1 = filteredSongs[currentIndex];
  const song2 = filteredSongs[targetIndex];

  // Get current positions (1-based)
  const pos1 = song1.position || (currentIndex + 1);
  const pos2 = song2.position || (targetIndex + 1);

  try {
    // Remove both songs from playlist
    await window.electronAPI.db.removeSongFromPlaylist(currentPlaylist.playlist_id, song1.song_id);
    await window.electronAPI.db.removeSongFromPlaylist(currentPlaylist.playlist_id, song2.song_id);

    // Re-add them with swapped positions
    // We need to manually update positions in the database
    // Since addSongToPlaylist auto-increments, we need a different approach

    // Get all songs from playlist
    const result = await window.electronAPI.db.getPlaylistSongs(currentPlaylist.playlist_id);
    if (!result.success) {
      console.error('Failed to get playlist songs:', result.error);
      return;
    }

    let allSongs = result.songs || [];

    // Remove the two songs we're swapping
    allSongs = allSongs.filter(s => s.song_id !== song1.song_id && s.song_id !== song2.song_id);

    // Insert them at swapped positions
    if (direction === 'up') {
      allSongs.splice(targetIndex, 0, song1);
      allSongs.splice(currentIndex, 0, song2);
    } else {
      allSongs.splice(currentIndex, 0, song2);
      allSongs.splice(targetIndex, 0, song1);
    }

    // Clear all songs from playlist
    for (const song of filteredSongs) {
      await window.electronAPI.db.removeSongFromPlaylist(currentPlaylist.playlist_id, song.song_id);
    }

    // Re-add all songs in new order
    for (let i = 0; i < allSongs.length; i++) {
      await window.electronAPI.db.addSongToPlaylist(currentPlaylist.playlist_id, allSongs[i].song_id);
    }

    // Reload playlist view
    await switchView('playlist', currentPlaylist.playlist_id);
  } catch (error) {
    console.error('Error reordering song:', error);
    alert('Failed to reorder song');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}