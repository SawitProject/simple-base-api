/**
 * SoundGASM Service
 * Audio hosting platform utilities
 */
const axios = require('axios');
const cheerio = require('cheerio');

class SoundGASM {
  constructor() {
    this.baseUrl = 'https://soundgasm.net';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    };
  }

  /**
   * Get home page data
   * @returns {Promise<Object>} - Home page data
   */
  async getHome() {
    try {
      const { data: html } = await axios.get(this.baseUrl, { headers: this.headers });
      
      const $ = cheerio.load(html);
      
      const navigation = [];
      $('header nav a').each((_, el) => {
        const $el = $(el);
        navigation.push({
          text: $el.text().trim(),
          url: $el.attr('href')
        });
      });

      return {
        success: true,
        title: $('div#container h1').text().trim() || 'SoundGASM',
        description: $('div#body p').text().trim() || '',
        navigation,
        footerInfo: $('p.footer strong').text().trim() || null
      };
    } catch (error) {
      throw new Error(error.message || 'Gagal memuat SoundGASM home');
    }
  }

  /**
   * Search audio files
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Search results
   */
  async search(query) {
    try {
      if (!query || typeof query !== 'string') {
        throw new Error('Parameter query wajib diisi');
      }

      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
      const { data: html } = await axios.get(searchUrl, { headers: this.headers });
      
      const $ = cheerio.load(html);
      
      const results = [];
      $('.audio-item, .search-result').each((_, el) => {
        const $el = $(el);
        const title = $el.find('h3, .title').text().trim();
        const url = $el.find('a').attr('href');
        const duration = $el.find('.duration, time').text().trim();
        
        if (title && url) {
          results.push({
            title,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            duration: duration || null
          });
        }
      });

      return {
        success: true,
        query,
        totalResults: results.length,
        results
      };
    } catch (error) {
      throw new Error(error.message || 'Gagal mencari di SoundGASM');
    }
  }

  /**
   * Get audio details
   * @param {string} url - Audio page URL
   * @returns {Promise<Object>} - Audio details
   */
  async getAudioDetails(url) {
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Parameter url wajib diisi');
      }

      const cleanUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
      const { data: html } = await axios.get(cleanUrl, { headers: this.headers });
      
      const $ = cheerio.load(html);

      const audio = {
        success: true,
        url: cleanUrl,
        title: $('meta[property="og:title"]').attr('content') || $('h1').text().trim(),
        description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content'),
        audioUrl: $('audio source').attr('src') || $('#audio-player source').attr('src'),
        duration: $('meta[property="og:duration"]').attr('content') || null,
        waveformImage: $('.waveform img').attr('src') || null
      };

      if (!audio.audioUrl) {
        throw new Error('Audio URL tidak ditemukan');
      }

      return audio;
    } catch (error) {
      throw new Error(error.message || 'Gagal mendapatkan detail audio');
    }
  }
}

module.exports = new SoundGASM();
