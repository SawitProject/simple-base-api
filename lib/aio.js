/**
 * AIO Downloader Service
 * Multi-platform downloader dengan dukungan berbagai situs
 */
const axios = require('axios');

/**
 * Download dari berbagai platform
 * @param {string} url - URL yang akan di-download
 * @param {string} platform - Platform target (instagram, tiktok, dll)
 * @returns {Promise<Object>} - Result object
 */
async function aioDownloader(url, platform = 'auto') {
  try {
    // Validasi input dasar
    if (!url) {
      throw new Error('Parameter url wajib diisi');
    }
    
    if (typeof url !== 'string') {
      throw new Error('Parameter url harus berupa string');
    }

    // Mapping platform ke endpoint
    const platforms = {
      'instagram': 'instagram',
      'tiktok': 'tiktok',
      'twitter': 'twitter',
      'youtube': 'youtube',
      'facebook': 'facebook',
      'threads': 'threads'
    };

    // Auto-detect platform jika tidak ditentukan
    let targetPlatform = platform;
    if (platform === 'auto' || !platforms[platform]) {
      const urlLower = url.toLowerCase();
      
      if (urlLower.includes('instagram.com')) {
        targetPlatform = 'instagram';
      } else if (urlLower.includes('tiktok.com')) {
        targetPlatform = 'tiktok';
      } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
        targetPlatform = 'twitter';
      } else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
        targetPlatform = 'youtube';
      } else if (urlLower.includes('facebook.com') || urlLower.includes('fb.gg')) {
        targetPlatform = 'facebook';
      } else if (urlLower.includes('threads.net')) {
        targetPlatform = 'threads';
      } else {
        throw new Error('Platform tidak dikenali. Gunakan: instagram, tiktok, twitter, youtube, facebook, atau threads');
      }
    }

    // Berdasarkan platform, panggil service yang sesuai
    const downloaderMap = {
      'instagram': downloadInstagram,
      'tiktok': downloadTiktok,
      'twitter': downloadTwitter,
      'youtube': downloadYoutube,
      'facebook': downloadFacebook,
      'threads': require('./threads').threads
    };

    const downloader = downloaderMap[targetPlatform];
    if (!downloader) {
      throw new Error('Platform tidak didukung');
    }

    const result = await downloader(url);
    
    return {
      success: true,
      platform: targetPlatform,
      ...result
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Download dari Instagram
 */
async function downloadInstagram(url) {
  try {
    // Validasi URL Instagram
    const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv|stories)\/[\w\-]+\/?/;
    if (!instagramRegex.test(url)) {
      throw new Error('URL Instagram tidak valid');
    }

    const apiUrl = `https://api.downr.ccinstagram.com/api?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    if (response.data?.url) {
      return {
        downloadUrl: response.data.url,
        type: response.data.type || 'post',
        thumbnail: response.data.thumbnail
      };
    }

    throw new Error('Gagal mengunduh dari Instagram');
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Download dari TikTok
 */
async function downloadTiktok(url) {
  try {
    const apiUrl = `https://api.tikmate.app/api/quote?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, {
      timeout: 30000
    });

    if (response.data?.videoUrl) {
      return {
        downloadUrl: response.data.videoUrl,
        type: 'video',
        thumbnail: response.data.thumbnail,
        music: response.data.music
      };
    }

    throw new Error('Gagal mengunduh dari TikTok');
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Download dari Twitter/X
 */
async function downloadTwitter(url) {
  try {
    const apiUrl = `https://api.xvideotools.com/twitter/download?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    if (response.data?.url) {
      return {
        downloadUrl: response.data.url,
        type: response.data.type || 'image',
        thumbnail: response.data.thumbnail
      };
    }

    throw new Error('Gagal mengunduh dari Twitter');
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Download dari YouTube
 */
async function downloadYoutube(url) {
  try {
    const apiUrl = `https://api.youtubemultidownloader.com/download?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, {
      timeout: 30000
    });

    if (response.data?.url) {
      return {
        downloadUrl: response.data.url,
        type: 'video',
        thumbnail: response.data.thumb,
        title: response.data.title,
        duration: response.data.duration
      };
    }

    throw new Error('Gagal mengunduh dari YouTube');
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Download dari Facebook
 */
async function downloadFacebook(url) {
  try {
    const apiUrl = `https://api.fbdownloader.me/api?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    if (response.data?.videoUrl) {
      return {
        downloadUrl: response.data.videoUrl,
        type: 'video',
        thumbnail: response.data.thumbnail,
        title: response.data.title
      };
    }

    throw new Error('Gagal mengunduh dari Facebook');
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = { aioDownloader };
