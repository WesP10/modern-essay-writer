import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

// Firebase Admin SDK configuration
const firebaseConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The private key needs to have escaped newlines replaced with actual newlines
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
};

let firebaseApp;
let auth;
let db;

try {
  // Initialize Firebase Admin
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  
  logger.info('✅ Firebase Admin initialized successfully');
} catch (error) {
  logger.error('❌ Firebase Admin initialization failed:', error);
  throw error;
}

// Test Firestore connection
export async function testFirestoreConnection() {
  try {
    // Try to read from a collection (doesn't need to exist)
    await db.collection('_health_check').limit(1).get();
    logger.info('✅ Firestore connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Firestore connection test failed:', error);
    return false;
  }
}

export { auth, db };
export default { auth, db };
