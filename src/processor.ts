/**
 * ChordNoob Main Preprocessor
 * Combines Nashville Number System and Chord Queue features
 */

import {
  convertChordWithSlashes,
  isNashvilleNumber,
} from "./nashville";
import { processChordQueue, Warning } from "./chordQueue";
import type { Note } from "./nashville";

export interface ProcessingResult {
  output: string;
  warnings: Warning[];
}

/**
 * Extract the {key: X} directive from ChordPro text
 * @returns The key (e.g., "G", "Bb") or null if not found
 */
export function extractKey(text: string): Note | null {
  const match = text.match(/\{key:\s*([A-G][b#]?)\}/);
  if (!match) return null;
  return match[1] as Note;
}

/**
 * Process a ChordPro document with Nashville Number System and Chord Queue
 * 1. Process chord queue ({q:} directives and _ replacements)
 * 2. Convert Nashville numbers to chords based on {key:}
 * 3. Ignores comments (lines starting with #)
 *
 * @param text - ChordPro formatted text
 * @returns Processed text and any warnings
 */
export function processChordNoob(text: string): ProcessingResult {
  const warnings: Warning[] = [];

  // Step 1: Extract key from directives (ignore comments)
  const key = extractKeyIgnoringComments(text);
  if (!key) {
    warnings.push({
      line: 1,
      message: "No {key: X} directive found - Nashville numbers cannot be converted",
    });
  }

  // Step 2: Process chord queue (handle {q:} and _ placeholders)
  const { output: afterQueue, warnings: queueWarnings } = processChordQueue(text);
  warnings.push(...queueWarnings);

  if (!key) {
    // Can't convert Nashville numbers without a key, return after queue processing
    return { output: afterQueue, warnings };
  }

  // Step 3: Convert Nashville numbers in chord brackets, but skip comment lines
  const lines = afterQueue.split("\n");
  const processedLines = lines.map((line) => {
    // Skip comment lines (starting with #)
    if (line.trim().startsWith("#")) {
      return line;
    }

    // Convert Nashville numbers in chord brackets
    // Match patterns like [1], [2m], [b3/5], etc.
    return line.replace(/\[([^\]]+)\]/g, (match, chordString) => {
      // Check if this chord string contains any Nashville numbers
      if (!chordString.includes("/") && !isNashvilleNumber(chordString)) {
        // Not Nashville, keep as-is
        return match;
      }

      // Try to convert (handles slash chords too)
      try {
        const converted = convertChordWithSlashes(chordString, key);
        return `[${converted}]`;
      } catch {
        // If conversion fails, keep original
        return match;
      }
    });
  });

  return { output: processedLines.join("\n"), warnings };
}

/**
 * Extract key while ignoring comments
 */
function extractKeyIgnoringComments(text: string): Note | null {
  const lines = text.split("\n");
  for (const line of lines) {
    // Skip comment lines
    if (line.trim().startsWith("#")) continue;
    const key = extractKey(line);
    if (key) return key;
  }
  return null;
}
