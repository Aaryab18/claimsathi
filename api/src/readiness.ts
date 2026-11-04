import pg from "pg";
import { createClient } from "redis";

const CONNECTION_TIMEOUT_MS = 2000;

export type ReadinessCheck = () => Promise<void>;

export interface ReadinessChecks {
  database: ReadinessCheck;
  queue: ReadinessCheck;
}

export async function checkDatabase(connectionString: string | undefined): Promise<void> {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    query_timeout: CONNECTION_TIMEOUT_MS,
  });
  client.on("error", () => {});

  try {
    await client.connect();
    await client.query("SELECT 1");
  } finally {
    void client.end().catch(() => {});
  }
}

export async function checkQueue(url: string | undefined): Promise<void> {
  if (!url) {
    throw new Error("REDIS_URL is not set");
  }

  const client = createClient({
    url,
    disableOfflineQueue: true,
    socket: { connectTimeout: CONNECTION_TIMEOUT_MS, reconnectStrategy: false },
  });
  client.on("error", () => {});

  try {
    await client.connect();
    await client.ping();
  } finally {
    if (client.isOpen) {
      client.destroy();
    }
  }
}
