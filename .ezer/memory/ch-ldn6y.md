---
type: note
created: '2026-01-08T15:36:40.722Z'
---
# ChordNoob Project

A lightweight preprocessor for ChordPro format with two main features:

## Feature 1: Nashville Number System
- Converts Nashville numbers to actual chords based on `{key: X}` directive
- Syntax: `[1]`, `[4]`, `[5]`, `[2m]`, `[7dim]`, etc.
- Scale degrees: 1 2m 3m 4 5 6m 7dim (major scale, number alone = major chord)
- Works inline: `[1]Amazing [4]grace`

## Feature 2: Chord Queue
- `{q: [1] [4] [1]}` queues up chords
- `_` in lyrics consumes next chord from queue
- Example: `{q:[1] [4] [1]} a_mazing grace how _sweet the _sound`
- Warnings (non-fatal):
  - `_` when queue is empty
  - New `{q:}` before previous queue consumed
  - Leftover chords in queue

## Design Decisions
- Both features are independent (can use one without the other)
- Stays within ChordPro format structure
- Strict but forgiving: warnings don't fail compilation
- Uses `{key: X}` directive for Nashville conversion

## Tech Stack
- Bun + TypeScript with strict syntax
- Bun's built-in test runner with coverage (`bun test --coverage`)
- Acceptance tests for all features and warning scenarios
