import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("./services/admin.service.js", () => ({
  AdminService: class {
    async getOverview() {
      return { players: { total: 0 }, attempts: { total: 0 } };
    }
  },
  statsFilterSchema: { parse: (value) => value },
  trendFilterSchema: { parse: (value) => value },
}));

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

  it("bloqueia origens não autorizadas nas rotas da API", async () => {
    const response = await request(app)
      .get("/api/v1/me/state")
      .set("Origin", "https://site-malicioso.example");
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ORIGIN_NOT_ALLOWED");
  });

  it("expõe estatísticas públicas sem credencial", async () => {
    const response = await request(app).get("/api/v1/admin/stats/overview");
    expect(response.status).toBe(200);
    expect(response.body.data.players.total).toBe(0);
  });
});
