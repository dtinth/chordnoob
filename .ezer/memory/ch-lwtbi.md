---
type: feedback
created: '2026-01-08T15:40:44.862Z'
---
Bug: puzzle links appear to be mutually exclusive or getting overwritten

## Repro
1. Create 4 puzzles:
   - Main (ch-u34fp)
   - Setup (ch-hllxi) 
   - Nashville (ch-7ea3b)
   - Queue (ch-zedvk)

2. Link setup to block both Nashville and Queue:
   ezer puzzle link --id ch-hllxi --blocks ch-7ea3b
   ezer puzzle link --id ch-hllxi --blocks ch-zedvk

3. Link both Nashville and Queue to block Main:
   ezer puzzle link --id ch-7ea3b --blocks ch-u34fp
   ezer puzzle link --id ch-zedvk --blocks ch-u34fp

## Expected
- Only Setup should be ready
- Nashville and Queue should be blocked by Setup
- Main should be blocked by Nashville and Queue

## Actual
- When linking ch-hllxi --blocks ch-7ea3b, then ch-hllxi --blocks ch-zedvk, the first link seems to disappear
- The 'blocks' relationship from ch-hllxi only retains one target at a time
- Re-linking one causes the other to become ready again

## Possible cause
Looks like a puzzle can only block one other puzzle, or the links array is being replaced instead of appended.
