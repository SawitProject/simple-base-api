/**
 * Sora2 Video Generation Service
 * Generate video dari text menggunakan AI
 */
const axios = require('axios');

/**
 * Generate video menggunakan Sora2
 * @param {string} prompt - Deskripsi video yang diinginkan
 * @param {Object} options - Opsi konfigurasi
 * @param {string} [options.ratio='portrait'] - Aspect ratio: portrait, landscape
 * @returns {Promise<Object>} - Video generation result
 */
async function sora2(prompt, { ratio = 'portrait' } = {}) {
  try {
    // Validasi input
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Parameter prompt wajib diisi dan harus berupa string');
    }

    if (prompt.trim().length < 10) {
      throw new Error('Prompt minimal 10 karakter untuk hasil yang baik');
    }

    const validRatios = ['portrait', 'landscape'];
    if (!validRatios.includes(ratio)) {
      throw new Error(`Ratio tidak valid. Available: ${validRatios.join(', ')}`);
    }

    const api = axios.create({
      baseURL: 'https://api.bylo.ai/aimodels/api/v1/ai',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'accept-encoding': 'gzip, deflate, br',
        'cache-control': 'max-age=0',
        'connection': 'keep-alive',
        'content-type': 'application/json; charset=UTF-8',
        'dnt': '1',
        'origin': 'https://bylo.ai',
        'pragma': 'no-cache',
        'referer': 'https://bylo.ai/features/sora-2',
        'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
        'x-requested-with': 'XMLHttpRequest'
      }
    });

    // Generate task
    const { data: taskResponse } = await api.post('/video/create', {
      prompt: prompt,
      channel: 'SORA2',
      pageId: 536,
      source: 'bylo.ai',
      watermarkFlag: true,
      privateFlag: true,
      isTemp: true,
      vipFlag: true,
      model: 'sora_video2',
      videoType: 'text-to-video',
      aspectRatio: ratio
    });

    if (!taskResponse.data) {
      throw new Error('Gagal membuat task video generation');
    }

    const taskId = taskResponse.data;

    // Poll untuk status
    let attempts = 0;
    const maxAttempts = 120; // Maksimal 2 menit
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const { data: statusResponse } = await api.get(`/${taskId}?channel=SORA2`);
        
        if (statusResponse?.data?.state > 0) {
          const completeData = JSON.parse(statusResponse.data.completeData);
          
          return {
            success: true,
            taskId,
            prompt,
            aspectRatio: ratio,
            video: {
              url: completeData.videoUrl || completeData.url,
              thumbnail: completeData.thumbnail || completeData.cover,
              duration: completeData.duration || null
            },
            metadata: {
              model: 'sora_video2',
              createdAt: new Date().toISOString(),
              status: 'completed'
            }
          };
        }
      } catch (pollError) {
        // Continue polling
      }
      
      attempts++;
    }

    throw new Error('Video generation timeout. Silakan coba lagi.');
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Gagal generate video');
  }
}

/**
 * Generate landscape video
 */
async function sora2Landscape(prompt) {
  return sora2(prompt, { ratio: 'landscape' });
}

/**
 * Generate portrait video
 */
async function sora2Portrait(prompt) {
  return sora2(prompt, { ratio: 'portrait' });
}

/**
 * Check generation status
 * @param {string} taskId - Task ID dari response
 * @returns {Promise<Object>} - Status object
 */
async function checkSora2Status(taskId) {
  try {
    if (!taskId) {
      throw new Error('Parameter taskId wajib diisi');
    }

    const api = axios.create({
      baseURL: 'https://api.bylo.ai/aimodels/api/v1/ai',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    const { data } = await api.get(`/${taskId}?channel=SORA2`);
    
    return {
      success: true,
      taskId,
      status: data.data?.state > 0 ? 'completed' : 'processing',
      state: data.data?.state
    };
  } catch (error) {
    throw new Error(error.message || 'Gagal check status');
  }
}

module.exports = { sora2, sora2Landscape, sora2Portrait, checkSora2Status };
