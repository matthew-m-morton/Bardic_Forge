-- Songs Table
CREATE TABLE IF NOT EXISTS songs (
    song_id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    original_file_path TEXT,
    original_format TEXT,
    title TEXT,
    artist TEXT,
    album TEXT,
    duration INTEGER,
    file_size INTEGER,
    track_number INTEGER,
    year INTEGER,
    genre TEXT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modified DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Playlists Table
CREATE TABLE IF NOT EXISTS playlists (
    playlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_name TEXT NOT NULL,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modified DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Playlist_Songs Junction Table
CREATE TABLE IF NOT EXISTS playlist_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    song_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(song_id) ON DELETE CASCADE,
    UNIQUE(playlist_id, song_id)
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist ON playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_song ON playlist_songs(song_id);

-- Insert default settings
INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('music_folder_path', './music');
INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('conversion_bitrate', '256');
INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('theme', 'dark');
INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('volume', '75');