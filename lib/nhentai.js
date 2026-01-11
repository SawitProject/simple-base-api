/**
 * nHentai Service
 * Search dan download manga dari nHentai
 */
const { fetch } = require('undici');
const cheerio = require('cheerio');

class NHentai {
  constructor() {
    this.baseUrl = 'https://nhentai.net';
  }

  /**
   * Get home page dengan gallery terbaru
   * @param {number} [page=1] - Halaman
   * @returns {Promise<Object>} - Object dengan gallery data
   */
  async getHome(page = 1) {
    try {
      if (isNaN(page) || page < 1) page = 1;

      const response = await fetch(`${this.baseUrl}/home?page=${page}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        }
      });
      
      const $ = cheerio.load(await response.text());
      
      const galleryData = {};
      
      $('.container').each((_, container) => {
        const $container = $(container);
        const type = $container.find('h2').text().trim();
        
        if (!type) return;
        
        galleryData[type] = [];
        
        $container.find('.gallery').each((_, element) => {
          const $el = $(element);
          const cover = $el.find('img').attr('src') || $el.find('img').attr('data-src');
          const title = $el.find('.caption').text().trim();
          const url = $el.find('a.cover').attr('href');
          const id = url?.match(/\/(\d+)\/?/)?.[1];

          galleryData[type].push({
            id,
            title,
            cover: cover || null,
            url: url ? `${this.baseUrl}${url}` : null,
            thumbnail: cover ? cover.replace('t.jpg', '.jpg') : null
          });
        });
      });

      return {
        success: true,
        page,
        data: galleryData
      };
    } catch (error) {
      throw new Error(error.message || 'Gagal memuat home page');
    }
  }

  /**
   * Search manga
   * @param {string} query - Kata kunci pencarian
   * @param {number} [page=1] - Halaman
   * @returns {Promise<Array>} - Array hasil pencarian
   */
  async search(query, page = 1) {
    try {
      if (!query || typeof query !== 'string') {
        throw new Error('Parameter query wajib diisi');
      }

      if (query.trim().length < 2) {
        throw new Error('Query minimal 2 karakter');
      }

      if (isNaN(page) || page < 1) page = 1;

      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `${this.baseUrl}/search/?q=${encodedQuery}&page=${page}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
          }
        }
      );
      
      const $ = cheerio.load(await response.text());
      
      const results = [];
      
      $('.gallery').each((_, element) => {
        const $el = $(element);
        const url = $el.find('a.cover').attr('href');
        const id = url?.match(/\/(\d+)\/?/)?.[1];
        const title = $el.find('.caption').text().trim();
        const cover = $el.find('img').attr('data-src');

        if (id && title) {
          results.push({
            id,
            title,
            cover: cover || null,
            url: url ? `${this.baseUrl}${url}` : null,
            thumbnail: cover ? cover.replace('t.jpg', '.jpg') : null
          });
        }
      });

      return {
        success: true,
        query,
        page,
        totalResults: results.length,
        results
      };
    } catch (error) {
      throw new Error(error.message || 'Gagal mencari di nHentai');
    }
  }

  /**
   * Get detail manga
   * @param {string} url - URL atau ID manga
   * @returns {Promise<Object>} - Object dengan detail manga
   */
  async detail(url) {
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Parameter url wajib diisi');
      }

      // Parse URL atau ID
      let cleanUrl;
      if (url.match(/^\d+$/)) {
        cleanUrl = `${this.baseUrl}/g/${url}/`;
      } else if (url.startsWith('http')) {
        cleanUrl = url.startsWith(this.baseUrl) ? url : `${this.baseUrl}${url}`;
      } else {
        cleanUrl = `${this.baseUrl}/${url}`;
      }

      const response = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(await response.text());

      // Extract info
      const infoBox = $('#info');
      
      const manga = {
        success: true,
        url: cleanUrl,
        id: cleanUrl.match(/\/g\/(\d+)\//)?.[1],
        title: {
          main: infoBox.find('h1').text().trim(),
          japanese: infoBox.find('h2').text().trim()
        },
        metadata: {
          id: infoBox.find('h3').contents().not('span').text().trim(),
          parody: infoBox.find('a[href*="/parody/"] span.name').map((_, t) => $(t).text().trim()).get(),
          tags: infoBox.find('a[href*="/tag/"] span.name').map((_, t) => $(t).text().trim()).get(),
          artists: infoBox.find('a[href*="/artist/"] span.name').map((_, t) => $(t).text().trim()).get(),
          languages: infoBox.find('a[href*="/language/"] span.name').map((_, t) => $(t).text().trim()).get(),
          categories: infoBox.find('a[href*="/category/"] span.name').map((_, t) => $(t).text().trim()).get(),
          pages: infoBox.find('a[href*="pages"] span.name').text().trim(),
          uploadDate: infoBox.find('time').text().trim()
        },
        cover: $('#cover img').attr('src') || $('#cover img').attr('data-src')
      };

      if (!manga.id) {
        throw new Error('ID manga tidak ditemukan');
      }

      return manga;
    } catch (error) {
      throw new Error(error.message || 'Gagal mendapatkan detail manga');
    }
  }

  /**
   * Get image URLs dari manga
   * @param {string} url - URL manga
   * @returns {Promise<Array>} - Array URL gambar
   */
  async getImages(url) {
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Parameter url wajib diisi');
      }

      // Parse URL atau ID
      let cleanUrl;
      if (url.match(/^\d+$/)) {
        cleanUrl = `${this.baseUrl}/g/${url}/`;
      } else if (url.startsWith('http')) {
        cleanUrl = url.startsWith(this.baseUrl) ? url : `${this.baseUrl}${url}`;
      } else {
        cleanUrl = `${this.baseUrl}/${url}`;
      }

      const response = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(await response.text());
      
      const images = [];
      const mangaId = cleanUrl.match(/\/g\/(\d+)\//)?.[1];

      // Extract image URLs
      const thumbContainers = $('.thumb-container').toArray();
      
      for (const container of thumbContainers) {
        const $container = $(container);
        const galleryLink = $container.find('a.gallerythumb').attr('href');
        
        if (galleryLink) {
          const imagePageUrl = `${this.baseUrl}${galleryLink}`;
          const imagePage = await fetch(imagePageUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' }
          });
          const $$ = cheerio.load(await imagePage.text());
          
          const imgSrc = $$('#image-container img').attr('src');
          if (imgSrc) {
            images.push({
              url: imgSrc,
              page: images.length + 1,
              thumbnail: imgSrc.replace('i.nhentai.net', 't.nhentai.net').replace(/\/(\d+)\.jpg$/, '/t.$1.jpg')
            });
          }
        }
      }

      return {
        success: true,
        mangaId,
        totalPages: images.length,
        images
      };
    } catch (error) {
      throw new Error(error.message || 'Gagal mendapatkan daftar gambar');
    }
  }

  /**
   * Get random manga
   * @returns {Promise<Object>} - Random manga object
   */
  async random() {
    try {
      const response = await fetch(`${this.baseUrl}/random/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
        },
        redirect: 'manual'
      });

      const redirectUrl = response.headers.get('location');
      const mangaId = redirectUrl?.match(/\/g\/(\d+)\//)?.[1];

      if (!mangaId) {
        throw new Error('Gagal mendapatkan random manga');
      }

      return this.detail(mangaId);
    } catch (error) {
      throw new Error(error.message || 'Gagal mendapatkan random manga');
    }
  }
}

module.exports = new NHentai();
