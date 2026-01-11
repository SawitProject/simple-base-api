/**
 * Rule34 Scraper Service
 * Scraping content dari rule34.xxx
 */
const axios = require('axios');
const cheerio = require('cheerio');

class Rule34 {
  constructor() {
    this.baseUrl = 'https://rule34.xxx';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    };
  }

  /**
   * Get posts dari index/list page
   * @param {Object} options - Opsi pencarian
   * @param {number} [options.page=1] - Halaman
   * @param {string} [options.tags] - Tag untuk difilter
   * @returns {Promise<Object>} - Object dengan posts
   */
  async getPosts({ page = 1, tags = '' } = {}) {
    try {
      if (isNaN(page) || page < 1) page = 1;

      let url = `${this.baseUrl}/index.php?page=post&s=list&pid=${(page - 1) * 42}`;
      
      if (tags) {
        const encodedTags = encodeURIComponent(tags);
        url += `&tags=${encodedTags}`;
      }

      const { data: html } = await axios.get(url, { headers: this.headers });
      
      const $ = cheerio.load(html);
      
      const posts = [];
      
      $('div.image-list span.thumb').each((_, element) => {
        const $el = $(element);
        const anchor = $el.find('a');
        const image = $el.find('img.preview');
        
        const id = $el.attr('id')?.replace('s', '');
        if (!id) return;

        const postUrl = new URL(anchor.attr('href'), this.baseUrl).href;
        const thumbnailUrl = image.attr('src');
        const tagsRaw = (image.attr('alt') || '').trim();
        
        // Parse metadata dari title
        const titleAttr = image.attr('title') || '';
        const titleParts = titleAttr.trim().split(' ');
        
        const rating = titleParts.pop()?.split(':')[1] || 'unknown';
        const score = parseInt(titleParts.pop?.()?.split(':')[1] || '0', 10);

        posts.push({
          id,
          postUrl,
          thumbnailUrl: thumbnailUrl || null,
          tags: tagsRaw.split(' ').filter(Boolean),
          metadata: {
            score,
            rating
          }
        });
      });

      return {
        success: true,
        page,
        totalPosts: posts.length,
        posts
      };
    } catch (error) {
      throw new Error(error.message || 'Gagal mengambil posts dari Rule34');
    }
  }

  /**
   * Get single post detail
   * @param {string|number} id - Post ID
   * @returns {Promise<Object>} - Post detail
   */
  async getPost(id) {
    try {
      if (!id) {
        throw new Error('Parameter id wajib diisi');
      }

      const postUrl = `${this.baseUrl}/index.php?page=post&s=view&id=${id}`;
      const { data: html } = await axios.get(postUrl, { headers: this.headers });
      
      const $ = cheerio.load(html);
      
      // Extract stats
      const stats = {};
      $('#stats li').each((_, li) => {
        const $li = $(li);
        const label = $li.find('span').text().trim();
        const value = $li.contents().not('span').text().trim();
        stats[label.toLowerCase()] = value;
      });

      // Extract tags
      const tags = [];
      $('#tag-sidebar .tag').each((_, tag) => {
        const $tag = $(tag);
        const name = $tag.find('a[name]').attr('name');
        const type = $tag.find('.type').text().trim();
        const count = $tag.find('.count').text().trim().replace(/[()]/g, '');
        
        if (name) {
          tags.push({
            name,
            type,
            count: parseInt(count) || 0
          });
        }
      });

      // Extract image/video URLs
      const imageElement = $('#image');
      const imageUrl = imageElement.find('img').attr('src') || imageElement.find('source').attr('src');
      const videoUrl = imageElement.find('video source').attr('src');

      const post = {
        success: true,
        id,
        url: postUrl,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        stats,
        tags,
        author: $('#author span a').text().trim() || null,
        createdAt: $('#date time').attr('datetime') || null
      };

      return post;
    } catch (error) {
      throw new Error(error.message || 'Gagal mengambil detail post');
    }
  }

  /**
   * Search posts by tags
   * @param {string} tags - Tags yang dipisahkan dengan spasi
   * @param {number} [page=1] - Halaman
   * @returns {Promise<Object>} - Search results
   */
  async search(tags, page = 1) {
    try {
      if (!tags || typeof tags !== 'string') {
        throw new Error('Parameter tags wajib diisi');
      }

      return this.getPosts({ page, tags });
    } catch (error) {
      throw new Error(error.message || 'Gagal mencari posts');
    }
  }

  /**
   * Get popular posts
   * @param {string} [period='day'] - Period: day, week, month
   * @returns {Promise<Array>} - Array popular posts
   */
  async getPopular(period = 'day') {
    try {
      const validPeriods = ['day', 'week', 'month'];
      if (!validPeriods.includes(period)) {
        period = 'day';
      }

      const url = `${this.baseUrl}/index.php?page=stats&s=view&period=${period}`;
      const { data: html } = await axios.get(url, { headers: this.headers });
      
      const $ = cheerio.load(html);
      
      const posts = [];
      
      $('#content div.thumb').each((_, element) => {
        const $el = $(element);
        const anchor = $el.find('a');
        const id = $el.attr('id')?.replace('p', '');
        const thumbnail = $el.find('img').attr('src');
        
        if (id && anchor.attr('href')) {
          posts.push({
            id,
            url: new URL(anchor.attr('href'), this.baseUrl).href,
            thumbnail: thumbnail || null
          });
        }
      });

      return {
        success: true,
        period,
        posts
      };
    } catch (error) {
      throw new Error(error.message || 'Gagal mengambil popular posts');
    }
  }
}

module.exports = new Rule34();
