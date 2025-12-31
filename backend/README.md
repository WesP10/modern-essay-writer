# EssayForge Backend

Backend API server for EssayForge - AI-powered essay writing assistant.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ installed
- Ollama installed and running locally
- Redis installed (or use Docker)
- Firebase project set up

### Installation

```powershell
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your actual credentials
# nano .env  # or use your preferred editor
```

### Configuration

Edit `.env` file with your credentials:

```env
# Server
PORT=3001
NODE_ENV=development

# Firebase (place your service account JSON file in backend/config/)
# See Firebase setup docs for details

# Ollama (default local setup)
OLLAMA_BASE_URL=http://localhost:11434

# Redis (local or cloud)
REDIS_URL=redis://localhost:6379

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Running Ollama (Optional for MVP)

**Note:** Ollama is only needed for the **Generator service** and LLM fallbacks. The other services work without it:
- ✅ **Autocomplete** - Uses Trie + dictionary (no LLM)
- ✅ **Detector** - Statistical analysis (LLM optional for edge cases)
- ✅ **Humanizer** - Rule-based (LLM optional for heavy rewrites)
- ⚠️ **Generator** - Requires LLM

```powershell
# Start Ollama service
ollama serve

# Pull required models (only if needed)
ollama pull qwen2.5:3b      # For short text generation
ollama pull llama3.1:8b      # For long-form generation & fallbacks
```

### Running Redis (Docker)

```powershell
# Pull and run Redis container
docker run -d -p 6379:6379 --name redis redis:alpine

# Verify Redis is running
docker ps
```

### Start Development Server

```powershell
# Start the backend server
npm run dev
```

The server will start on http://localhost:3001

### Verify Setup

Open http://localhost:3001/health in your browser. You should see:

```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T...",
  "uptime": 1.234,
  "environment": "development"
}
```

## 📁 Project Structure

```
backend/
├── server.js                    # Express app entry point
├── .env.example                 # Environment variables template
├── package.json
│
├── config/
│   ├── firebase.js              # Firebase connection
│   ├── ollama.js                # Ollama client config
│   └── redis.js                 # Redis cache config
│
├── routes/
│   ├── auth.js                  # Authentication routes
│   ├── essays.js                # Essay CRUD operations
│   └── ai/
│       ├── autocomplete.js      # Autocomplete endpoint
│       ├── detect.js            # AI detection endpoint
│       ├── humanize.js          # Text humanizer endpoint
│       └── generate.js          # Text generation endpoint
│
├── services/                    # TODO: Implement AI services
│   ├── autocompleteService.js
│   ├── detectorService.js
│   ├── humanizerService.js
│   └── generatorService.js
│
├── middleware/
│   ├── auth.js                  # JWT verification
│   ├── rateLimiter.js           # Rate limiting
│   ├── errorHandler.js          # Error handling
│   └── validateRequest.js       # Request validation
│
└── utils/
    ├── logger.js                # Winston logger
    └── prompts/                 # TODO: Prompt templates
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify JWT token
- `GET /api/auth/me` - Get current user

### Essays
- `GET /api/essays` - Get all user essays
- `GET /api/essays/:id` - Get specific essay
- `POST /api/essays` - Create new essay
- `PUT /api/essays/:id` - Update essay
- `DELETE /api/essays/:id` - Delete essay

### AI Services
- `POST /api/ai/autocomplete` - Get text suggestions (120 req/min) - **No LLM, < 10ms**
- `POST /api/ai/detect` - Detect AI content (10 req/min) - **Statistical first, < 100ms**
- `POST /api/ai/humanize` - Humanize text (20 req/min) - **Rule-based first, < 100ms**
- `POST /api/ai/generate` - Generate content (15 req/min) - **Requires LLM, 4-8s**

All AI endpoints require authentication via `Authorization: Bearer <token>` header.

**Service Architecture:**
- **Autocomplete:** Trie data structure + dictionary (instant, no API cost)
- **Detector:** Statistical metrics → LLM fallback only if score unclear (0.4-0.7)
- **Humanizer:** Rule-based transformations → LLM fallback for heavy AI scores (> 0.7)
- **Generator:** LLM-based with smart model selection and caching

## 🧪 Testing

```powershell
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## 📊 Rate Limits

| Service | Limit | Window |
|---------|-------|--------|
| Autocomplete | 120 requests | 1 minute |
| Detection | 10 requests | 1 minute |
| Humanizer | 20 requests | 1 minute |
| Generator | 15 requests | 1 minute |
| General API | 100 requests | 1 minute |

## 🐛 Debugging

### Enable Debug Logging

```env
LOG_LEVEL=debug
```

### Skip Rate Limiting (Development Only)

```env
SKIP_RATE_LIMIT=true
```

### Check Ollama Status

```powershell
# Test if Ollama is running
curl http://localhost:11434/api/tags

# List available models
ollama list
```

### Check Redis Status

```powershell
# Using Redis CLI
redis-cli ping
# Should return: PONG

# Or using Docker
docker exec -it redis redis-cli ping
```

## 🚀 Deployment

### Railway

1. Create new project on Railway
2. Firebase already provides cloud database
3. Add Redis addon
4. Set environment variables
5. Deploy from GitHub

### Render

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables

## 📝 Next Steps (TODO)

### Sprint 1 (Current)
- [x] Set up Express server
- [x] Configure middleware
- [x] Create route structure
- [x] Add authentication
- [x] Add rate limiting
- [ ] Test all endpoints

### Sprint 2 (Next) - Optimized Approach
**Week 1: Rule-Based Services (No LLM)**
- [ ] Implement AutocompleteService (Trie + dictionary)
- [ ] Implement statistical analysis for DetectorService
- [ ] Implement rule-based HumanizerService
- [ ] Create academic vocabulary dictionaries

**Week 2: LLM Integration**
- [ ] Implement GeneratorService (requires LLM)
- [ ] Add LLM fallback to DetectorService
- [ ] Add LLM fallback to HumanizerService
- [ ] Write unit tests (80%+ coverage)
- [ ] Add Redis caching layer

### Sprint 3
- [ ] Optimize prompts
- [ ] Add streaming support
- [ ] Performance monitoring
- [ ] Integration tests
- [ ] Deploy to staging

## 🔗 Related Documentation

- [Backend Implementation Plan](../BACKEND_IMPLEMENTATION_PLAN.md)
- [Firebase Setup Guide](../docs/FIREBASE_SETUP.md)
- [Ollama Documentation](https://ollama.ai/docs)

## 📄 License

MIT
