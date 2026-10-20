import { Timestamp } from "firebase-admin/firestore";
import { db } from "../database/firebase.js";

export class AdminAuthRepository {
  async createSession(sessionId, data) {
    await db.collection("adminSessions").doc(sessionId).create({
      ...data,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(data.expiresAt),
    });
  }

  async getSession(sessionId) {
    const snapshot = await db.collection("adminSessions").doc(sessionId).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data();
    return { ...data, expiresAt: data.expiresAt.toDate() };
  }

  async deleteSession(sessionId) {
    await db.collection("adminSessions").doc(sessionId).delete();
  }
}
