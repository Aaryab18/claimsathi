import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import * as client from "./api/client";
import { sampleCaseResult } from "@claimsathi/contracts";

describe("ClaimSathi New Screens", () => {
  beforeEach(() => {
    client.clearMockCases();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    vi.stubEnv("VITE_API_URL", "https://api.example.com");
  });

  afterEach(() => {
    cleanup();
    client.clearMockCases();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe("Home Screen (/)", () => {
    it("renders headline for a worried family, short explanation, and demo notice", () => {
      render(<App initialEntries={["/"]} />);

      expect(
        screen.getByText("Has your health insurance claim been rejected or cut short?"),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /Upload your rejection letter, policy, and hospital bill/i,
        ),
      ).toBeTruthy();
      expect(
        screen.getByText("This is a demo. Please do not upload real medical documents."),
      ).toBeTruthy();
    });

    it("shows file type error when a non-PDF/JPG/PNG file is selected", () => {
      render(<App initialEntries={["/"]} />);

      const rejectionInput = screen.getByTestId("file-rejection");
      const invalidFile = new File(["dummy text"], "notes.txt", { type: "text/plain" });

      fireEvent.change(rejectionInput, { target: { files: [invalidFile] } });

      const error = screen.getByTestId("error-rejection");
      expect(error.textContent).toBe("Only PDF, JPG, and PNG files are allowed.");
    });

    it("shows file size error when a file larger than 10MB is selected", () => {
      render(<App initialEntries={["/"]} />);

      const billInput = screen.getByTestId("file-bill");
      // 10MB + 1 byte
      const oversizedFile = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big-bill.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(billInput, { target: { files: [oversizedFile] } });

      const error = screen.getByTestId("error-bill");
      expect(error.textContent).toBe("File is larger than the 10 MB limit.");
    });

    it("keeps the Analyse button disabled until all three files are chosen", async () => {
      render(<App initialEntries={["/"]} />);

      const analyseBtn = screen.getByTestId("analyse-btn") as HTMLButtonElement;
      expect(analyseBtn.disabled).toBe(true);
      expect(screen.getByTestId("analyse-hint")).toBeTruthy();

      const validRejection = new File(["rejection"], "rejection.pdf", { type: "application/pdf" });
      const validPolicy = new File(["policy"], "policy.jpg", { type: "image/jpeg" });
      const validBill = new File(["bill"], "bill.png", { type: "image/png" });

      // Add only rejection
      fireEvent.change(screen.getByTestId("file-rejection"), { target: { files: [validRejection] } });
      expect(analyseBtn.disabled).toBe(true);

      // Add policy
      fireEvent.change(screen.getByTestId("file-policy"), { target: { files: [validPolicy] } });
      expect(analyseBtn.disabled).toBe(true);

      // Add hospital bill - all 3 now present
      fireEvent.change(screen.getByTestId("file-bill"), { target: { files: [validBill] } });
      expect(analyseBtn.disabled).toBe(false);

      // Clicking analyse triggers case creation and navigation
      const createCaseSpy = vi.spyOn(client, "createCase");
      fireEvent.click(analyseBtn);

      await waitFor(() => {
        expect(createCaseSpy).toHaveBeenCalled();
      });
    });

    it("navigates directly when clicking 'Try sample case' button without files", async () => {
      render(<App initialEntries={["/"]} />);

      const trySampleBtn = screen.getByTestId("try-sample-btn");
      expect(trySampleBtn).toBeTruthy();

      const sampleSpy = vi.spyOn(client, "createSampleCase");
      fireEvent.click(trySampleBtn);

      await waitFor(() => {
        expect(sampleSpy).toHaveBeenCalled();
      });
    });

    it("switches language between English and Hindi on Home screen", () => {
      render(<App initialEntries={["/"]} />);

      expect(
        screen.getByText("Has your health insurance claim been rejected or cut short?"),
      ).toBeTruthy();

      // Switch to Hindi
      fireEvent.click(screen.getByRole("button", { name: "हिंदी" }));

      expect(
        screen.getByText("क्या आपका हेल्थ इंश्योरेंस क्लेम खारिज या कम कर दिया गया है?"),
      ).toBeTruthy();
      expect(
        screen.getByText("यह एक डेमो है। कृपया असली मेडिकल दस्तावेज़ अपलोड न करें।"),
      ).toBeTruthy();
      expect(screen.getByText("सैंपल केस देखें →")).toBeTruthy();

      // Switch back to English
      fireEvent.click(screen.getByRole("button", { name: "English" }));
      expect(
        screen.getByText("Has your health insurance claim been rejected or cut short?"),
      ).toBeTruthy();
    });
  });

  describe("Progress Screen (/case/:token)", () => {
    it("displays the queued stage in simple words without fake percentages", async () => {
      client.setMockCaseStatus("test-case-queued", {
        stage: "queued",
        progressMessage: "Case queued",
      });

      render(<App initialEntries={["/case/test-case-queued"]} />);

      const stageItem = await screen.findByTestId("stage-queued");
      expect(stageItem.textContent).toContain("Queued");
      expect(stageItem.textContent).toContain("In line for automated analysis");

      // Verify no fake percentage like "45%" or "%"
      const progressCard = screen.getByTestId("progress-card");
      expect(progressCard.textContent).not.toMatch(/\d+%/);
    });

    it("displays the reading stage in simple words", async () => {
      client.setMockCaseStatus("test-case-reading", {
        stage: "reading",
        progressMessage: "Reading files",
      });

      render(<App initialEntries={["/case/test-case-reading"]} />);

      const stageItem = await screen.findByTestId("stage-reading");
      expect(stageItem.textContent).toContain("Reading documents");
      expect(stageItem.getAttribute("data-status")).toBe("active");
    });

    it("displays the checking stage in simple words", async () => {
      client.setMockCaseStatus("test-case-checking", {
        stage: "checking",
        progressMessage: "Checking rules",
      });

      render(<App initialEntries={["/case/test-case-checking"]} />);

      const stageItem = await screen.findByTestId("stage-checking");
      expect(stageItem.textContent).toContain("Checking rules");
      expect(stageItem.getAttribute("data-status")).toBe("active");
    });

    it("displays the drafting stage in simple words", async () => {
      client.setMockCaseStatus("test-case-drafting", {
        stage: "drafting",
        progressMessage: "Drafting findings",
      });

      render(<App initialEntries={["/case/test-case-drafting"]} />);

      const stageItem = await screen.findByTestId("stage-drafting");
      expect(stageItem.textContent).toContain("Drafting findings");
      expect(stageItem.getAttribute("data-status")).toBe("active");
    });

    it("shows friendly message and retry button when stage is failed", async () => {
      client.setMockCaseStatus("test-case-failed", {
        stage: "failed",
        progressMessage: "Stopped",
        errorMessage: "This file could not be read",
      });

      render(<App initialEntries={["/case/test-case-failed"]} />);

      const alert = await screen.findByRole("alert");
      expect(alert.textContent).toContain("Analysis could not be completed");
      expect(alert.textContent).toContain("This file could not be read");

      const retryBtn = screen.getByTestId("retry-btn");
      expect(retryBtn).toBeTruthy();

      const backHomeBtn = screen.getByTestId("back-home-btn");
      expect(backHomeBtn).toBeTruthy();

      // Clicking retry triggers a re-check
      const resetSpy = vi.spyOn(client, "resetCaseProgress");
      fireEvent.click(retryBtn);
      expect(resetSpy).toHaveBeenCalledWith("test-case-failed");
    });

    it("switches language between English and Hindi on Progress screen", async () => {
      client.setMockCaseStatus("test-case-lang", {
        stage: "reading",
        progressMessage: "Reading documents",
      });

      render(<App initialEntries={["/case/test-case-lang"]} />);

      expect(await screen.findByText("Analysing your claim")).toBeTruthy();

      // Switch to Hindi
      fireEvent.click(screen.getByRole("button", { name: "हिंदी" }));

      expect(screen.getByText("आपके क्लेम का विश्लेषण हो रहा है")).toBeTruthy();
      expect(screen.getByText("दस्तावेज़ पढ़े जा रहे हैं")).toBeTruthy();
      expect(screen.getByText("नियमों की जांच")).toBeTruthy();
    });
  });

  describe("Confirm the facts panel on results screen", () => {
    it("renders the preview-only note and editable date inputs", async () => {
      render(<App initialEntries={["/case/sample"]} />);

      await screen.findByTestId("recoverable-amount");

      // Verify panel and preview-only note
      const panel = screen.getByTestId("confirm-facts-panel");
      expect(panel).toBeTruthy();

      const previewNote = screen.getByTestId("preview-only-note");
      expect(previewNote.textContent).toContain("Preview only: corrections are not active yet");

      // Verify date inputs with existing extracted dates
      const startDateInput = screen.getByTestId("fact-policy-start-date") as HTMLInputElement;
      expect(startDateInput.value).toBe(sampleCaseResult.extracted.policy.startDate);

      const coverDateInput = screen.getByTestId("fact-continuous-cover") as HTMLInputElement;
      expect(coverDateInput.value).toBe(sampleCaseResult.extracted.policy.continuousCoverSince);

      const admissionDateInput = screen.getByTestId("fact-admission-date") as HTMLInputElement;
      expect(admissionDateInput.value).toBe(sampleCaseResult.extracted.claim.admissionDate);
    });

    it("allows editing dates and bill item categories, and calls applyFacts", async () => {
      render(<App initialEntries={["/case/sample"]} />);

      await screen.findByTestId("recoverable-amount");

      const applyFactsSpy = vi.spyOn(client, "applyFacts");

      // Edit admission date
      const admissionDateInput = screen.getByTestId("fact-admission-date");
      fireEvent.change(admissionDateInput, { target: { value: "2025-11-12" } });

      // Change category of first item L1
      const l1Select = screen.getByTestId("fact-category-select-L1");
      fireEvent.change(l1Select, { target: { value: "procedure" } });

      // Submit form
      const submitBtn = screen.getByTestId("apply-corrections-btn");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(applyFactsSpy).toHaveBeenCalled();
      });

      const calledWithOverrides = applyFactsSpy.mock.calls[0]?.[1];
      expect(calledWithOverrides?.admissionDate).toBe("2025-11-12");
      expect(
        calledWithOverrides?.lineItemCategories?.some(
          (c) => c.lineItemId === "L1" && c.category === "procedure",
        ),
      ).toBe(true);

      // Verify status note remains preview only and results are not falsely altered
      expect(screen.getByTestId("corrections-submitted-status")).toBeTruthy();
      expect(screen.getByTestId("recoverable-amount").textContent).toContain("₹71,400");
    });

    it("switches language between English and Hindi on Confirm Facts panel", async () => {
      render(<App initialEntries={["/case/sample"]} />);

      await screen.findByTestId("recoverable-amount");

      expect(screen.getByText("Confirm the facts")).toBeTruthy();
      expect(screen.getByTestId("preview-only-note").textContent).toContain(
        "Preview only: corrections are not active yet",
      );

      // Switch to Hindi
      fireEvent.click(screen.getByRole("button", { name: "हिंदी" }));

      expect(screen.getByText("तथ्यों की पुष्टि करें")).toBeTruthy();
      expect(screen.getByTestId("preview-only-note").textContent).toContain(
        "केवल पूर्वावलोकन: सुधार अभी सक्रिय नहीं हैं",
      );
      expect(screen.getByText("पॉलिसी प्रारंभ तिथि")).toBeTruthy();
      expect(screen.getByText("अस्पताल में भर्ती की तिथि")).toBeTruthy();
    });
  });
});
