import { expect, it } from "vitest";
import { RULES_PLACEHOLDER } from "./index.js";

it("exports the placeholder", () => {
  expect(RULES_PLACEHOLDER).toBe("rules-placeholder");
});
