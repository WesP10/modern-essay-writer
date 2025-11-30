# Firebase Setup Guide

This guide will help you configure Firebase Authentication and Firestore for your EssayForge application.

## Prerequisites

- A Google account
- Node.js installed
- Access to the Firebase Console

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or "Create a project"
3. Enter a project name (e.g., "essay-forge")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create Project"

## Step 2: Enable Authentication

1. In the Firebase Console, select your project
2. Click "Authentication" in the left sidebar
3. Click "Get Started"
4. Click on the "Sign-in method" tab
5. Enable the following sign-in providers:
   - **Email/Password**: Click on it, toggle "Enable", and save
   - **Google**: Click on it, toggle "Enable", select a support email, and save
6. (Optional) Enable other providers as needed

## Step 3: Create a Firestore Database

1. In the Firebase Console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" (you can set up security rules later)
4. Select a location for your database (choose one close to your users)
5. Click "Enable"

## Step 4: Set up Firestore Security Rules

1. In Firestore Database, click on the "Rules" tab
2. Replace the default rules with the following:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own essays
    match /essays/{essayId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.user_id;
      
      // Users can only read/write their own versions
      match /versions/{versionId} {
        allow read, write: if request.auth != null && get(/databases/$(database)/documents/essays/$(essayId)).data.user_id == request.auth.uid;
      }
    }
  }
}
\`\`\`

3. Click "Publish"

## Step 5: Get Frontend Configuration

1. In the Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register your app with a nickname (e.g., "EssayForge Web")
6. Copy the configuration object

## Step 6: Configure Frontend Environment Variables

1. Create a `.env` file in the `frontend` directory:

\`\`\`bash
cd frontend
# Create .env file (or .env.local for local development)
\`\`\`

2. Add your Firebase configuration:

\`\`\`env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
\`\`\`

## Step 7: Get Backend Service Account Credentials

1. In the Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Go to the "Service accounts" tab
4. Click "Generate new private key"
5. Click "Generate key" to download the JSON file
6. **Keep this file secure!** Never commit it to version control

## Step 8: Configure Backend Environment Variables

1. Create a `.env` file in the `backend` directory:

\`\`\`bash
cd backend
# Create .env file
\`\`\`

2. Open the downloaded JSON service account file and extract these values:

\`\`\`env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
\`\`\`

**Important**: The private key must be wrapped in double quotes and keep the `\n` characters for line breaks.

## Step 9: Test Your Setup

1. Start the backend server:

\`\`\`bash
cd backend
npm run dev
\`\`\`

You should see: `✅ Firebase Admin initialized successfully`

2. In another terminal, start the frontend:

\`\`\`bash
cd frontend
npm run dev
\`\`\`

3. Open your browser to http://localhost:5173
4. Try creating an account and signing in

## Step 10: Create Initial Indexes (Optional)

For better query performance, create composite indexes:

1. Go to Firestore Database in Firebase Console
2. Click on the "Indexes" tab
3. Add the following composite index:
   - Collection: `essays`
   - Fields:
     - `user_id` (Ascending)
     - `updated_at` (Descending)
   - Query scope: Collection

## Security Best Practices

1. **Never commit your `.env` files** to version control
2. Add `.env` to your `.gitignore`:
   \`\`\`
   /.env
   /.env.local
   \`\`\`

3. **Keep your service account key secure** - treat it like a password
4. **Use environment variables** in production (e.g., Vercel, Netlify, Railway)
5. **Review Firestore security rules** regularly
6. **Enable App Check** for additional security (optional but recommended)

## Troubleshooting

### Firebase not initialized

- Check that all environment variables are set correctly
- Ensure `.env` files are in the correct directories
- Restart your development servers after changing `.env` files

### Authentication errors

- Verify that the auth provider is enabled in Firebase Console
- Check that the `authDomain` in your config is correct
- Ensure your app is registered in Firebase Console

### Permission denied errors

- Review your Firestore security rules
- Ensure the user is authenticated
- Check that the `user_id` field matches the authenticated user's ID

### "Module not found" errors

- Run `npm install` in both frontend and backend directories
- Clear node_modules and reinstall if needed:
  \`\`\`bash
  rm -rf node_modules package-lock.json
  npm install
  \`\`\`

## Migration from localStorage

If you have existing essays in localStorage, they can be migrated to Firebase:

1. Sign in to your Firebase account
2. Open the browser console (F12)
3. Run the migration script (see `frontend/src/lib/utils/migration.ts`)

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the backend logs for errors
3. Verify all environment variables are set correctly
4. Ensure Firebase services are enabled in the console
