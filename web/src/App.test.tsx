import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { App } from "./App";

it("shows ClaimSathi", () => {
  render(<App />);

  expect(screen.getByRole("heading", { name: "ClaimSathi" })).toBeTruthy();
});
