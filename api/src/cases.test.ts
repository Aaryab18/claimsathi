import {
  API_ROUTES,
  CaseResultSchema,
  sampleCaseResult,
  sampleExtractedClaim,
  type CaseResult,
} from "@claimsathi/contracts";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { createApp } from "./app.js";
import type { CaseRecord, CaseStore, NewCase, StoredDocument } from "./case-store.js";
import { deleteExpiredCases } from "./cleanup.js";
import { recalculateResult } from "./rules.js";
import { MAX_FILE_BYTES } from "./upload.js";

vi.mock("./rules.js", async (original) => {
  const actual = await original<typeof import("./rules.js")>();
  return { ...actual, recalculateResult: vi.fn(actual.recalculateResult) };
});

const ALLOWED_ORIGIN = "https://claimsathi-web.onrender.com";
const SECRET = "postgres://admin:s3cret-password@db.internal:5432/claims";
const SECRET_PATTERN = /s3cret|admin|db\.internal|postgres:/;
const DAY_MS = 24 * 60 * 60 * 1000;
const TOKEN = "a".repeat(43);
const UNKNOWN_TOKEN = "b".repeat(43);

const PDF = Buffer.from("%PDF-1.7 private medical details");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2]);

interface FakeCase extends CaseRecord {
  documents: StoredDocument[];
}

function createFakeStore() {
  const cases = new Map<string, FakeCase>();
  const store: CaseStore = {
    async createCase({ token, stage, progressMessage, extracted, result, deleteAfter, documents }: NewCase) {
      cases.set(token, {
        token,
        stage,
        progressMessage,
        errorMessage: null,
        extracted,
        overrides: null,
        result,
        deleteAfter,
        documents,
      });
    },
    findDocuments: async (token) => cases.get(token)?.documents ?? [],
    findUnfinished: async () => [],
    setProgress: async () => {},
    completeCase: async () => {},
    failCase: async () => {},
    async findCase(token) {
      return cases.get(token) ?? null;
    },
    async saveFacts(token, overrides, result) {
      const found = cases.get(token);
      if (!found) {
        return false;
      }
      found.overrides = overrides;
      found.result = result;
      return true;
    },
    async deleteExpired() {
      return 0;
    },
  };
  return { store, cases };
}

function seedCase(cases: Map<string, FakeCase>, changes: Partial<FakeCase> = {}): FakeCase {
  const seeded: FakeCase = {
    token: TOKEN,
    stage: "done",
    progressMessage: "Done.",
    errorMessage: null,
    extracted: sampleExtractedClaim,
    overrides: null,
    result: { ...sampleCaseResult, caseToken: TOKEN },
    deleteAfter: new Date(Date.now() + DAY_MS),
    documents: [],
    ...changes,
  };
  cases.set(seeded.token, seeded);
  return seeded;
}

function appFor(store: CaseStore, allowedOrigin: string | undefined = ALLOWED_ORIGIN) {
  const works = () => Promise.resolve();
  const processor = { enqueue: () => {}, resumeUnfinished: () => Promise.resolve(), idle: () => Promise.resolve() };
  return createApp({ allowedOrigin, checks: { database: works, queue: works }, store, processor, uploadsPerHour: 1000 });
}

function failingStore(): CaseStore {
  const fail = () => Promise.reject(new Error(`Could not connect to ${SECRET}`));
  return {
    createCase: fail,
    findDocuments: fail,
    findUnfinished: fail,
    setProgress: fail,
    completeCase: fail,
    failCase: fail,
    findCase: fail,
    saveFacts: fail,
    deleteExpired: fail,
  };
}

const casePath = (token: string) => API_ROUTES.getCase.path.replace(":token", token);
const factsPath = (token: string) => API_ROUTES.applyFacts.path.replace(":token", token);

function uploadRequest(store: CaseStore) {
  return request(appFor(store)).post(API_ROUTES.createCase.path);
}

function uploadAll(store: CaseStore) {
  return uploadRequest(store)
    .attach("rejection_letter", PDF, { filename: "letter.pdf", contentType: "application/pdf" })
    .attach("policy", PNG, { filename: "policy.png", contentType: "image/png" })
    .attach("bill", JPG, { filename: "bill.jpg", contentType: "image/jpeg" });
}

let errorLog: MockInstance;

beforeEach(() => {
  errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(recalculateResult).mockClear();
});

afterEach(() => {
  errorLog.mockRestore();
});

function expectNoSecrets(response: request.Response) {
  expect(response.text).not.toMatch(SECRET_PATTERN);
  expect(JSON.stringify(errorLog.mock.calls)).not.toMatch(SECRET_PATTERN);
}

describe(`POST ${API_ROUTES.createSampleCase.path}`, () => {
  it("creates a done case with a long random token", async () => {
    const { store, cases } = createFakeStore();

    const response = await request(appFor(store)).post(API_ROUTES.createSampleCase.path).send({});

    expect(response.status).toBe(201);
    expect(response.body.caseToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(response.body.status.stage).toBe("done");
    expect(cases.get(response.body.caseToken)?.documents).toEqual([]);
  });

  it("stores the sample under the new token, still labelled saved_sample", async () => {
    const { store, cases } = createFakeStore();

    const { body } = await request(appFor(store)).post(API_ROUTES.createSampleCase.path);

    const result = CaseResultSchema.parse(cases.get(body.caseToken)?.result);
    expect(result.caseToken).toBe(body.caseToken);
    expect(result.totals).toEqual(sampleCaseResult.totals);
    expect(result.findings.map(({ verdict, amount }) => ({ verdict, amount }))).toEqual(
      sampleCaseResult.findings.map(({ verdict, amount }) => ({ verdict, amount })),
    );
    expect(result.resultSource).toBe("saved_sample");
    expect(cases.get(body.caseToken)?.extracted).toEqual(sampleExtractedClaim);
  });

  it("gives every case a different token", async () => {
    const { store } = createFakeStore();
    const app = appFor(store);

    const first = await request(app).post(API_ROUTES.createSampleCase.path);
    const second = await request(app).post(API_ROUTES.createSampleCase.path);

    expect(first.body.caseToken).not.toBe(second.body.caseToken);
  });

  it("sets delete-after to 24 hours from now", async () => {
    const { store, cases } = createFakeStore();
    const before = Date.now();

    const { body } = await request(appFor(store)).post(API_ROUTES.createSampleCase.path);

    const deleteAfter = cases.get(body.caseToken)!.deleteAfter.getTime();
    expect(deleteAfter).toBeGreaterThanOrEqual(before + DAY_MS);
    expect(deleteAfter).toBeLessThanOrEqual(Date.now() + DAY_MS);
  });

  it("rejects unexpected fields", async () => {
    const { store, cases } = createFakeStore();

    const response = await request(appFor(store)).post(API_ROUTES.createSampleCase.path).send({ extra: true });

    expect(response.status).toBe(400);
    expect(cases.size).toBe(0);
  });

  it("rejects unreadable JSON without repeating it", async () => {
    const { store } = createFakeStore();

    const response = await request(appFor(store))
      .post(API_ROUTES.createSampleCase.path)
      .set("Content-Type", "application/json")
      .send('{"private-text": ');

    expect(response.status).toBe(400);
    expect(response.text).not.toContain("private-text");
  });

  it("hides database errors", async () => {
    const response = await request(appFor(failingStore())).post(API_ROUTES.createSampleCase.path);

    expect(response.status).toBe(500);
    expectNoSecrets(response);
  });
});

describe(`POST ${API_ROUTES.createCase.path}`, () => {
  it("stores all three files and queues the case", async () => {
    const { store, cases } = createFakeStore();

    const response = await uploadAll(store);

    expect(response.status).toBe(201);
    expect(response.body.status.stage).toBe("queued");
    expect(response.body.caseToken).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const saved = cases.get(response.body.caseToken)!;
    expect(saved.stage).toBe("queued");
    expect(saved.result).toBeNull();
    expect(saved.extracted).toBeNull();
    expect(saved.documents.map(({ documentType, fileName, fileType }) => ({ documentType, fileName, fileType }))).toEqual([
      { documentType: "rejection_letter", fileName: "letter.pdf", fileType: "application/pdf" },
      { documentType: "policy", fileName: "policy.png", fileType: "image/png" },
      { documentType: "bill", fileName: "bill.jpg", fileType: "image/jpeg" },
    ]);
    expect(saved.documents[0]?.contents.equals(PDF)).toBe(true);
    expect(saved.deleteAfter.getTime()).toBeGreaterThan(Date.now() + DAY_MS - 60_000);
  });

  it("never returns file contents or names", async () => {
    const { store } = createFakeStore();

    const response = await uploadAll(store);

    expect(response.text).not.toContain("private medical details");
    expect(response.text).not.toContain("letter.pdf");
  });

  it("accepts a file of exactly 10 MB", async () => {
    const { store, cases } = createFakeStore();
    const exact = Buffer.concat([PDF, Buffer.alloc(MAX_FILE_BYTES - PDF.length)]);

    const response = await uploadRequest(store)
      .attach("rejection_letter", exact, { filename: "a.pdf", contentType: "application/pdf" })
      .attach("policy", PDF, { filename: "b.pdf", contentType: "application/pdf" })
      .attach("bill", PDF, { filename: "c.pdf", contentType: "application/pdf" });

    expect(response.status).toBe(201);
    expect(cases.size).toBe(1);
  });

  it("rejects an oversized file", async () => {
    const { store, cases } = createFakeStore();
    const tooBig = Buffer.concat([PDF, Buffer.alloc(MAX_FILE_BYTES - PDF.length + 1)]);

    const response = await uploadRequest(store)
      .attach("rejection_letter", tooBig, { filename: "a.pdf", contentType: "application/pdf" })
      .attach("policy", PDF, { filename: "b.pdf", contentType: "application/pdf" })
      .attach("bill", PDF, { filename: "c.pdf", contentType: "application/pdf" });

    expect(response.status).toBe(413);
    expect(response.body.error).toContain("10 MB");
    expect(cases.size).toBe(0);
  });

  it.each(["rejection_letter", "policy", "bill"])("rejects a request with %s missing", async (missing) => {
    const { store, cases } = createFakeStore();
    let upload = uploadRequest(store);
    for (const field of ["rejection_letter", "policy", "bill"].filter((name) => name !== missing)) {
      upload = upload.attach(field, PDF, { filename: "a.pdf", contentType: "application/pdf" });
    }

    const response = await upload;

    expect(response.status).toBe(400);
    expect(response.body.error).toContain(`Missing: ${missing}`);
    expect(cases.size).toBe(0);
  });

  it("rejects a request with no files", async () => {
    const { store } = createFakeStore();

    const response = await uploadRequest(store).send({ not: "a file" });

    expect(response.status).toBe(400);
  });

  it("rejects a disallowed file type", async () => {
    const { store, cases } = createFakeStore();

    const response = await uploadRequest(store)
      .attach("rejection_letter", Buffer.from("MZ program"), { filename: "a.exe", contentType: "application/x-msdownload" })
      .attach("policy", PDF, { filename: "b.pdf", contentType: "application/pdf" })
      .attach("bill", PDF, { filename: "c.pdf", contentType: "application/pdf" });

    expect(response.status).toBe(415);
    expect(response.body.error).toContain("rejection_letter");
    expect(cases.size).toBe(0);
  });

  it("rejects a file pretending to be a PDF", async () => {
    const { store, cases } = createFakeStore();

    const response = await uploadRequest(store)
      .attach("rejection_letter", Buffer.from("<script>private</script>"), { filename: "a.pdf", contentType: "application/pdf" })
      .attach("policy", PDF, { filename: "b.pdf", contentType: "application/pdf" })
      .attach("bill", PDF, { filename: "c.pdf", contentType: "application/pdf" });

    expect(response.status).toBe(415);
    expect(response.text).not.toContain("private");
    expect(cases.size).toBe(0);
  });

  it("rejects a file whose stated type disagrees with its contents", async () => {
    const { store } = createFakeStore();

    const response = await uploadRequest(store)
      .attach("rejection_letter", PNG, { filename: "a.pdf", contentType: "application/pdf" })
      .attach("policy", PDF, { filename: "b.pdf", contentType: "application/pdf" })
      .attach("bill", PDF, { filename: "c.pdf", contentType: "application/pdf" });

    expect(response.status).toBe(415);
  });

  it("rejects an empty file", async () => {
    const { store, cases } = createFakeStore();

    const response = await uploadRequest(store)
      .attach("rejection_letter", Buffer.alloc(0), { filename: "a.pdf", contentType: "application/pdf" })
      .attach("policy", PDF, { filename: "b.pdf", contentType: "application/pdf" })
      .attach("bill", PDF, { filename: "c.pdf", contentType: "application/pdf" });

    expect(response.status).toBe(400);
    expect(cases.size).toBe(0);
  });

  it("rejects two files of the same type", async () => {
    const { store, cases } = createFakeStore();

    const response = await uploadRequest(store)
      .attach("policy", PDF, { filename: "a.pdf", contentType: "application/pdf" })
      .attach("policy", PDF, { filename: "b.pdf", contentType: "application/pdf" })
      .attach("bill", PDF, { filename: "c.pdf", contentType: "application/pdf" });

    expect(response.status).toBe(400);
    expect(cases.size).toBe(0);
  });

  it("rejects an unknown file field and a fourth file", async () => {
    const { store, cases } = createFakeStore();

    const unknown = await uploadRequest(store).attach("other", PDF, { filename: "a.pdf", contentType: "application/pdf" });
    const fourth = await uploadAll(store).attach("other", PDF, { filename: "d.pdf", contentType: "application/pdf" });

    expect(unknown.status).toBe(400);
    expect(fourth.status).toBe(400);
    expect(cases.size).toBe(0);
  });

  it("rejects extra text fields", async () => {
    const { store, cases } = createFakeStore();

    const response = await uploadAll(store).field("note", "hello");

    expect(response.status).toBe(400);
    expect(cases.size).toBe(0);
  });

  it("rejects a broken upload", async () => {
    const { store, cases } = createFakeStore();

    const response = await uploadRequest(store)
      .set("Content-Type", "multipart/form-data; boundary=x")
      .send("--x\r\nnot a real part");

    expect(response.status).toBe(400);
    expect(cases.size).toBe(0);
  });

  it("keeps Hindi file names and removes paths and control characters", async () => {
    const { store, cases } = createFakeStore();

    const { body } = await uploadRequest(store)
      .attach("rejection_letter", PDF, { filename: "दावा.pdf", contentType: "application/pdf" })
      .attach("policy", PDF, { filename: "..\\..\\secret\\policy.pdf", contentType: "application/pdf" })
      .attach("bill", PDF, { filename: "bi\tll.pdf", contentType: "application/pdf" });

    expect(cases.get(body.caseToken)?.documents.map((document) => document.fileName)).toEqual([
      "दावा.pdf",
      "policy.pdf",
      "bill.pdf",
    ]);
  });

  it("rejects a file name the upload parser cannot read", async () => {
    const { store, cases } = createFakeStore();

    const response = await uploadRequest(store)
      .attach("rejection_letter", PDF, { filename: "bi\u0001ll.pdf", contentType: "application/pdf" })
      .attach("policy", PDF, { filename: "b.pdf", contentType: "application/pdf" })
      .attach("bill", PDF, { filename: "c.pdf", contentType: "application/pdf" });

    expect(response.status).toBe(400);
    expect(cases.size).toBe(0);
  });

  it("hides database errors and file contents", async () => {
    const response = await uploadAll(failingStore());

    expect(response.status).toBe(500);
    expectNoSecrets(response);
    expect(response.text).not.toContain("private medical details");
  });
});

describe(`GET ${API_ROUTES.getCase.path}`, () => {
  it("returns the status and result of a done case", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases);

    const response = await request(appFor(store)).get(casePath(TOKEN));

    expect(response.status).toBe(200);
    expect(response.body.caseToken).toBe(TOKEN);
    expect(response.body.status).toEqual({ stage: "done", progressMessage: "Done." });
    expect(response.body.result).toEqual({ ...sampleCaseResult, caseToken: TOKEN });
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("returns no result while a case is queued", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases, { stage: "queued", extracted: null, result: null });

    const response = await request(appFor(store)).get(casePath(TOKEN));

    expect(response.status).toBe(200);
    expect(response.body.status.stage).toBe("queued");
    expect(response.body.result).toBeNull();
  });

  it("returns the error message of a failed case", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases, { stage: "failed", errorMessage: "This file could not be read", result: null });

    const response = await request(appFor(store)).get(casePath(TOKEN));

    expect(response.body.status.errorMessage).toBe("This file could not be read");
    expect(response.body.result).toBeNull();
  });

  it("returns 404 for an unknown token", async () => {
    const { store } = createFakeStore();

    const response = await request(appFor(store)).get(casePath(UNKNOWN_TOKEN));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Case not found." });
  });

  it.each(["short", "a".repeat(44), "a".repeat(42) + "%00", "a".repeat(42) + "!"])(
    "returns 404 for the impossible token %s without looking it up",
    async (token) => {
      const { store } = createFakeStore();
      const findCase = vi.spyOn(store, "findCase");

      const response = await request(appFor(store)).get(casePath(token));

      expect(response.status).toBe(404);
      expect(findCase).not.toHaveBeenCalled();
    },
  );

  it("returns 400 for a badly encoded address", async () => {
    const { store } = createFakeStore();

    const response = await request(appFor(store)).get(casePath("%E0%A4%A"));

    expect(response.status).toBe(400);
    expect(response.headers["content-type"]).toContain("json");
  });

  it("returns 404 for a case past its delete-after time", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases, { deleteAfter: new Date(Date.now() - 1) });

    const response = await request(appFor(store)).get(casePath(TOKEN));

    expect(response.status).toBe(404);
  });

  it("refuses to send a saved result that breaks the contract", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases, { result: { caseToken: TOKEN, private: "patient details" } });

    const response = await request(appFor(store)).get(casePath(TOKEN));

    expect(response.status).toBe(500);
    expect(response.text).not.toContain("patient details");
  });

  it("hides database errors", async () => {
    const response = await request(appFor(failingStore())).get(casePath(TOKEN));

    expect(response.status).toBe(500);
    expectNoSecrets(response);
  });
});

describe(`PATCH ${API_ROUTES.applyFacts.path}`, () => {
  it("saves the overrides, re-runs the rules with them and returns the result", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases);
    const overrides = { continuousCoverSince: "2024-01-01" };

    const response = await request(appFor(store)).patch(factsPath(TOKEN)).send(overrides);

    expect(response.status).toBe(200);
    expect(CaseResultSchema.safeParse(response.body).success).toBe(true);
    expect(cases.get(TOKEN)?.overrides).toEqual(overrides);
    expect(recalculateResult).toHaveBeenCalledWith(
      expect.objectContaining({
        extracted: sampleExtractedClaim,
        overrides,
        asOfDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    );
  });

  describe("on the sample case, with the real rules engine", () => {
    const SAMPLE_TOTALS = { totalDeducted: 96000, recoverableStrong: 71400, questionable: 7800, validDeductions: 16800 };
    // The sample's pre-existing disease deduction. It stops being clearly wrong with cover this recent.
    const PED_AMOUNT = 20600;
    const RECENT_COVER = { continuousCoverSince: "2024-01-01" };
    const RECENT_COVER_TOTALS = {
      totalDeducted: 96000,
      recoverableStrong: 71400 - PED_AMOUNT,
      questionable: 7800 + PED_AMOUNT,
      validDeductions: 16800,
    };

    async function createSample() {
      const app = appFor(createFakeStore().store);
      const created = await request(app).post(API_ROUTES.createSampleCase.path).send({});
      return { app, token: created.body.caseToken as string };
    }

    it("keeps the sample totals when there are no overrides", async () => {
      const { app, token } = await createSample();

      const response = await request(app).patch(factsPath(token)).send({});

      expect(response.status).toBe(200);
      expect(response.body.totals).toEqual(SAMPLE_TOTALS);
      expect(response.body.warnings).toEqual([]);
    });

    it("takes the 20600 out of the recoverable amount when cover started in 2024", async () => {
      const { app, token } = await createSample();

      const response = await request(app).patch(factsPath(token)).send(RECENT_COVER);

      expect(response.status).toBe(200);
      expect(response.body.totals).toEqual(RECENT_COVER_TOTALS);
      expect(response.body.totals.recoverableStrong).toBe(50800);
    });

    it("saves the recalculated result, so reading the case returns it", async () => {
      const { app, token } = await createSample();

      await request(app).patch(factsPath(token)).send(RECENT_COVER);
      const read = await request(app).get(casePath(token));

      expect(read.body.result.totals).toEqual(RECENT_COVER_TOTALS);
    });

    it("still applies earlier corrections when a later request adds nothing", async () => {
      const { app, token } = await createSample();

      await request(app).patch(factsPath(token)).send(RECENT_COVER);
      const response = await request(app).patch(factsPath(token)).send({});

      expect(response.body.totals).toEqual(RECENT_COVER_TOTALS);
    });

    it("can undo a correction, because it recalculates from the original facts", async () => {
      const { app, token } = await createSample();

      await request(app).patch(factsPath(token)).send(RECENT_COVER);
      const response = await request(app)
        .patch(factsPath(token))
        .send({ continuousCoverSince: sampleExtractedClaim.policy.continuousCoverSince });

      expect(response.body.totals).toEqual(SAMPLE_TOTALS);
    });

    it("keeps caseToken, resultSource and the extracted facts from the saved result", async () => {
      const { app, token } = await createSample();

      const response = await request(app).patch(factsPath(token)).send(RECENT_COVER);

      expect(response.body.caseToken).toBe(token);
      expect(response.body.resultSource).toBe("saved_sample");
      expect(response.body.extracted).toEqual(sampleExtractedClaim);
    });

    it("keeps legal references unverified", async () => {
      const { app, token } = await createSample();

      const { body } = await request(app).patch(factsPath(token)).send(RECENT_COVER);

      expect(body.findings.length).toBeGreaterThan(0);
      for (const finding of body.findings) {
        expect(finding.evidence.regulation.verified).toBe(false);
      }
      expect(body.deadlines.length).toBeGreaterThan(0);
      for (const deadline of body.deadlines) {
        expect(deadline.verified).toBe(deadline.date !== null);
      }
    });

    it.each([
      ["a badly formatted date", { continuousCoverSince: "01/01/2024" }],
      ["an impossible date", { continuousCoverSince: "2024-02-31" }],
      ["a misspelled field", { continuousCoverSinceDate: "2024-01-01" }],
    ])("returns 400 for %s and leaves the totals alone", async (_name, body) => {
      const { app, token } = await createSample();

      const response = await request(app).patch(factsPath(token)).send(body);
      const read = await request(app).get(casePath(token));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("The facts are not valid.");
      expect(read.body.result.totals).toEqual(SAMPLE_TOTALS);
    });
  });

  it("saves and returns what the rules produce", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases);
    const changed: CaseResult = {
      ...sampleCaseResult,
      caseToken: TOKEN,
      warnings: [{ code: "totals_do_not_match", messageEn: "Check.", messageHi: "जाँचें।" }],
    };
    vi.mocked(recalculateResult).mockReturnValueOnce(changed);

    const response = await request(appFor(store)).patch(factsPath(TOKEN)).send({});

    expect(response.body).toEqual(changed);
    expect(cases.get(TOKEN)?.result).toEqual(changed);
  });

  it("adds corrections to the ones already saved", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases, {
      overrides: {
        admissionDate: "2025-01-01",
        lineItemCategories: [
          { lineItemId: "L1", category: "other" },
          { lineItemId: "L2", category: "other" },
        ],
      },
    });

    await request(appFor(store))
      .patch(factsPath(TOKEN))
      .send({ policyStartDate: "2020-01-01", lineItemCategories: [{ lineItemId: "L2", category: "pharmacy" }] });

    expect(cases.get(TOKEN)?.overrides).toEqual({
      admissionDate: "2025-01-01",
      policyStartDate: "2020-01-01",
      lineItemCategories: [
        { lineItemId: "L1", category: "other" },
        { lineItemId: "L2", category: "pharmacy" },
      ],
    });
  });

  it.each([
    ["a badly formatted date", { admissionDate: "10/11/2025" }],
    ["a misspelled field", { admisionDate: "2025-11-10" }],
    ["an unknown category", { lineItemCategories: [{ lineItemId: "L1", category: "food" }] }],
    ["the wrong kind of value", { insurerAskedForMissingDocument: "yes" }],
    ["a list instead of an object", []],
  ])("rejects %s and saves nothing", async (_name, body) => {
    const { store, cases } = createFakeStore();
    seedCase(cases);

    const response = await request(appFor(store)).patch(factsPath(TOKEN)).send(body);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("The facts are not valid.");
    expect(response.body.issues.length).toBeGreaterThan(0);
    expect(cases.get(TOKEN)?.overrides).toBeNull();
    expect(recalculateResult).not.toHaveBeenCalled();
  });

  it("rejects a missing body", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases);

    const response = await request(appFor(store)).patch(factsPath(TOKEN));

    expect(response.status).toBe(400);
    expect(cases.get(TOKEN)?.overrides).toBeNull();
  });

  it("rejects a line item that is not in the case", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases);

    const response = await request(appFor(store))
      .patch(factsPath(TOKEN))
      .send({ lineItemCategories: [{ lineItemId: "L99", category: "other" }] });

    expect(response.status).toBe(400);
    expect(response.body.issues[0].path).toBe("lineItemCategories.0.lineItemId");
    expect(cases.get(TOKEN)?.overrides).toBeNull();
  });

  it("rejects a body that is too large", async () => {
    const { store } = createFakeStore();

    const response = await request(appFor(store))
      .patch(factsPath(TOKEN))
      .send({ admissionDate: "x".repeat(200 * 1024) });

    expect(response.status).toBe(413);
  });

  it("returns 404 for an unknown token", async () => {
    const { store } = createFakeStore();

    const response = await request(appFor(store)).patch(factsPath(UNKNOWN_TOKEN)).send({});

    expect(response.status).toBe(404);
  });

  it("returns 404 for a case past its delete-after time", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases, { deleteAfter: new Date(Date.now() - 1) });

    const response = await request(appFor(store)).patch(factsPath(TOKEN)).send({});

    expect(response.status).toBe(404);
  });

  it("returns 409 while the case is not finished, and saves nothing", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases, { stage: "queued", extracted: null, result: null });

    const response = await request(appFor(store)).patch(factsPath(TOKEN)).send({ admissionDate: "2025-01-01" });

    expect(response.status).toBe(409);
    expect(cases.get(TOKEN)?.overrides).toBeNull();
  });

  it("saves nothing and hides the error when the rules fail", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases);
    vi.mocked(recalculateResult).mockImplementationOnce(() => {
      throw new Error(`Failed with ${SECRET}`);
    });

    const response = await request(appFor(store)).patch(factsPath(TOKEN)).send({ admissionDate: "2025-01-01" });

    expect(response.status).toBe(500);
    expectNoSecrets(response);
    expect(cases.get(TOKEN)?.overrides).toBeNull();
  });

  it("saves nothing when the rules break the contract", async () => {
    const { store, cases } = createFakeStore();
    seedCase(cases);
    vi.mocked(recalculateResult).mockReturnValueOnce({ ...sampleCaseResult, totals: { ...sampleCaseResult.totals, totalDeducted: 1 } });

    const response = await request(appFor(store)).patch(factsPath(TOKEN)).send({});

    expect(response.status).toBe(500);
    expect(cases.get(TOKEN)?.overrides).toBeNull();
  });

  it("hides database errors", async () => {
    const response = await request(appFor(failingStore())).patch(factsPath(TOKEN)).send({});

    expect(response.status).toBe(500);
    expectNoSecrets(response);
  });
});

describe("the sample case from start to finish", () => {
  it("can be created, read and corrected", async () => {
    const { store } = createFakeStore();
    const app = appFor(store);

    const created = await request(app).post(API_ROUTES.createSampleCase.path).send({});
    const read = await request(app).get(casePath(created.body.caseToken));
    const corrected = await request(app).patch(factsPath(created.body.caseToken)).send({ admissionDate: "2025-11-11" });

    expect(read.body.result.caseToken).toBe(created.body.caseToken);
    expect(read.body.result.resultSource).toBe("saved_sample");
    expect(read.body.result.totals).toEqual(sampleCaseResult.totals);
    expect(corrected.status).toBe(200);
    expect(corrected.body.resultSource).toBe("saved_sample");
  });
});

describe("routes that do not exist", () => {
  it("answers with a plain 404", async () => {
    const { store } = createFakeStore();

    const { body } = await request(appFor(store)).get("/nothing-here").expect(404);

    expect(body).toEqual({ error: "Not found." });
  });
});

describe("browser requests", () => {
  it("allows PATCH from ALLOWED_ORIGIN", async () => {
    const { store } = createFakeStore();

    const response = await request(appFor(store))
      .options(factsPath(TOKEN))
      .set("Origin", ALLOWED_ORIGIN)
      .set("Access-Control-Request-Method", "PATCH")
      .set("Access-Control-Request-Headers", "content-type");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
    expect(response.headers["access-control-allow-methods"]).toContain("PATCH");
    expect(response.headers["access-control-allow-headers"]).toContain("content-type");
  });

  it("does not allow PATCH from another origin", async () => {
    const { store } = createFakeStore();

    const response = await request(appFor(store))
      .options(factsPath(TOKEN))
      .set("Origin", "https://example.com")
      .set("Access-Control-Request-Method", "PATCH");

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows the real responses to be read by ALLOWED_ORIGIN, even errors", async () => {
    const { store } = createFakeStore();

    const response = await request(appFor(store)).get(casePath(UNKNOWN_TOKEN)).set("Origin", ALLOWED_ORIGIN);

    expect(response.status).toBe(404);
    expect(response.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
  });
});

describe("deleting expired cases", () => {
  it("asks the store to delete what has expired", async () => {
    const { store } = createFakeStore();
    const deleteExpired = vi.spyOn(store, "deleteExpired");

    await deleteExpiredCases(store);

    expect(deleteExpired).toHaveBeenCalledWith(expect.any(Date));
  });

  it("does not crash or log secrets when it fails", async () => {
    await expect(deleteExpiredCases(failingStore())).resolves.toBeUndefined();

    expect(errorLog).toHaveBeenCalled();
    expect(JSON.stringify(errorLog.mock.calls)).not.toMatch(SECRET_PATTERN);
  });
});
