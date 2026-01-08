import { createInterface } from "node:readline";
import { ChordNoobParser } from "./src/streaming";

async function main() {
  const parser = new ChordNoobParser();

  try {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    // Process each line as it arrives
    for await (const line of rl) {
      const processed = parser.processLine(line);
      console.log(processed);
    }

    // Finalize and report warnings to stderr
    const warnings = parser.finalize();
    if (warnings.length > 0) {
      for (const warning of warnings) {
        console.error(
          `chordnoob:${warning.line}: warning: ${warning.message}`
        );
      }
    }
  } catch (error) {
    console.error(
      "chordnoob: error:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("chordnoob: fatal error:", err);
  process.exit(1);
});