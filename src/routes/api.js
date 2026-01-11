/**
 * Routes Index - Enhanced Base API v2.0
 * Semua API routes terorganisir dengan middleware yang tepat
 */
const express = require('express');
const config = require('../config');
const { asyncHandler, successResponse } = require('../utils/response');
const { aiValidations, downloaderValidations, toolsValidations, handleValidationErrors } = require('../middleware/validation');
const healthService = require('../services/healthService');
const { GoogleGenAI } = require('@google/genai');
const { ssweb, sswebPc, sswebHp } = require('../lib/ssweb.js');
const { threads } = require('../lib/threads.js');
const { aioDownloader } = require('../lib/aio.js');
const { search: xvideosSearch, download: xvideosDownload, trending: xvideosTrending } = require('../lib/xvideos.js');
const { waifu2x } = require('../lib/waifu2x.js');
const nhentai = require('../lib/nhentai.js');
const rule34 = require('../lib/rule34.js');
const { sora2 } = require('../lib/sora2.js');
const { wainsfw } = require('../lib/wainsfw.js');
const soundgsm = require('../lib/soundgsm.js');
const NodeCache = require('node-cache');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

// ====================
// HEALTH CHECK ROUTES
// ====================

/**
 * GET /health
 * Basic health check - apakah service hidup
 */
router.get('/health', asyncHandler(async (req, res) => {
  const health = healthService.checkLiveness();
  const response = successResponse({
    data: health,
    message: 'Service is healthy',
    statusCode: 200,
    req
  });
  res.json(response);
}));

/**
 * GET /ready
 * Readiness check - apakah service siap menerima traffic
 */
router.get('/ready', asyncHandler(async (req, res) => {
  const readiness = await healthService.checkReadiness();
  const statusCode = readiness.status === 'ready' ? 200 : 503;
  
  const response = successResponse({
    data: readiness,
    message: `Service ${readiness.status}`,
    statusCode,
    req
  });
  res.status(statusCode).json(response);
}));

/**
 * GET /metrics
 * System metrics untuk monitoring
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = healthService.getSystemMetrics();
  
  const response = successResponse({
    data: metrics,
    message: 'System metrics',
    statusCode: 200,
    req
  });
  res.json(response);
}));

// ====================
// AI ROUTES
// ====================

/**
 * GET /ai/gemini
 * Chat dengan Gemini AI
 */
router.get('/ai/gemini', aiValidations.gemini, asyncHandler(async (req, res) => {
  const { text, apikey } = req.query;
  const cacheKey = `gemini:${Buffer.from(text).toString('base64').slice(0, 20)}:${apikey?.slice(0, 5)}`;
  
  // Check cache
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    const response = successResponse({
      data: cachedResult,
      message: 'Response dari cache',
      statusCode: 200,
      req
    });
    return res.json(response);
  }
  
  // Generate response
  const ai = new GoogleGenAI({ apiKey: apikey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: text
  });
  
  const replyText = response?.text ?? response?.output?.[0]?.content ?? JSON.stringify(response);
  const result = { text: replyText };
  
  // Cache result
  cache.set(cacheKey, result);
  
  const success = successResponse({
    data: result,
    message: 'Gemini AI response',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /ai/gemini-with-system
 * Gemini AI dengan system instruction
 */
router.get('/ai/gemini-with-system', aiValidations.geminiWithSystem, asyncHandler(async (req, res) => {
  const { text, system, apikey } = req.query;
  
  const ai = new GoogleGenAI({ apiKey: apikey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: text,
    config: {
      systemInstruction: system
    }
  });
  
  const result = { text: response.text };
  
  const success = successResponse({
    data: result,
    message: 'Gemini AI with system instruction response',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * POST /ai/waifu2x
 * Upscale gambar dengan Waifu2x
 */
router.post('/ai/waifu2x', asyncHandler(async (req, res) => {
  const { image, style, noice, upscaling } = req.body;
  
  if (!image) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter image wajib diisi'
    });
  }

  const result = await waifu2x(image, { style, noice, upscaling });
  
  const response = successResponse({
    data: result,
    message: 'Waifu2x upscaling completed',
    statusCode: 200,
    req
  );
  res.json(response);
}));

/**
 * POST /ai/wainsfw
 * Generate gambar dengan Wain SFW
 */
router.post('/ai/wainsfw', asyncHandler(async (req, res) => {
  const { prompt, model, width, height, guidanceScale, inferenceSteps } = req.body;
  
  if (!prompt) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter prompt wajib diisi'
    });
  }

  const result = await wainsfw(prompt, { model, width, height, guidanceScale, inferenceSteps });
  
  const response = successResponse({
    data: result,
    message: 'Wain SFW image generation completed',
    statusCode: 200,
    req
  });
  res.json(response);
}));

/**
 * POST /ai/sora2
 * Generate video dengan Sora2
 */
router.post('/ai/sora2', asyncHandler(async (req, res) => {
  const { prompt, ratio } = req.body;
  
  if (!prompt) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter prompt wajib diisi'
    });
  }

  const result = await sora2(prompt, { ratio });
  
  const response = successResponse({
    data: result,
    message: 'Sora2 video generation started',
    statusCode: 200,
    req
  });
  res.json(response);
}));

// ====================
// DOWNLOADER ROUTES
// ====================

/**
 * GET /downloader/videy
 * Download video dari Videy
 */
router.get('/downloader/videy', downloaderValidations.videy, asyncHandler(async (req, res) => {
  const { url } = req.query;
  const videoId = url.split('=')[1];
  
  if (!videoId) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Invalid URL parameter'
    });
  }
  
  const fileUrl = `https://cdn.videy.co/${videoId}.mp4`;
  
  const result = {
    fileUrl,
    videoId,
    downloadUrl: fileUrl
  };
  
  const success = successResponse({
    data: result,
    message: 'Videy video URL generated',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /downloader/threads
 * Download media dari Threads
 */
router.get('/downloader/threads', downloaderValidations.threads, asyncHandler(async (req, res) => {
  const { url } = req.query;
  const cacheKey = `threads:${Buffer.from(url).toString('base64').slice(0, 20)}`;
  
  // Check cache
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    const response = successResponse({
      data: cachedResult,
      message: 'Response dari cache',
      statusCode: 200,
      req
    });
    return res.json(response);
  }
  
  const result = await threads(url);
  
  // Cache for 5 minutes
  cache.set(cacheKey, result, 300);
  
  const success = successResponse({
    data: result,
    message: 'Threads media downloaded',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /downloader/aio
 * Multi-platform downloader
 */
router.get('/downloader/aio', asyncHandler(async (req, res) => {
  const { url, platform } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter url wajib diisi'
    });
  }

  const result = await aioDownloader(url, platform || 'auto');
  
  const success = successResponse({
    data: result,
    message: 'AIO download completed',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /downloader/xvideos/search
 * Search video di Xvideos
 */
router.get('/downloader/xvideos/search', asyncHandler(async (req, res) => {
  const { q, page } = req.query;
  
  if (!q) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter q (query) wajib diisi'
    });
  }

  const result = await xvideosSearch(q, parseInt(page) || 1);
  
  const success = successResponse({
    data: result,
    message: 'Xvideos search completed',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /downloader/xvideos/info
 * Get video info dari Xvideos
 */
router.get('/downloader/xvideos/info', asyncHandler(async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter url wajib diisi'
    });
  }

  const result = await xvideosDownload(url);
  
  const success = successResponse({
    data: result,
    message: 'Xvideos video info retrieved',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /downloader/xvideos/trending
 * Get trending videos dari Xvideos
 */
router.get('/downloader/xvideos/trending', asyncHandler(async (req, res) => {
  const result = await xvideosTrending();
  
  const success = successResponse({
    data: result,
    message: 'Xvideos trending retrieved',
    statusCode: 200,
    req
  });
  res.json(success);
}));

// ====================
// TOOLS ROUTES
// ====================

/**
 * GET /tools/ssweb-pc
 * Screenshot website (PC/Desktop view)
 */
router.get('/tools/ssweb-pc', toolsValidations.ssweb, asyncHandler(async (req, res) => {
  const { url } = req.query;
  
  const result = await sswebPc(url);
  const buffernya = await fetch(result.url).then((response) => response.buffer());
  
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': buffernya.length,
    'Cache-Control': 'public, max-age=3600'
  });
  res.end(buffernya);
}));

/**
 * GET /tools/ssweb-hp
 * Screenshot website (Mobile/Phone view)
 */
router.get('/tools/ssweb-hp', toolsValidations.ssweb, asyncHandler(async (req, res) => {
  const { url } = req.query;
  
  const result = await sswebHp(url);
  const buffernya = await fetch(result.url).then((response) => response.buffer());
  
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': buffernya.length,
    'Cache-Control': 'public, max-age=3600'
  });
  res.end(buffernya);
}));

/**
 * GET /tools/ssweb
 * Screenshot website dengan custom options
 */
router.get('/tools/ssweb', asyncHandler(async (req, res) => {
  const { url, width, height, fullPage } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter url wajib diisi'
    });
  }

  const result = await ssweb(url, {
    width: parseInt(width) || 1280,
    height: parseInt(height) || 720,
    full_page: fullPage === 'true'
  });
  
  const success = successResponse({
    data: result,
    message: 'Screenshot generated',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /tools/nhentai/search
 * Search manga di nHentai
 */
router.get('/tools/nhentai/search', asyncHandler(async (req, res) => {
  const { q, page } = req.query;
  
  if (!q) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter q (query) wajib diisi'
    });
  }

  const result = await nhentai.search(q, parseInt(page) || 1);
  
  const success = successResponse({
    data: result,
    message: 'nHentai search completed',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /tools/nhentai/detail
 * Get manga detail dari nHentai
 */
router.get('/tools/nhentai/detail', asyncHandler(async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter url wajib diisi'
    });
  }

  const result = await nhentai.detail(url);
  
  const success = successResponse({
    data: result,
    message: 'nHentai detail retrieved',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /tools/nhentai/home
 * Get home page nHentai
 */
router.get('/tools/nhentai/home', asyncHandler(async (req, res) => {
  const { page } = req.query;
  
  const result = await nhentai.getHome(parseInt(page) || 1);
  
  const success = successResponse({
    data: result,
    message: 'nHentai home page retrieved',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /tools/nhentai/images
 * Get image URLs dari manga
 */
router.get('/tools/nhentai/images', asyncHandler(async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter url wajib diisi'
    });
  }

  const result = await nhentai.getImages(url);
  
  const success = successResponse({
    data: result,
    message: 'nHentai images retrieved',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /tools/rule34/posts
 * Get posts dari Rule34
 */
router.get('/tools/rule34/posts', asyncHandler(async (req, res) => {
  const { page, tags } = req.query;
  
  const result = await rule34.getPosts({ page: parseInt(page) || 1, tags });
  
  const success = successResponse({
    data: result,
    message: 'Rule34 posts retrieved',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /tools/rule34/search
 * Search posts di Rule34
 */
router.get('/tools/rule34/search', asyncHandler(async (req, res) => {
  const { tags, page } = req.query;
  
  if (!tags) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter tags wajib diisi'
    });
  }

  const result = await rule34.search(tags, parseInt(page) || 1);
  
  const success = successResponse({
    data: result,
    message: 'Rule34 search completed',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /tools/rule34/popular
 * Get popular posts dari Rule34
 */
router.get('/tools/rule34/popular', asyncHandler(async (req, res) => {
  const { period } = req.query;
  
  const result = await rule34.getPopular(period || 'day');
  
  const success = successResponse({
    data: result,
    message: 'Rule34 popular posts retrieved',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /tools/soundgasm/home
 * Get SoundGASM home
 */
router.get('/tools/soundgasm/home', asyncHandler(async (req, res) => {
  const result = await soundgsm.getHome();
  
  const success = successResponse({
    data: result,
    message: 'SoundGASM home page retrieved',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /tools/soundgasm/search
 * Search audio di SoundGASM
 */
router.get('/tools/soundgasm/search', asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter q (query) wajib diisi'
    });
  }

  const result = await soundgsm.search(q);
  
  const success = successResponse({
    data: result,
    message: 'SoundGASM search completed',
    statusCode: 200,
    req
  });
  res.json(success);
}));

/**
 * GET /tools/soundgasm/audio
 * Get audio details dari SoundGASM
 */
router.get('/tools/soundgasm/audio', asyncHandler(async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Parameter url wajib diisi'
    });
  }

  const result = await soundgsm.getAudioDetails(url);
  
  const success = successResponse({
    data: result,
    message: 'SoundGASM audio details retrieved',
    statusCode: 200,
    req
  });
  res.json(success);
}));

// ====================
// API INFO ROUTE
// ====================

/**
 * GET /info
 * Informasi tentang API ini
 */
router.get('/info', (req, res) => {
  const info = {
    name: config.server.name,
    version: config.server.version,
    description: 'Enhanced Base API v2.0 dengan fitur keamanan, performa, dan developer experience yang lebih baik',
    endpoints: {
      health: {
        '/health': 'Basic health check',
        '/ready': 'Readiness probe',
        '/metrics': 'System metrics'
      },
      ai: {
        '/ai/gemini': 'Chat with Gemini AI',
        '/ai/gemini-with-system': 'Gemini with system instruction',
        '/ai/waifu2x': 'Image upscaling (POST)',
        '/ai/wainsfw': 'Image generation (POST)',
        '/ai/sora2': 'Video generation (POST)'
      },
      downloader: {
        '/downloader/videy': 'Download dari Videy',
        '/downloader/threads': 'Download dari Threads',
        '/downloader/aio': 'Multi-platform downloader',
        '/downloader/xvideos/search': 'Search Xvideos',
        '/downloader/xvideos/info': 'Get Xvideos video info',
        '/downloader/xvideos/trending': 'Trending Xvideos'
      },
      tools: {
        '/tools/ssweb': 'Website screenshot',
        '/tools/ssweb-pc': 'Screenshot (PC)',
        '/tools/ssweb-hp': 'Screenshot (Mobile)',
        '/tools/nhentai/search': 'Search nHentai',
        '/tools/nhentai/detail': 'Get nHentai detail',
        '/tools/nhentai/home': 'nHentai home',
        '/tools/nhentai/images': 'Get nHentai images',
        '/tools/rule34/posts': 'Get Rule34 posts',
        '/tools/rule34/search': 'Search Rule34',
        '/tools/rule34/popular': 'Popular Rule34',
        '/tools/soundgasm/home': 'SoundGASM home',
        '/tools/soundgasm/search': 'Search SoundGASM',
        '/tools/soundgasm/audio': 'Get audio details'
      }
    },
    features: [
      'Rate Limiting',
      'Input Validation',
      'Structured Logging',
      'Request ID Tracking',
      'Caching',
      'Security Headers',
      'Standardized API Responses',
      'Health Checks'
    ],
    documentation: '/'
  };
  
  const response = successResponse({
    data: info,
    message: 'API Information',
    statusCode: 200,
    req
  });
  res.json(response);
});

module.exports = router;
