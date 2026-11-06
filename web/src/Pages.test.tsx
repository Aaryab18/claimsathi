import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import * as client from "./api/client";
import { sampleCaseResult } from "@claimsathi/contracts";

const caseResponse = () =>
  new Response(JSON.stringify({ caseToken: "case-1", status: { stage: "done", progressMessage: "Done" }, result: sampleCaseResult }));

describe("the case dashboard pages", () => {
  beforeEach(() => {
    client.clearMockCases();
    vi.stubEnv("VITE_API_URL", "https://api.example.com");
    vi.stubGlobal("fetch", vi.fn(async () => caseResponse()));
  });

  afterEach(() => {
    cleanup();
    client.clearMockCases();
    vi.restoreAllMocks();
  });

  it("shows one page at a time and moves between them", async () => {
    render(<App initialEntries={["/case/case-1"]} />);

    expect((await screen.findByTestId("page-overview")).className).not.toMatch(/(^| )hidden( |$)/);
    expect(screen.getByTestId("page-letters").className).toMatch(/(^| )hidden( |$)/);

    fireEvent.click(screen.getByTestId("nav-letters"));

    await waitFor(() => expect(screen.getByTestId("page-letters").className).not.toMatch(/(^| )hidden( |$)/));
    expect(screen.getByTestId("page-overview").className).toMatch(/(^| )hidden( |$)/);
  });

  it("opens a page straight from its address", async () => {
    render(<App initialEntries={["/case/case-1/evidence"]} />);

    const page = await screen.findByTestId("page-evidence");
    expect(page.className).not.toMatch(/(^| )hidden( |$)/);
    expect(within(page).getAllByTestId(/^evidence-/).length).toBeGreaterThan(0);
  });

  it("explains that the saved sample has no file to check quotes against", async () => {
    render(<App initialEntries={["/case/case-1/evidence"]} />);

    const page = await screen.findByTestId("page-evidence");
    expect(within(page).getAllByText(/This is the saved sample case/).length).toBeGreaterThan(0);
    expect(within(page).queryByText(/for example because it is a photo/)).toBeNull();
  });

  it("falls back to the overview for an unknown page", async () => {
    render(<App initialEntries={["/case/case-1/nonsense"]} />);

    expect((await screen.findByTestId("page-overview")).className).not.toMatch(/(^| )hidden( |$)/);
  });

  it("asks for the letter in the chosen language", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      String(input).endsWith("/letters")
        ? new Response(JSON.stringify({ letterType: "grievance", text: "महोदय/महोदया" }))
        : caseResponse(),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<App initialEntries={["/case/case-1/letters"]} />);

    fireEvent.change(await screen.findByTestId("letter-language"), { target: { value: "hi" } });
    fireEvent.click(screen.getByTestId("letter-grievance-btn"));

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/letters")) as unknown[] | undefined;
      expect(JSON.parse(String((call?.[1] as RequestInit | undefined)?.body))).toEqual({ letterType: "grievance", language: "hi" });
    });
  });
});

describe("the rules and sources page", () => {
  afterEach(cleanup);

  it("lists every rule with its status and an official link where there is one", () => {
    render(<App initialEntries={["/rules"]} />);

    for (const id of ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"]) {
      expect(screen.getByTestId(`rule-${id}`)).toBeTruthy();
    }
    const r1 = screen.getByTestId("rule-R1");
    expect(within(r1).getByText("Official source checked")).toBeTruthy();
    expect(within(r1).getByRole("link", { name: "Read the official source" }).getAttribute("href")).toMatch(/^https:\/\/irdai\.gov\.in\//);
    expect(within(screen.getByTestId("rule-R4")).getByText("Official source found, still confirming it applies")).toBeTruthy();
    expect(within(screen.getByTestId("rule-R2")).queryByRole("link")).toBeNull();
  });
});

describe("the progress checklist", () => {
  beforeEach(() => {
    client.clearMockCases();
    vi.stubEnv("VITE_API_URL", "https://api.example.com");
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const done = (id: string) => screen.getByTestId(`progress-${id}`).getAttribute("data-done");

  it("ticks only what the person has done", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).endsWith("/letters")
          ? new Response(JSON.stringify({ letterType: "grievance", text: "Dear Sir or Madam" }))
          : caseResponse(),
      ),
    );
    render(<App initialEntries={["/case/case-1"]} />);

    expect((await screen.findByTestId("progress-checklist")).textContent).toContain("1 of 5 done");
    expect(done("result")).toBe("true");
    expect(done("letter")).toBe("false");
    expect(done("call")).toBe("false");

    fireEvent.click(screen.getByTestId("nav-letters"));
    fireEvent.click(await screen.findByTestId("letter-grievance-btn"));
    await screen.findByTestId("letter-text");
    fireEvent.change(screen.getByTestId("grievance-reference"), { target: { value: "GRV-1" } });

    await waitFor(() => expect(done("letter")).toBe("true"));
    expect(done("call")).toBe("true");
    expect(screen.getByTestId("progress-checklist").textContent).toContain("3 of 5 done");
  });

  it("counts the complaint as sent once its date gives a reply date", async () => {
    const sent = {
      ...sampleCaseResult,
      deadlines: sampleCaseResult.deadlines.map((deadline) =>
        deadline.label === "Grievance to the insurer" ? { ...deadline, date: "2026-12-05" } : deadline,
      ),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ caseToken: "case-1", status: { stage: "done", progressMessage: "Done" }, result: sent }))),
    );
    render(<App initialEntries={["/case/case-1"]} />);

    await screen.findByTestId("progress-checklist");
    expect(done("sent")).toBe("true");
  });
});
