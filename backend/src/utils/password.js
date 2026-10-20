import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password, stored) {
  const [algorithm, saltEncoded, hashEncoded, extra] = String(stored).split("$");
  if (algorithm !== "scrypt" || !saltEncoded || !hashEncoded || extra) return false;
  let salt;
  let expected;
  try {
    salt = Buffer.from(saltEncoded, "base64url");
    expected = Buffer.from(hashEncoded, "base64url");
  } catch {
    return false;
  }
  if (salt.length !== 16 || expected.length !== 64) return false;
  const received = await scrypt(password, salt, expected.length);
  return timingSafeEqual(received, expected);
}
