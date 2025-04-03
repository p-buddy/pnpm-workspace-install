import { describe, test, expect, vi } from "vitest";
import { findMatchingPackage } from "./utils";
import { beforeEach } from "vitest";

describe(findMatchingPackage.name, () => {
  beforeEach(() => vi.clearAllMocks());

  test("basic", () => {
    vi.mock("find-up", () => ({
      findUpSync: vi.fn(() => "dummy"),
    }));

    vi.mock("fs", () => ({
      readFileSync: vi.fn(() => JSON.stringify({ name: "base" })),
    }));

    const packages = ["a", "b", "c"];
    const prefixes = ["", "base", "base-"];
    for (const pkg of packages)
      for (const prefix of prefixes) {
        const prefixed = (pkg: string) => prefix + pkg;
        expect(findMatchingPackage(new Set(packages.map(prefixed)), pkg)).toBe(prefixed(pkg));
      }
  });
})