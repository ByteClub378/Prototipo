import { createHash, randomBytes, randomUUID } from "node:crypto";
export const newId = () => randomUUID();
export const newOpaqueToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token) => createHash("sha256").update(token).digest();
