/**
 * Threads Downloader Service
 * Download media dari threads.net
 */
const axios = require('axios');

/**
 * Download media dari Threads
 * @param {string} url - URL post Threads
 * @returns {Promise<Object>} - Object berisi download URL
 */
async function threads(url) {
  try {
    // Validasi input
    if (!url) {
      throw new Error('Parameter url wajib diisi');
    }
    
    if (typeof url !== 'string') {
      throw new Error('Parameter url harus berupa string');
    }
    
    // Validasi URL Threads
    const threadsRegex = /(?:https?:\/\/)?(?:www\.)?threads\.net\/[\w\/-]+/;
    if (!threadsRegex.test(url)) {
      throw new Error('URL harus berasal dari threads.net');
    }

    // Normalisasi URL jika perlu
    let cleanUrl = url;
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      cleanUrl = 'https://' + url;
    }

    const apiUrl = `https://snapthreads.net/api/download?url=${encodeURIComponent(cleanUrl)}`;

    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://snapthreads.net/id',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 30000
    });

    if (!response.data) {
      throw new Error('Response kosong dari server');
    }

    // Parse response dan return hasil
    if (response.data.directLink || response.data.url || response.data.downloadUrl) {
      return {
        success: true,
        downloadUrl: response.data.directLink || response.data.url || response.data.downloadUrl,
        originalUrl: cleanUrl,
        type: response.data.type || 'unknown',
        metadata: {
          caption: response.data.caption,
          username: response.data.username,
          likeCount: response.data.likeCount,
          replyCount: response.data.replyCount
        }
      };
    } else if (response.data.success === false) {
      throw new Error(response.data.message || 'Gagal mengambil link download');
    } else {
      throw new Error('Format response tidak dikenali');
    }
  } catch (error) {
    if (error.response?.data) {
      throw new Error(error.response.data.message || error.response.data.error || 'Gagal mengunduh dari Threads');
    }
    throw new Error(error.message || 'Gagal mengunduh dari Threads');
  }
}

/**
 * Get video dari Threads dengan multiple quality options
 * @param {string} url - URL post Threads
 * @returns {Promise<Object>} - Object dengan multiple quality URLs
 */
async function threadsWithQuality(url) {
  try {
    const result = await threads(url);
    
    return {
      ...result,
      availableQualities: ['original'],
      selectedQuality: 'original'
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = { threads, threadsWithQuality };
