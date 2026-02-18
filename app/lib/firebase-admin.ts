import "server-only";
import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Helper to handle the service account key
// In production (Vercel/Netlify), these are usually set as a single JSON string in an env var
// e.g. FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
// Or as individual fields.
function getServiceAccount() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      return JSON.parse(serviceAccountKey);
    } catch (e) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY", e);
    }
  }

  // Fallback to individual fields if available
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return null;
}

let app: App | undefined;

if (getApps().length === 0) {
  const serviceAccount = getServiceAccount();

  if (serviceAccount) {
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // If no service account is provided, we might be in a local environment
    // without admin SDK configured properly. This will specificly fail actions
    // that require admin privileges (like creating users efficiently without logging in).
    // For now, we will Initialize a default app which might fail if GOOGLE_APPLICATION_CREDENTIALS is not set.
    console.warn(
      "Firebase Admin SDK Warning: No service account provided in environment variables.",
    );
    try {
      app = initializeApp();
    } catch (e) {
      // Fallback or error handling
      console.error("Failed to initialize Firebase Admin", e);
    }
  }
} else {
  app = getApp();
}

export const adminAuth = app ? getAuth(app) : null;
export const adminDb = app ? getFirestore(app) : null;
