import { describe, it, expect } from "bun:test";
import {
  getChordRoot,
  parseNashvilleNumber,
  nashvilleToChord,
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
    });
  });

  describe("parseNashvilleNumber", () => {
    it("should parse simple numbers", () => {
      expect(parseNashvilleNumber("1")).toEqual({ degree: 1, quality: "" });
      expect(parseNashvilleNumber("5")).toEqual({ degree: 5, quality: "" });
    });

    it("should parse numbers with qualities", () => {
      expect(parseNashvilleNumber("2m")).toEqual({ degree: 2, quality: "m" });
      expect(parseNashvilleNumber("7dim")).toEqual({
        degree: 7,
        quality: "dim",
      });
      expect(parseNashvilleNumber("1maj7")).toEqual({
        degree: 1,
        quality: "maj7",
      });
    });

    it("should handle complex qualities", () => {
      expect(parseNashvilleNumber("4sus2")).toEqual({
        degree: 4,
        quality: "sus2",
      });
      expect(parseNashvilleNumber("5b9")).toEqual({
        degree: 5,
        quality: "b9",
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
    it("should convert Nashville numbers in C major", () => {
      expect(nashvilleToChord("1", "C")).toBe("C");
      expect(nashvilleToChord("2", "C")).toBe("Dm");
      expect(nashvilleToChord("3", "C")).toBe("Em");
      expect(nashvilleToChord("4", "C")).toBe("F");
      expect(nashvilleToChord("5", "C")).toBe("G");
      expect(nashvilleToChord("6", "C")).toBe("Am");
      expect(nashvilleToChord("7", "C")).toBe("Bdim");
    });

    it("should convert Nashville numbers in G major", () => {
      expect(nashvilleToChord("1", "G")).toBe("G");
      expect(nashvilleToChord("2", "G")).toBe("Am");
      expect(nashvilleToChord("3", "G")).toBe("Bm");
      expect(nashvilleToChord("4", "G")).toBe("C");
      expect(nashvilleToChord("5", "G")).toBe("D");
      expect(nashvilleToChord("6", "G")).toBe("Em");
      expect(nashvilleToChord("7", "G")).toBe("F#dim");
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

    it("should throw on invalid Nashville numbers", () => {
      expect(() => nashvilleToChord("8", "C")).toThrow();
      expect(() => nashvilleToChord("0", "C")).toThrow();
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
      expect(chords).toEqual(["Am", "F", "C", "G"]);
    });

    it("should convert with mixed qualities", () => {
      const progression = ["1", "6m", "4maj7", "5"];
      const chords = progression.map((num) => nashvilleToChord(num, "C"));
      // Note: 6 is naturally minor, so 6m redundantly makes it minor
      expect(chords).toEqual(["C", "Am", "Fmaj7", "G"]);
    });
  });
});
