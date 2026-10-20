import { hashPassword } from "../src/utils/password.js";

const password = process.env.ADMIN_PASSWORD;
if (!password || password.length < 12) {
  throw new Error("Defina ADMIN_PASSWORD temporariamente com pelo menos 12 caracteres para gerar o hash.");
}

console.log(await hashPassword(password));
