# ChordNoob

A lightweight **[ChordPro](https://www.chordpro.org/) preprocessor** that with these features:

- **Nashville Number System:** Write chords [using scale degrees instead of absolute note names](https://en.wikipedia.org/wiki/Nashville_Number_System), so you don’t have to transpose the chords in your head while transcribing. For example, if you hear a two-five-one, you can transcribe as [2m] [5] [1] regardless of the song's key.
- **Chord Queues:** Separate the chord notation from the lyrics.

## Example

```
{key:Eb}
{q:[1] [6m] [5] [57] [1] [1maj7] [4] [1]}
_Holy, _holy, _ho_-_ly!_
_Lord God Al_mighty
{q:[5/7] [1] [5/7] [6m] [2/6] [5/7] [4/1] [5/2] [27] [5] [57]}
_Early _in _the _mor_-_ning
_Our _song shall _rise to _Thee_
{q:[1] [6m] [5] [57] [1] [1maj7] [4] [1]}
_Holy, _holy, _ho_-_ly!_
_Merciful and _mighty
{q:[6m] [1/3] [17/3] [4] [1] [17] [2m] [57] [1]}
_God _in _three _per_sons_
_Blessed _Trini_ty!
```

**Nashville number processing:** The numbers in the chord notations enclosed in `[` square brackets `]` will be treated as a scale degree in the current `{key:}`. This results in chords with absolute note names.

```
{key:Eb}
{q:[Eb] [Cm] [Bb] [Bb7] [Eb] [Ebmaj7] [Ab] [Eb]}
_Holy, _holy, _ho_-_ly!_
_Lord God Al_mighty
{q:[Bb/D] [Eb] [Bb/D] [Cm] [F/C] [Bb/D] [Ab/Eb] [Bb/F] [F7] [Bb] [Bb7]}
_Early _in _the _mor_-_ning
_Our _song shall _rise to _Thee_
{q:[Eb] [Cm] [Bb] [Bb7] [Eb] [Ebmaj7] [Ab] [Eb]}
_Holy, _holy, _ho_-_ly!_
_Merciful and _mighty
{q:[Cm] [Eb/G] [Eb7/G] [Ab] [Eb] [Eb7] [Fm] [Bb7] [Eb]}
_God _in _three _per_sons_
_Blessed _Trini_ty!
```

**Queue processing:** The `{q:}` directive queues up chords to be replaced in each successive `_`. That is, each chord in the `{q:}` directive will be matched up and substituted into the subsequent `_` tokens found later. This results in a standard ChordPro file that looks like this:

```
{key: Eb}
[Eb]Holy, [Cm]holy, [Bb]ho[Bb7]-[Eb]ly![Ebmaj7]
[Ab]Lord God Al[Eb]mighty
[Bb/D]Early [Eb]in [Bb/D]the [Cm]mor[F/C]-[Bb/D]ning
[Ab/Eb]Our [Bb/F]song shall [F7]rise to [Bb]Thee[Bb7]
[Eb]Holy, [Cm]holy, [Bb]ho[Bb7]-[Eb]ly![Ebmaj7]
[Ab]Merciful and [Eb]mighty
[Cm]God [Eb/G]in [Eb7/G]three [Ab]per[Eb]sons[Eb7]
[Fm]Blessed [Bb7]Trini[Eb]ty!
```

Both features are independent of each other, they work well together, so you can pick and choose the features you want.

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
