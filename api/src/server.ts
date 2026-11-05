import { createApp } from "./app.js";
import { checkDatabase, checkQueue } from "./readiness.js";

const port = Number(process.env.PORT ?? 3000);

const app = createApp({
  allowedOrigin: process.env.ALLOWED_ORIGIN,
  checks: {
    database: () => checkDatabase(process.env.DATABASE_URL),
    queue: () => checkQueue(process.env.REDIS_URL),
  },
});

app.listen(port, () => {
  console.log(`ClaimSathi API listening on port ${port}`);
});
