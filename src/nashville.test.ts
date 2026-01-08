import { describe, it, expect } from "bun:test";
import {
  getChordRoot,
  parseNashvilleNumber,
  nashvilleToChord,
  isNashvilleNumber,
  convertChordWithSlashes,
} from "./nashville";

describe("Nashville Number System", () => {
  describe("getChordRoot", () => {
    it("should get correct roots for C major scale", () => {
      expect(getChordRoot("C", 1)).toBe("C"); // I
      expect(getChordRoot("C", 2)).toBe("D"); // ii
      expect(getChordRoot("C", 3)).toBe("E"); // iii
      expect(getChordRoot("C", 4)).toBe("F"); // IV
      expect(getChordRoot("C", 5)).toBe("G"); // V
      expect(getChordRoot("C", 6)).toBe("A"); // vi
      expect(getChordRoot("C", 7)).toBe("B"); // vii°
    });

    it("should get correct roots for G major scale", () => {
      expect(getChordRoot("G", 1)).toBe("G");
      expect(getChordRoot("G", 2)).toBe("A");
      expect(getChordRoot("G", 3)).toBe("B");
      expect(getChordRoot("G", 4)).toBe("C");
      expect(getChordRoot("G", 5)).toBe("D");
      expect(getChordRoot("G", 6)).toBe("E");
      expect(getChordRoot("G", 7)).toBe("F#");
    });

    it("should get correct roots for D major scale", () => {
      expect(getChordRoot("D", 1)).toBe("D");
      expect(getChordRoot("D", 2)).toBe("E");
      expect(getChordRoot("D", 3)).toBe("F#");
      expect(getChordRoot("D", 4)).toBe("G");
      expect(getChordRoot("D", 5)).toBe("A");
      expect(getChordRoot("D", 6)).toBe("B");
      expect(getChordRoot("D", 7)).toBe("C#");
    });

    it("should handle flat keys", () => {
      expect(getChordRoot("Bb", 1)).toBe("Bb");
      expect(getChordRoot("Bb", 4)).toBe("Eb");
      expect(getChordRoot("Bb", 5)).toBe("F");
    });

    it("should throw on invalid keys", () => {
      expect(() => getChordRoot("H" as any, 1)).toThrow();
      expect(() => getChordRoot("Q" as any, 5)).toThrow();
    });
  });

  describe("parseNashvilleNumber", () => {
    it("should parse simple numbers", () => {
      expect(parseNashvilleNumber("1")).toEqual({
        accidental: "",
        degree: 1,
        quality: "",
      });
      expect(parseNashvilleNumber("5")).toEqual({
        accidental: "",
        degree: 5,
        quality: "",
      });
    });

    it("should parse numbers with qualities", () => {
      expect(parseNashvilleNumber("2m")).toEqual({
        accidental: "",
        degree: 2,
        quality: "m",
      });
      expect(parseNashvilleNumber("7dim")).toEqual({
        accidental: "",
        degree: 7,
        quality: "dim",
      });
      expect(parseNashvilleNumber("1maj7")).toEqual({
        accidental: "",
        degree: 1,
        quality: "maj7",
      });
    });

    it("should handle complex qualities", () => {
      expect(parseNashvilleNumber("4sus2")).toEqual({
        accidental: "",
        degree: 4,
        quality: "sus2",
      });
      expect(parseNashvilleNumber("5b9")).toEqual({
        accidental: "",
        degree: 5,
        quality: "b9",
      });
    });

    it("should parse accidentals before degree", () => {
      expect(parseNashvilleNumber("b3")).toEqual({
        accidental: "b",
        degree: 3,
        quality: "",
      });
      expect(parseNashvilleNumber("#4")).toEqual({
        accidental: "#",
        degree: 4,
        quality: "",
      });
      expect(parseNashvilleNumber("b2m")).toEqual({
        accidental: "b",
        degree: 2,
        quality: "m",
      });
    });

    it("should return null for invalid inputs", () => {
      expect(parseNashvilleNumber("8")).toBeNull();
      expect(parseNashvilleNumber("0")).toBeNull();
      expect(parseNashvilleNumber("x")).toBeNull();
      expect(parseNashvilleNumber("")).toBeNull();
    });
  });

  describe("nashvilleToChord", () => {
    it("should convert Nashville numbers in C major (all as major by default)", () => {
      expect(nashvilleToChord("1", "C")).toBe("C");
      expect(nashvilleToChord("2", "C")).toBe("D");
      expect(nashvilleToChord("3", "C")).toBe("E");
      expect(nashvilleToChord("4", "C")).toBe("F");
      expect(nashvilleToChord("5", "C")).toBe("G");
      expect(nashvilleToChord("6", "C")).toBe("A");
      expect(nashvilleToChord("7", "C")).toBe("B");
    });

    it("should convert Nashville numbers in G major (all as major by default)", () => {
      expect(nashvilleToChord("1", "G")).toBe("G");
      expect(nashvilleToChord("2", "G")).toBe("A");
      expect(nashvilleToChord("3", "G")).toBe("B");
      expect(nashvilleToChord("4", "G")).toBe("C");
      expect(nashvilleToChord("5", "G")).toBe("D");
      expect(nashvilleToChord("6", "G")).toBe("E");
      expect(nashvilleToChord("7", "G")).toBe("F#");
    });

    it("should convert Nashville numbers in D major", () => {
      expect(nashvilleToChord("1", "D")).toBe("D");
      expect(nashvilleToChord("4", "D")).toBe("G");
      expect(nashvilleToChord("5", "D")).toBe("A");
    });

    it("should respect explicit qualities", () => {
      expect(nashvilleToChord("1m", "C")).toBe("Cm");
      expect(nashvilleToChord("4maj7", "C")).toBe("Fmaj7");
      expect(nashvilleToChord("5sus4", "G")).toBe("Dsus4");
      expect(nashvilleToChord("2m7", "C")).toBe("Dm7");
    });

    it("should handle flat keys", () => {
      expect(nashvilleToChord("1", "Bb")).toBe("Bb");
      expect(nashvilleToChord("4", "Bb")).toBe("Eb");
      expect(nashvilleToChord("5", "Bb")).toBe("F");
    });

    it("should apply accidentals", () => {
      // b3 in C major: E -> Eb (major, since 3 defaults to major)
      expect(nashvilleToChord("b3", "C")).toBe("Eb");
      // #4 in C major: F -> F# (major)
      expect(nashvilleToChord("#4", "C")).toBe("F#");
      // b7 in C major: B -> Bb (major, not diminished)
      expect(nashvilleToChord("b7", "C")).toBe("Bb");
    });

    it("should apply accidentals in sharp keys", () => {
      // b3 in G major: B -> Bb (major)
      expect(nashvilleToChord("b3", "G")).toBe("Bb");
      // #5 in G major: D -> D#
      expect(nashvilleToChord("#5", "G")).toBe("D#");
    });

    it("should apply accidentals with qualities", () => {
      expect(nashvilleToChord("b3m7", "C")).toBe("Ebm7");
      expect(nashvilleToChord("#4maj7", "C")).toBe("F#maj7");
    });

    it("should throw on invalid Nashville numbers", () => {
      expect(() => nashvilleToChord("8", "C")).toThrow();
      expect(() => nashvilleToChord("0", "C")).toThrow();
    });

    it("should handle edge case of accidental on valid notes", () => {
      // Test that accidentals work consistently across all degrees
      expect(nashvilleToChord("b1", "C")).toBe("B");
      expect(nashvilleToChord("#1", "C")).toBe("C#");
      expect(nashvilleToChord("b6", "C")).toBe("Ab");
    });
  });

  describe("isNashvilleNumber", () => {
    it("should recognize Nashville numbers", () => {
      expect(isNashvilleNumber("1")).toBe(true);
      expect(isNashvilleNumber("5")).toBe(true);
      expect(isNashvilleNumber("2m")).toBe(true);
      expect(isNashvilleNumber("7dim")).toBe(true);
      expect(isNashvilleNumber("b3")).toBe(true);
      expect(isNashvilleNumber("#4m7")).toBe(true);
    });

    it("should reject non-Nashville strings", () => {
      expect(isNashvilleNumber("C")).toBe(false);
      expect(isNashvilleNumber("Am")).toBe(false);
      expect(isNashvilleNumber("Gm")).toBe(false);
      expect(isNashvilleNumber("|")).toBe(false);
      expect(isNashvilleNumber("8")).toBe(false);
      expect(isNashvilleNumber("")).toBe(false);
    });
  });

  describe("convertChordWithSlashes", () => {
    it("should convert simple Nashville chords", () => {
      expect(convertChordWithSlashes("1", "C")).toBe("C");
      expect(convertChordWithSlashes("5", "G")).toBe("D");
    });

    it("should convert slash chords with both parts Nashville", () => {
      expect(convertChordWithSlashes("1/5", "C")).toBe("C/G");
      expect(convertChordWithSlashes("4/1", "G")).toBe("C/G");
    });

    it("should handle mixed Nashville and regular chords", () => {
      expect(convertChordWithSlashes("1/Gm", "C")).toBe("C/Gm");
      expect(convertChordWithSlashes("C/5", "G")).toBe("C/D");
      expect(convertChordWithSlashes("1/Bb/5", "C")).toBe("C/Bb/G");
    });

    it("should keep non-Nashville chords unchanged", () => {
      expect(convertChordWithSlashes("C", "G")).toBe("C");
      expect(convertChordWithSlashes("|", "C")).toBe("|");
      expect(convertChordWithSlashes("Gm/A", "C")).toBe("Gm/A");
    });

    it("should handle polychords with Nashville numbers", () => {
      expect(convertChordWithSlashes("1/5m/6", "C")).toBe("C/Gm/A");
      expect(convertChordWithSlashes("b3/5/7", "C")).toBe("Eb/G/B");
    });

    it("should handle accidentals in slash chords", () => {
      expect(convertChordWithSlashes("1/#4", "C")).toBe("C/F#");
      expect(convertChordWithSlashes("b3/5m", "C")).toBe("Eb/Gm");
    });
  });

  // Integration tests
  describe("Integration - Common progressions", () => {
    it("should convert I-IV-V-I (1 4 5 1)", () => {
      const progression = ["1", "4", "5", "1"];
      const chords = progression.map((num) => nashvilleToChord(num, "G"));
      expect(chords).toEqual(["G", "C", "D", "G"]);
    });

    it("should convert vi-IV-I-V (6 4 1 5) in C major", () => {
      const progression = ["6", "4", "1", "5"];
      const chords = progression.map((num) => nashvilleToChord(num, "C"));
      expect(chords).toEqual(["A", "F", "C", "G"]);
    });

    it("should convert with mixed qualities - using explicit minor", () => {
      const progression = ["1", "6m", "4maj7", "5"];
      const chords = progression.map((num) => nashvilleToChord(num, "C"));
      // 6 by itself is major A, but 6m is minor Am
      expect(chords).toEqual(["C", "Am", "Fmaj7", "G"]);
    });
  });
});
