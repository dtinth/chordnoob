import { describe, it, expect } from "bun:test";
import { ChordNoobParser } from "./streaming";

describe("ChordNoobParser - Streaming", () => {
  it("should process single lines with mixed content", () => {
    const parser = new ChordNoobParser();

    const line1 = "{key:G} Some text";
    const line2 = "{q:[1] [4] [5]} A_mazing _grace _how";

    const out1 = parser.processLine(line1);
    const out2 = parser.processLine(line2);

    expect(out1).toContain("{key: G}");
    expect(out2).toContain("A[G]mazing");
    expect(out2).toContain("[C]grace");
    expect(out2).toContain("[D]how");
  });

  it("should handle directives on the same line as lyrics", () => {
    const parser = new ChordNoobParser();

    const line = "{key:C} {q:[1] [4]} _First _Second";

    const output = parser.processLine(line);

    expect(output).toContain("{key: C}");
    expect(output).toContain("[C]First");
    expect(output).toContain("[F]Second");
  });

  it("should preserve comments", () => {
    const parser = new ChordNoobParser();

    const line = "# This is a comment";
    const output = parser.processLine(line);

    expect(output).toBe("# This is a comment");
  });

  it("should handle inline comments correctly", () => {
    const parser = new ChordNoobParser();

    const line1 = "{key: G}";
    const line2 = "[1]Verse # This is a comment";

    const out1 = parser.processLine(line1);
    const out2 = parser.processLine(line2);

    expect(out1).toContain("{key: G}");
    expect(out2).toContain("[G]Verse");
    expect(out2).toContain("# This is a comment");
  });

  it("should convert slash chords on same line as queue", () => {
    const parser = new ChordNoobParser();

    const line1 = "{key: C}";
    const line2 = "{q:[1/5]} _Chord";

    const out1 = parser.processLine(line1);
    const out2 = parser.processLine(line2);

    expect(out2).toContain("[C/G]");
  });

  it("should process Amazing Grace in one line", () => {
    const parser = new ChordNoobParser();

    const line =
      "{key:Bb} {q:[1] [4] [1] [5]} A_mazing grace, how _sweet the _sound That saved a wretch like _me";

    const output = parser.processLine(line);

    expect(output).toContain("A[Bb]mazing");
    expect(output).toContain("[Eb]sweet");
    expect(output).toContain("[F]me");
  });

  it("should warn on queue issues", () => {
    const parser = new ChordNoobParser();

    parser.processLine("{key: C}");
    parser.processLine("{q: [1] [4]}");
    parser.processLine("_One _Two _Three");

    const warnings = parser.getWarnings();
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain("queue is empty");
  });

  it("should warn on unconsumed queue at end", () => {
    const parser = new ChordNoobParser();

    parser.processLine("{key: C}");
    parser.processLine("{q: [1] [4] [5]}");
    parser.processLine("_One");

    const warnings = parser.finalize();
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain("unconsumed");
  });

  it("should handle multiple key directives (use first)", () => {
    const parser = new ChordNoobParser();

    const line1 = "{key: C}";
    const line2 = "{key: G}"; // Should be ignored
    const line3 = "[1]Chord";

    parser.processLine(line1);
    parser.processLine(line2);
    const out3 = parser.processLine(line3);

    expect(out3).toContain("[C]"); // Should use first key (C), not G
  });

  it("should preserve regular chords unchanged", () => {
    const parser = new ChordNoobParser();

    const line1 = "{key: C}";
    const line2 = "[Am]Regular [F]chords [G]here";

    parser.processLine(line1);
    const out2 = parser.processLine(line2);

    expect(out2).toContain("[Am]");
    expect(out2).toContain("[F]");
    expect(out2).toContain("[G]");
  });

  it("should handle mixed Nashville and regular chords", () => {
    const parser = new ChordNoobParser();

    const line1 = "{key: C}";
    const line2 = "[1]Nashville [Am]Regular [4]More";

    parser.processLine(line1);
    const out2 = parser.processLine(line2);

    expect(out2).toContain("[C]Nashville");
    expect(out2).toContain("[Am]Regular");
    expect(out2).toContain("[F]More");
  });

  it("should handle accidentals in single line", () => {
    const parser = new ChordNoobParser();

    const line1 = "{key: C} [b3] [#4] [b7]";

    const out1 = parser.processLine(line1);

    expect(out1).toContain("[Eb]");
    expect(out1).toContain("[F#]");
    expect(out1).toContain("[Bb]");
  });

  it("should handle empty lines", () => {
    const parser = new ChordNoobParser();

    const line1 = "{key: C}";
    const line2 = "";
    const line3 = "[1]Chord";

    parser.processLine(line1);
    const out2 = parser.processLine(line2);
    const out3 = parser.processLine(line3);

    expect(out2).toBe("");
    expect(out3).toContain("[C]");
  });
});
