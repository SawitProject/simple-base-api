/**
 * Enhanced Base API - Main Entry Point
 * Versi 2.0 dengan fitur keamanan, performa, dan DX yang lebih baik
 */

// ====================
// IMPORTS
// ====================
const express = require('express');
const path = require('path');
const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Import konfigurasi
const config = require('./config');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generateRequestId } = require('./middleware/requestId');
const { corsMiddleware, secureResponseHeaders } = require('./middleware/security');
const { createRateLimiter } = require('./middleware/rateLimiter');

// Import utilities
const logger = require('./utils/logger');
const { successResponse, errorResponse } = require('./utils/response');

// Import routes
const apiRoutes = require('./routes/api');

// ====================
// APP INITIALIZATION
// ====================
const app = express();

// ====================
// TRUST PROXY (untuk mendapatkan IP yang benar di belakang proxy)
 // ====================
app.set('trust proxy', 1);

// ====================
// SECURITY MIDDLEWARE
// ====================
if (config.features.helmet) {
  app.use(helmet({
    contentSecurityPolicy: config.server.nodeEnv === 'production' ? false : false,
    crossOriginEmbedderPolicy: false
  }));
}

if (config.features.cors) {
  app.use(corsMiddleware);
}

app.use(secureResponseHeaders);

// ====================
// REQUEST ID & LOGGING
// ====================
app.use(generateRequestId);

if (config.features.logging) {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.infoRequest(message.trim())
    }
  }));
}

// ====================
// COMPRESSION
// ====================
if (config.features.compression) {
  app.use(compression());
}

// ====================
// BODY PARSING
// ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ====================
// STATIC FILES
// ====================
app.use(express.static(path.join(__dirname, '../')));

// ====================
// RATE LIMITING
// ====================
if (config.features.rateLimiting) {
  const limiter = createRateLimiter();
  app.use(config.server.apiPrefix, limiter);
}

// ====================
// API ROUTES
// ====================
app.use(config.server.apiPrefix, apiRoutes);

// ====================
// FRONTEND ROUTES
// ====================
app.get('/script.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../script.js'));
});

app.get('/listapi.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../listapi.json'));
});

app.get('/linkbio.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../linkbio.json'));
});

// ====================
// MAIN FRONTEND WITH ENHANCED UX
// ====================
app.get('/', (req, res) => {
  const title = 'EH PI AY DOANG - Enhanced API';
  const favicon = 'https://github.com/SawitProject/assets/blob/248ac551d4d639590b74f237c4c01f9916d95810/image.jpg?format=png&name=900x900';
  const logo = 'https://github.com/SawitProject/assets/blob/248ac551d4d639590b74f237c4c01f9916d95810/image.jpg';
  const headertitle = 'REST EH PI AY - v2.0';
  const headerdescription = 'Enhanced API dengan fitur keamanan, performa, dan developer experience yang lebih baik';
  const footer = '© 2026 SawitProject - Enhanced Base API v2.0';
  const apiVersion = config.server.version;

  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${title}</title>
    <meta name="description" content="Enhanced Base API dengan fitur keamanan dan performa yang lebih baik">
    <meta name="theme-color" content="#000000">
    <link id="faviconLink" rel="icon" type="image/x-icon" href="${favicon}">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
    * {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
    }

    :root {
        --bg-primary: #0a0a0f;
        --bg-secondary: #111118;
        --bg-tertiary: #1a1a25;
        --card-bg: #151520;
        --text-primary: #ffffff;
        --text-secondary: #a0a0b0;
        --text-tertiary: #6b6b7b;
        --border-color: #2a2a3a;
        --accent-blue: #3b82f6;
        --accent-purple: #8b5cf6;
        --accent-cyan: #06b6d4;
        --success-green: #22c55e;
        --warning-yellow: #eab308;
        --error-red: #ef4444;
    }

    .light-mode {
        --bg-primary: #f8fafc;
        --bg-secondary: #ffffff;
        --bg-tertiary: #f1f5f9;
        --card-bg: #ffffff;
        --text-primary: #0f172a;
        --text-secondary: #475569;
        --text-tertiary: #94a3b8;
        --border-color: #e2e8f0;
        --accent-blue: #2563eb;
        --accent-purple: #7c3aed;
        --accent-cyan: #0891b2;
    }

    body {
        font-family: 'Space Grotesk', sans-serif;
        background: var(--bg-primary);
        color: var(--text-primary);
        min-height: 100vh;
    }

    * {
        scrollbar-width: thin;
        scrollbar-color: var(--border-color) var(--bg-secondary);
    }
    *::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    *::-webkit-scrollbar-track {
        background: var(--bg-secondary);
    }
    *::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 4px;
    }
    *::-webkit-scrollbar-thumb:hover {
        background: var(--text-tertiary);
    }

    .gradient-text {
        background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple), var(--accent-cyan));
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-size: 200% 200%;
        animation: gradientShift 3s ease infinite;
    }

    @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
    }

    .card-hover {
        transition: all 0.3s ease-in-out;
    }

    .card-hover:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px -12px rgba(59, 130, 246, 0.25);
    }

    .glow {
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    }

    .theme-toggle-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1000;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
    }

    .theme-toggle-btn:hover {
        transform: scale(1.1) rotate(12deg);
        box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
        border-color: var(--accent-blue);
    }

    .toast {
        position: fixed;
        top: 24px;
        right: 24px;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        padding: 16px 24px;
        border-radius: 12px;
        color: var(--text-primary);
        z-index: 10000;
        transform: translateX(120%);
        transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .toast.show {
        transform: translateX(0);
    }

    .toast.success {
        border-left: 4px solid var(--success-green);
    }

    .toast.error {
        border-left: 4px solid var(--error-red);
    }

    .status-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .status-ready {
        background: rgba(34, 197, 94, 0.15);
        color: var(--success-green);
        border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .status-update {
        background: rgba(234, 179, 8, 0.15);
        color: var(--warning-yellow);
        border: 1px solid rgba(234, 179, 8, 0.3);
    }

    .status-error {
        background: rgba(239, 68, 68, 0.15);
        color: var(--error-red);
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .search-input {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        transition: all 0.3s ease;
    }

    .search-input:focus {
        border-color: var(--accent-blue);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        outline: none;
    }

    .method-badge {
        background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
        color: white;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
    }

    .endpoint-card {
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s ease;
    }

    .endpoint-card:hover {
        border-color: var(--accent-blue);
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color);
        border-top-color: var(--accent-blue);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .code-font {
        font-family: 'JetBrains Mono', monospace;
    }

    .stats-card {
        background: linear-gradient(135deg, var(--card-bg), var(--bg-tertiary));
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 16px 24px;
    }

    .feature-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
    }

    .feature-card {
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 20px;
        transition: all 0.3s ease;
    }

    .feature-card:hover {
        transform: translateY(-4px);
        border-color: var(--accent-purple);
    }

    @media (max-width: 640px) {
        .theme-toggle-btn {
            width: 48px;
            height: 48px;
            bottom: 16px;
            right: 16px;
        }
    }
    </style>
</head>
<body class="min-h-screen antialiased">
    <!-- Toast Container -->
    <div id="toast" class="toast">
        <div class="flex items-center gap-3">
            <svg id="toastIcon" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span id="toastMessage" class="font-medium">Action completed</span>
        </div>
    </div>

    <!-- Theme Toggle Button -->
    <button id="themeToggle" class="theme-toggle-btn" aria-label="Toggle theme">
        <svg id="theme-toggle-dark-icon" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
        </svg>
        <svg id="theme-toggle-light-icon" class="w-6 h-6 hidden" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
        </svg>
    </button>

    <div class="max-w-6xl mx-auto px-4 py-8">
        <!-- Header Section -->
        <header class="mb-12 text-center">
            <div class="mb-6 flex justify-center">
                <img id="logoImg" src="${logo}" alt="Logo" class="w-32 h-32 rounded-2xl shadow-2xl glow hover:scale-105 transition-transform duration-300">
            </div>
            
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-accent-blue/10 border border-accent-blue/30 rounded-full mb-4">
                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span class="text-sm font-medium text-accent-blue">API v${apiVersion}</span>
            </div>
            
            <h1 class="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-wider">
                <span class="gradient-text">${headertitle}</span>
            </h1>
            <p class="text-lg font-light tracking-wide text-text-secondary max-w-2xl mx-auto">${headerdescription}</p>
            
            <!-- Stats Cards -->
            <div class="mt-8 flex flex-wrap justify-center items-center gap-4">
                <div class="stats-card">
                    <div class="flex items-center gap-3">
                        <div class="feature-icon bg-blue-500/20 text-blue-500">⚡</div>
                        <div class="text-left">
                            <p class="text-xs text-text-tertiary uppercase tracking-wider">Total Endpoints</p>
                            <p id="totalEndpoints" class="text-2xl font-bold gradient-text">0</p>
                        </div>
                    </div>
                </div>
                
                <div class="stats-card">
                    <div class="flex items-center gap-3">
                        <div class="feature-icon bg-purple-500/20 text-purple-500">📁</div>
                        <div class="text-left">
                            <p class="text-xs text-text-tertiary uppercase tracking-wider">Categories</p>
                            <p id="totalCategories" class="text-2xl font-bold gradient-text">0</p>
                        </div>
                    </div>
                </div>
                
                <div class="stats-card">
                    <div class="flex items-center gap-3">
                        <div class="feature-icon bg-cyan-500/20 text-cyan-500">🛡️</div>
                        <div class="text-left">
                            <p class="text-xs text-text-tertiary uppercase tracking-wider">Rate Limit</p>
                            <p class="text-lg font-bold text-accent-cyan">100/15m</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Features Grid -->
            <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                <div class="feature-card text-center">
                    <div class="feature-icon bg-blue-500/20 text-blue-500 mx-auto mb-2">🔒</div>
                    <p class="text-xs text-text-secondary">Security Headers</p>
                </div>
                <div class="feature-card text-center">
                    <div class="feature-icon bg-green-500/20 text-green-500 mx-auto mb-2">✓</div>
                    <p class="text-xs text-text-secondary">Input Validation</p>
                </div>
                <div class="feature-card text-center">
                    <div class="feature-icon bg-purple-500/20 text-purple-500 mx-auto mb-2">📝</div>
                    <p class="text-xs text-text-secondary">Structured Logging</p>
                </div>
                <div class="feature-card text-center">
                    <div class="feature-icon bg-cyan-500/20 text-cyan-500 mx-auto mb-2">⚡</div>
                    <p class="text-xs text-text-secondary">Caching</p>
                </div>
            </div>
        </header>

        <!-- Search Section -->
        <div class="mb-8">
            <div class="relative max-w-xl mx-auto">
                <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="Search endpoints by name, path, or category..."
                    class="search-input w-full px-5 py-4 text-sm rounded-xl focus:outline-none focus:border-blue-500 transition-all code-font"
                >
                <svg class="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <div class="absolute right-14 top-1/2 -translate-y-1/2 text-xs text-text-tertiary bg-bg-tertiary px-2 py-1 rounded">
                    Ctrl+K
                </div>
            </div>
        </div>

        <!-- No Results Message -->
        <div id="noResults" class="text-center py-12 hidden">
            <div class="text-5xl mb-4">🔍</div>
            <h3 class="text-lg font-bold mb-2">No endpoints found</h3>
            <p class="text-sm text-text-tertiary">Try a different search term</p>
        </div>

        <!-- API List -->
        <div id="apiList" class="space-y-6"></div>

        <!-- Social Links Section -->
        <section class="mt-12 pt-8 border-t border-border-color">
            <h3 class="text-center text-sm font-semibold text-text-secondary uppercase tracking-wider mb-6">Connect With Us</h3>
            <div id="socialContainer" class="flex flex-wrap justify-center gap-3">
                <div id="socialLoading" class="text-center py-8 w-full">
                    <div class="spinner mx-auto mb-4"></div>
                    <p class="text-sm text-text-tertiary">Loading link bio...</p>
                </div>
                <div id="socialError" class="text-center py-8 w-full hidden">
                    <div class="text-4xl mb-4">⚠️</div>
                    <h3 class="text-sm font-bold mb-1">Link bio not available</h3>
                    <p class="text-xs text-text-tertiary">Please create linkbio.json file first</p>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="mt-12 pt-8 border-t border-border-color text-center">
            <p class="text-sm text-text-tertiary">${footer}</p>
            <p class="text-xs text-text-tertiary mt-2">Built with ❤️ using Express.js + Tailwind CSS</p>
        </footer>
    </div>
    
    <script src="script.js"></script>
</body>
</html>
    `);
});

// ====================
// ERROR HANDLING
// ====================

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// ====================
// SERVER STARTUP
// ====================
const PORT = config.server.port;

const server = app.listen(PORT, () => {
  logger.infoRequest(`🚀 Enhanced Base API v${config.server.version} started`, {
    port: PORT,
    environment: config.server.nodeEnv,
    apiPrefix: config.server.apiPrefix
  });
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 Enhanced Base API v${config.server.version} Started Successfully!         ║
║                                                              ║
║   📡 Server:    http://localhost:${PORT}                      ║
║   📖 Docs:      http://localhost:${PORT}/                     ║
║   🔧 Health:    http://localhost:${PORT}${config.server.apiPrefix}/health       ║
║   📊 Metrics:   http://localhost:${PORT}${config.server.apiPrefix}/metrics      ║
║                                                              ║
║   🔒 Features:                                           ║
║   • Rate Limiting: 100 requests/15min                     ║
║   • Security Headers (Helmet)                             ║
║   • CORS Enabled                                         ║
║   • Request ID Tracking                                   ║
║   • Structured Logging                                    ║
║   • Input Validation                                      ║
║   • Response Standardization                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.infoRequest('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.infoRequest('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.infoRequest('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.infoRequest('Server closed');
    process.exit(0);
  });
});

// Export for testing
module.exports = app;
