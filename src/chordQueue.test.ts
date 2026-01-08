import { describe, it, expect } from "bun:test";
import { parseQueueDirective, processChordQueue } from "./chordQueue";

describe("Chord Queue", () => {
  describe("parseQueueDirective", () => {
    it("should parse simple queue directives", () => {
      expect(parseQueueDirective("{q: [1] [4] [5]}")).toEqual(["1", "4", "5"]);
      expect(parseQueueDirective("{q: [Am] [F] [C]}")).toEqual([
        "Am",
        "F",
        "C",
      ]);
    });

    it("should parse complex chord qualities", () => {
      expect(parseQueueDirective("{q: [1maj7] [2m7] [7dim]}")).toEqual([
        "1maj7",
        "2m7",
        "7dim",
      ]);
    });

    it("should handle extra whitespace", () => {
      expect(parseQueueDirective("{q:  [1]   [4]   [5]  }")).toEqual([
        "1",
        "4",
        "5",
      ]);
    });

    it("should parse single chord queue", () => {
      expect(parseQueueDirective("{q: [1]}")).toEqual(["1"]);
    });

    it("should return null for non-queue directives", () => {
      expect(parseQueueDirective("{title: My Song}")).toBeNull();
      expect(parseQueueDirective("{key: G}")).toBeNull();
      expect(parseQueueDirective("Just some text")).toBeNull();
    });

    it("should return null for incomplete queue", () => {
      expect(parseQueueDirective("{q:}")).toEqual([]);
      expect(parseQueueDirective("{q: }")).toEqual([]);
    });
  });

  describe("processChordQueue", () => {
    it("should replace underscores with queued chords", () => {
      const input = `{q: [1] [4] [5]}
A_mazing _grace _how`;

      const result = processChordQueue(input);

      expect(result.output).toBe(
        `A[1]mazing [4]grace [5]how`
      );
      expect(result.warnings).toEqual([]);
    });

    it("should handle multiple queues", () => {
      const input = `{q: [1] [4]}
Line _one _more
{q: [5] [1]}
Line _two _end`;

      const result = processChordQueue(input);

      expect(result.output).toBe(
        `Line [1]one [4]more
Line [5]two [1]end`
      );
      expect(result.warnings).toEqual([]);
    });

    it("should warn on underscore with empty queue", () => {
      const input = `{q: [1]}
Line _one
No queue _here`;

      const result = processChordQueue(input);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatchObject({
        line: 3,
        message: expect.stringContaining("queue is empty"),
      });
    });

    it("should warn on unconsumed queue before new queue", () => {
      const input = `{q: [1] [4] [5]}
Line _one
{q: [G]}
More`;

      const result = processChordQueue(input);

      // Warning for 2 unconsumed chords when new queue started
      // Plus warning for leftover [G] at EOF
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) =>
        w.message.includes("unconsumed")
      )).toBe(true);
    });

    it("should warn on leftover chords at end of file", () => {
      const input = `{q: [1] [4] [5]}
Line _one`;

      const result = processChordQueue(input);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatchObject({
        line: 1,
        message: expect.stringContaining("2 unconsumed"),
      });
    });

    it("should handle lines with no underscores", () => {
      const input = `{q: [1] [4] [5]}
Just a normal line
_one _two _three`;

      const result = processChordQueue(input);

      expect(result.output).toBe(
        `Just a normal line
[1]one [4]two [5]three`
      );
      expect(result.warnings).toEqual([]);
    });

    it("should not modify non-queue directives", () => {
      const input = `{title: My Song}
{key: G}
{q: [1]}
_Start`;

      const result = processChordQueue(input);

      expect(result.output).toBe(
        `{title: My Song}
{key: G}
[1]Start`
      );
      expect(result.warnings).toEqual([]);
    });

    it("should handle empty lines", () => {
      const input = `{q: [1]}

_Line`;

      const result = processChordQueue(input);

      // {q:} directive is not output, empty line is preserved, _Line becomes [1]Line
      expect(result.output).toContain("[1]Line");
      expect(result.output.split("\n").length).toBe(2); // 2 lines in output (empty + processed)
      expect(result.warnings).toEqual([]);
    });

    it("should process chords with accidentals", () => {
      const input = `{q: [b3] [#5] [7dim]}
_Chord _one _more`;

      const result = processChordQueue(input);

      expect(result.output).toBe(
        `[b3]Chord [#5]one [7dim]more`
      );
      expect(result.warnings).toEqual([]);
    });

    it("should keep underscore if queue empty", () => {
      const input = `{q: [1]}
_One
Another _ here`;

      const result = processChordQueue(input);

      expect(result.output).toContain("_");
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // Integration tests
  describe("Integration - Real ChordPro examples", () => {
    it("should process Amazing Grace correctly", () => {
      const input = `{key: Bb}
{q: [1] [4] [1] [5]}
A_mazing grace, how _sweet the _sound
That saved a wretch like _me
{q: [1] [4] [1] [5] [1]}
I _once was lost, but _now I'm _found
Was blind, but _now I _see`;

      const result = processChordQueue(input);

      expect(result.output).toContain("A[1]mazing grace, how [4]sweet the [1]sound");
      expect(result.output).toContain("That saved a wretch like [5]me");
      expect(result.output).toContain("I [1]once was lost, but [4]now I'm [1]found");
      expect(result.output).toContain("Was blind, but [5]now I [1]see");
      expect(result.warnings).toEqual([]);
    });

    it("should warn on mixed usage errors", () => {
      const input = `{q: [1] [4]}
Line with _ and _
Another _ without queue`;

      const result = processChordQueue(input);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) =>
        w.message.includes("queue is empty")
      )).toBe(true);
    });

    it("should handle consecutive underscores", () => {
      const input = `{q: [1] [4]}
__Start`;

      const result = processChordQueue(input);

      expect(result.output).toContain("[1][4]Start");
      expect(result.warnings).toEqual([]);
    });
  });
});
