import cors from "cors";
import express from "express";
import type { ReadinessCheck, ReadinessChecks } from "./readiness.js";

const READINESS_TIMEOUT_MS = 3000;

export interface AppOptions {
  allowedOrigin: string | undefined;
  checks: ReadinessChecks;
  readinessTimeoutMs?: number;
}

async function runCheck(name: string, check: ReadinessCheck, timeoutMs: number): Promise<"ok" | "failed"> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error("Timed out")), timeoutMs);
  });

  try {
    await Promise.race([check(), timeout]);
    return "ok";
  } catch (error) {
    // Error messages can contain connection details, so only the code is logged.
    const code = (error as { code?: unknown }).code;
    console.error(`Readiness check failed: ${name}${typeof code === "string" ? ` (${code})` : ""}`);
    return "failed";
  } finally {
    clearTimeout(timer);
  }
}

export function createApp({ allowedOrigin, checks, readinessTimeoutMs = READINESS_TIMEOUT_MS }: AppOptions) {
  const app = express();

  app.use(cors({ origin: allowedOrigin ? [allowedOrigin] : false }));

  app.get("/healthz", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/readyz", async (_req, res) => {
    const [database, queue] = await Promise.all([
      runCheck("database", checks.database, readinessTimeoutMs),
      runCheck("queue", checks.queue, readinessTimeoutMs),
    ]);
    const ready = database === "ok" && queue === "ok";

    res
      .set("Cache-Control", "no-store")
      .status(ready ? 200 : 503)
      .json({ status: ready ? "ok" : "unavailable", database, queue });
  });

  return app;
}
