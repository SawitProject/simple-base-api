/**
 * Waifu2x Image Upscaling Service
 * Meningkatkan resolusi gambar dengan AI
 */
const axios = require('axios');
const FormData = require('form-data');

/**
 * Upscale gambar menggunakan Waifu2x
 * @param {Buffer|string} image - Buffer gambar atau URL gambar
 * @param {Object} options - Opsi konfigurasi
 * @param {string} [options.style='artwork'] - Style: artwork, scans, photo
 * @param {string} [options.noice='medium'] - Noise reduction: none, low, medium, high, highest
 * @param {string} [options.upscaling='2x'] - Scale: none, 1.6x, 2x
 * @returns {Promise<Buffer>} - Buffer gambar yang sudah di-upscale
 */
async function waifu2x(image, { 
  style = 'artwork', 
  noice = 'medium', 
  upscaling = '2x' 
} = {}) {
  try {
    // Validasi input
    if (!image) {
      throw new Error('Parameter image wajib diisi');
    }

    let imageBuffer;
    
    // Jika input adalah URL, download terlebih dahulu
    if (typeof image === 'string') {
      if (!image.startsWith('http')) {
        throw new Error('URL gambar harus dimulai dengan http:// atau https://');
      }
      const imageResponse = await axios.get(image, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      imageBuffer = Buffer.from(imageResponse.data);
    } else if (Buffer.isBuffer(image)) {
      imageBuffer = image;
    } else {
      throw new Error('Image harus berupa Buffer atau URL string');
    }

    // Validasi opsi
    const styles = ['artwork', 'scans', 'photo'];
    if (!styles.includes(style)) {
      throw new Error(`Style tidak valid. Available: ${styles.join(', ')}`);
    }

    const noiseLevels = ['none', 'low', 'medium', 'high', 'highest'];
    if (!noiseLevels.includes(noice)) {
      throw new Error(`Noise level tidak valid. Available: ${noiseLevels.join(', ')}`);
    }

    const scales = ['none', '1.6x', '2x'];
    if (!scales.includes(upscaling)) {
      throw new Error(`Scale tidak valid. Available: ${scales.join(', ')}`);
    }

    // Konfigurasi mapping
    const conf = {
      style: {
        artwork: 'art',
        scans: 'art_scan',
        photo: 'photo'
      },
      noice: {
        none: '-1',
        low: '0',
        medium: '1',
        high: '2',
        highest: '3'
      },
      upscaling: {
        none: '-1',
        '1.6x': '1',
        '2x': '2'
      }
    };

    // Bypass Cloudflare Turnstile jika diperlukan
    let cfResult = '';
    try {
      const { data: cf } = await axios.post(
        'https://api.nekolabs.web.id/tools/bypass/cf-turnstile',
        {
          url: 'https://www.waifu2x.net/',
          siteKey: '0x4AAAAAABqlY7DKXMzoS81U'
        },
        { timeout: 10000 }
      );
      cfResult = cf.result;
    } catch (cfError) {
      // Jika bypass gagal, continue tanpa cf-turnstile
      console.warn('Cloudflare bypass failed, continuing without it');
    }

    // Buat form data
    const form = new FormData();
    form.append('recap', '');
    if (cfResult) form.append('turnstile', cfResult);
    form.append('url', '');
    form.append('file', imageBuffer, `waifu2x_${Date.now()}.jpg`);
    form.append('style', conf.style[style]);
    form.append('noice', conf.noice[noice]);
    form.append('scale', conf.upscaling[upscaling]);
    form.append('format', '0');
    form.append('cf-turnstile-response', '');

    // Kirim request ke waifu2x
    const { data } = await axios.post(
      'https://www.waifu2x.net/api',
      form,
      {
        headers: {
          ...form.getHeaders(),
          origin: 'https://www.waifu2x.net',
          referer: 'https://www.waifu2x.net/',
          'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        },
        responseType: 'arraybuffer',
        timeout: 120000 // 2 menit timeout
      }
    );

    const resultBuffer = Buffer.from(data);

    if (resultBuffer.length === 0) {
      throw new Error('Response kosong dari server Waifu2x');
    }

    return {
      success: true,
      buffer: resultBuffer,
      metadata: {
        style,
        noiseLevel: noice,
        scale: upscaling,
        originalSize: imageBuffer.length,
        resultSize: resultBuffer.length
      }
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Gagal meng-upscale gambar');
  }
}

/**
 * Quick upscale dengan preset untuk anime artwork
 */
async function waifu2xAnime(image) {
  return waifu2x(image, {
    style: 'artwork',
    noice: 'medium',
    upscaling: '2x'
  });
}

/**
 * Quick upscale untuk foto
 */
async function waifu2xPhoto(image) {
  return waifu2x(image, {
    style: 'photo',
    noice: 'medium',
    upscaling: '2x'
  });
}

module.exports = { waifu2x, waifu2xAnime, waifu2xPhoto };
