/**
 * Streaming parser for ChordNoob
 * Processes input line-by-line using a single regex to match all tokens
 * Handles: [chords], {key:}, {q:}, _, and regular text
 */

import {
  convertChordWithSlashes,
  isNashvilleNumber,
  type Note,
} from "./nashville";

export interface Warning {
  line: number;
  message: string;
}

/**
 * Token types found by the regex
 */
type Token =
  | { type: "key"; value: Note }
  | { type: "queue"; value: string[] }
  | { type: "chord"; value: string }
  | { type: "underscore" }
  | { type: "text"; value: string }
  | { type: "comment"; value: string };

export class ChordNoobParser {
  private key: Note | null = null;
  private queue: string[] = [];
  private queueLineStart = -1;
  private currentLineNumber = 0;
  private warnings: Warning[] = [];

  // Regex to match all tokens we care about in order
  private tokenRegex = /\{key:\s*([A-G][b#]?)\}|\{q:\s*(.*?)\}|\[([^\]]+)\]|_|#.*?$|./g;

  /**
   * Process a single line and return the processed output
   */
  processLine(line: string): string {
    this.currentLineNumber++;

    // Skip comment lines completely
    if (line.trim().startsWith("#")) {
      return line;
    }

    // Tokenize and process the line
    const tokens = this.tokenizeLine(line);
    let result = "";

    for (const token of tokens) {
      switch (token.type) {
        case "key":
          if (!this.key) {
            this.key = token.value;
          }
          // Keep the directive in output
          result += `{key: ${token.value}}`;
          break;

        case "queue":
          // Warn if previous queue wasn't consumed
          if (this.queue.length > 0) {
            this.warnings.push({
              line: this.queueLineStart,
              message: `Previous chord queue has ${this.queue.length} unconsumed chord(s)`,
            });
          }
          this.queue = token.value;
          this.queueLineStart = this.currentLineNumber;
          // Don't output the {q:} directive
          break;

        case "underscore":
          if (this.queue.length === 0) {
            this.warnings.push({
              line: this.currentLineNumber,
              message: "Underscore placeholder found but queue is empty",
            });
            // Keep the underscore
            result += "_";
          } else {
            let chord = this.queue.shift()!;
            // Convert Nashville number if key is available
            if (this.key && (chord.includes("/") || isNashvilleNumber(chord))) {
              try {
                chord = convertChordWithSlashes(chord, this.key);
              } catch {
                // Keep original if conversion fails
              }
            }
            result += `[${chord}]`;
          }
          break;

        case "chord":
          // Try to convert Nashville number
          if (this.key && (token.value.includes("/") || isNashvilleNumber(token.value))) {
            try {
              const converted = convertChordWithSlashes(token.value, this.key);
              result += `[${converted}]`;
            } catch {
              // Keep original if conversion fails
              result += `[${token.value}]`;
            }
          } else {
            // Keep non-Nashville chords as-is
            result += `[${token.value}]`;
          }
          break;

        case "text":
        case "comment":
          result += token.value;
          break;
      }
    }

    return result;
  }

  /**
   * Tokenize a line using regex matching
   */
  private tokenizeLine(line: string): Token[] {
    const tokens: Token[] = [];
    const regex = this.tokenRegex;
    // Reset regex state
    regex.lastIndex = 0;

    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match[1]) {
        // Key directive
        tokens.push({ type: "key", value: match[1] as Note });
      } else if (match[2]) {
        // Queue directive - parse chords from it
        const chordsText = match[2];
        const chords: string[] = [];
        const chordMatches = chordsText.matchAll(/\[([^\]]+)\]/g);
        for (const chordMatch of chordMatches) {
          chords.push(chordMatch[1]);
        }
        tokens.push({ type: "queue", value: chords });
      } else if (match[3]) {
        // Chord brackets
        tokens.push({ type: "chord", value: match[3] });
      } else if (match[0] === "_") {
        // Underscore placeholder
        tokens.push({ type: "underscore" });
      } else {
        // Regular text (including #comments)
        const text = match[0];
        if (text === "#") {
          // Start of comment - consume rest of line
          const remaining = line.substring(regex.lastIndex - 1);
          tokens.push({ type: "comment", value: remaining });
          break;
        } else {
          tokens.push({ type: "text", value: text });
        }
      }
    }

    return tokens;
  }

  /**
   * Finalize processing - should be called after all lines
   */
  finalize(): Warning[] {
    // Warn if queue has leftovers
    if (this.queue.length > 0) {
      this.warnings.push({
        line: this.queueLineStart,
        message: `End of input reached with ${this.queue.length} unconsumed chord(s) from queue at line ${this.queueLineStart}`,
      });
    }

    return this.warnings;
  }

  /**
   * Get current warnings
   */
  getWarnings(): Warning[] {
    return [...this.warnings];
  }
}
