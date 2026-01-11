# 🚀 Enhanced Base API v2.0

Enhanced Base API dengan fitur keamanan, performa, dan developer experience yang lebih baik.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## ✨ Fitur Baru v2.0

### 🔒 Keamanan
- **Rate Limiting**: 100 requests per 15 menit dengan endpoint auth yang lebih ketat (5 requests per jam)
- **Security Headers**: Helmet integration dengan CSP, HSTS, dan security headers lainnya
- **CORS**: Konfigurasi CORS yang aman dengan origin validation
- **Request ID Tracking**: Setiap request memiliki unique identifier untuk tracing

### ⚡ Performa
- **Response Compression**: Gzip compression untuk response yang lebih kecil
- **Caching**: Node-cache untuk caching endpoint tertentu
- **Structured Logging**: Winston logger dengan JSON format di production

### 🎨 Developer Experience
- **Standardized API Response**: Format response yang konsisten
- **Input Validation**: Express-validator untuk validasi input
- **Health Checks**: `/health`, `/ready`, dan `/metrics` endpoints
- **Enhanced Frontend**: UI yang lebih baik dengan search, keyboard shortcuts, dan animations

### 📝 Dokumentasi
- **Auto-generated API Info**: Endpoint `/api/v1/info` dengan semua endpoint yang tersedia
- **Interactive Documentation**: Frontend dengan form untuk testing endpoint langsung

## 🚀 Cara Menjalankan

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Buat file `.env` berdasarkan `.env.example`:
```bash
cp .env.example .env
```

### 3. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📡 API Endpoints

### Health & Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Basic health check |
| GET | `/api/v1/ready` | Readiness probe |
| GET | `/api/v1/metrics` | System metrics |

### AI Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ai/gemini?text=&apikey=` | Chat with Gemini AI |
| GET | `/api/v1/ai/gemini-with-system?text=&system=&apikey=` | Gemini dengan system instruction |

### Downloader Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/downloader/videy?url=` | Download dari Videy |
| GET | `/api/v1/downloader/threads?url=` | Download dari Threads |

### Tools Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tools/ssweb-pc?url=` | Screenshot desktop |
| GET | `/api/v1/tools/ssweb-hp?url=` | Screenshot mobile |

### Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/info` | API information |

## 📁 Struktur Proyek

```
sawit-base-api/
├── src/
│   ├── config/           # Konfigurasi aplikasi
│   ├── middleware/       # Express middleware
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   ├── requestId.js
│   │   ├── security.js
│   │   └── validation.js
│   ├── routes/           # API routes
│   │   └── api.js
│   ├── services/         # Business logic
│   │   └── healthService.js
│   ├── utils/            # Utilities
│   │   ├── logger.js
│   │   └── response.js
│   └── index.js          # Entry point
├── lib/                  # Library files (scrapers, etc.)
├── logs/                 # Log files
├── listapi.json          # API documentation
├── linkbio.json          # Link bio configuration
├── script.js             # Frontend script
└── package.json
```

## ⚙️ Konfigurasi Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Port server |
| `NODE_ENV` | development | Environment (development/production) |
| `API_PREFIX` | /api/v1 | API prefix untuk versioning |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 menit) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `CORS_ORIGIN` | * | CORS origin |
| `LOG_LEVEL` | info | Winston log level |
| `CACHE_TTL` | 300 | Cache TTL dalam detik |
| `GEMINI_API_KEY` | - | Gemini API key |

## 🔧 Menambahkan Endpoint Baru

### 1. Tambah Route di `src/routes/api.js`

```javascript
/**
 * GET /category/endpoint
 * Deskripsi endpoint
 */
router.get('/category/endpoint', [
  // Validasi jika diperlukan
  query('param')
    .notEmpty().withMessage('Parameter wajib diisi')
    .isString(),
  handleValidationErrors
], asyncHandler(async (req, res) => {
  const { param } = req.query;
  
  // Business logic
  const result = await someFunction(param);
  
  // Response
  const response = successResponse({
    data: result,
    message: 'Success message',
    statusCode: 200,
    req
  });
  res.json(response);
}));
```

### 2. Update `listapi.json`

```json
{
  "name": "CATEGORY NAME",
  "items": [
    {
      "name": "ENDPOINT NAME",
      "path": "/api/v1/category/endpoint?param=",
      "desc": "Deskripsi endpoint",
      "status": "ready",
      "params": {
        "param": "Deskripsi parameter"
      }
    }
  ]
}
```

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:3000/api/v1/health

# Test API info
curl http://localhost:3000/api/v1/info

# Test dengan validasi
curl "http://localhost:3000/api/v1/ai/gemini?text=hello&apikey=YOUR_KEY"
```

## 🔒 Security Features

- ✅ Rate limiting otomatis
- ✅ Helmet security headers
- ✅ CORS dengan origin validation
- ✅ Input validation
- ✅ Request ID tracking
- ✅ Structured logging
- ✅ Error handling terpusat

## 📊 Monitoring

Akses frontend di `http://localhost:3000/` untuk:
- Melihat semua endpoint
- Testing langsung dari browser
- Melihat response format

## 🤝 Kontribusi

1. Fork repository ini
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 Lisensi

Project ini dilisensikan di bawah MIT License.

---

Dibuat dengan ❤️ oleh SawitProject
