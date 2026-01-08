/**
 * ChordPro Chord Queue handler
 * Processes {q: [chord] [chord] ...} directives and replaces _ with queued chords
 */

export interface Warning {
  line: number;
  message: string;
}

export interface ProcessingResult {
  output: string;
  warnings: Warning[];
}

/**
 * Parse chord queue directive from a line
 * Example: {q: [1] [4] [5]}
 */
export function parseQueueDirective(line: string): string[] | null {
  const match = line.match(/\{q:\s*(.*?)\}/);
  if (!match) return null;

  const chordsText = match[1];
  // Extract all chord patterns: [chord], including numbers and qualities
  const chords: string[] = [];
  const chordMatches = chordsText.matchAll(/\[([^\]]+)\]/g);

  for (const match of chordMatches) {
    chords.push(match[1]);
  }

  return chords;
}

/**
 * Process a ChordPro document with queue support
 * - Parses {q:} directives to queue chords
 * - Replaces _ placeholders with queued chords
 * - Warns on queue misuse
 */
export function processChordQueue(text: string): ProcessingResult {
  const lines = text.split("\n");
  const output: string[] = [];
  const warnings: Warning[] = [];

  let queue: string[] = [];
  let queueLineStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line starts a new queue directive
    const newQueue = parseQueueDirective(line);

    if (newQueue !== null) {
      // Warn if previous queue wasn't consumed
      if (queue.length > 0) {
        warnings.push({
          line: queueLineStart + 1,
          message: `Previous chord queue (line ${queueLineStart + 1}) has ${queue.length} unconsumed chord(s)`,
        });
      }

      queue = newQueue;
      queueLineStart = i;
      // Don't output the {q:} directive itself
      continue;
    }

    // Process underscores in non-directive lines
    let processedLine = "";

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === "_") {
        if (queue.length === 0) {
          warnings.push({
            line: i + 1,
            message: `Underscore placeholder found but queue is empty`,
          });
          // Keep the underscore as-is
          processedLine += "_";
        } else {
          // Replace underscore with next chord from queue
          const chord = queue.shift()!;
          processedLine += `[${chord}]`;
        }
      } else {
        processedLine += char;
      }
    }

    output.push(processedLine);
  }

  // Warn if queue has leftovers at end
  if (queue.length > 0) {
    warnings.push({
      line: queueLineStart + 1,
      message: `End of file reached with ${queue.length} unconsumed chord(s) from queue at line ${queueLineStart + 1}`,
    });
  }

  return {
    output: output.join("\n"),
    warnings,
  };
}
