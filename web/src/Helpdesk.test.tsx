import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { sampleCaseResult, type Finding } from "@claimsathi/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { caseStrength } from "./lib/case-strength";
import { canOpenCase, DEMO_CASES, loadCases, recordCase } from "./lib/helpdesk";
import { translations } from "./lib/i18n";

const finding = (changes: Partial<Finding>): Finding => ({ ...sampleCaseResult.findings[0]!, ...changes });

beforeEach(() => {
  window.localStorage.clear();
  vi.stubEnv("VITE_API_URL", "https://api.example.com");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) =>
      String(input).includes("/cases/")
        ? new Response(
            JSON.stringify({ caseToken: "case-1", status: { stage: "done", progressMessage: "Done" }, result: sampleCaseResult }),
          )
        : new Response(null, { status: 200 }),
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("case strength", () => {
  it("gives full weight only to strong grounds, and none to valid deductions", () => {
    expect(caseStrength([finding({ amount: 100, verdict: "wrong", confidence: "strong" })])?.score).toBe(100);
    expect(caseStrength([finding({ amount: 100, verdict: "wrong", confidence: "moderate" })])?.score).toBe(70);
    expect(caseStrength([finding({ amount: 100, verdict: "questionable", confidence: "moderate" })])?.score).toBe(25);
    expect(caseStrength([finding({ amount: 100, verdict: "valid", confidence: "strong" })])?.score).toBe(0);
  });

  it("puts scores in bands", () => {
    expect(caseStrength([finding({ amount: 100, verdict: "wrong", confidence: "strong" })])?.band).toBe("strong");
    expect(caseStrength([finding({ amount: 100, verdict: "wrong", confidence: "weak" })])?.band).toBe("fair");
    expect(caseStrength([finding({ amount: 100, verdict: "valid", confidence: "strong" })])?.band).toBe("limited");
  });

  it("gives no score when nothing was deducted", () => {
    expect(caseStrength([])).toBeNull();
  });

  it("says on screen that it doesn't predict winning, and how it's worked out", async () => {
    render(<App initialEntries={["/case/case-1"]} />);

    const card = await screen.findByTestId("case-strength");

    expect(card.textContent).toContain("isn't a prediction of winning");
    expect(card.textContent).toContain("not data from past cases");
  });
});

describe("the helpdesk dashboard", () => {
  it("starts empty, and clearly labels the demo cases as made up", () => {
    render(<App initialEntries={["/helpdesk"]} />);
    expect(screen.getByTestId("helpdesk-empty")).toBeTruthy();

    fireEvent.click(screen.getByTestId("helpdesk-load-demo"));

    expect(screen.getByTestId("helpdesk-demo-banner").textContent).toContain("made up");
    expect(within(screen.getByTestId("helpdesk-cases")).getAllByRole("listitem")).toHaveLength(DEMO_CASES.length);
  });

  it("adds up the cases", () => {
    window.localStorage.setItem("claimsathi.helpdesk", JSON.stringify(DEMO_CASES.slice(0, 2)));
    render(<App initialEntries={["/helpdesk"]} />);

    expect(screen.getByTestId("kpi-Cases").textContent).toBe("2");
    expect(screen.getByTestId("kpi-Total deducted").textContent).toBe("₹1,97,500");
    expect(screen.getByTestId("kpi-Likely recoverable").textContent).toBe("₹79,400");
  });

  it("lists the nearest deadline first, with resolved cases last", () => {
    window.localStorage.setItem("claimsathi.helpdesk", JSON.stringify(DEMO_CASES));
    render(<App initialEntries={["/helpdesk"]} />);

    const rows = within(screen.getByTestId("helpdesk-cases")).getAllByRole("listitem");

    expect(rows[0]?.textContent).toContain("Demo 6");
    expect(rows[rows.length - 1]?.textContent).toContain("Demo 4");
  });

  it("remembers a status change", () => {
    window.localStorage.setItem("claimsathi.helpdesk", JSON.stringify(DEMO_CASES.slice(0, 1)));
    render(<App initialEntries={["/helpdesk"]} />);

    fireEvent.change(screen.getByTestId("status-demo-Demo 1"), { target: { value: "resolved" } });

    expect(loadCases()[0]?.status).toBe("resolved");
  });

  it("can be cleared", () => {
    window.localStorage.setItem("claimsathi.helpdesk", JSON.stringify(DEMO_CASES));
    render(<App initialEntries={["/helpdesk"]} />);

    fireEvent.click(screen.getByTestId("helpdesk-clear"));

    expect(loadCases()).toEqual([]);
    expect(screen.getByTestId("helpdesk-empty")).toBeTruthy();
  });
});

describe("recording cases", () => {
  const live = { ...sampleCaseResult, caseToken: "tok-1", resultSource: "live" as const };

  it("saves a read case without any patient name", () => {
    recordCase(live);

    const saved = window.localStorage.getItem("claimsathi.helpdesk") ?? "";
    expect(loadCases()[0]).toMatchObject({ id: "tok-1", reference: "Case 1", recoverable: 71400, status: "new" });
    expect(saved).not.toContain("Suresh");
  });

  it("doesn't add sample results", () => {
    recordCase(sampleCaseResult);

    expect(loadCases()).toEqual([]);
  });

  it("updates a corrected case and keeps its status", () => {
    recordCase(live);
    window.localStorage.setItem(
      "claimsathi.helpdesk",
      JSON.stringify(loadCases().map((item) => ({ ...item, status: "complained" }))),
    );

    recordCase({ ...live, totals: { ...live.totals, recoverableStrong: 50800 } });

    expect(loadCases()).toHaveLength(1);
    expect(loadCases()[0]).toMatchObject({ recoverable: 50800, status: "complained" });
  });

  it("stops offering a case's link once the API has deleted it", () => {
    recordCase(live);
    const saved = loadCases()[0]!;
    const addedAt = new Date(saved.addedAt).getTime();

    expect(canOpenCase(saved, addedAt + 1000)).toBe(true);
    expect(canOpenCase(saved, addedAt + 25 * 60 * 60 * 1000)).toBe(false);
  });

  it("never offers a link for a demo case", () => {
    expect(canOpenCase(DEMO_CASES[0]!)).toBe(false);
  });
});

describe("Kannada", () => {
  it("translates every label", () => {
    for (const key of Object.keys(translations.en) as (keyof typeof translations.en)[]) {
      expect(translations.kn[key], key).toBeTruthy();
    }
  });

  it("switches the home page, and says the case text stays in English", async () => {
    render(<App initialEntries={["/case/case-1"]} />);
    await screen.findByTestId("recoverable-amount");

    fireEvent.click(screen.getByRole("button", { name: "ಕನ್ನಡ" }));

    expect(screen.getByText(translations.kn.findingsTitle)).toBeTruthy();
    expect(screen.getByTestId("case-text-english-note")).toBeTruthy();
    expect(screen.getByText(translations.kn.deadlineGrievanceLabel)).toBeTruthy();
  });

  it("doesn't show the English note in English or Hindi", async () => {
    render(<App initialEntries={["/case/case-1"]} />);
    await screen.findByTestId("recoverable-amount");

    expect(screen.queryByTestId("case-text-english-note")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "हिंदी" }));
    expect(screen.queryByTestId("case-text-english-note")).toBeNull();
  });
});

describe("the home page", () => {
  it("links to the helpdesk dashboard", () => {
    render(<App initialEntries={["/"]} />);

    expect(screen.getByRole("link", { name: translations.en.navHelpdesk })).toBeTruthy();
  });
});
