import { describe, expect, it } from "vitest";
import { readLlmsReference } from "../../src/utils/llms";

describe("readLlmsReference", () => {
  it("finds llms.txt in the package root when run from source", () => {
    const reference = readLlmsReference();

    expect(reference).toBeDefined();
    expect(reference).toMatch(/^# torch-it/);
    expect(reference).toContain("## The safe way to run it");
  });
});
