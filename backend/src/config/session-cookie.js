export function sessionCookieOptions(config) {
  const frontendUsesHttps = new URL(config.FRONTEND_ORIGIN).protocol === "https:";
  const secure = config.NODE_ENV === "production" || frontendUsesHttps;

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/api/v1",
  };
}
