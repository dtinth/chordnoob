/**
 * Nashville Number System converter
 * Converts numbered chords (1, 2m, 7dim, etc.) to actual chord names
 * based on a specified musical key.
 */

type Note =
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "A"
  | "B"
  | "Db"
  | "Eb"
  | "Gb"
  | "Ab"
  | "Bb";

// Chromatic scale for calculating intervals (using sharps as primary)
const CHROMATIC = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

// Map flat notes to their sharp equivalents for lookup
const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

// Enharmonic equivalents for flat keys
const FLAT_NOTES: Record<string, Note> = {
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
  "A#": "Bb",
};

// Keys with flats
const FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb"]);

// Major scale intervals (in semitones from root)
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

// Scale degree default qualities (for no suffix)
const DEFAULT_QUALITIES: Record<number, string> = {
  1: "", // major
  2: "m", // minor
  3: "m", // minor
  4: "", // major
  5: "", // major
  6: "m", // minor
  7: "dim", // diminished
};

/**
 * Get the chord root note for a given scale degree in a key.
 * @param key - The root note of the key (e.g., "G", "C", "D")
 * @param degree - The scale degree (1-7)
 * @returns The root note of the chord
 */
export function getChordRoot(key: Note, degree: number): Note {
  // Convert flat keys to sharps for lookup
  let lookupKey = key as string;
  if (FLAT_TO_SHARP[key]) {
    lookupKey = FLAT_TO_SHARP[key];
  }

  const keyIndex = CHROMATIC.indexOf(lookupKey);
  if (keyIndex === -1) throw new Error(`Invalid key: ${key}`);

  // Get the interval for this scale degree
  const interval = MAJOR_SCALE_INTERVALS[(degree - 1) % 7];
  const chordIndex = (keyIndex + interval) % 12;

  let note = CHROMATIC[chordIndex] as Note;

  // Convert to flat notation for flat keys
  if (FLAT_KEYS.has(key) && FLAT_NOTES[note]) {
    note = FLAT_NOTES[note];
  }

  return note;
}

/**
 * Validate and normalize a Nashville number string.
 * Examples: "1", "2m", "7dim", "1maj7", "4sus2"
 */
export function parseNashvilleNumber(
  input: string
): { degree: number; quality: string } | null {
  const match = input.match(/^([1-7])(.*)$/);
  if (!match) return null;

  const degree = parseInt(match[1], 10);
  const quality = match[2];

  return { degree, quality };
}

/**
 * Convert a Nashville number to a chord symbol.
 * @param nashvilleNumber - The number part (e.g., "2m", "7dim", "1maj7")
 * @param key - The key the song is in
 * @returns The chord symbol (e.g., "Am", "F#dim", "Cmaj7")
 */
export function nashvilleToChord(nashvilleNumber: string, key: Note): string {
  const parsed = parseNashvilleNumber(nashvilleNumber);
  if (!parsed) throw new Error(`Invalid Nashville number: ${nashvilleNumber}`);

  const { degree, quality } = parsed;
  const root = getChordRoot(key, degree);

  // If a quality is specified, use it as-is
  if (quality) {
    return root + quality;
  }

  // Otherwise use default quality for this scale degree
  const defaultQuality = DEFAULT_QUALITIES[degree] || "";
  return root + defaultQuality;
}
