import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { env } from "../config/env.js";

if (env.FIRESTORE_EMULATOR_HOST) process.env.FIRESTORE_EMULATOR_HOST = env.FIRESTORE_EMULATOR_HOST;

const credential = env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY
  ? cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    })
  : applicationDefault();

const firebaseApp = getApps()[0] ?? initializeApp({ credential, projectId: env.FIREBASE_PROJECT_ID });
export const db = getFirestore(firebaseApp);

export async function checkDatabase() {
  await db.collection("_health").limit(1).get();
}
