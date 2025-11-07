const fs = require('fs');
const path = require('path');

// Supported audio file extensions
const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.wma'];

/**
 * Scan a folder recursively for audio files
 * @param {string} folderPath - Path to the folder to scan
 * @param {boolean} recursive - Whether to scan subfolders (default: true)
 * @returns {Array<string>} - Array of file paths
 */
function scanFolder(folderPath, recursive = true) {
  const audioFiles = [];
  
  try {
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder does not exist: ${folderPath}`);
    }
    
    const items = fs.readdirSync(folderPath);
    
    for (const item of items) {
      const fullPath = path.join(folderPath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory() && recursive) {
        // Recursively scan subdirectories
        const subFiles = scanFolder(fullPath, recursive);
        audioFiles.push(...subFiles);
      } else if (stats.isFile()) {
        // Check if file has an audio extension
        const ext = path.extname(item).toLowerCase();
        if (AUDIO_EXTENSIONS.includes(ext)) {
          audioFiles.push(fullPath);
        }
      }
    }
    
    return audioFiles;
  } catch (error) {
    console.error('Error scanning folder:', error);
    throw error;
  }
}

/**
 * Get file information
 * @param {string} filePath - Path to the file
 * @returns {object} - File information
 */
function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase().substring(1); // Remove the dot
    
    return {
      path: filePath,
      name: path.basename(filePath),
      extension: ext,
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
}

/**
 * Check if a path is a valid audio file
 * @param {string} filePath - Path to check
 * @returns {boolean} - True if valid audio file
 */
function isAudioFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return false;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    return AUDIO_EXTENSIONS.includes(ext);
  } catch (error) {
    return false;
  }
}

/**
 * Get all audio files from multiple paths (files and/or folders)
 * @param {Array<string>} paths - Array of file and folder paths
 * @param {boolean} recursive - Whether to scan folders recursively
 * @returns {Array<string>} - Array of audio file paths
 */
function getAudioFiles(paths, recursive = true) {
  const audioFiles = [];
  
  for (const itemPath of paths) {
    try {
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        const folderFiles = scanFolder(itemPath, recursive);
        audioFiles.push(...folderFiles);
      } else if (stats.isFile() && isAudioFile(itemPath)) {
        audioFiles.push(itemPath);
      }
    } catch (error) {
      console.error(`Error processing path ${itemPath}:`, error);
    }
  }
  
  // Remove duplicates
  return [...new Set(audioFiles)];
}

/**
 * Count audio files in a folder
 * @param {string} folderPath - Path to the folder
 * @param {boolean} recursive - Whether to count recursively
 * @returns {number} - Number of audio files
 */
function countAudioFiles(folderPath, recursive = true) {
  try {
    const files = scanFolder(folderPath, recursive);
    return files.length;
  } catch (error) {
    console.error('Error counting audio files:', error);
    return 0;
  }
}

module.exports = {
  scanFolder,
  getFileInfo,
  isAudioFile,
  getAudioFiles,
  countAudioFiles,
  AUDIO_EXTENSIONS
};