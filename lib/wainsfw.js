/**
 * Wain SFW Image Generation Service
 * Generate gambar menggunakan AI (SFW only)
 */
const axios = require('axios');

/**
 * Generate gambar menggunakan Wain SFW
 * @param {string} prompt - Deskripsi gambar
 * @param {Object} options - Opsi konfigurasi
 * @param {string} [options.model='v140'] - Model: v140, v130, v120
 * @param {string} [options.qualityPrompt='masterpiece, best quality'] - Quality prompt
 * @param {string} [options.negativePrompt] - Negative prompt
 * @param {number} [options.width=1024] - Lebar gambar
 * @param {number} [options.height=1024] - Tinggi gambar
 * @param {number} [options.guidanceScale=6] - Guidance scale
 * @param {number} [options.inferenceSteps=30] - Number of inference steps
 * @returns {Promise<Object>} - Generation result
 */
async function wainsfw(prompt, options = {}) {
  try {
    // Validasi input
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Parameter prompt wajib diisi dan harus berupa string');
    }

    if (prompt.trim().length < 5) {
      throw new Error('Prompt minimal 5 karakter');
    }

    // Default options
    const {
      model = 'v140',
      qualityPrompt = 'masterpiece, best quality, fine details, high quality',
      negativePrompt = 'lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, worst quality, low quality, low score, bad score, average score, signature, watermark, username, blurry',
      width = 1024,
      height = 1024,
      guidanceScale = 6,
      inferenceSteps = 30,
      generations = 1
    } = options;

    // Validasi model
    const validModels = ['v140', 'v130', 'v120'];
    if (!validModels.includes(model)) {
      throw new Error(`Model tidak valid. Available: ${validModels.join(', ')}`);
    }

    // Validasi ukuran
    if (width < 256 || width > 2048 || height < 256 || height > 2048) {
      throw new Error('Width dan height harus antara 256 dan 2048 piksel');
    }

    const sessionHash = Math.random().toString(36).substring(2);

    // Request ke Gradio API
    const { data: joinData } = await axios.post(
      'https://nech-c-wainsfwillustrious-v140.hf.space/gradio_api/queue/join?',
      {
        data: [
          model,
          prompt,
          qualityPrompt,
          negativePrompt,
          0,
          true,
          width,
          height,
          guidanceScale,
          inferenceSteps,
          generations,
          null,
          true
        ],
        event_data: null,
        fn_index: 9,
        trigger_id: 18,
        session_hash: sessionHash
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
        },
        timeout: 60000
      }
    );

    if (!joinData?.event_id) {
      throw new Error('Gagal join queue');
    }

    // Poll untuk hasil
    let result = null;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts && !result) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const { data: pollData } = await axios.get(
          `https://nech-c-wainsfwillustrious-v140.hf.space/gradio_api/queue/data?session_hash=${sessionHash}`,
          { timeout: 10000 }
        );

        const lines = pollData.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const parsed = JSON.parse(line.substring(6));
              if (parsed.msg === 'process_completed' && parsed.output?.data?.[0]?.url) {
                result = parsed.output.data[0].url;
                break;
              }
            } catch (e) {
              // Continue
            }
          }
        }
      } catch (pollError) {
        // Continue polling
      }

      attempts++;
    }

    if (!result) {
      throw new Error('Generation timeout. Silakan coba lagi.');
    }

    return {
      success: true,
      prompt,
      imageUrl: result,
      metadata: {
        model,
        width,
        height,
        guidanceScale,
        inferenceSteps,
        qualityPrompt,
        negativePrompt,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Gagal generate gambar');
  }
}

/**
 * Quick generate dengan preset default
 */
async function wainsfwQuick(prompt) {
  return wainsfw(prompt, {
    model: 'v140',
    width: 1024,
    height: 1024
  });
}

/**
 * Generate dengan model v130
 */
async function wainsfwV130(prompt) {
  return wainsfw(prompt, { model: 'v130' });
}

/**
 * Generate dengan model v120
 */
async function wainsfwV120(prompt) {
  return wainsfw(prompt, { model: 'v120' });
}

/**
 * Generate anime style
 */
async function wainsfwAnime(prompt) {
  return wainsfw(prompt, {
    model: 'v140',
    qualityPrompt: 'masterpiece, best quality, anime style, high quality anime illustration',
    negativePrompt: 'lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, worst quality, low quality, low score, bad score, average score, signature, watermark, username, blurry, realistic, photorealistic'
  });
}

module.exports = { wainsfw, wainsfwQuick, wainsfwV130, wainsfwV120, wainsfwAnime };
