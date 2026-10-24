import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Step 1: a generator for five-letter uppercase words.
// const word = ...
const wordfrom = (letters: string) =>
  fc.array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5 }).map(cs => cs.join(''));
// const word = wordfrom(ALPHABET);
const word = wordfrom('ABC');

const count = (letter: string, w: string) => [...w].filter(c => c === letter).length;

describe('matchGuess', () => {
  // Pattern: invariant. The result always has exactly five colors.
  it('returns exactly five colors', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        expect(matchGuess(secret, guess)).toHaveLength(5);
      }),
    );
  });

  // Pattern: invariant. Every color is G, Y, or B.
  it('only uses the colors G, Y, B', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        for (const c of matchGuess(secret, guess)) {
          expect(['G', 'Y', 'B']).toContain(c);
        }
      }),
    );
  });

  // Pattern: invariant. Position i is green exactly when guess[i] equals secret[i].
  it('is green exactly where the letters match in place', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);
        for (let i = 0; i < 5; i++) {
          expect(result[i] === 'G').toBe(guess[i] === secret[i]);
        }
      }),
    );
  });

  // Pattern: invariant. A letter is never credited more often than the secret contains it, and a yellow letter occurs in the secret.
  it('never credits a letter more times than the secret contains it', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const credited = [...guess].filter((c, i) => c === letter && result[i] !== 'B').length;
          expect(credited).toBeLessThanOrEqual(count(letter, secret));
        }
        for (let i = 0; i < 5; i++) {
          if (result[i] === 'Y') expect(secret).toContain(guess[i]);
        }
      }),
    );
  });

  // Pattern: invariant. For each letter, the G/Y credits equal min(times in guess, times in secret).
  it('credits every letter as often as possible', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const credited = [...guess].filter((c, i) => c === letter && result[i] !== 'B').length;
          expect(credited).toBe(Math.min(count(letter, guess), count(letter, secret)));
        }
      }),
    );
  });

  // Pattern: conditional. If the guess is the secret, every color is green.
  it('guessing the secret gives all greens', () => {
    fc.assert(
      fc.property(word, secret => {
        expect(matchGuess(secret, secret)).toEqual(['G', 'G', 'G', 'G', 'G']);
      }),
    );
  });

  // Pattern: conditional. If secret and guess share no letters, every color is black.
  it('gives all blacks when the words share no letters', () => {
    fc.assert(
      fc.property(wordfrom('ABCDEFGHIJKLM'), wordfrom('NOPQRSTUVWXYZ'), (secret, guess) => {
        expect(matchGuess(secret, guess)).toEqual(['B', 'B', 'B', 'B', 'B']);
      }),
    );
  });

  // Pattern: metamorphic. Swapping the letters A and B everywhere, in both words, does not change the result.
  it('is unchanged by swapping two letters in both words', () => {
    const swapAB = (w: string) =>
      [...w].map(c => (c === 'A' ? 'B' : c === 'B' ? 'A' : c)).join('');
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        expect(matchGuess(swapAB(secret), swapAB(guess))).toEqual(matchGuess(secret, guess));
      }),
    );
  });
});