import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { App } from "./App";
import { SystemStatus } from "./SystemStatus";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("VITE_API_URL", "https://api.example.com");
});

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("shows ClaimSathi", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

  render(<App />);

  expect(screen.getByRole("heading", { name: "ClaimSathi" })).toBeTruthy();
  await screen.findByText("System ready");
});

it('shows "Checking system..." while waiting for the API', () => {
  fetchMock.mockReturnValue(new Promise(() => {}));

  render(<App />);

  expect(screen.getByRole("status").textContent).toBe("Checking system...");
});

it('shows "System ready" when /readyz succeeds', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

  render(<App />);

  await screen.findByText("System ready");
  expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example.com/readyz");
});

it('shows "System unavailable" when /readyz returns 503, and the page still works', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

  render(<App />);

  await screen.findByText("System unavailable");
  expect(screen.getByRole("heading", { name: "ClaimSathi" })).toBeTruthy();
});

it('shows "System unavailable" when the API is down, and the page still works', async () => {
  fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

  render(<App />);

  await screen.findByText("System unavailable");
  expect(screen.getByRole("heading", { name: "ClaimSathi" })).toBeTruthy();
});

it('shows "System unavailable" when the API never answers', async () => {
  fetchMock.mockImplementation(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }),
  );

  render(<SystemStatus timeoutMs={10} />);

  await screen.findByText("System unavailable");
});

it('shows "System unavailable" without calling anything when VITE_API_URL is not set', async () => {
  vi.stubEnv("VITE_API_URL", "");

  render(<App />);

  await screen.findByText("System unavailable");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("handles a trailing slash in VITE_API_URL", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.com/");
  fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

  render(<App />);

  await screen.findByText("System ready");
  expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example.com/readyz");
});
