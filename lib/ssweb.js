/**
 * Screenshot Web Service
 * Mengambil screenshot website dalam format desktop atau mobile
 */
const axios = require('axios');

/**
 * Ambil screenshot website
 * @param {string} url - URL website yang akan di-screenshot
 * @param {Object} options - Opsi konfigurasi
 * @param {number} [options.width=1280] - Lebar browser
 * @param {number} [options.height=720] - Tinggi browser
 * @param {boolean} [options.full_page=false] - Apakah perlu screenshot full page
 * @param {number} [options.device_scale=1] - Device scale factor
 * @returns {Promise<string>} - URL gambar screenshot
 */
async function ssweb(url, { 
  width = 1280, 
  height = 720, 
  full_page = false, 
  device_scale = 1 
} = {}) {
  try {
    // Validasi input
    if (!url) {
      throw new Error('Parameter url wajib diisi');
    }
    
    if (typeof url !== 'string') {
      throw new Error('Parameter url harus berupa string');
    }
    
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      throw new Error('URL harus dimulai dengan http:// atau https://');
    }
    
    if (isNaN(width) || isNaN(height) || isNaN(device_scale)) {
      throw new Error('Width, height, dan scale harus berupa angka');
    }
    
    if (typeof full_page !== 'boolean') {
      throw new Error('Full page harus berupa boolean');
    }
    
    // Validasi ukuran
    if (width < 100 || width > 4096) {
      throw new Error('Width harus antara 100 dan 4096 piksel');
    }
    
    if (height < 100 || height > 4096) {
      throw new Error('Height harus antara 100 dan 4096 piksel');
    }

    // Konfigurasi dimensi berdasarkan preset
    const presets = {
      'pc': { width: 1280, height: 720 },
      'mobile': { width: 720, height: 1280 },
      'tablet': { width: 1024, height: 768 }
    };

    if (presets[width.toLowerCase?.()]) {
      const preset = presets[width.toLowerCase()];
      width = preset.width;
      height = preset.height;
    }

    const { data } = await axios.post(
      'https://gcp.imagy.app/screenshot/createscreenshot',
      {
        url: url,
        browserWidth: parseInt(width),
        browserHeight: parseInt(height),
        fullPage: full_page,
        deviceScaleFactor: parseInt(device_scale),
        format: 'png'
      },
      {
        headers: {
          'content-type': 'application/json',
          referer: 'https://imagy.app/full-page-screenshot-taker/',
          'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        }
      }
    );
    
    if (!data.fileUrl) {
      throw new Error('Gagal mendapatkan URL screenshot dari server');
    }

    return {
      success: true,
      url: data.fileUrl,
      metadata: {
        originalUrl: url,
        dimensions: { width: parseInt(width), height: parseInt(height) },
        fullPage: full_page,
        format: 'png'
      }
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Gagal mengambil screenshot');
  }
}

/**
 * Preset untuk desktop (16:9)
 */
async function sswebPc(url) {
  return ssweb(url, { width: 1280, height: 720 });
}

/**
 * Preset untuk mobile (9:16)
 */
async function sswebHp(url) {
  return ssweb(url, { width: 720, height: 1280 });
}

module.exports = { ssweb, sswebPc, sswebHp };
