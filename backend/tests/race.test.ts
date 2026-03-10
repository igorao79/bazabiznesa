import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/app";

let dispatcherToken: string;
let master1Token: string;

describe("Race condition: Take in work", () => {
  beforeAll(async () => {
    const dispRes = await request(app).post("/api/auth/login").send({ username: "dispatcher", password: "dispatcher123" });
    dispatcherToken = dispRes.body.token;

    const m1Res = await request(app).post("/api/auth/login").send({ username: "master1", password: "master123" });
    master1Token = m1Res.body.token;
  });

  it("should handle concurrent take-in-work requests safely", async () => {
    // 1. Create a new request
    const createRes = await request(app).post("/api/requests").send({
      clientName: "Race Test Client",
      phone: "+7 (999) 999-99-99",
      address: "ул. Гонка, д. 1",
      problemText: "Тест параллельных запросов",
    });
    const requestId = createRes.body.id;

    // 2. Get master1 id from token
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${master1Token}`);
    const masterId = meRes.body.user.id;

    // 3. Assign to master1
    await request(app)
      .patch(`/api/requests/${requestId}/assign`)
      .set("Authorization", `Bearer ${dispatcherToken}`)
      .send({ masterId });

    // 4. Send TWO simultaneous "take" requests
    const [res1, res2] = await Promise.all([
      request(app)
        .patch(`/api/requests/${requestId}/take`)
        .set("Authorization", `Bearer ${master1Token}`),
      request(app)
        .patch(`/api/requests/${requestId}/take`)
        .set("Authorization", `Bearer ${master1Token}`),
    ]);

    // 5. Exactly one should succeed (200) and one should fail (409 or 400)
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toContain(200);
    expect(statuses.some((s) => s === 409 || s === 400)).toBe(true);
  });
});
