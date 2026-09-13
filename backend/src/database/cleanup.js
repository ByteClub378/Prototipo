import "dotenv/config";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "./firebase.js";
import { env } from "../config/env.js";

const playerLimit = Timestamp.fromMillis(Date.now() - env.PLAYER_RETENTION_DAYS * 86400000);
const inactive = await db.collection("players").where("lastSeenAt", "<", playerLimit).get();
let players = 0;
for (const player of inactive.docs) {
  const writer = db.bulkWriter();
  const attempts = await db.collection("attempts").where("playerId", "==", player.id).get();
  attempts.docs.forEach((doc) => writer.delete(doc.ref));
  writer.delete(player.ref);
  await writer.close();
  players += 1;
}
console.log(`Limpeza concluída: ${players} jogadores inativos e suas tentativas removidos.`);
