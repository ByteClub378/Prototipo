import { Timestamp } from "firebase-admin/firestore";
import { initialProgress } from "../database/catalog.js";

export class SessionRepository {
  constructor(db) { this.db = db; }

  async createPlayer({ playerId, publicId }) {
    await this.db.collection("players").doc(playerId).create({
      publicId,
      revision: 1,
      createdAt: Timestamp.now(),
      lastSeenAt: Timestamp.now(),
      ...initialProgress(),
    });
  }

  async deletePlayer(playerId) {
    const writer = this.db.bulkWriter();
    const attempts = await this.db.collection("attempts").where("playerId", "==", playerId).get();
    attempts.docs.forEach((doc) => writer.delete(doc.ref));
    writer.delete(this.db.collection("players").doc(playerId));
    await writer.close();
  }
}
