/**
 * Audio Importer Module
 * Handles importing MP3 files into the database
 */

const { readMetadata, readBardicId, writeBardicId } = require('./metadata');
const { generateBardicId } = require('../utils/hash');
const fs = require('fs');
const path = require('path');

/**
 * Import MP3 files into the database
 * @param {Array<string>} filePaths - Array of file paths to import
 * @param {object} db - Database module
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<object>} - Import results
 */
async function importMP3Files(filePaths, db, progressCallback = null) {
  const results = {
    total: filePaths.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    importedSongs: []
  };

  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];

    try {
      // Report progress
      if (progressCallback) {
        progressCallback({
          current: i + 1,
          total: filePaths.length,
          file: path.basename(filePath),
          status: 'processing'
        });
      }

      // 1. Check if file exists and is MP3
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const ext = path.extname(filePath).toLowerCase();
      if (ext !== '.mp3') {
        throw new Error('Only MP3 files are supported in this version');
      }

      // 2. Read metadata from file
      const metadataResult = await readMetadata(filePath);
      if (!metadataResult.success) {
        throw new Error(metadataResult.error || 'Failed to read metadata');
      }

      const metadata = metadataResult.metadata;

      // 3. Get file stats
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // 4. Check for existing Bardic ID in file
      let bardicId = readBardicId(filePath);

      // 5. Generate Bardic ID if not present
      if (!bardicId) {
        const title = metadata.title || path.basename(filePath, ext);
        bardicId = generateBardicId(metadata.duration, fileSize, title);

        // Write Bardic ID to file
        const writeSuccess = writeBardicId(filePath, bardicId);
        if (!writeSuccess) {
          console.warn('Failed to write Bardic ID to file:', filePath);
        }
      }

      // 6. Check if song already exists in database
      const existingResult = await db.getSongById(bardicId);
      if (existingResult.success && existingResult.song) {
        console.log(`Skipping duplicate: ${metadata.title || path.basename(filePath)}`);
        results.skipped++;
        continue;
      }

      // 7. Prepare song data for database
      const songData = {
        song_id: bardicId,
        file_path: filePath,
        title: metadata.title || path.basename(filePath, ext),
        artist: metadata.artist || 'Unknown Artist',
        album: metadata.album || 'Unknown Album',
        duration: metadata.duration || 0,
        file_size: fileSize,
        track_number: metadata.trackNumber || null,
        year: metadata.year || null,
        genre: metadata.genre || null
      };

      // 8. Add to database
      const addResult = await db.addSong(songData);
      if (!addResult.success) {
        throw new Error(addResult.error || 'Failed to add to database');
      }

      // Success!
      console.log(`✅ Imported: ${songData.title} by ${songData.artist}`);
      results.imported++;
      results.importedSongs.push(songData);

    } catch (error) {
      console.error(`❌ Failed to import ${path.basename(filePath)}:`, error.message);
      results.failed++;
      results.errors.push({
        file: path.basename(filePath),
        path: filePath,
        error: error.message
      });
    }
  }

  // Final progress callback
  if (progressCallback) {
    progressCallback({
      current: filePaths.length,
      total: filePaths.length,
      status: 'complete',
      results
    });
  }

  return results;
}

/**
 * Import a single MP3 file
 * @param {string} filePath - Path to MP3 file
 * @param {object} db - Database module
 * @returns {Promise<object>} - Import result
 */
async function importSingleMP3(filePath, db) {
  const result = await importMP3Files([filePath], db);
  return {
    success: result.imported > 0,
    imported: result.imported > 0,
    skipped: result.skipped > 0,
    error: result.errors.length > 0 ? result.errors[0].error : null,
    song: result.importedSongs.length > 0 ? result.importedSongs[0] : null
  };
}

/**
 * Filter files to only include MP3s
 * @param {Array<string>} filePaths - Array of file paths
 * @returns {Array<string>} - Filtered MP3 file paths
 */
function filterMP3Files(filePaths) {
  return filePaths.filter(filePath => {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.mp3';
  });
}

/**
 * Get information about files to import without actually importing
 * @param {Array<string>} filePaths - Array of file paths
 * @returns {object} - File information
 */
function getImportInfo(filePaths) {
  const mp3Files = filterMP3Files(filePaths);
  const otherFiles = filePaths.length - mp3Files.length;

  return {
    total: filePaths.length,
    mp3Files: mp3Files.length,
    unsupportedFiles: otherFiles,
    canImport: mp3Files.length > 0,
    files: mp3Files
  };
}

module.exports = {
  importMP3Files,
  importSingleMP3,
  filterMP3Files,
  getImportInfo
};
