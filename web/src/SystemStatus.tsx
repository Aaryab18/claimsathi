import { useEffect, useState } from "react";

// A free Render service takes about a minute to wake up after being idle.
const STATUS_TIMEOUT_MS = 75000;

type Status = "checking" | "ready" | "unavailable";

const MESSAGES: Record<Status, string> = {
  checking: "Checking system...",
  ready: "System ready",
  unavailable: "System unavailable",
};

export function SystemStatus({ timeoutMs = STATUS_TIMEOUT_MS }: { timeoutMs?: number }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const apiUrl: string | undefined = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      setStatus("unavailable");
      return;
    }

    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    fetch(`${apiUrl.replace(/\/+$/, "")}/readyz`, { signal: controller.signal })
      .then((response) => {
        if (active) {
          setStatus(response.ok ? "ready" : "unavailable");
        }
      })
      .catch(() => {
        if (active) {
          setStatus("unavailable");
        }
      })
      .finally(() => clearTimeout(timer));

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [timeoutMs]);

  return (
    <p role="status" className="mt-2 text-sm text-gray-500">
      {MESSAGES[status]}
    </p>
  );
}
