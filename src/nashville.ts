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
 * Examples: "1", "2m", "7dim", "1maj7", "4sus2", "b3", "#4"
 */
export function parseNashvilleNumber(
  input: string
): { accidental: string; degree: number; quality: string } | null {
  const match = input.match(/^([b#]?)([1-7])(.*)$/);
  if (!match) return null;

  const accidental = match[1];
  const degree = parseInt(match[2], 10);
  const quality = match[3];

  return { accidental, degree, quality };
}

/**
 * Reverse map: sharp notes to their flat equivalents
 */
const SHARP_TO_FLAT: Record<string, Note> = {
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
  "A#": "Bb",
};

/**
 * Apply accidental shift to a note.
 * @param note - The note to shift (e.g., "C", "F#")
 * @param accidental - "#" for sharp, "b" for flat
 * @returns The shifted note
 */
function applyAccidental(note: string, accidental: string): Note {
  if (!accidental) return note as Note;

  const noteIndex = CHROMATIC.indexOf(note);
  if (noteIndex === -1) {
    // Try converting flat to sharp equivalent
    const sharpEquiv = FLAT_TO_SHARP[note];
    if (sharpEquiv) {
      return applyAccidental(sharpEquiv, accidental);
    }
    throw new Error(`Cannot apply accidental to unknown note: ${note}`);
  }

  if (accidental === "#") {
    // Move up a semitone - prefer sharp spelling
    const result = CHROMATIC[(noteIndex + 1) % 12];
    return result as Note;
  } else if (accidental === "b") {
    // Move down a semitone - prefer flat spelling
    const result = CHROMATIC[(noteIndex - 1 + 12) % 12];
    // Convert sharp result to flat if available
    return (SHARP_TO_FLAT[result] || result) as Note;
  }

  return note as Note;
}

/**
 * Convert a single Nashville number to a chord symbol.
 * Per Nashville Number System: "A number by itself (without any other notation)
 * is assumed to represent a major chord."
 *
 * @param nashvilleNumber - The number part (e.g., "1", "2m", "7dim", "1maj7", "b3", "#4")
 * @param key - The key the song is in
 * @returns The chord symbol (e.g., "C", "Am", "F#dim", "Cmaj7", "Eb", "F#")
 */
export function nashvilleToChord(nashvilleNumber: string, key: Note): string {
  const parsed = parseNashvilleNumber(nashvilleNumber);
  if (!parsed) throw new Error(`Invalid Nashville number: ${nashvilleNumber}`);

  const { accidental, degree, quality } = parsed;
  let root = getChordRoot(key, degree);

  // Apply accidental if specified
  if (accidental) {
    root = applyAccidental(root, accidental);
  }

  // If a quality is specified, use it as-is; otherwise default to major
  return root + quality;
}

/**
 * Check if a string looks like a Nashville number.
 * Pattern: optional accidental [b#] followed by scale degree [1-7], then optional quality
 */
export function isNashvilleNumber(str: string): boolean {
  return /^[b#]?[1-7]/.test(str);
}

/**
 * Convert a chord string that may contain slash chords or polychords.
 * Each part separated by / is checked: if it's Nashville, it's converted; otherwise kept as-is.
 * Examples:
 *   "1" -> "C" (in key C)
 *   "1/5" -> "C/G" (in key C)
 *   "1/Gm" -> "C/Gm" (mixed notation)
 *   "|" -> "|" (not Nashville, unchanged)
 *
 * @param chordString - Chord string with possible slashes
 * @param key - The key the song is in
 * @returns Converted chord string
 */
export function convertChordWithSlashes(chordString: string, key: Note): string {
  return chordString
    .split("/")
    .map((part) => {
      // Only try to convert if it looks like Nashville
      if (isNashvilleNumber(part)) {
        return nashvilleToChord(part, key);
      }
      // Otherwise keep it as-is
      return part;
    })
    .join("/");
}
