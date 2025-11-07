const stringSimilarity = require('string-similarity');

/**
 * Normalize a string for comparison (remove extra spaces, lowercase, remove special chars)
 * @param {string} str - String to normalize
 * @returns {string} - Normalized string
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Compare two strings for similarity
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-1, where 1 is identical)
 */
function compareStrings(str1, str2) {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  
  // Exact match
  if (normalized1 === normalized2) {
    return 1.0;
  }
  
  // Use string similarity algorithm
  return stringSimilarity.compareTwoStrings(normalized1, normalized2);
}

/**
 * Check if two songs are potential duplicates based on title and artist
 * @param {object} song1 - First song object
 * @param {object} song2 - Second song object
 * @param {number} threshold - Similarity threshold (0-1, default 0.8)
 * @returns {object} - { isDuplicate, titleSimilarity, artistSimilarity, overallSimilarity }
 */
function areSongsDuplicate(song1, song2, threshold = 0.8) {
  const titleSimilarity = compareStrings(song1.title || '', song2.title || '');
  const artistSimilarity = compareStrings(song1.artist || '', song2.artist || '');
  
  // Overall similarity is weighted average (title is more important)
  const overallSimilarity = (titleSimilarity * 0.6) + (artistSimilarity * 0.4);
  
  return {
    isDuplicate: overallSimilarity >= threshold,
    titleSimilarity,
    artistSimilarity,
    overallSimilarity,
    matchType: getMatchType(titleSimilarity, artistSimilarity)
  };
}

/**
 * Determine the type of match
 * @param {number} titleSimilarity - Title similarity score
 * @param {number} artistSimilarity - Artist similarity score
 * @returns {string} - Match type
 */
function getMatchType(titleSimilarity, artistSimilarity) {
  if (titleSimilarity === 1.0 && artistSimilarity === 1.0) {
    return 'exact';
  } else if (titleSimilarity === 1.0 || artistSimilarity === 1.0) {
    return 'partial_exact';
  } else if (titleSimilarity >= 0.9 && artistSimilarity >= 0.9) {
    return 'high_similarity';
  } else {
    return 'fuzzy';
  }
}

/**
 * Find duplicate groups in a list of songs
 * @param {Array<object>} songs - Array of song objects
 * @param {number} threshold - Similarity threshold (default 0.8)
 * @returns {Array<object>} - Array of duplicate groups
 */
function findDuplicateGroups(songs, threshold = 0.8) {
  const duplicateGroups = [];
  const processedSongs = new Set();
  
  for (let i = 0; i < songs.length; i++) {
    if (processedSongs.has(i)) continue;
    
    const group = [songs[i]];
    processedSongs.add(i);
    
    for (let j = i + 1; j < songs.length; j++) {
      if (processedSongs.has(j)) continue;
      
      const comparison = areSongsDuplicate(songs[i], songs[j], threshold);
      
      if (comparison.isDuplicate) {
        group.push({
          ...songs[j],
          similarity: comparison.overallSimilarity,
          matchType: comparison.matchType
        });
        processedSongs.add(j);
      }
    }
    
    // Only add groups with 2 or more songs
    if (group.length > 1) {
      duplicateGroups.push({
        count: group.length,
        songs: group,
        title: songs[i].title,
        artist: songs[i].artist
      });
    }
  }
  
  return duplicateGroups;
}

/**
 * Find potential duplicates for a specific song
 * @param {object} targetSong - The song to find duplicates for
 * @param {Array<object>} allSongs - Array of all songs to search
 * @param {number} threshold - Similarity threshold (default 0.8)
 * @returns {Array<object>} - Array of potential duplicates with similarity scores
 */
function findDuplicatesForSong(targetSong, allSongs, threshold = 0.8) {
  const duplicates = [];
  
  for (const song of allSongs) {
    // Skip the same song
    if (song.song_id === targetSong.song_id) continue;
    
    const comparison = areSongsDuplicate(targetSong, song, threshold);
    
    if (comparison.isDuplicate) {
      duplicates.push({
        ...song,
        similarity: comparison.overallSimilarity,
        titleSimilarity: comparison.titleSimilarity,
        artistSimilarity: comparison.artistSimilarity,
        matchType: comparison.matchType
      });
    }
  }
  
  // Sort by similarity (highest first)
  duplicates.sort((a, b) => b.similarity - a.similarity);
  
  return duplicates;
}

/**
 * Check if a string contains featuring/feat patterns
 * @param {string} str - String to check
 * @returns {object} - { hasFeaturing, mainPart, featuringPart }
 */
function parseFeaturing(str) {
  if (!str) return { hasFeaturing: false, mainPart: '', featuringPart: '' };
  
  const patterns = [
    /\(feat\.?\s+([^)]+)\)/i,
    /\(ft\.?\s+([^)]+)\)/i,
    /\s+feat\.?\s+(.+)$/i,
    /\s+ft\.?\s+(.+)$/i,
    /\s+featuring\s+(.+)$/i
  ];
  
  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      return {
        hasFeaturing: true,
        mainPart: str.replace(pattern, '').trim(),
        featuringPart: match[1].trim()
      };
    }
  }
  
  return { hasFeaturing: false, mainPart: str, featuringPart: '' };
}

/**
 * Advanced comparison that handles featuring artists
 * @param {object} song1 - First song
 * @param {object} song2 - Second song
 * @param {number} threshold - Similarity threshold
 * @returns {object} - Comparison result
 */
function advancedSongComparison(song1, song2, threshold = 0.8) {
  const title1Info = parseFeaturing(song1.title || '');
  const title2Info = parseFeaturing(song2.title || '');
  
  // Compare main titles
  const mainTitleSimilarity = compareStrings(title1Info.mainPart, title2Info.mainPart);
  const artistSimilarity = compareStrings(song1.artist || '', song2.artist || '');
  
  const overallSimilarity = (mainTitleSimilarity * 0.6) + (artistSimilarity * 0.4);
  
  return {
    isDuplicate: overallSimilarity >= threshold,
    titleSimilarity: mainTitleSimilarity,
    artistSimilarity,
    overallSimilarity,
    matchType: getMatchType(mainTitleSimilarity, artistSimilarity),
    hasFeaturing: title1Info.hasFeaturing || title2Info.hasFeaturing
  };
}

module.exports = {
  normalizeString,
  compareStrings,
  areSongsDuplicate,
  findDuplicateGroups,
  findDuplicatesForSong,
  parseFeaturing,
  advancedSongComparison
};