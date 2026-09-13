import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
export const newId = () => randomUUID();
export const newOpaqueToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token) => createHash("sha256").update(token).digest();
export function signPayload(payload, secret) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
    return `${encoded}.${signature}`;
}
export function verifyPayload(token, secret) {
    if (typeof token !== "string" || token.length > 1024) return null;
    const [encoded, signature, extra] = token.split(".");
    if (!encoded || !signature || extra) return null;
    const expected = createHmac("sha256", secret).update(encoded).digest();
    let received;
    try { received = Buffer.from(signature, "base64url"); } catch { return null; }
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
    try { return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")); } catch { return null; }
}
