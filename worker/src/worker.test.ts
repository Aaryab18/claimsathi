import { expect, it, vi } from "vitest";
import { STARTUP_MESSAGE, startWorker } from "./worker.js";

it("logs a startup message", () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});

  startWorker();

  expect(log).toHaveBeenCalledWith(STARTUP_MESSAGE);
  log.mockRestore();
});
