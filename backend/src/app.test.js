import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("API HTTP", () => {
  it("responde ao health check de processo sem depender do banco", async () => {
    const response = await request(app).get("/health/live");
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("ok");
  });

  it("protege rotas privadas sem cookie", async () => {
    const response = await request(app).get("/api/v1/me/progress");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("SESSION_INVALID");
  });

  it("padroniza rotas inexistentes", async () => {
    const response = await request(app).get("/nao-existe");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
  });
});
