const { parseFile } = require('music-metadata');
const NodeID3 = require('node-id3');
const fs = require('fs');

/**
 * Read metadata from an audio file
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<object>} - Metadata object
 */
async function readMetadata(filePath) {
  try {
    const metadata = await parseFile(filePath);
    
    return {
      success: true,
      metadata: {
        title: metadata.common.title || '',
        artist: metadata.common.artist || '',
        album: metadata.common.album || '',
        year: metadata.common.year || null,
        genre: metadata.common.genre ? metadata.common.genre.join(', ') : '',
        trackNumber: metadata.common.track?.no || null,
        duration: Math.round(metadata.format.duration || 0),
        bitrate: metadata.format.bitrate || null,
        sampleRate: metadata.format.sampleRate || null,
        format: metadata.format.container || ''
      }
    };
  } catch (error) {
    console.error('Error reading metadata:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Write metadata to an MP3 file using ID3v2 tags
 * @param {string} filePath - Path to the MP3 file
 * @param {object} metadata - Metadata object to write
 * @returns {Promise<object>} - Success status
 */
async function writeMetadata(filePath, metadata) {
  try {
    const tags = {
      title: metadata.title || '',
      artist: metadata.artist || '',
      album: metadata.album || '',
      year: metadata.year ? metadata.year.toString() : '',
      genre: metadata.genre || '',
      trackNumber: metadata.trackNumber ? metadata.trackNumber.toString() : ''
    };
    
    const success = NodeID3.write(tags, filePath);
    
    if (success) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to write tags' };
    }
  } catch (error) {
    console.error('Error writing metadata:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Read the TXXX:BARDIC_ID tag from an MP3 file
 * @param {string} filePath - Path to the MP3 file
 * @returns {string|null} - Bardic ID or null if not found
 */
function readBardicId(filePath) {
  try {
    const tags = NodeID3.read(filePath);
    
    if (tags.userDefinedText && Array.isArray(tags.userDefinedText)) {
      const bardicTag = tags.userDefinedText.find(
        item => item.description === 'BARDIC_ID'
      );
      return bardicTag ? bardicTag.value : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading Bardic ID:', error);
    return null;
  }
}

/**
 * Write the TXXX:BARDIC_ID tag to an MP3 file
 * @param {string} filePath - Path to the MP3 file
 * @param {string} bardicId - Bardic ID to write
 * @returns {boolean} - Success status
 */
function writeBardicId(filePath, bardicId) {
  try {
    // Read existing tags
    const existingTags = NodeID3.read(filePath) || {};
    
    // Prepare user defined text array
    let userDefinedText = [];
    
    if (existingTags.userDefinedText && Array.isArray(existingTags.userDefinedText)) {
      // Filter out any existing BARDIC_ID tags
      userDefinedText = existingTags.userDefinedText.filter(
        item => item.description !== 'BARDIC_ID'
      );
    }
    
    // Add new BARDIC_ID tag
    userDefinedText.push({
      description: 'BARDIC_ID',
      value: bardicId
    });
    
    // Write the tags
    const tags = {
      ...existingTags,
      userDefinedText: userDefinedText
    };
    
    const success = NodeID3.write(tags, filePath);
    return success;
  } catch (error) {
    console.error('Error writing Bardic ID:', error);
    return false;
  }
}

/**
 * Update specific metadata fields in an MP3 file
 * @param {string} filePath - Path to the MP3 file
 * @param {object} updates - Object with fields to update
 * @returns {Promise<object>} - Success status
 */
async function updateMetadata(filePath, updates) {
  try {
    // Read existing tags
    const existingTags = NodeID3.read(filePath) || {};
    
    // Merge existing tags with updates
    const newTags = {
      ...existingTags,
      ...updates
    };
    
    // Write updated tags
    const success = NodeID3.write(newTags, filePath);
    
    if (success) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to update tags' };
    }
  } catch (error) {
    console.error('Error updating metadata:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a file has ID3v2 tags
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if has ID3v2 tags
 */
function hasID3v2Tags(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    // Check for ID3v2 header (first 3 bytes should be "ID3")
    return buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33;
  } catch (error) {
    console.error('Error checking ID3v2 tags:', error);
    return false;
  }
}

/**
 * Upgrade ID3v1 tags to ID3v2
 * @param {string} filePath - Path to the MP3 file
 * @returns {Promise<object>} - Success status
 */
async function upgradeToID3v2(filePath) {
  try {
    // Read any existing tags (ID3v1 or ID3v2)
    const tags = NodeID3.read(filePath);
    
    if (!tags) {
      return { success: false, error: 'No tags found to upgrade' };
    }
    
    // Write as ID3v2.4
    const success = NodeID3.write(tags, filePath);
    
    if (success) {
      return { success: true, message: 'Tags upgraded to ID3v2' };
    } else {
      return { success: false, error: 'Failed to upgrade tags' };
    }
  } catch (error) {
    console.error('Error upgrading to ID3v2:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get audio file duration
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<number>} - Duration in seconds
 */
async function getDuration(filePath) {
  try {
    const metadata = await parseFile(filePath);
    return Math.round(metadata.format.duration || 0);
  } catch (error) {
    console.error('Error getting duration:', error);
    return 0;
  }
}

/**
 * Extract album art from an audio file
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<object>} - Album art data as base64 or null
 */
async function getAlbumArt(filePath) {
  try {
    const metadata = await parseFile(filePath);

    // Check if there's album art in the file
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0]; // Get first image

      // Convert buffer to base64
      const base64 = picture.data.toString('base64');
      const mimeType = picture.format || 'image/jpeg';

      return {
        success: true,
        data: `data:${mimeType};base64,${base64}`,
        format: picture.format,
        type: picture.type,
        description: picture.description
      };
    }

    return {
      success: false,
      message: 'No album art found'
    };
  } catch (error) {
    console.error('Error extracting album art:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Format duration from seconds to MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
  readMetadata,
  writeMetadata,
  readBardicId,
  writeBardicId,
  updateMetadata,
  hasID3v2Tags,
  upgradeToID3v2,
  getDuration,
  getAlbumArt,
  formatDuration
};