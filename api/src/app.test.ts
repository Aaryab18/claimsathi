import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { createApp } from "./app.js";
import { checkDatabase, checkQueue } from "./readiness.js";

const SECRET_URL = "postgres://admin:s3cret-password@db.internal:5432/claims";
const ALLOWED_ORIGIN = "https://claimsathi-web.onrender.com";

const works = () => Promise.resolve();
const breaks = () => Promise.reject(new Error(`Could not connect to ${SECRET_URL}`));
const hangs = () => new Promise<void>(() => {});

function appWith(database = works as () => Promise<void>, queue = works as () => Promise<void>) {
  return createApp({ allowedOrigin: ALLOWED_ORIGIN, checks: { database, queue }, readinessTimeoutMs: 20 });
}

let errorLog: MockInstance;

beforeEach(() => {
  errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /healthz", () => {
  it('returns {"status":"ok"}', async () => {
    const response = await request(appWith()).get("/healthz");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("does not depend on the database or queue", async () => {
    const database = vi.fn(breaks);
    const queue = vi.fn(breaks);

    const response = await request(appWith(database, queue)).get("/healthz");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(database).not.toHaveBeenCalled();
    expect(queue).not.toHaveBeenCalled();
  });
});

describe("GET /readyz", () => {
  it("returns 200 when both work", async () => {
    const response = await request(appWith()).get("/readyz");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", database: "ok", queue: "ok" });
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("returns 503 and names the database when it fails", async () => {
    const response = await request(appWith(breaks, works)).get("/readyz");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "unavailable", database: "failed", queue: "ok" });
  });

  it("returns 503 and names the queue when it fails", async () => {
    const response = await request(appWith(works, breaks)).get("/readyz");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "unavailable", database: "ok", queue: "failed" });
  });

  it("names both when both fail", async () => {
    const response = await request(appWith(breaks, breaks)).get("/readyz");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "unavailable", database: "failed", queue: "failed" });
  });

  it("does not hang when a check never finishes", async () => {
    const response = await request(appWith(hangs, hangs)).get("/readyz");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "unavailable", database: "failed", queue: "failed" });
  });

  it("keeps connection details out of the response and the logs", async () => {
    const response = await request(appWith(breaks, breaks)).get("/readyz");

    expect(response.text).not.toMatch(/s3cret|admin|db\.internal|postgres:/);
    expect(errorLog).toHaveBeenCalled();
    expect(JSON.stringify(errorLog.mock.calls)).not.toMatch(/s3cret|admin|db\.internal|postgres:/);
  });
});

describe("browser requests", () => {
  it("allows ALLOWED_ORIGIN", async () => {
    const response = await request(appWith()).get("/readyz").set("Origin", ALLOWED_ORIGIN);

    expect(response.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
  });

  it("does not allow another origin", async () => {
    const response = await request(appWith()).get("/readyz").set("Origin", "https://example.com");

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("does not allow any origin when ALLOWED_ORIGIN is not set", async () => {
    const app = createApp({ allowedOrigin: undefined, checks: { database: works, queue: works } });

    const response = await request(app).get("/readyz").set("Origin", ALLOWED_ORIGIN);

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("readiness checks with a missing setting", () => {
  it("fails without trying to connect", async () => {
    await expect(checkDatabase(undefined)).rejects.toThrow("DATABASE_URL is not set");
    await expect(checkQueue(undefined)).rejects.toThrow("REDIS_URL is not set");
  });
});
