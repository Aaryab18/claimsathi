import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import * as client from "./api/client";
import { sampleCaseResult, type CaseResult } from "@claimsathi/contracts";
import { findInsurerContact } from "./lib/insurer-contacts";

const withInsurer = (insurer: string | null): CaseResult => ({
  ...sampleCaseResult,
  extracted: { ...sampleCaseResult.extracted, claim: { ...sampleCaseResult.extracted.claim, insurer } },
});

function serve(result: CaseResult, letterText = "WHAT TO SAY ON THE CALL") {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) =>
    String(input).endsWith("/letters")
      ? new Response(JSON.stringify({ letterType: "call_script", text: letterText }))
      : new Response(JSON.stringify({ caseToken: "case-1", status: { stage: "done", progressMessage: "Done" }, result })),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const letterBodies = (fetchMock: ReturnType<typeof serve>) =>
  fetchMock.mock.calls
    .filter(([url]) => String(url).endsWith("/letters"))
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)));

describe("contact your insurer", () => {
  beforeEach(() => {
    client.clearMockCases();
    vi.stubEnv("VITE_API_URL", "https://api.example.com");
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("matches insurer names written in different ways", () => {
    expect(findInsurerContact("HDFC ERGO General Insurance Co. Ltd")?.name).toBe("HDFC ERGO");
    expect(findInsurerContact("Max Bupa Health Insurance")?.name).toBe("Niva Bupa");
    expect(findInsurerContact("Bajaj Allianz General Insurance")?.name).toBe("Bajaj General Insurance");
    expect(findInsurerContact("Star Health and Allied Insurance")).toBeNull();
    expect(findInsurerContact(null)).toBeNull();
  });

  it("shows a call button with the confirmed number for a listed insurer", async () => {
    serve(withInsurer("HDFC ERGO General Insurance Company Limited"));
    render(<App initialEntries={["/case/case-1/contact"]} />);

    const call = await screen.findByTestId("call-insurer");
    expect(call.getAttribute("href")).toBe("tel:18002677444");
    expect(screen.getByTestId("insurer-form").getAttribute("href")).toMatch(/^https:\/\/www\.hdfcergo\.com\//);
    expect(screen.getByTestId("email-insurer")).toBeTruthy();
  });

  it("shows no number for an insurer we haven't confirmed, and points to IRDAI", async () => {
    serve(sampleCaseResult);
    render(<App initialEntries={["/case/case-1/contact"]} />);

    expect((await screen.findByTestId("insurer-not-listed")).textContent).toContain("Sample Health Insurance Ltd");
    expect(screen.queryByTestId("call-insurer")).toBeNull();
    expect(screen.queryByTestId("email-insurer")).toBeNull();
    expect(screen.getByTestId("bima-bharosa").getAttribute("href")).toBe("https://bimabharosa.irdai.gov.in/RegComplaint/RegisterComplaint");
    expect(screen.getByTestId("ombudsman-online").getAttribute("href")).toBe("https://cioins.co.in/Complaint/Online");
  });

  it("lets the person choose their insurer when the letter's name isn't recognised, and remembers it", async () => {
    serve(sampleCaseResult);
    render(<App initialEntries={["/case/case-1/contact"]} />);

    fireEvent.change(await screen.findByTestId("choose-insurer"), { target: { value: "Tata AIG" } });

    expect(screen.getByTestId("call-insurer").getAttribute("href")).toBe("tel:02264898282");
    expect(screen.getByTestId("insurer-contact").textContent).toContain("You chose Tata AIG");
    expect(window.localStorage.getItem("claimsathi.insurer.sample-case")).toBe("Tata AIG");

    fireEvent.change(screen.getByTestId("choose-insurer"), { target: { value: "" } });
    expect(screen.queryByTestId("call-insurer")).toBeNull();
    expect(window.localStorage.getItem("claimsathi.insurer.sample-case")).toBeNull();
  });

  it("doesn't offer a choice when the letter's insurer was recognised", async () => {
    serve(withInsurer("Niva Bupa Health Insurance Company Limited"));
    render(<App initialEntries={["/case/case-1/contact"]} />);

    expect((await screen.findByTestId("insurer-contact")).textContent).toContain("Your letter is from Niva Bupa");
    expect(screen.queryByTestId("choose-insurer")).toBeNull();
  });

  it("asks the server for the call script in the chosen language", async () => {
    const fetchMock = serve(sampleCaseResult);
    render(<App initialEntries={["/case/case-1/contact"]} />);

    fireEvent.change(await screen.findByTestId("script-language"), { target: { value: "kn" } });
    fireEvent.click(screen.getByTestId("show-call-script"));

    expect((await screen.findByTestId("call-script")).textContent).toBe("WHAT TO SAY ON THE CALL");
    expect(letterBodies(fetchMock)).toEqual([{ letterType: "call_script", language: "kn" }]);
  });

  it("remembers the reference number and adds it to the Ombudsman complaint only", async () => {
    const fetchMock = serve(sampleCaseResult, "Complaint");
    render(<App initialEntries={["/case/case-1/contact"]} />);

    fireEvent.change(await screen.findByTestId("grievance-reference"), { target: { value: "GRV-42" } });
    expect(window.localStorage.getItem("claimsathi.reference.case-1")).toBe("GRV-42");

    fireEvent.click(screen.getByTestId("nav-letters"));
    fireEvent.click(await screen.findByTestId("letter-grievance-btn"));
    await screen.findByTestId("letter-text");
    fireEvent.click(screen.getByTestId("letter-ombudsman-btn"));

    await waitFor(() =>
      expect(letterBodies(fetchMock)).toEqual([
        { letterType: "grievance", language: "en" },
        { letterType: "ombudsman", language: "en", grievanceReference: "GRV-42" },
      ]),
    );
  });
});
