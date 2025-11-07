const crypto = require('crypto');

/**
 * Generate a unique hash ID for a song based on duration, file size, and title
 * @param {number} duration - Song duration in seconds
 * @param {number} fileSize - File size in bytes
 * @param {string} title - Song title
 * @returns {string} - SHA-256 hash
 */
function generateBardicId(duration, fileSize, title) {
  try {
    // Normalize the title (remove extra spaces, convert to lowercase)
    const normalizedTitle = title.trim().toLowerCase();
    
    // Create a string to hash
    const dataString = `${duration}|${fileSize}|${normalizedTitle}`;
    
    // Generate SHA-256 hash
    const hash = crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex');
    
    // Return first 32 characters for a shorter ID
    return hash.substring(0, 32);
  } catch (error) {
    console.error('Error generating Bardic ID:', error);
    throw error;
  }
}

/**
 * Generate a hash with collision handling
 * @param {number} duration - Song duration in seconds
 * @param {number} fileSize - File size in bytes
 * @param {string} title - Song title
 * @param {number} suffix - Suffix number for collision handling
 * @returns {string} - SHA-256 hash with optional suffix
 */
function generateBardicIdWithSuffix(duration, fileSize, title, suffix = 0) {
  const baseId = generateBardicId(duration, fileSize, title);
  
  if (suffix === 0) {
    return baseId;
  }
  
  // Add suffix to handle collisions
  return `${baseId}_${suffix}`;
}

/**
 * Validate if a string is a valid Bardic ID format
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid format
 */
function isValidBardicId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Check if it's a 32-character hex string or has a suffix
  const hexPattern = /^[a-f0-9]{32}(_\d+)?$/;
  return hexPattern.test(id);
}

/**
 * Extract base ID and suffix from a Bardic ID
 * @param {string} id - Bardic ID (possibly with suffix)
 * @returns {object} - { baseId, suffix }
 */
function parseBardicId(id) {
  if (!isValidBardicId(id)) {
    throw new Error('Invalid Bardic ID format');
  }
  
  const parts = id.split('_');
  return {
    baseId: parts[0],
    suffix: parts.length > 1 ? parseInt(parts[1]) : 0
  };
}

module.exports = {
  generateBardicId,
  generateBardicIdWithSuffix,
  isValidBardicId,
  parseBardicId
};