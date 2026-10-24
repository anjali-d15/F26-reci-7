import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const interval: fc.Arbitrary<Interval> = fc
  .tuple(fc.integer({ min: -15, max: 15 }), fc.nat(8))
  .map(([start, len]): Interval => [start, start + len]);
const intervalList = fc.array(interval, { maxLength: 10 });

const disjointList: fc.Arbitrary<Interval[]> = fc
  .tuple(
    fc.integer({ min: -15, max: 15 }),
    fc.array(fc.tuple(fc.integer({ min: 1, max: 4 }), fc.nat(5)), { maxLength: 8 }),
  )
  .map(([firstPosition, steps]) => {
    let previousEnd = firstPosition;
    return steps.map(([gapBefore, length]): Interval => {
      const start = previousEnd + gapBefore;
      const end = start + length;
      previousEnd = end;
      return [start, end];
    });
  });

const covered = (xs: readonly Interval[], p: number) => xs.some(([a, b]) => a <= p && p <= b);

const point = fc.integer({ min: -80, max: 80 }).map(n => n / 2);




describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });



  // Add your properties here. Aim for at least one of each pattern:
  // invariant, algebraic, metamorphic, differential, conditional.

  // Pattern: invariant. The output is sorted, each interval is valid, and consecutive intervals don't overlap or touch.
  it('returns sorted intervals with gaps between them', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (const [a, b] of out) expect(a).toBeLessThanOrEqual(b);
        for (let i = 0; i + 1 < out.length; i++) {
          expect(out[i][1]).toBeLessThan(out[i + 1][0]);
        }
      }),
    );
  });

  // Pattern: invariant. The input array and its intervals are not modified.
  it('does not modify its input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const copy = xs.map(([start, end]) => [start, end]);
        mergeIntervals(xs);
        expect(xs).toEqual(copy);
      }),
    );
  });

  // Pattern: differential. A point is covered by the input exactly when it is covered by the output.
  it('covers exactly the same points as the input', () => {
    fc.assert(
      fc.property(intervalList, fc.array(point, { minLength: 1, maxLength: 20 }), (xs, ps) => {
        const out = mergeIntervals(xs);
        for (const p of ps) expect(covered(out, p)).toBe(covered(xs, p));
      }),
    );
  });

  // Pattern: algebraic. Merging an already merged list changes nothing.
  it('merging twice gives the same result as merging once', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: metamorphic. Reversing the order of the input does not change the output.
  it('is unchanged by reversing the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        expect(mergeIntervals([...xs].reverse())).toEqual(mergeIntervals(xs));
      }),
    );
  });

  // Pattern: metamorphic. Adding a duplicate of an existing interval does not change the output.
  it('is unchanged by adding a duplicate of an interval', () => {
    fc.assert(
      fc.property(
        fc.array(interval, { minLength: 1, maxLength: 10 }).chain(xs =>
          fc.tuple(fc.constant(xs), fc.nat(xs.length - 1)),
        ),
        ([xs, i]) => {
          expect(mergeIntervals([...xs, [...xs[i]] as Interval])).toEqual(mergeIntervals(xs));
        },
      ),
    );
  });

  // Pattern: conditional. If no intervals overlap or touch, the output is the same as the input.
  it('leaves intervals that do not overlap unchanged', () => {
    fc.assert(
      fc.property(disjointList, xs => {
        expect(mergeIntervals(xs)).toEqual(xs);
      }),
    );
  });
});
