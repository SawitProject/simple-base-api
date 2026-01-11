/**
 * Xvideos Service
 * Search dan download video dari Xvideos
 */
const { fetch } = require('undici');
const cheerio = require('cheerio');

class Xvideos {
  constructor() {
    this.baseUrl = 'https://www.xvideos.com';
  }

  /**
   * Search video di Xvideos
   * @param {string} query - Kata kunci pencarian
   * @param {number} [page=1] - Halaman hasil
   * @returns {Promise<Array>} - Array hasil pencarian
   */
  async search(query, page = 1) {
    try {
      if (!query || typeof query !== 'string') {
        throw new Error('Parameter query wajib diisi dan harus berupa string');
      }

      if (query.trim().length < 2) {
        throw new Error('Query minimal 2 karakter');
      }

      if (isNaN(page) || page < 1) {
        page = 1;
      }

      const searchPage = Math.floor(Math.random() * 5) + 1; // Random page untuk variasi
      const encodedQuery = encodeURIComponent(query);
      const resp = await fetch(
        `${this.baseUrl}/?k=${encodedQuery}&p=${searchPage}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
          }
        }
      );
      
      const $ = cheerio.load(await resp.text());
      
      const results = [];
      $('div[id*="video"]').each((_, element) => {
        const $el = $(element);
        
        const titleElement = $el.find('.thumb-under p.title a');
        const title = titleElement.contents().not('span').text().trim();
        
        if (!title) return; // Skip jika tidak ada title

        const resolution = $el.find('.thumb-inside .thumb span').text().trim();
        const duration = $el.find('.thumb-under p.metadata span.duration').text().trim();
        const artist = $el.find('.thumb-under p.metadata a span.name').text().trim();
        const cover = $el.find('.thumb-inside .thumb img').attr('data-src');
        const videoUrl = $el.find('.thumb-inside .thumb a').attr('href');
        const videoId = $el.attr('id')?.replace('video_', '');

        results.push({
          id: videoId,
          title,
          resolution: resolution || 'N/A',
          duration,
          artist: artist || 'Unknown',
          thumbnail: cover || null,
          url: videoUrl ? `${this.baseUrl}${videoUrl}` : null,
          previewUrl: videoId ? `${this.baseUrl}/?k=${videoId}` : null
        });
      });

      return {
        success: true,
        query,
        page: searchPage,
        totalResults: results.length,
        results
      };
    } catch (error) {
      throw new Error(error.message || 'Gagal mencari video di Xvideos');
    }
  }

  /**
   * Get video details dan download links
   * @param {string} url - URL video Xvideos
   * @returns {Promise<Object>} - Object dengan video info dan download links
   */
  async download(url) {
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Parameter url wajib diisi');
      }

      // Validasi URL
      if (!url.includes('xvideos.com') && !url.includes('/video')) {
        throw new Error('URL Xvideos tidak valid');
      }

      // Normalisasi URL
      let cleanUrl = url;
      if (!url.startsWith('http')) {
        cleanUrl = 'https://www.xvideos.com' + url;
      }

      const resp = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        }
      });
      
      const $ = cheerio.load(await resp.text());

      // Extract video info
      const scriptContent = $('#video-player-bg > script:nth-child(6)').html();
      const extractData = (regex) => (scriptContent?.match(regex) || [])[1];

      const video = {
        success: true,
        url: cleanUrl,
        videoUrls: {
          low: extractData(/html5player\.setVideoUrlLow\('(.*?)'\);/) || null,
          high: extractData(/html5player\.setVideoUrlHigh\('(.*?)'\);/) || null,
          hls: extractData(/html5player\.setVideoHLS\('(.*?)'\);/) || null
        },
        thumbnail: extractData(/html5player\.setThumbUrl\('(.*?)'\);/) || null,
        title: $('meta[property="og:title"]').attr('content') || 'Untitled',
        duration: extractData(/html5player\.setVideoDuration\('(.*?)'\);/) || null
      };

      // Check jika video URLs valid
      if (!video.videoUrls.low && !video.videoUrls.high && !video.videoUrls.hls) {
        throw new Error('Gagal mendapatkan link video');
      }

      return video;
    } catch (error) {
      throw new Error(error.message || 'Gagal mendownload video dari Xvideos');
    }
  }

  /**
   * Get trending videos
   * @returns {Promise<Array>} - Array trending videos
   */
  async trending() {
    try {
      const resp = await fetch(`${this.baseUrl}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(await resp.text());
      
      const results = [];
      $('div[id*="video"]').slice(0, 10).each((_, element) => {
        const $el = $(element);
        const title = $el.find('.thumb-under p.title a').contents().not('span').text().trim();
        const cover = $el.find('.thumb-inside .thumb img').attr('data-src');
        const videoUrl = $el.find('.thumb-inside .thumb a').attr('href');
        
        if (title && videoUrl) {
          results.push({
            title,
            thumbnail: cover,
            url: `${this.baseUrl}${videoUrl}`
          });
        }
      });

      return {
        success: true,
        section: 'trending',
        results
      };
    } catch (error) {
      throw new Error(error.message || 'Gagal mendapatkan trending videos');
    }
  }
}

module.exports = new Xvideos();
