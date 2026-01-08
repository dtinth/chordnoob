# ChordNoob

A lightweight ChordPro preprocessor that adds **Nashville Number System** support and **Chord Queues** to your chord charts.

## Features

### 🎵 Nashville Number System

Convert scale degrees to actual chords based on the song's key. All numbers default to **major** (per Nashville spec).

```
Input (key: Bb):   [1]  [4]  [5]  [1]
Output:            [Bb] [Eb] [F]  [Bb]
```

**Explicit qualities:**
- Minors: `[2m]`, `[3m]`, `[6m]`
- Diminished: `[7dim]`
- Complex: `[1maj7]`, `[4sus2]`

**Accidentals:**
```
{key: C}
[b3]  [#4]  [b7]
[Eb]  [F#]  [Bb]
```

**Slash chords & polychords:**
```
[1/5]      → [C/G]      (in key C)
[1/Gm/A]   → [C/Gm/A]   (mixed notation)
```

### 📋 Chord Queue

Queue up chords to replace underscores (`_`) in your lyrics—no need to manually place each chord.

```
{q: [1] [4] [1] [5]}
A_mazing grace, how _sweet the _sound
That saved a wretch like _me

Output:
A[1]mazing grace, how [4]sweet the [5]sound
That saved a wretch like [1]me
```

**With conversion:**
```
{key: Bb}
{q: [1] [4] [1] [5]}
A_mazing grace, how _sweet the _sound

Output:
{key: Bb}
A[Bb]mazing grace, how [Eb]sweet the [Bb]sound
```

### 💬 Comments

Lines starting with `#` are preserved unchanged:

```
{key: G}
# This is a verse
[1]Start _here
```

## Installation

```bash
git clone https://github.com/yourusername/chordnoob
cd chordnoob
bun install
```

## Usage

### CLI (stdin/stdout)

Process ChordPro files directly:

```bash
cat song.txt | bun run index.ts > output.txt
```

Warnings are printed to stderr:
```
chordnoob:4: warning: Underscore placeholder found but queue is empty
```

### As a Library

```typescript
import { ChordNoobParser } from "./src/streaming";

const parser = new ChordNoobParser();

const output1 = parser.processLine("{key: G}");
const output2 = parser.processLine("{q: [1] [4] [5]}");
const output3 = parser.processLine("A_mazing _grace");

const warnings = parser.finalize();
console.log(output1); // {key: G}
console.log(output2); // (empty - {q:} directive removed)
console.log(output3); // A[G]mazing [C]grace
```

## Examples

### Example 1: Amazing Grace

**Input:**
```
{title: Amazing Grace}
{key: Bb}
{q: [1] [4] [1] [5]}
A_mazing grace, how _sweet the _sound
That saved a wretch like _me
{q: [1] [4] [1] [5] [1]}
I _once was lost, but _now I'm _found
Was blind, but _now I _see
```

**Output:**
```
{title: Amazing Grace}
{key: Bb}
A[Bb]mazing grace, how [Eb]sweet the [Bb]sound
That saved a wretch like [F]me
I[Bb]once was lost, but [Eb]now I'm [Bb]found
Was blind, but [F]now I [Bb]see
```

### Example 2: Mixed Nashville & Regular Chords

**Input:**
```
{key: G}
[Verse]
[1]Start with _Nashville
Then some [Em] and [Am] regular chords
```

**Output:**
```
{key: G}
[Verse]
[G]Start with _Nashville
Then some [Em] and [Am] regular chords
```

### Example 3: Directives on Same Line

**Input:**
```
{key:C} {q:[1] [4]} _First _Second
```

**Output:**
```
{key: C} [C]First [F]Second
```

## How It Works

1. **Tokenization** - Single regex matches all tokens: `[chords]`, `{directives}`, `_`, comments, and text
2. **State Management** - Parser maintains key and queue state across lines
3. **Conversion** - Nashville numbers converted only if a `{key:}` directive exists
4. **Streaming** - Lines processed one at a time via `node:readline` (no buffering)

## Design Decisions

- **All numbers default to major** per Nashville Number System spec (write `2m`, `3m`, `6m`, `7dim` for other qualities)
- **`{q:}` directives are removed** from output (they're instructions, not lyrics)
- **Queue persists across lines** until consumed or new queue defined
- **Comments preserved** (lines starting with `#`)
- **Nashville conversion is optional** (regular chords work without a key)
- **Warnings are non-fatal** (process continues even with queue misuse)

## Warnings

### "Underscore placeholder found but queue is empty"
You used `_` but no `{q:}` directive provided chords. The underscore is kept in output.

### "Previous chord queue has N unconsumed chord(s)"
A new `{q:}` directive was found before all chords from the previous queue were consumed. Previous chords are discarded.

### "End of input reached with N unconsumed chord(s)"
The file ended with leftover chords in the queue. They were never used.

## Testing

Run the test suite with coverage:

```bash
bun test src/ --coverage
```

**Results:**
- 79 tests across 4 modules
- 95% function coverage
- 96.82% line coverage

Individual test files:
- `src/nashville.test.ts` - Nashville Number System (31 tests)
- `src/chordQueue.test.ts` - Chord Queue (19 tests)
- `src/streaming.test.ts` - Streaming Parser (13 tests)
- `src/processor.test.ts` - Full Integration (16 tests)

## Architecture

```
index.ts
  └─ ChordNoobParser (src/streaming.ts)
       ├─ convertChordWithSlashes() [src/nashville.ts]
       ├─ parseQueueDirective() [src/chordQueue.ts]
       └─ tokenizeLine() [regex-based]
```

### Modules

- **`src/nashville.ts`** - Nashville number conversion (Nashville → chord names)
- **`src/chordQueue.ts`** - Queue parsing and underscore replacement
- **`src/streaming.ts`** - Line-by-line parser with state management
- **`src/processor.ts`** - Higher-level processor (batch mode)

## Requirements

- **Bun** 1.3.5+ (or any version compatible with `node:readline`)
- **TypeScript** 5.9+

## Development

Setup:
```bash
bun install
mise use bun@latest  # Optional: pin Bun version
```

Run tests:
```bash
bun test src/
bun test src/ --coverage
```

Build/Type check:
```bash
bunx tsc --noEmit
```

## License

MIT

## Contributing

This is a minimal, focused tool. New features should:
- Keep the regex tokenizer as the core
- Maintain line-by-line independence (tokens don't cross boundaries)
- Be covered by tests (run `bun test --coverage` before submitting)
- Be documented with examples
