import { describe, it, expect } from "bun:test";
import { extractKey, processChordNoob } from "./processor";

describe("ChordNoob Processor", () => {
  describe("extractKey", () => {
    it("should extract key from directive", () => {
      expect(extractKey("{key: C}")).toBe("C");
      expect(extractKey("{key: G}")).toBe("G");
      expect(extractKey("{key: Bb}")).toBe("Bb");
      expect(extractKey("{key: F#}")).toBe("F#");
    });

    it("should handle whitespace variations", () => {
      expect(extractKey("{key:C}")).toBe("C");
      expect(extractKey("{key: G}")).toBe("G");
      expect(extractKey("{key:  Bb  }")).toBeNull(); // Extra spaces not supported
    });

    it("should return null if no key directive", () => {
      expect(extractKey("{title: My Song}")).toBeNull();
      expect(extractKey("Some lyrics")).toBeNull();
    });
  });

  describe("processChordNoob", () => {
    it("should warn if no key directive", () => {
      const result = processChordNoob("[1]Amazing [4]grace");

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain("No {key:");
    });

    it("should convert Nashville numbers with key directive", () => {
      const input = `{key: C}
[1]Amazing [4]grace how [5]sweet`;

      const result = processChordNoob(input);

      expect(result.output).toContain("[C]Amazing");
      expect(result.output).toContain("[F]grace");
      expect(result.output).toContain("[G]sweet");
      expect(result.warnings).toEqual([]);
    });

    it("should process chord queue and convert Nashville numbers", () => {
      const input = `{key: G}
{q: [1] [4] [1] [5]}
A_mazing _grace how _sweet the _sound`;

      const result = processChordNoob(input);

      expect(result.output).toContain("A[G]mazing");
      expect(result.output).toContain("[C]grace");
      expect(result.output).toContain("[G]sweet");
      expect(result.output).toContain("[D]sound");
      expect(result.warnings).toEqual([]);
    });

    it("should handle full Amazing Grace example", () => {
      const input = `{title: Amazing Grace}
{key: Bb}
{q: [1] [4] [1] [5]}
A_mazing grace, how _sweet the _sound
That saved a wretch like _me
{q: [1] [4] [1] [5] [1]}
I _once was lost, but _now I'm _found
Was blind, but _now I _see`;

      const result = processChordNoob(input);

      expect(result.output).toContain("{title: Amazing Grace}");
      expect(result.output).toContain("{key: Bb}");
      expect(result.output).toContain("A[Bb]mazing");
      expect(result.output).toContain("[Eb]sweet");
      expect(result.output).toContain("[F]me");
      expect(result.warnings).toEqual([]);
    });

    it("should keep regular chords unchanged", () => {
      const input = `{key: G}
[C]Regular [Am]chords [G]stay [D]same`;

      const result = processChordNoob(input);

      expect(result.output).toContain("[C]Regular");
      expect(result.output).toContain("[Am]chords");
      expect(result.output).toContain("[G]stay");
      expect(result.output).toContain("[D]same");
    });

    it("should handle mixed Nashville and regular chords", () => {
      const input = `{key: C}
[1]Start with [Am]this then [4]continue`;

      const result = processChordNoob(input);

      expect(result.output).toContain("[C]Start");
      expect(result.output).toContain("[Am]this");
      expect(result.output).toContain("[F]continue");
    });

    it("should convert slash chords with Nashville", () => {
      const input = `{key: C}
[1/5] [4/1] [Gm/5]`;

      const result = processChordNoob(input);

      expect(result.output).toContain("[C/G]");
      expect(result.output).toContain("[F/C]");
      expect(result.output).toContain("[Gm/G]");
    });

    it("should preserve all non-chord directives", () => {
      const input = `{title: Test}
{artist: Someone}
{key: G}
[1]Verse`;

      const result = processChordNoob(input);

      expect(result.output).toContain("{title: Test}");
      expect(result.output).toContain("{artist: Someone}");
      expect(result.output).toContain("{key: G}");
    });

    it("should handle accidentals in Nashville numbers", () => {
      const input = `{key: C}
[b3] [#4] [b7]`;

      const result = processChordNoob(input);

      expect(result.output).toContain("[Eb]");
      expect(result.output).toContain("[F#]");
      expect(result.output).toContain("[Bb]");
    });

    it("should warn on queue and Nashville issues", () => {
      const input = `{key: G}
{q: [1] [4]}
Line _one
_two _missing`;

      const result = processChordNoob(input);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain("Underscore placeholder found but queue is empty");
    });

    it("should handle empty lines", () => {
      const input = `{key: C}

[1]Line after empty`;

      const result = processChordNoob(input);

      expect(result.output).toContain("[C]Line");
      expect(result.output.split("\n").length).toBe(3);
    });
  });

  describe("Integration - Real world examples", () => {
    it("should process a complete song", () => {
      const input = `{title: Simple Song}
{artist: Test Artist}
{key: D}

{q: [1] [5] [4]}
[Verse]
_First line _second _line
[Chorus]
{q: [1] [4] [5] [1]}
_Go back _home _soon _now`;

      const result = processChordNoob(input);

      // Verify directives preserved
      expect(result.output).toContain("{title: Simple Song}");
      expect(result.output).toContain("[Verse]");
      expect(result.output).toContain("[Chorus]");

      // Verify conversions (key D: 1=D, 4=G, 5=A)
      expect(result.output).toContain("[D]First");
      expect(result.output).toContain("[A]second");
      expect(result.output).toContain("[G]line");
    });

    it("should handle mixed Nashville and regular chords in complex song", () => {
      const input = `{title: Mixed}
{key: Bb}

[Verse]
{q: [1] [4m]}
_Chord A _chord B
Then some [Cm] and [F] regular chords
[Chorus]
{q: [5] [1]}
_Back to _end`;

      const result = processChordNoob(input);

      expect(result.output).toContain("[Bb]Chord");
      expect(result.output).toContain("[Ebm]chord");
      expect(result.output).toContain("[Cm]");
      expect(result.output).toContain("[F]");
      expect(result.output).toContain("[F]Back");
      expect(result.output).toContain("[Bb]end");
    });
  });
});
