import "dotenv/config";
import { db } from "./firebase.js";
import { LEVELS, MEDALS, REGIONS, levelId } from "./catalog.js";

const batch = db.batch();
for (const region of REGIONS) batch.set(db.collection("regions").doc(region.id), { ...region, active: true }, { merge: true });
for (const level of LEVELS) batch.set(db.collection("levels").doc(levelId(level.regionId, level.levelNumber)), { ...level, active: true }, { merge: true });
for (const medal of MEDALS) batch.set(db.collection("medals").doc(medal.id), { ...medal, active: true }, { merge: true });
await batch.commit();
console.log("Catálogo inicial carregado no Firestore.");
