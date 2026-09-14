import { describe, expect, it } from "vitest";
import { sessionCookieOptions } from "./session-cookie.js";

describe("cookie de sessão", () => {
  it("usa Lax sem Secure no desenvolvimento HTTP local", () => {
    expect(sessionCookieOptions({
      NODE_ENV: "development",
      FRONTEND_ORIGIN: "http://localhost:5173",
    })).toMatchObject({ sameSite: "lax", secure: false, httpOnly: true });
  });

  it("usa None e Secure em produção", () => {
    expect(sessionCookieOptions({
      NODE_ENV: "production",
      FRONTEND_ORIGIN: "https://braziladventure.onrender.com",
    })).toMatchObject({ sameSite: "none", secure: true, httpOnly: true });
  });

  it("protege implantação HTTPS mesmo se NODE_ENV estiver incorreto", () => {
    expect(sessionCookieOptions({
      NODE_ENV: "development",
      FRONTEND_ORIGIN: "https://braziladventure.onrender.com",
    })).toMatchObject({ sameSite: "none", secure: true });
  });
});
