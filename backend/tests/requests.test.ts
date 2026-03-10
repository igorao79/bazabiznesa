import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/app";

let dispatcherToken: string;
let master1Token: string;
let master2Token: string;

// These tests require a running database with seeded data
// Run: DATABASE_URL=... npx vitest run

describe("Request API", () => {
  beforeAll(async () => {
    // Login all test users
    const dispRes = await request(app).post("/api/auth/login").send({ username: "dispatcher", password: "dispatcher123" });
    dispatcherToken = dispRes.body.token;

    const m1Res = await request(app).post("/api/auth/login").send({ username: "master1", password: "master123" });
    master1Token = m1Res.body.token;

    const m2Res = await request(app).post("/api/auth/login").send({ username: "master2", password: "master123" });
    master2Token = m2Res.body.token;
  });

  describe("POST /api/requests — Create request", () => {
    it("should create a new request with valid data", async () => {
      const res = await request(app).post("/api/requests").send({
        clientName: "Тест Тестович",
        phone: "+7 (999) 000-00-00",
        address: "ул. Тестовая, д. 1",
        problemText: "Тестовая проблема",
        priority: "high",
      });

      expect(res.status).toBe(201);
      expect(res.body.clientName).toBe("Тест Тестович");
      expect(res.body.status).toBe("new");
      expect(res.body.priority).toBe("high");
    });

    it("should reject request with missing required fields", async () => {
      const res = await request(app).post("/api/requests").send({
        clientName: "Тест",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("GET /api/requests — List requests", () => {
    it("should require authentication", async () => {
      const res = await request(app).get("/api/requests");
      expect(res.status).toBe(401);
    });

    it("should return requests for authenticated user", async () => {
      const res = await request(app)
        .get("/api/requests")
        .set("Authorization", `Bearer ${dispatcherToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("should filter by status", async () => {
      const res = await request(app)
        .get("/api/requests?status=new")
        .set("Authorization", `Bearer ${dispatcherToken}`);

      expect(res.status).toBe(200);
      res.body.forEach((r: any) => expect(r.status).toBe("new"));
    });
  });

  describe("Dispatcher actions", () => {
    let newRequestId: number;

    beforeAll(async () => {
      const res = await request(app).post("/api/requests").send({
        clientName: "Клиент для теста",
        phone: "+7 (999) 111-11-11",
        address: "ул. Тестовая, д. 2",
        problemText: "Проблема для теста диспетчера",
      });
      newRequestId = res.body.id;
    });

    it("should assign master to a request", async () => {
      // First get list of masters
      const mastersRes = await request(app)
        .get("/api/requests/users/masters")
        .set("Authorization", `Bearer ${dispatcherToken}`);

      const masterId = mastersRes.body[0].id;

      const res = await request(app)
        .patch(`/api/requests/${newRequestId}/assign`)
        .set("Authorization", `Bearer ${dispatcherToken}`)
        .send({ masterId });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("assigned");
      expect(res.body.assignedTo).toBe(masterId);
    });

    it("should not allow master to assign", async () => {
      const anotherReq = await request(app).post("/api/requests").send({
        clientName: "Другой клиент",
        phone: "+7 (999) 222-22-22",
        address: "ул. Другая, д. 3",
        problemText: "Другая проблема",
      });

      const res = await request(app)
        .patch(`/api/requests/${anotherReq.body.id}/assign`)
        .set("Authorization", `Bearer ${master1Token}`)
        .send({ masterId: 2 });

      expect(res.status).toBe(403);
    });
  });
});
