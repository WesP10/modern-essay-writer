# Quick Start: Setting Up Your Environment

## 🚀 Local Mode (Default)

The app works in **local-only mode** where your essays are saved in your browser's localStorage.

Just run:
```powershell
npm run dev
```

---

## ☁️ Cloud Features (Firebase)

Firebase is configured for authentication and cloud storage. The backend uses Firebase Firestore for data persistence.

### Setting Up Firebase

Follow the complete guide in **`docs/FIREBASE_SETUP.md`** to:
- Configure Firebase project
- Set up authentication
- Enable Firestore database

### Backend Configuration

The backend requires a Firebase service account key. See `backend/README.md` for setup instructions.

---

## 📝 Current Status

- ✅ Local storage works out of the box
- ✅ Backend uses Firebase/Firestore
- 📖 See `docs/FIREBASE_SETUP.md` for cloud features
