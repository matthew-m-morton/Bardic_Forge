/**
 * Audio Player Module
 * This file contains the frontend audio player logic (used in renderer process)
 * Note: This should be included in the renderer.js file
 */

class AudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.currentSong = null;
    this.playlist = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.isShuffle = false;
    this.repeatMode = 'none'; // 'none', 'one', 'all'
    
    // Event listeners
    this.onPlayCallback = null;
    this.onPauseCallback = null;
    this.onEndedCallback = null;
    this.onTimeUpdateCallback = null;
    this.onLoadedCallback = null;
    this.onErrorCallback = null;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      if (this.onPlayCallback) this.onPlayCallback();
    });
    
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      if (this.onPauseCallback) this.onPauseCallback();
    });
    
    this.audio.addEventListener('ended', () => {
      this.handleSongEnded();
    });
    
    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback({
          currentTime: this.audio.currentTime,
          duration: this.audio.duration,
          percent: (this.audio.currentTime / this.audio.duration) * 100
        });
      }
    });
    
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.onLoadedCallback) {
        this.onLoadedCallback({
          duration: this.audio.duration
        });
      }
    });
    
    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      if (this.onErrorCallback) {
        this.onErrorCallback(e);
      }
    });
  }
  
  /**
   * Load a song
   * @param {object} song - Song object with file_path
   */
  loadSong(song) {
    this.currentSong = song;
    this.audio.src = `file://${song.file_path}`;
    this.audio.load();
  }
  
  /**
   * Play current song
   */
  play() {
    if (this.currentSong) {
      this.audio.play().catch(err => {
        console.error('Play error:', err);
        if (this.onErrorCallback) this.onErrorCallback(err);
      });
    }
  }
  
  /**
   * Pause playback
   */
  pause() {
    this.audio.pause();
  }
  
  /**
   * Toggle play/pause
   */
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  /**
   * Stop playback
   */
  stop() {
    this.pause();
    this.audio.currentTime = 0;
  }
  
  /**
   * Seek to a specific time
   * @param {number} time - Time in seconds
   */
  seek(time) {
    this.audio.currentTime = time;
  }
  
  /**
   * Seek by percentage
   * @param {number} percent - Percentage (0-100)
   */
  seekPercent(percent) {
    const time = (percent / 100) * this.audio.duration;
    this.seek(time);
  }
  
  /**
   * Set volume
   * @param {number} volume - Volume (0-100)
   */
  setVolume(volume) {
    this.audio.volume = Math.max(0, Math.min(100, volume)) / 100;
  }
  
  /**
   * Get current volume
   * @returns {number} - Volume (0-100)
   */
  getVolume() {
    return Math.round(this.audio.volume * 100);
  }
  
  /**
   * Mute/unmute
   */
  toggleMute() {
    this.audio.muted = !this.audio.muted;
    return this.audio.muted;
  }
  
  /**
   * Set playlist
   * @param {Array} songs - Array of song objects
   */
  setPlaylist(songs) {
    this.playlist = songs;
  }
  
  /**
   * Play song from playlist by index
   * @param {number} index - Song index
   */
  playSongAtIndex(index) {
    if (index >= 0 && index < this.playlist.length) {
      this.currentIndex = index;
      this.loadSong(this.playlist[index]);
      this.play();
    }
  }
  
  /**
   * Play next song
   */
  next() {
    if (this.playlist.length === 0) return;
    
    if (this.isShuffle) {
      // Random next song
      const randomIndex = Math.floor(Math.random() * this.playlist.length);
      this.playSongAtIndex(randomIndex);
    } else {
      // Sequential next
      const nextIndex = (this.currentIndex + 1) % this.playlist.length;
      this.playSongAtIndex(nextIndex);
    }
  }
  
  /**
   * Play previous song
   */
  previous() {
    if (this.playlist.length === 0) return;
    
    // If more than 3 seconds into song, restart current song
    if (this.audio.currentTime > 3) {
      this.seek(0);
      return;
    }
    
    // Otherwise go to previous
    const prevIndex = this.currentIndex - 1;
    if (prevIndex < 0) {
      this.playSongAtIndex(this.playlist.length - 1);
    } else {
      this.playSongAtIndex(prevIndex);
    }
  }
  
  /**
   * Handle song ended
   */
  handleSongEnded() {
    if (this.onEndedCallback) this.onEndedCallback();
    
    switch (this.repeatMode) {
      case 'one':
        // Repeat current song
        this.seek(0);
        this.play();
        break;
      case 'all':
        // Play next song
        this.next();
        break;
      default:
        // Stop if last song
        if (this.currentIndex === this.playlist.length - 1) {
          this.stop();
        } else {
          this.next();
        }
    }
  }
  
  /**
   * Toggle shuffle mode
   */
  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    return this.isShuffle;
  }
  
  /**
   * Cycle through repeat modes
   */
  cycleRepeat() {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(currentIndex + 1) % modes.length];
    return this.repeatMode;
  }
  
  /**
   * Get current playback state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      currentSong: this.currentSong,
      currentTime: this.audio.currentTime,
      duration: this.audio.duration,
      volume: this.getVolume(),
      isMuted: this.audio.muted,
      isShuffle: this.isShuffle,
      repeatMode: this.repeatMode,
      playlistLength: this.playlist.length,
      currentIndex: this.currentIndex
    };
  }
  
  // Callback setters
  onPlay(callback) { this.onPlayCallback = callback; }
  onPause(callback) { this.onPauseCallback = callback; }
  onEnded(callback) { this.onEndedCallback = callback; }
  onTimeUpdate(callback) { this.onTimeUpdateCallback = callback; }
  onLoaded(callback) { this.onLoadedCallback = callback; }
  onError(callback) { this.onErrorCallback = callback; }
}

// Export for use in renderer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioPlayer;
}