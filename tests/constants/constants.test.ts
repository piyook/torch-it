import { describe, expect, it } from "vitest";
import { COLOURS } from "../../src/constants/constants";

describe("COLOURS helpers", () => {
  it("wraps text in bold ANSI codes", () => {
    expect(COLOURS.BOLD("test")).toBe("\u001b[1mtest\u001b[22m");
  });

  it("wraps text in colour ANSI codes", () => {
    expect(COLOURS.CYAN("test")).toBe("\u001b[36mtest\u001b[39m");
    expect(COLOURS.GREEN("test")).toBe("\u001b[32mtest\u001b[39m");
    expect(COLOURS.RED("test")).toBe("\u001b[31mtest\u001b[39m");
    expect(COLOURS.YELLOW("test")).toBe("\u001b[33mtest\u001b[39m");
    expect(COLOURS.PURPLE("test")).toBe("\u001b[35mtest\u001b[39m");
  });

  it("produces a reset sequence without content when passed an empty string", () => {
    expect(COLOURS.RESET("")).toBe("\u001b[0m");
  });
});
