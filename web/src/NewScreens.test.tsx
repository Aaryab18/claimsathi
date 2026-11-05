import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import * as client from "./api/client";
import { sampleCaseResult } from "@claimsathi/contracts";

describe("ClaimSathi New Screens", () => {
  beforeEach(() => {
    client.clearMockCases();
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
            caseToken: "sample-case-123",
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
        const match = url.match(/\/cases\/([^/]+)/);
        const token = match ? match[1] : "sample";
        return new Response(
          JSON.stringify({
            caseToken: token,
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
        screen.getByText(/tested rules/i),
      ).toBeTruthy();
      expect(
        screen.queryByText(/verified rules/i),
      ).toBeNull();
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

    function chooseAllFiles() {
      fireEvent.change(screen.getByTestId("file-rejection"), {
        target: { files: [new File(["rejection"], "rejection.pdf", { type: "application/pdf" })] },
      });
      fireEvent.change(screen.getByTestId("file-policy"), {
        target: { files: [new File(["policy"], "policy.jpg", { type: "image/jpeg" })] },
      });
      fireEvent.change(screen.getByTestId("file-bill"), {
        target: { files: [new File(["bill"], "bill.png", { type: "image/png" })] },
      });
    }

    it("keeps Analyse disabled until all three files are chosen, and says where files go", () => {
      render(<App initialEntries={["/"]} />);

      const analyseBtn = screen.getByTestId("analyse-btn") as HTMLButtonElement;
      expect(analyseBtn.disabled).toBe(true);
      expect(screen.getByTestId("analyse-hint").textContent).toContain("Google's Gemini AI");

      chooseAllFiles();

      expect(analyseBtn.disabled).toBe(false);
    });

    it("uploads the three files under the names the API expects, then opens the case", async () => {
      const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/cases") && init?.method === "POST") {
          return new Response(
            JSON.stringify({ caseToken: "uploaded-1", status: { stage: "queued", progressMessage: "Waiting" } }),
            { status: 201 },
          );
        }
        return new Response(
          JSON.stringify({
            caseToken: "uploaded-1",
            status: { stage: "reading", progressMessage: "Reading your documents." },
            result: null,
          }),
        );
      });
      vi.stubGlobal("fetch", fetchMock);
      render(<App initialEntries={["/"]} />);

      chooseAllFiles();
      fireEvent.click(screen.getByTestId("analyse-btn"));

      await screen.findByTestId("progress-card");
      const upload = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
      const form = upload?.[1]?.body as FormData;
      expect((form.get("rejection_letter") as File).name).toBe("rejection.pdf");
      expect((form.get("policy") as File).name).toBe("policy.jpg");
      expect((form.get("bill") as File).name).toBe("bill.png");
    });

    it("shows the API's message when an upload is refused", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(JSON.stringify({ error: "Live document reading is switched off." }), { status: 503 })),
      );
      render(<App initialEntries={["/"]} />);

      chooseAllFiles();
      fireEvent.click(screen.getByTestId("analyse-btn"));

      expect((await screen.findByRole("alert")).textContent).toContain("switched off");
    });

    it("refuses files that are too big together before uploading", () => {
      const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);
      render(<App initialEntries={["/"]} />);
      const fiveMb = () => new Uint8Array(5 * 1024 * 1024);

      for (const id of ["file-rejection", "file-policy", "file-bill"]) {
        fireEvent.change(screen.getByTestId(id), {
          target: { files: [new File([fiveMb()], "big.pdf", { type: "application/pdf" })] },
        });
      }
      fireEvent.click(screen.getByTestId("analyse-btn"));

      expect(screen.getByRole("alert").textContent).toContain("14 MB");
      expect(fetchMock.mock.calls.filter(([url]: unknown[]) => String(url).endsWith("/cases"))).toEqual([]);
    });

    it("drafts a letter from the API and lets the person edit it", async () => {
      const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).endsWith("/letters")) {
          expect(JSON.parse(String(init?.body))).toEqual({ letterType: "grievance" });
          return new Response(JSON.stringify({ letterType: "grievance", text: "Dear Sir or Madam" }));
        }
        return new Response(
          JSON.stringify({
            caseToken: "case-1",
            status: { stage: "done", progressMessage: "Done" },
            result: sampleCaseResult,
          }),
        );
      });
      vi.stubGlobal("fetch", fetchMock);
      render(<App initialEntries={["/case/case-1"]} />);

      fireEvent.click(await screen.findByTestId("letter-grievance-btn"));

      const letter = (await screen.findByTestId("letter-text")) as HTMLTextAreaElement;
      expect(letter.value).toBe("Dear Sir or Madam");
      fireEvent.change(letter, { target: { value: "Edited" } });
      expect(letter.value).toBe("Edited");
    });

    it("offers a calendar file with only the dates we could work out", async () => {
      render(<App initialEntries={["/case/case-1"]} />);

      const link = (await screen.findByTestId("calendar-download")) as HTMLAnchorElement;
      const file = decodeURIComponent(link.getAttribute("href") ?? "");

      expect(file).toContain("DTSTART;VALUE=DATE:20271015");
      expect(file.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    });

    it("asks for the sent date and sends it with the corrections", async () => {
      const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
        String(input).endsWith("/facts")
          ? new Response(JSON.stringify(sampleCaseResult))
          : new Response(
              JSON.stringify({ caseToken: "case-1", status: { stage: "done", progressMessage: "Done" }, result: sampleCaseResult }),
            ),
      );
      vi.stubGlobal("fetch", fetchMock);
      render(<App initialEntries={["/case/case-1"]} />);

      fireEvent.change(await screen.findByTestId("fact-grievance-sent"), { target: { value: "2026-11-05" } });
      fireEvent.click(screen.getByTestId("apply-corrections-btn"));

      await waitFor(() => {
        const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/facts")) as unknown[] | undefined;
        expect(JSON.parse(String((call?.[1] as RequestInit | undefined)?.body)).grievanceSentDate).toBe("2026-11-05");
      });
    });

    it("shows the rules' warnings on the result, in the chosen language", async () => {
      const warned = {
        ...sampleCaseResult,
        warnings: [{ code: "totals_do_not_match", messageEn: "Totals differ.", messageHi: "कुल अलग हैं।" }],
      };
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          new Response(JSON.stringify({ caseToken: "case-1", status: { stage: "done", progressMessage: "Done" }, result: warned })),
        ),
      );
      render(<App initialEntries={["/case/case-1"]} />);

      expect((await screen.findByTestId("assessment-warnings")).textContent).toContain("Totals differ.");
    });

    it("explains how it works on the home page", () => {
      render(<App initialEntries={["/"]} />);

      expect(screen.getByTestId("how-it-works").textContent).toContain("Fixed rules check each cut");
    });

    it("gives a next-steps plan using the case's own dates", async () => {
      render(<App initialEntries={["/case/case-1"]} />);

      const steps = await screen.findByTestId("next-steps");

      expect(steps.textContent).toContain("Send a complaint to the insurer");
      expect(steps.textContent).toContain("15 Oct 2027");
    });

    it("shows what the bill and the insurer's decision were", async () => {
      render(<App initialEntries={["/case/case-1"]} />);

      expect((await screen.findByTestId("claim-flow")).textContent).toContain("₹2,10,000");
    });

    it("says what a correction changed", async () => {
      const corrected = {
        ...sampleCaseResult,
        totals: { ...sampleCaseResult.totals, recoverableStrong: 50800, questionable: 28400 },
      };
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL) =>
          String(input).endsWith("/facts")
            ? new Response(JSON.stringify(corrected))
            : new Response(
                JSON.stringify({ caseToken: "case-1", status: { stage: "done", progressMessage: "Done" }, result: sampleCaseResult }),
              ),
        ),
      );
      render(<App initialEntries={["/case/case-1"]} />);

      fireEvent.click(await screen.findByTestId("apply-corrections-btn"));

      const change = await screen.findByTestId("correction-change");
      expect(change.textContent).toContain("₹71,400");
      expect(change.textContent).toContain("₹50,800");
    });

    it("shares the summary on WhatsApp without names or a case link", async () => {
      render(<App initialEntries={["/case/case-1"]} />);

      const link = (await screen.findByTestId("whatsapp-share")) as HTMLAnchorElement;
      const text = decodeURIComponent(link.href);

      expect(text).toContain("wa.me");
      expect(text).toContain("₹71,400");
      expect(text).not.toContain("Suresh");
      expect(text).not.toContain("case-1");
    });

    it("only offers to read aloud when the browser has a voice for that language", async () => {
      render(<App initialEntries={["/case/case-1"]} />);

      await screen.findByTestId("whatsapp-share");

      expect(screen.queryByTestId("listen-btn")).toBeNull();
    });

    describe("Ombudsman office finder", () => {
      async function choose(state: string) {
        render(<App initialEntries={["/case/case-1"]} />);
        fireEvent.change(await screen.findByTestId("ombudsman-state"), { target: { value: state } });
        return screen.getByTestId("ombudsman-result");
      }

      it("names the one office for a state with one", async () => {
        expect((await choose("Rajasthan")).textContent).toContain("Insurance Ombudsman, Jaipur");
      });

      it("explains which part of a split state goes where", async () => {
        const text = (await choose("Haryana")).textContent;

        expect(text).toContain("Insurance Ombudsman, Delhi");
        expect(text).toContain("Gurugram");
        expect(text).toContain("Insurance Ombudsman, Chandigarh");
      });

      it("links to the official page for contact details", async () => {
        const link = (await choose("Kerala")).querySelector("a");

        expect(link?.getAttribute("href")).toBe("https://www.cioins.co.in/Ombudsman");
      });
    });

    it("never shows the private case token while reading", async () => {
      client.setMockCaseStatus("private-token-123", { stage: "reading", progressMessage: "Reading" });
      render(<App initialEntries={["/case/private-token-123"]} />);

      const card = await screen.findByTestId("progress-card");

      expect(card.textContent).not.toContain("private-token-123");
    });

    it("counts the files, marks each one done and lets one be removed", () => {
      render(<App initialEntries={["/"]} />);
      expect(screen.getByTestId("files-chosen").textContent).toBe("0 of 3 files chosen");

      fireEvent.change(screen.getByTestId("file-policy"), {
        target: { files: [new File(["policy"], "policy.pdf", { type: "application/pdf" })] },
      });

      expect(screen.getByTestId("files-chosen").textContent).toBe("1 of 3 files chosen");
      expect(screen.getByTestId("done-policy")).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Remove policy document" }));

      expect(screen.getByTestId("files-chosen").textContent).toBe("0 of 3 files chosen");
      expect(screen.queryByTestId("done-policy")).toBeNull();
    });

    it("accepts a dropped file and checks it the same way", () => {
      render(<App initialEntries={["/"]} />);
      const slot = screen.getByTestId("slot-bill");

      fireEvent.drop(slot, { dataTransfer: { files: [new File(["bill"], "bill.pdf", { type: "application/pdf" })] } });
      expect(screen.getByTestId("done-bill")).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Remove hospital bill" }));
      fireEvent.drop(slot, { dataTransfer: { files: [new File(["x"], "notes.exe", { type: "application/x-msdownload" })] } });
      expect(screen.getByTestId("error-bill").textContent).toContain("Only PDF");
    });

    it("offers made-up documents to try", () => {
      render(<App initialEntries={["/"]} />);

      const links = screen.getByTestId("sample-documents").querySelectorAll("a");

      expect([...links].map((link) => link.getAttribute("href"))).toEqual([
        "/samples/sample-rejection-letter.pdf",
        "/samples/sample-policy.pdf",
        "/samples/sample-hospital-bill.pdf",
      ]);
    });

    it("never swaps someone's own case for the sample when the API can't be reached", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
      render(<App initialEntries={["/case/uploaded-1"]} />);

      await vi.advanceTimersByTimeAsync(20000);
      vi.useRealTimers();

      expect(await screen.findByRole("alert")).toBeTruthy();
      expect(screen.queryByTestId("recoverable-amount")).toBeNull();
      expect(screen.queryByText(/Offline copy/i)).toBeNull();
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
        screen.getByText(/परीक्षित नियमों/),
      ).toBeTruthy();
      expect(
        screen.getByText("यह एक डेमो है। कृपया असली मेडिकल दस्तावेज़ अपलोड न करें।"),
      ).toBeTruthy();
      expect(
        screen.getByText(/Google के Gemini AI/),
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
    it("renders editable date inputs and does not render preview-only note", async () => {
      render(<App initialEntries={["/case/sample"]} />);

      await screen.findByTestId("recoverable-amount");

      // Verify panel and that preview-only note is absent
      const panel = screen.getByTestId("confirm-facts-panel");
      expect(panel).toBeTruthy();
      expect(screen.queryByTestId("preview-only-note")).toBeNull();
      expect(screen.queryByText(/Preview only/i)).toBeNull();

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

      // Verify corrections applied status and preview-only note remains absent
      await screen.findByTestId("corrections-applied-status");
      expect(screen.queryByTestId("preview-only-note")).toBeNull();
      expect(screen.getByTestId("recoverable-amount").textContent).toContain("₹71,400");
    });

    it("switches language between English and Hindi on Confirm Facts panel", async () => {
      render(<App initialEntries={["/case/sample"]} />);

      await screen.findByTestId("recoverable-amount");

      expect(screen.getByText("Confirm the facts")).toBeTruthy();
      expect(screen.queryByTestId("preview-only-note")).toBeNull();
      expect(screen.queryByText(/Preview only/i)).toBeNull();

      // Switch to Hindi
      fireEvent.click(screen.getByRole("button", { name: "हिंदी" }));

      expect(screen.getByText("तथ्यों की पुष्टि करें")).toBeTruthy();
      expect(screen.queryByTestId("preview-only-note")).toBeNull();
      expect(screen.queryByText(/केवल पूर्वावलोकन/i)).toBeNull();
      expect(screen.getByText("पॉलिसी प्रारंभ तिथि")).toBeTruthy();
      expect(screen.getByText("अस्पताल में भर्ती की तिथि")).toBeTruthy();
    });
  });
});
