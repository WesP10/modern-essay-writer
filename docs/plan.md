# 📋 EssayForge Development Plan

## 🎯 Project Philosophy
Build a **modular, production-ready word processor** with clean separation between UI and AI features. Start with a fully functional base app, then layer AI capabilities without refactoring core architecture.

---

## 🏗️ Development Phases

### **Phase 1: Base Word Processor** ✅ (Weeks 1-2)
**Goal:** Ship a working web-based word processor with no AI dependencies.

#### 1.1 Frontend Foundation ✅
- [x] **SvelteKit Setup**
  - Initialize SvelteKit project with TypeScript
  - Configure TailwindCSS for styling
  - Set up routing structure (`/`, `/editor/:id`, `/templates`)
  
- [x] **Core Editor Component**
  - Rich text editor (TipTap or ProseMirror)
  - Toolbar: bold, italic, headings, lists, alignment
  - Character/word count display
  - Markdown import/export
  
- [x] **Layout & Navigation**
  - Top navbar (logo, save status, export button)
  - Main editor pane (center, full width initially)
  - Placeholder side panel containers (hidden by default)
  - Responsive mobile view

#### 1.2 Data Persistence ✅
- [x] **Local Storage First**
  - Autosave to browser localStorage every 2 seconds
  - Essay metadata (title, created/modified dates)
  - Version history array (store last 10 versions)
  
- [x] **Supabase Integration**
  - User authentication (email + OAuth)
  - Cloud sync for essays
  - Real-time save indicators
  - Database schema with RLS policies

#### 1.3 Template System ✅
- [x] **Essay Templates**
  - Create 3-5 base templates (argumentative, research, creative)
  - Template selector on home page
  - Pre-populated structure (sections, headings)

#### 1.4 Export Features ✅
- [x] **Document Export**
  - Export to `.txt`, `.md`, `.html`
  - Copy to clipboard button
  - Export modal with format selection
  - Metadata inclusion option

---

### **Phase 2: UI Placeholders & Architecture** ✅ (Week 3)

#### 2.1 Panel System Architecture ✅
- [x] **Resizable Panel Layout**
  - Main editor: 60% width default (flexible)
  - Right sidebar: 40% width (collapsible, resizable 300-800px)
  - Panel tabs: Prompt | Humanizer | Detector | Citations
  
- [x] **Placeholder Panels**
  - **Prompt Panel**: 
    - Input textbox for queries
    - "Generate Outline" button (disabled)
    - Placeholder skeleton loader
  - **Humanizer Panel**:
    - Text selection indicator
    - "Rewrite" button (disabled)
    - Before/after comparison view
  - **Detector Panel**:
    - "Scan Essay" button (disabled)
    - Score gauge placeholder (0-100%)
    - Flagged sections list
  - **Citation Panel**:
    - Search input
    - Citation format dropdown (APA, MLA, Chicago)
    - Results list placeholder

#### 2.2 Settings & Preferences ✅
- [x] Theme toggle (light/dark/auto mode)
- [x] Font size/family selector
- [x] Panel visibility toggles
- [x] Auto-save interval setting
- [x] Line height control
- [x] Spell check toggle

---

### **Phase 3: Backend Foundation** ⚙️ (Week 4)

#### 3.1 API Server Setup
```
backend/
├── server.js              # Express entry point
├── routes/
│   ├── essays.js          # CRUD for essays
│   ├── auth.js            # User authentication
│   └── ai/
│       ├── prompt.js      # Outline generation endpoint
│       ├── rewrite.js     # Humanizer endpoint
│       ├── detect.js      # AI detection endpoint
│       └── citations.js   # Citation lookup endpoint
├── middleware/
│   ├── auth.js            # JWT verification
│   └── rateLimiter.js     # API throttling
├── services/
│   ├── supabase.js        # DB connection
│   └── llama.js           # Llama client wrapper
└── utils/
    └── logger.js
```

- [ ] **Express Server**
  - CORS configuration
  - Error handling middleware
  - Request logging
  - Environment variables (`.env`)

- [ ] **API Endpoints (Stubbed)**
  ```
  POST /api/ai/prompt       → { outline: "Coming soon..." }
  POST /api/ai/rewrite      → { rewritten: "Original text" }
  POST /api/ai/detect       → { score: 0, flagged: [] }
  POST /api/ai/citations    → { results: [] }
  ```

#### 3.2 Database Schema
**Supabase Tables:**
- `users` (id, email, created_at)
- `essays` (id, user_id, title, content, metadata, created_at, updated_at)
- `versions` (id, essay_id, content, timestamp)

**MongoDB (for AI Memory - Phase 4):**
- `agent_sessions` (conversation history per essay)

---

### **Phase 4: Local AI Integration** 🤖 (Weeks 5-7)

#### 4.1 Ollama Setup
- [ ] **Local Ollama Installation**
  - Install Ollama on development machine
  - Download models:
    - `gemini:7b` or `gpt-3.5-turbo` OSS variant (general prompts, outlines)
    - `gemini:27b` or larger GPT OSS model (humanizer, complex rewrites)
  - Test inference speed and memory usage

- [ ] **Backend AI Service**
  ```javascript
  // backend/services/ollama.js
  class OllamaService {
    async generateOutline(topic, essayType) { }
    async rewriteText(text, tone) { }
    async detectAI(text) { }
    async findCitations(query) { }
  }
  ```

#### 4.2 Agent Modules
```
agents/
├── promptAgent.js         # Outline/thesis generation
├── humanizerAgent.js      # Rewriting logic
├── detectorAgent.js       # AI detection heuristics
└── citationAgent.js       # Search scholarly sources
```

Each agent:
- Has a system prompt template
- Handles Ollama API calls
- Implements retry logic
- Logs usage for debugging

#### 4.3 Prompt Engineering
- [ ] **Prompt Templates**
  - Outline generator prompt (optimized for Gemini/GPT models)
  - Humanizer system message (tone, style)
  - AI detector criteria checklist
  - Citation formatter prompt

---

### **Phase 5: Feature Integration** 🔗 (Week 8)

#### 5.1 Connect Frontend to Backend
- [ ] Replace placeholder buttons with real API calls
- [ ] Add loading states and error handling
- [ ] Stream Ollama responses (for outline generation)
- [ ] Implement rate limiting UI feedback

#### 5.2 Advanced Features
- [ ] **Context-Aware Rewriting**
  - Send surrounding paragraphs with selected text
  - Let Ollama model maintain essay flow
  
- [ ] **Hybrid AI Detection**
  - Ollama-based semantic analysis
  - Statistical heuristics (perplexity, burstiness)
  
- [ ] **Citation Integration**
  - CrossRef API for academic papers
  - Google Books API for books
  - Auto-format in APA/MLA/Chicago

---

### **Phase 6: Polish & Deployment** 🚀 (Week 9-10)

#### 6.1 Testing
- [ ] Unit tests for agents (Jest)
- [ ] Integration tests for API endpoints
- [ ] E2E tests for editor workflows (Playwright)
- [ ] Load testing for Llama endpoints

#### 6.2 Optimization
- [ ] Lazy load AI panels
- [ ] Cache Ollama responses (Redis)
- [ ] Optimize bundle size (code splitting)
- [ ] Add service worker for offline editing

#### 6.3 Deployment
- [ ] Frontend: Vercel
- [ ] Backend: Railway/Render (with persistent Ollama instance)
- [ ] Database: Supabase (cloud tier)
- [ ] Monitoring: Sentry for errors

---

## 📂 Final Folder Structure

```
modern-essay-writer/
├── frontend/                    # SvelteKit app
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/
│   │   │   │   ├── Editor.svelte
│   │   │   │   ├── Toolbar.svelte
│   │   │   │   ├── panels/
│   │   │   │   │   ├── PromptPanel.svelte
│   │   │   │   │   ├── HumanizerPanel.svelte
│   │   │   │   │   ├── DetectorPanel.svelte
│   │   │   │   │   └── CitationPanel.svelte
│   │   │   │   └── layout/
│   │   │   │       ├── Navbar.svelte
│   │   │   │       └── ResizablePanels.svelte
│   │   │   ├── stores/          # Svelte stores for state
│   │   │   └── utils/           # Frontend helpers
│   │   └── routes/
│   │       ├── +page.svelte     # Home/dashboard
│   │       └── editor/
│   │           └── [id]/+page.svelte
│   ├── static/
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                     # Express API
│   ├── server.js
│   ├── routes/
│   │   ├── essays.js
│   │   ├── auth.js
│   │   └── ai/
│   │       ├── prompt.js
│   │       ├── rewrite.js
│   │       ├── detect.js
│   │       └── citations.js
│   ├── services/
│   │   ├── supabase.js
│   │   └── ollama.js
│   ├── middleware/
│   └── package.json
│
├── agents/                      # AI logic (can be delegated)
│   ├── promptAgent.js
│   ├── humanizerAgent.js
│   ├── detectorAgent.js
│   └── citationAgent.js
│
├── shared/                      # Types/constants used by both
│   ├── types.ts
│   └── constants.js
│
├── docs/                        # Documentation
│   ├── API.md                   # API endpoint specs
│   ├── AGENTS.md                # Agent implementation guide
│   └── DEPLOYMENT.md
│
├── .env.example
├── README.md
├── plan.md                      # This file
└── package.json                 # Root workspace scripts
```

---

## 🎯 Delegation Strategy

### **Core Team Tasks** (You)
- Phase 1: Base editor and UI
- Phase 2: Panel architecture
- Backend routes setup (stubbed)
- Overall integration and testing

### **Delegatable Tasks** (Can be assigned independently)

#### Agent Developer 1: **Prompt Agent**
- **Input:** Essay topic, type (argumentative/research/creative)
- **Output:** JSON outline with sections and bullet points
- **Files:** `agents/promptAgent.js`, `backend/routes/ai/prompt.js`
- **Requirements:** 
  - Use Gemini 7B or GPT OSS model via Ollama
  - Return structured JSON
  - Handle timeouts gracefully

#### Agent Developer 2: **Humanizer Agent**
- **Input:** Selected text + surrounding context
- **Output:** Rewritten text with natural tone
- **Files:** `agents/humanizerAgent.js`, `backend/routes/ai/rewrite.js`
- **Requirements:**
  - Preserve original meaning
  - Support tone options (formal, casual, academic)
  - Use Gemini 27B or larger GPT OSS model for quality

#### Agent Developer 3: **Detector Agent**
- **Input:** Full essay text
- **Output:** AI score (0-100%) + flagged sections
- **Files:** `agents/detectorAgent.js`, `backend/routes/ai/detect.js`
- **Requirements:**
  - Combine Ollama model analysis with statistical heuristics
  - Explain flagged sections
  - Run offline (no external APIs)

#### Agent Developer 4: **Citation Agent** (Optional)
- **Input:** Search query or DOI
- **Output:** Formatted citation + metadata
- **Files:** `agents/citationAgent.js`, `backend/routes/ai/citations.js`
- **Requirements:**
  - Query CrossRef API
  - Format in APA/MLA/Chicago
  - Cache results

---

## 🔧 Tech Setup Commands

### Initial Setup
```bash
# Clone and install
cd modern-essay-writer
npm init -y
npm install

# Frontend
cd frontend
npm create svelte@latest .
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @tiptap/core @tiptap/starter-kit

# Backend
cd ../backend
npm init -y
npm install express cors dotenv @supabase/supabase-js
npm install -D nodemon

# Agents
cd ../agents
npm init -y
npm install axios
```

### Run Development
```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Ollama (local)
ollama serve
```

---

## ✅ Phase 1 Success Criteria
- [x] User can create a new essay
- [x] Editor supports rich text formatting
- [x] Autosave works (localStorage)
- [x] Export to .txt and .md
- [x] Clean, responsive UI (mobile + desktop)
- [x] Cloud sync with Supabase
- [x] User authentication
- [x] Version history

## ✅ Phase 2 Success Criteria
- [x] Resizable panel system functional
- [x] All placeholder panels visible and clearly labeled as "Coming Soon"
- [x] Settings panel with full customization
- [x] Theme switching (light/dark/auto)
- [x] Typography controls
- [x] Panel visibility toggles
- [x] Google Sheets-inspired clean UI
- [x] VS Code-style panel functionality

---

## 🚦 Next Steps After Phase 2
1. ~~Deploy base app to Vercel for early feedback~~
2. Begin Phase 3: Backend Foundation (Express server, API routes)
3. Set up Ollama locally and test inference with models
4. Create API documentation for delegated tasks
5. Assign agent tasks to team/collaborators for Phase 4

---

## 💡 Why This Plan Works
- **Modular:** Each agent is self-contained and can be developed independently
- **Testable:** Base app works without AI, so you can demo early
- **Scalable:** Swap Ollama models for cloud APIs (Cohere, OpenAI) if needed
- **Sponsor-Friendly:** Easy to add Google/Cohere integrations later
- **Hackathon-Ready:** Phase 1 alone is a working product

---

**Last Updated:** November 7, 2025  
**Current Phase:** Phase 2 Complete ✅  
**Next Phase:** Phase 3 - Backend Foundation
