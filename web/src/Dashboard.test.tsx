import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import * as client from "./api/client";
import { sampleCaseResult } from "@claimsathi/contracts";

describe("ClaimSathi Dashboard", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/case/sample");
    const defaultMockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const method = (init?.method || (typeof input === "object" && "method" in input ? (input as Request).method : "GET")).toUpperCase();

      if (url.includes("/readyz")) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.endsWith("/cases/sample") && method === "POST") {
        return new Response(
          JSON.stringify({
            caseToken: "sample",
            status: { stage: "done", progressMessage: "Analysis complete" },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/facts") && (method === "PATCH" || method === "POST")) {
        return new Response(
          JSON.stringify(sampleCaseResult),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/cases/")) {
        return new Response(
          JSON.stringify({
            caseToken: "sample",
            status: { stage: "done", progressMessage: "Analysis complete" },
            result: sampleCaseResult,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(null, { status: 200 });
    });
    vi.stubGlobal("fetch", defaultMockFetch);
    vi.stubEnv("VITE_API_URL", "https://api.example.com");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("renders the correct amounts from totals", async () => {
    render(<App />);

    const recoverable = await screen.findByTestId("recoverable-amount");
    expect(recoverable.textContent).toContain("₹71,400");

    const questionable = screen.getByTestId("questionable-amount");
    expect(questionable.textContent).toContain("₹7,800");

    const valid = screen.getByTestId("valid-amount");
    expect(valid.textContent).toContain("₹16,800");

    const total = screen.getByTestId("total-deducted-amount");
    expect(total.textContent).toContain("₹96,000");

    // Check split bar
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toBeTruthy();
  });

  it("reads dynamic amounts from totals rather than hardcoding", async () => {
    const customResult = {
      ...sampleCaseResult,
      totals: {
        totalDeducted: 100000,
        recoverableStrong: 80000,
        questionable: 15000,
        validDeductions: 5000,
      },
    };
    vi.spyOn(client, "getCase").mockResolvedValueOnce({
      caseToken: "sample",
      status: { stage: "done", progressMessage: "Analysis complete" },
      result: customResult,
    });
    vi.spyOn(client, "getCaseResult").mockResolvedValueOnce(customResult);

    render(<App />);

    const recoverable = await screen.findByTestId("recoverable-amount");
    expect(recoverable.textContent).toContain("₹80,000");

    const questionable = screen.getByTestId("questionable-amount");
    expect(questionable.textContent).toContain("₹15,000");

    const valid = screen.getByTestId("valid-amount");
    expect(valid.textContent).toContain("₹5,000");
  });

  it("renders verdict labels honestly with icons and words", async () => {
    render(<App />);

    await screen.findByTestId("recoverable-amount");

    // Must say "Likely wrongly denied", never "wrongly denied" alone
    const wrongBadges = screen.getAllByTestId("verdict-wrong");
    expect(wrongBadges.length).toBeGreaterThan(0);
    for (const badge of wrongBadges) {
      expect(badge.textContent).toContain("Likely wrongly denied");
      // Ensure SVG icon is inside the badge (never rely on color alone)
      expect(badge.querySelector("svg")).not.toBeNull();
    }

    const questionableBadges = screen.getAllByTestId("verdict-questionable");
    expect(questionableBadges.length).toBeGreaterThan(0);
    for (const badge of questionableBadges) {
      expect(badge.textContent).toContain("Questionable");
      expect(badge.querySelector("svg")).not.toBeNull();
    }

    const validBadges = screen.getAllByTestId("verdict-valid");
    expect(validBadges.length).toBeGreaterThan(0);
    for (const badge of validBadges) {
      expect(badge.textContent).toContain("Valid");
      expect(badge.querySelector("svg")).not.toBeNull();
    }
  });

  it("switches language between English and Hindi", async () => {
    render(<App />);

    await screen.findByTestId("recoverable-amount");

    // Default English explanation
    expect(
      screen.getByText(/The insurer cut ₹24,133 from the pharmacy bill/i),
    ).toBeTruthy();

    // Click Hindi switch
    const hindiBtn = screen.getByRole("button", { name: "हिंदी" });
    fireEvent.click(hindiBtn);

    // Hindi text should now be visible
    expect(
      screen.getByText(/बीमा कंपनी ने दवाइयों के बिल से ₹24,133/i),
    ).toBeTruthy();

    // Hindi verdict label
    const hindiWrongBadges = screen.getAllByTestId("verdict-wrong");
    expect(hindiWrongBadges[0].textContent).toContain("संभावित रूप से गलत कटौती");

    // Hindi deadline explanations and no legal team claims
    expect(screen.getByText(/पहले बीमा कंपनी को लिखित शिकायत भेजें/)).toBeTruthy();
    expect(screen.queryByText(/हमारी कानूनी टीम/)).toBeNull();

    // Hindi translated deadline labels
    expect(screen.getByText("बीमा कंपनी को शिकायत")).toBeTruthy();
    expect(screen.getByText("लोकपाल (ओम्बड्समैन) को शिकायत")).toBeTruthy();
    expect(screen.getAllByText("स्थिति:").length).toBe(2);

    // Switch back to English
    const englishBtn = screen.getByRole("button", { name: "English" });
    fireEvent.click(englishBtn);

    expect(
      screen.getByText(/The insurer cut ₹24,133 from the pharmacy bill/i),
    ).toBeTruthy();

    // English deadline labels
    expect(screen.getByText("Grievance to the insurer")).toBeTruthy();
    expect(screen.getByText("Complaint to the ombudsman")).toBeTruthy();
    expect(screen.getAllByText("Status:").length).toBe(2);
  });

  it("opens evidence view on row click and closes easily", async () => {
    render(<App />);

    await screen.findByTestId("recoverable-amount");

    // Dialog should not be open yet
    expect(screen.queryByRole("dialog")).toBeNull();

    // Click finding row F1
    const f1Row = screen.getByTestId("finding-row-F1");
    fireEvent.click(f1Row);

    // Dialog is now open
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();

    // Shows insurer's exact words
    expect(
      within(dialog).getByText(
        /Pharmacy and implant charges are reduced proportionately/i,
      ),
    ).toBeTruthy();

    // Shows relevant policy clause
    expect(
      within(dialog).getByText(
        /Clause 4.2: Room rent is payable up to Rs. 5,000 per day./i,
      ),
    ).toBeTruthy();

    // Close button works
    const closeBtn = within(dialog).getByTestId("close-evidence-modal");
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes evidence modal on Escape key press", async () => {
    render(<App />);

    await screen.findByTestId("recoverable-amount");

    const f1Row = screen.getByTestId("finding-row-F1");
    fireEvent.click(f1Row);

    expect(screen.getByRole("dialog")).toBeTruthy();

    // Press Escape
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  describe("Honesty Rules", () => {
    it("shows the official source with an honest status, and never presents a placeholder as law", async () => {
      render(<App />);

      await screen.findByTestId("recoverable-amount");

      // F1 relies on a 2020 circular that may have been replaced in 2024.
      fireEvent.click(screen.getByTestId("finding-row-F1"));
      let dialog = screen.getByRole("dialog");
      expect(within(dialog).getByTestId("regulation-confirming")).toBeTruthy();
      expect(within(dialog).getByText("Official source found, still confirming it applies")).toBeTruthy();
      expect(within(dialog).getByRole("link", { name: "Read the official source" }).getAttribute("href")).toMatch(/^https:\/\/irdai\.gov\.in\//);
      expect(within(dialog).queryByText(/legal research team/i)).toBeNull();
      expect(within(dialog).queryByText(/Member C/)).toBeNull();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog")).toBeNull();

      // F3 relies on the moratorium clause, read in the 2024 Master Circular.
      fireEvent.click(screen.getByTestId("finding-row-F3"));
      dialog = screen.getByRole("dialog");
      expect(within(dialog).getByTestId("regulation-verified")).toBeTruthy();
    });

    it("displays 'Date pending' when a deadline date is null and never makes one up", async () => {
      render(<App />);

      await screen.findByTestId("recoverable-amount");

      const datePendingBadges = screen.getAllByTestId("deadline-date-pending");
      expect(datePendingBadges.length).toBe(1);
      expect(datePendingBadges[0].textContent).toBe("Date pending");
      expect(screen.getByText(/We found no fixed legal deadline/)).toBeTruthy();
      expect(screen.getByText(/Safest last date/)).toBeTruthy();
      expect(screen.queryByText(/legal team/i)).toBeNull();
    });

    it("displays 'Sample case' badge when resultSource is saved_sample", async () => {
      render(<App />);

      await screen.findByTestId("recoverable-amount");

      expect(screen.getByText("Sample case")).toBeTruthy();
    });

    it("displays 'Information, not legal advice' disclaimers", async () => {
      render(<App />);

      await screen.findByTestId("recoverable-amount");

      const disclaimers = screen.getAllByText(/Information, not legal advice/i);
      expect(disclaimers.length).toBeGreaterThan(0);
    });

    it("shows waking message while waiting for the server", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

      render(<App />);

      expect(screen.getByTestId("waking-message")).toBeTruthy();
      expect(
        screen.getByText(/Starting the server, this can take up to a minute/i),
      ).toBeTruthy();
    });

    it("shows the saved sample labelled 'Offline copy: corrections are unavailable' and disables Apply corrections when API can't be reached", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

      render(<App />);

      await screen.findByTestId("recoverable-amount");

      expect(
        screen.getAllByText(/Offline copy: corrections are unavailable/i).length,
      ).toBeGreaterThan(0);
      const applyBtn = screen.getByTestId("apply-corrections-btn") as HTMLButtonElement;
      expect(applyBtn.disabled).toBe(true);
    });

    it("updates numbers and breakdown from API response after a successful correction", async () => {
      const updatedCaseResult = {
        ...sampleCaseResult,
        totals: {
          totalDeducted: 96000,
          recoverableStrong: 55000,
          questionable: 10000,
          validDeductions: 31000,
        },
      };

      const mockFetchWithPatch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url.includes("/facts")) {
          return new Response(JSON.stringify(updatedCaseResult), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url.includes("/cases/")) {
          return new Response(
            JSON.stringify({
              caseToken: "sample",
              status: { stage: "done", progressMessage: "Analysis complete" },
              result: sampleCaseResult,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      });

      vi.stubGlobal("fetch", mockFetchWithPatch);

      render(<App />);

      await screen.findByTestId("recoverable-amount");
      expect(screen.getByTestId("recoverable-amount").textContent).toContain("₹71,400");
      expect(screen.queryByTestId("preview-only-note")).toBeNull();

      // Submit corrections
      const applyBtn = screen.getByTestId("apply-corrections-btn");
      fireEvent.click(applyBtn);

      // Verify numbers updated
      await waitFor(() => {
        expect(screen.getByTestId("recoverable-amount").textContent).toContain("₹55,000");
      });

      // Verify preview only note remains absent
      expect(screen.queryByTestId("preview-only-note")).toBeNull();

      // Verify success status
      expect(screen.getByTestId("corrections-applied-status")).toBeTruthy();
    });

    it("shows an error message and does not update numbers when a correction fails", async () => {
      const mockFetchWithError = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url.includes("/facts")) {
          return new Response(JSON.stringify({ error: "Service unavailable" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url.includes("/cases/")) {
          return new Response(
            JSON.stringify({
              caseToken: "sample",
              status: { stage: "done", progressMessage: "Analysis complete" },
              result: sampleCaseResult,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      });

      vi.stubGlobal("fetch", mockFetchWithError);

      render(<App />);

      await screen.findByTestId("recoverable-amount");
      expect(screen.getByTestId("recoverable-amount").textContent).toContain("₹71,400");

      // Submit corrections
      const applyBtn = screen.getByTestId("apply-corrections-btn");
      fireEvent.click(applyBtn);

      // Expect error alert
      const errorAlert = await screen.findByTestId("apply-facts-error");
      expect(errorAlert).toBeTruthy();

      // Numbers must NOT be altered or presented as if correction worked
      expect(screen.getByTestId("recoverable-amount").textContent).toContain("₹71,400");
      expect(screen.queryByTestId("corrections-applied-status")).toBeNull();
    });

    it("handles a trailing slash in VITE_API_URL when calling the API", async () => {
      vi.stubEnv("VITE_API_URL", "https://api.example.com///");
      const urlsCalled: string[] = [];
      const trackingFetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        urlsCalled.push(url);
        return new Response(
          JSON.stringify({
            caseToken: "sample-token",
            status: { stage: "done", progressMessage: "Done" },
            result: sampleCaseResult,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      });
      vi.stubGlobal("fetch", trackingFetch);

      await client.getCase("sample-token");
      expect(urlsCalled[0]).toBe("https://api.example.com/cases/sample-token");
    });
  });
});
