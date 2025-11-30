import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from 'firebase/auth';
import { auth, onAuthChange, signIn, signUp, signOut, signInWithGoogle, resetPassword } from '$lib/firebaseClient';

// User store
export const user = writable<User | null>(null);

// Loading state
export const loading = writable(true);

// Auth error
export const authError = writable<string | null>(null);

// Derived state
export const isAuthenticated = derived(user, ($user) => $user !== null);

// Initialize auth state listener
if (browser && auth) {
  onAuthChange((firebaseUser) => {
    user.set(firebaseUser);
    loading.set(false);
  });
}

// Auth actions
export const authActions = {
  async signIn(email: string, password: string) {
    try {
      authError.set(null);
      loading.set(true);
      await signIn(email, password);
      return { success: true };
    } catch (error: any) {
      const message = getErrorMessage(error);
      authError.set(message);
      return { success: false, error: message };
    } finally {
      loading.set(false);
    }
  },

  async signUp(email: string, password: string) {
    try {
      authError.set(null);
      loading.set(true);
      await signUp(email, password);
      return { success: true };
    } catch (error: any) {
      const message = getErrorMessage(error);
      authError.set(message);
      return { success: false, error: message };
    } finally {
      loading.set(false);
    }
  },

  async signOut() {
    try {
      authError.set(null);
      await signOut();
      return { success: true };
    } catch (error: any) {
      const message = getErrorMessage(error);
      authError.set(message);
      return { success: false, error: message };
    }
  },

  async signInWithGoogle() {
    try {
      authError.set(null);
      loading.set(true);
      await signInWithGoogle();
      return { success: true };
    } catch (error: any) {
      const message = getErrorMessage(error);
      authError.set(message);
      return { success: false, error: message };
    } finally {
      loading.set(false);
    }
  },

  async resetPassword(email: string) {
    try {
      authError.set(null);
      await resetPassword(email);
      return { success: true };
    } catch (error: any) {
      const message = getErrorMessage(error);
      authError.set(message);
      return { success: false, error: message };
    }
  }
};

// Helper to get user-friendly error messages
function getErrorMessage(error: any): string {
  const code = error?.code || '';
  
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/operation-not-allowed':
      return 'Operation not allowed';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/popup-closed-by-user':
      return 'Sign in cancelled';
    default:
      return error?.message || 'An error occurred';
  }
}
