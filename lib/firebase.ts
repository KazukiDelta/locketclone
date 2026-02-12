/**
 * Firebase initialization (Auth only)
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

const ALLOWED_EMAILS =
  process.env.NEXT_PUBLIC_ALLOWED_EMAILS?.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean) || [];

export function isEmailAllowed(email: string): boolean {
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}

export { app };
