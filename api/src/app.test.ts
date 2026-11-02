import request from "supertest";
import { expect, it } from "vitest";
import { app } from "./app.js";

it('GET /healthz returns {"status":"ok"}', async () => {
  const response = await request(app).get("/healthz");

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ status: "ok" });
});
