# Quick Start: Setting Up Your Environment

## 🚀 Local Mode (No Configuration Needed)

The app works perfectly in **local-only mode** without any setup! Your essays are saved in your browser's localStorage.

Just run:
```powershell
npm run dev
```

---

## ☁️ Enable Cloud Sync (Optional)

To sync essays across devices and enable cloud backups, follow these steps:

### 1. Create .env File

In the `frontend` folder, create a `.env` file:

```powershell
cd frontend
copy .env.example .env
```

### 2. Set Up Supabase

Follow the complete guide in **`docs/SUPABASE_SETUP.md`** to:
- Create a Supabase account
- Set up database tables
- Get your API credentials

### 3. Add Your Credentials

Edit `frontend/.env` and replace with your actual values:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 4. Restart the Server

```powershell
# Stop the server (Ctrl+C)
npm run dev
```

---

## 🔍 How to Check if Supabase is Working

1. Open the app
2. Look for authentication options on the home page
3. If you see "Local Mode" message, Supabase is not configured
4. If you see sign-in options, Supabase is configured!

---

## 📝 Current Status

- ✅ Local storage works out of the box
- ⚙️ Cloud sync requires Supabase setup
- 📖 See `docs/SUPABASE_SETUP.md` for detailed instructions
