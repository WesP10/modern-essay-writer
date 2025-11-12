# 🚀 Ollama Setup Guide for Enhanced Autocomplete

Complete instructions for setting up Ollama with gemma2:2b for the enhanced autocomplete feature.

---

## 📋 Prerequisites

- Windows 10/11 (64-bit)
- At least 8GB RAM (16GB recommended)
- 5GB free disk space for the model
- Internet connection for initial model download

---

## 🔧 Step 1: Install Ollama

### Option A: Download Installer (Recommended)

1. **Download Ollama for Windows:**
   - Visit: https://ollama.com/download
   - Click "Download for Windows"
   - Run the installer: `OllamaSetup.exe`

2. **Follow the installation wizard:**
   - Accept the license agreement
   - Choose installation location (default is fine)
   - Click "Install"

3. **Verify installation:**
   ```powershell
   ollama --version
   ```
   You should see something like: `ollama version is 0.x.x`

### Option B: Using winget (Windows Package Manager)

```powershell
winget install Ollama.Ollama
```

---

## 📦 Step 2: Download the gemma2:2b Model

The gemma2:2b model is a lightweight, fast model perfect for autocomplete (1.6GB download).

### Pull the model:

```powershell
ollama pull gemma2:2b
```

**What happens:**
- Downloads ~1.6GB model files
- May take 5-15 minutes depending on internet speed
- Model is cached locally for instant future use

**Expected output:**
```
pulling manifest
pulling 2af3b81862c6... 100% ▕████████████████▏ 1.6 GB
pulling 70d5d0a8cfec... 100% ▕████████████████▏  137 B
pulling 4f659a1e86d7... 100% ▕████████████████▏  483 B
verifying sha256 digest
writing manifest
success
```

### Verify the model is ready:

```powershell
ollama list
```

**You should see:**
```
NAME              ID              SIZE      MODIFIED
gemma2:2b         2af3b81862c6    1.6 GB    2 minutes ago
```

---

## 🎯 Step 3: Start Ollama Server

Ollama runs as a background service on Windows. It should start automatically, but you can manage it:

### Check if Ollama is running:

```powershell
# Test the API
curl http://localhost:11434/api/tags
```

**If running, you'll see JSON with available models.**

### Start Ollama manually (if needed):

```powershell
ollama serve
```

**Note:** Ollama usually starts automatically on Windows boot. The serve command is only needed if you stopped it manually.

### Test the model:

```powershell
ollama run gemma2:2b "Hello, how are you?"
```

**Expected output:**
```
Hello! I'm doing well, thank you for asking. How can I help you today?
```

Type `/bye` to exit the interactive session.

---

## ⚙️ Step 4: Configure the Backend

### Set environment variables:

1. **Create/edit `.env` file** in the `backend` folder:

```bash
cd "C:\Users\Westo\Saved Games\modern-essay-writer\backend"
notepad .env
```

2. **Add these lines:**

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma2:2b

# Other existing config...
PORT=3001
NODE_ENV=development
```

3. **Save and close**

### Alternative: Use environment variables directly:

```powershell
$env:OLLAMA_BASE_URL="http://localhost:11434"
$env:OLLAMA_MODEL="gemma2:2b"
```

---

## 🧪 Step 5: Test the Enhanced Autocomplete

### Run the test suite:

```powershell
cd "C:\Users\Westo\Saved Games\modern-essay-writer\backend"
node test-enhanced-autocomplete.js
```

**Expected output:**
```
🚀 Testing Enhanced AutocompleteService with LLM Integration
======================================================================

📝 Test 1: Basic Prefix Matching (Tier 1 - Dictionary)
----------------------------------------------------------------------
Query: "concl"
Suggestions: conclusion (contextual), conclude (dictionary), ...
Latency: 4ms | Tier: 1 | Cached: false

📝 Test 2: Context-Aware Phrase Suggestions (Tier 2 - N-gram)
----------------------------------------------------------------------
...

📝 Test 4: LLM-Powered Context Suggestions (Tier 3 - Smart)
----------------------------------------------------------------------
Query: "there" with rich context
Suggestions:
  - therefore (confidence: 0.95, source: contextual, tier: 1, type: word)
  - there is (confidence: 0.88, source: llm, tier: 3, type: phrase)
  ...
Latency: 142ms | Tier: 3 | Cached: false

✅ All tests completed!
```

---

## 🚀 Step 6: Start the Application

### Terminal 1 - Backend:

```powershell
cd "C:\Users\Westo\Saved Games\modern-essay-writer\backend"
npm install  # If you haven't already
npm run dev
```

**Expected output:**
```
[INFO] Ollama client initialized with base URL: http://localhost:11434, default model: gemma2:2b
[INFO] AutocompleteService initialized
[INFO] Loaded 1247 academic vocabulary words
[INFO] N-gram model trained with 284 contexts
[INFO] EnhancedAutocompleteService initialized
[INFO] Server running on port 3001
```

### Terminal 2 - Frontend:

```powershell
cd "C:\Users\Westo\Saved Games\modern-essay-writer\frontend"
npm install  # If you haven't already
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in 543 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🎨 Step 7: Use the Enhanced Autocomplete

1. **Open your browser:** http://localhost:5173

2. **Navigate to the editor** (create or open an essay)

3. **Start typing:**
   - Type at least 2 characters
   - Autocomplete dropdown will appear
   - You'll see suggestions with badges:
     - 🤖 = LLM-powered suggestion (Tier 3)
     - 📝 = Multi-word phrase
     - **T1/T2/T3** = Tier indicator

4. **Navigate suggestions:**
   - ↑↓ arrows to select
   - Enter or Tab to accept
   - Esc to close

5. **Watch the tiers in action:**
   - **Short words without context:** Tier 1 (3-5ms) - Dictionary
   - **Words with context:** Tier 2 (15-30ms) - N-gram patterns
   - **Complex context (50+ chars):** Tier 3 (100-150ms) - LLM-powered

---

## 🔍 Troubleshooting

### Issue: "Ollama connection failed"

**Solution:**
```powershell
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve

# In another terminal, pull the model
ollama pull gemma2:2b
```

### Issue: "Model not found"

**Solution:**
```powershell
# List available models
ollama list

# Pull gemma2:2b if missing
ollama pull gemma2:2b
```

### Issue: Autocomplete too slow (>500ms)

**Reasons:**
- First LLM call is slower (model loading)
- System under heavy load
- Model is too large

**Solutions:**
1. **Disable LLM temporarily:**
   ```javascript
   // In Editor.svelte or component
   export let enableLLM = false;  // Disable LLM, use Tier 1-2 only
   ```

2. **Use an even smaller model:**
   ```powershell
   ollama pull gemma:2b
   ```
   Update `.env`: `OLLAMA_MODEL=gemma:2b`

3. **Wait for first call to complete** (subsequent calls use cache)

### Issue: High memory usage

**Solution:**
- gemma2:2b uses ~2-3GB RAM when loaded
- If memory is limited, Ollama will automatically unload after 5 minutes of inactivity
- You can also use `ollama stop gemma2:2b` to manually unload

### Issue: Suggestions not showing

**Check:**
1. Backend is running on port 3001
2. Frontend can reach backend (check console for errors)
3. Type at least 2 characters
4. Look in browser DevTools console for [Autocomplete] logs

---

## 📊 Performance Expectations

### With Ollama (LLM Enabled):

| Query Type | Tier | Latency | Examples |
|------------|------|---------|----------|
| Simple word | 1 | 3-5ms | "conc" → "conclusion" |
| Phrase pattern | 2 | 15-30ms | "in add" → "in addition" |
| Context-aware | 3 | 100-150ms | Full context + LLM |

**First LLM call:** 200-300ms (model loading)  
**Subsequent LLM calls:** 100-150ms  
**Cached LLM results:** <2ms

### Without Ollama (Tier 1-2 Only):

- All queries: 3-30ms
- No LLM overhead
- Still gets N-gram and pattern-based suggestions

---

## 🎛️ Advanced Configuration

### Change model:

```env
# Faster but less accurate
OLLAMA_MODEL=gemma:2b

# Slower but more accurate (requires more RAM)
OLLAMA_MODEL=gemma2:9b

# Even more powerful (requires 16GB+ RAM)
OLLAMA_MODEL=llama2
```

### Disable LLM for all users:

In `backend/routes/ai/autocomplete.js`:
```javascript
const enableLLM = false;  // Force disable
```

### Adjust LLM timeout:

In `backend/config/ollama.js`:
```javascript
timeout: 30000,  // 30 seconds (default: 60)
```

---

## 📈 Monitoring

### Check autocomplete stats:

```powershell
# Using curl or any HTTP client
curl http://localhost:3001/api/ai/autocomplete/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "cacheSize": 342,
    "llmCacheSize": 23,
    "userPreferences": 45,
    "ngramContexts": 284
  }
}
```

### Clear caches (if needed):

```powershell
curl -X POST http://localhost:3001/api/ai/autocomplete/clear-cache
```

---

## 🎓 Tips for Best Results

1. **Let the system warm up:**
   - First LLM call takes longer
   - Cache builds up over time
   - Performance improves with use

2. **Provide context:**
   - Write at least 50 characters before expecting LLM suggestions
   - More context = better suggestions

3. **Use essay types:**
   - Set essay type in editor settings
   - Gets vocabulary specific to argumentative, research, etc.

4. **Monitor tier usage:**
   - Most queries should use Tier 1 (fast)
   - Tier 3 (LLM) for complex contexts only
   - Check backend logs for tier distribution

5. **System learns from you:**
   - Suggestions you select are tracked
   - System adapts to your writing style
   - Give it time to learn your preferences

---

## 🔒 Security Note

- Ollama runs **locally** on your machine
- No data is sent to external servers
- All LLM processing happens on-premise
- Models are cached locally in: `C:\Users\[YourName]\.ollama\models`

---

## 📚 Additional Resources

- **Ollama Documentation:** https://github.com/ollama/ollama/blob/main/README.md
- **Gemma2 Model Info:** https://ollama.com/library/gemma2
- **Model Library:** https://ollama.com/library

---

## ✅ Quick Start Checklist

- [ ] Install Ollama
- [ ] Pull gemma2:2b model (`ollama pull gemma2:2b`)
- [ ] Verify Ollama is running (`curl http://localhost:11434/api/tags`)
- [ ] Set environment variables in backend/.env
- [ ] Run test: `node test-enhanced-autocomplete.js`
- [ ] Start backend: `npm run dev` in backend folder
- [ ] Start frontend: `npm run dev` in frontend folder
- [ ] Test autocomplete in the editor
- [ ] Monitor logs for tier usage and latency

---

**You're all set! 🎉**

Start typing in the editor and enjoy intelligent, context-aware autocomplete suggestions powered by local AI!
