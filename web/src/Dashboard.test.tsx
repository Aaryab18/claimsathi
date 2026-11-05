import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import * as client from "./api/client";
import { sampleCaseResult } from "@claimsathi/contracts";

describe("ClaimSathi Dashboard", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/case/sample");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
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

    // Switch back to English
    const englishBtn = screen.getByRole("button", { name: "English" });
    fireEvent.click(englishBtn);

    expect(
      screen.getByText(/The insurer cut ₹24,133 from the pharmacy bill/i),
    ).toBeTruthy();
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
    it("displays 'Source check pending' and never shows unverified placeholder as a real law", async () => {
      render(<App />);

      await screen.findByTestId("recoverable-amount");

      // Open finding F1 (which has verified: false)
      const f1Row = screen.getByTestId("finding-row-F1");
      fireEvent.click(f1Row);

      const dialog = screen.getByRole("dialog");

      // Check for "Source check pending" badge
      const pendingBadges = within(dialog).getAllByText("Source check pending");
      expect(pendingBadges.length).toBeGreaterThan(0);

      // Verify placeholder text is NOT rendered as established law
      expect(within(dialog).queryByText("Member C")).toBeNull();
    });

    it("displays 'Date pending' when a deadline date is null and never makes one up", async () => {
      render(<App />);

      await screen.findByTestId("recoverable-amount");

      const datePendingBadges = screen.getAllByTestId("deadline-date-pending");
      expect(datePendingBadges.length).toBe(2);
      expect(datePendingBadges[0].textContent).toBe("Date pending");
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
  });
});
