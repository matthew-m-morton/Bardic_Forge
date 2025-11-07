const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

// Set ffmpeg path to the static binary
ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * Convert an audio file to MP3 format
 * @param {string} inputPath - Path to input file
 * @param {string} outputPath - Path for output MP3 file
 * @param {number} bitrate - Bitrate in kbps (128, 192, 256, 320)
 * @param {function} onProgress - Progress callback (percent)
 * @returns {Promise<object>} - Conversion result
 */
function convertToMP3(inputPath, outputPath, bitrate = 256, onProgress = null) {
  return new Promise((resolve, reject) => {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const command = ffmpeg(inputPath)
        .audioBitrate(bitrate)
        .audioCodec('libmp3lame')
        .format('mp3')
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress(Math.round(progress.percent));
          }
        })
        .on('end', () => {
          console.log('Conversion finished:', outputPath);
          resolve({
            success: true,
            outputPath: outputPath,
            message: 'Conversion completed successfully'
          });
        })
        .on('error', (err) => {
          console.error('Conversion error:', err);
          reject({
            success: false,
            error: err.message
          });
        });
      
      command.save(outputPath);
    } catch (error) {
      reject({
        success: false,
        error: error.message
      });
    }
  });
}

/**
 * Convert multiple audio files to MP3 in batch
 * @param {Array<object>} files - Array of {inputPath, outputPath} objects
 * @param {number} bitrate - Bitrate in kbps
 * @param {function} onFileProgress - Progress callback for each file
 * @param {function} onOverallProgress - Overall progress callback
 * @returns {Promise<Array>} - Array of conversion results
 */
async function convertBatch(files, bitrate = 256, onFileProgress = null, onOverallProgress = null) {
  const results = [];
  const total = files.length;
  
  for (let i = 0; i < total; i++) {
    const { inputPath, outputPath } = files[i];
    
    try {
      const progressCallback = onFileProgress ? (percent) => {
        onFileProgress(i, percent, inputPath);
      } : null;
      
      const result = await convertToMP3(inputPath, outputPath, bitrate, progressCallback);
      results.push({ ...result, index: i, inputPath });
      
      if (onOverallProgress) {
        const overallPercent = Math.round(((i + 1) / total) * 100);
        onOverallProgress(overallPercent, i + 1, total);
      }
    } catch (error) {
      results.push({
        success: false,
        error: error.error || error.message,
        index: i,
        inputPath
      });
    }
  }
  
  return results;
}

/**
 * Get audio file information without converting
 * @param {string} filePath - Path to audio file
 * @returns {Promise<object>} - File information
 */
function getAudioInfo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject({ success: false, error: err.message });
      } else {
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
        
        resolve({
          success: true,
          info: {
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitrate: metadata.format.bit_rate,
            format: metadata.format.format_name,
            codec: audioStream ? audioStream.codec_name : 'unknown',
            sampleRate: audioStream ? audioStream.sample_rate : null,
            channels: audioStream ? audioStream.channels : null
          }
        });
      }
    });
  });
}

/**
 * Check if a file needs conversion (not MP3 or low quality)
 * @param {string} filePath - Path to audio file
 * @param {number} minBitrate - Minimum acceptable bitrate
 * @returns {Promise<boolean>} - True if conversion needed
 */
async function needsConversion(filePath, minBitrate = 128) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    // Always convert non-MP3 files
    if (ext !== '.mp3') {
      return true;
    }
    
    // Check MP3 bitrate
    const info = await getAudioInfo(filePath);
    if (!info.success) {
      return true; // Convert if we can't read the file
    }
    
    const bitrateKbps = info.info.bitrate / 1000;
    return bitrateKbps < minBitrate;
  } catch (error) {
    console.error('Error checking if conversion needed:', error);
    return true; // Convert on error to be safe
  }
}

/**
 * Generate output path for converted file
 * @param {string} inputPath - Input file path
 * @param {string} outputDir - Output directory
 * @returns {string} - Output file path
 */
function generateOutputPath(inputPath, outputDir) {
  const fileName = path.basename(inputPath, path.extname(inputPath));
  const outputFileName = `${fileName}.mp3`;
  return path.join(outputDir, outputFileName);
}

/**
 * Validate bitrate value
 * @param {number} bitrate - Bitrate to validate
 * @returns {number} - Valid bitrate (defaults to 256 if invalid)
 */
function validateBitrate(bitrate) {
  const validBitrates = [128, 192, 256, 320];
  return validBitrates.includes(bitrate) ? bitrate : 256;
}

/**
 * Estimate conversion time based on file size and bitrate
 * @param {number} fileSize - File size in bytes
 * @param {number} bitrate - Target bitrate
 * @returns {number} - Estimated time in seconds
 */
function estimateConversionTime(fileSize, bitrate) {
  // Rough estimate: 1 MB takes about 1-2 seconds at 256kbps
  const fileSizeMB = fileSize / (1024 * 1024);
  const baseTime = fileSizeMB * 1.5;
  
  // Adjust for bitrate (higher bitrate = slightly longer)
  const bitrateMultiplier = bitrate / 256;
  return Math.round(baseTime * bitrateMultiplier);
}

module.exports = {
  convertToMP3,
  convertBatch,
  getAudioInfo,
  needsConversion,
  generateOutputPath,
  validateBitrate,
  estimateConversionTime
};