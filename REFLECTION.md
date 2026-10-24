# Reflection

**Name / Andrew ID:** Anjali Dadlani, anjalid

**Recitation group members (Task 2):** N/A

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

“returns exactly five colors” passes on the correct implementation and kills almost no mutants, because every mutant also returns five colors. It’s still a valid property, since the result has to have one color per position of the guess. It would catch a bug like a version that skips a position and returns only four colors when the guess has a repeated letter, or one that returns an extra entry.


### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

With a full-alphabet generator, singlePass was flaky (killed in 3/5 runs), even though my property “never credits a letter more times than the secret contains it” is correct. singlePass only goes wrong when a letter appears twice in the guess, so that an early yellow uses up the copy a later green needed. A random 5 letter word from 26 letters rarely repeats a letter, so the generator only sometimes produced an input that exposed the bug. I fixed it by changing the generator to draw words from a small alphabet (A, B, C), so repeated letters are common. After the change, all 5 mutants were killed in all 5 runs.

Before:
Running against 5 mutants (5 runs each)...

  ✔ allBlack       killed  by: is green exactly where the letters match in place; credits every letter as often as possible; guessing the secret gives all greens
      Counterexample: ["AAAAA","AAAAA"]
      AssertionError: expected false to be true // Object.is equality
  ✔ greensOnly     killed  by: credits every letter as often as possible
      Counterexample: ["AAAAL","ALAAA"]
      AssertionError: expected 3 to be 4 // Object.is equality
  ✔ ignoresCounts  killed  by: never credits a letter more times than thesecret contains it; credits every letter as often as possible
      Counterexample: ["AJAAA","JAJAA"]
      AssertionError: expected 2 to be less than or equal to 1
  ~ singlePass     flaky: killed in 3/5 runs  by: never credits a letter more times than the secret contains it; credits every letter as often as possible
      Counterexample: ["AAAAZ","ZAAAZ"]
      AssertionError: expected 2 to be less than or equal to 1
  ✔ swapped        killed  by: never credits a letter more times than thesecret contains it; credits every letter as often as possible
      Counterexample: ["AAWAA","AALWA"]
      AssertionError: expected 1 to be less than or equal to 0

Mutation score: 4/5 killed (80%)


After:
Running against 5 mutants (5 runs each)...

  ✔ allBlack       killed  by: is green exactly where the letters match in place; credits every letter as often as possible; guessing the secret gives all greens
      Counterexample: ["AAAAA","AAAAA"]
      AssertionError: expected false to be true // Object.is equality
  ✔ greensOnly     killed  by: credits every letter as often as possible
      Counterexample: ["AAAAB","AAACA"]
      AssertionError: expected 3 to be 4 // Object.is equality
  ✔ ignoresCounts  killed  by: never credits a letter more times than thesecret contains it; credits every letter as often as possible
      Counterexample: ["AAABA","AAABB"]
      AssertionError: expected 2 to be less than or equal to 1
  ✔ singlePass     killed  by: never credits a letter more times than thesecret contains it; credits every letter as often as possible
      Counterexample: ["AAAAC","AAACC"]
      AssertionError: expected 2 to be less than or equal to 1
  ✔ swapped        killed  by: never credits a letter more times than thesecret contains it; credits every letter as often as possible
      Counterexample: ["BCCAA","CAAAA"]
      AssertionError: expected 3 to be less than or equal to 2

Mutation score: 5/5 killed (100%)



### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.


  ✔ mergesIntegerNeighbors  killed  by: leaves intervals that do not overlap unchanged; covers exactly the same points as the input
      Counterexample: [[[1,1],[2,2]]]
      AssertionError: expected [ [ 1, 2 ] ] to deeply equal [ [ 1, 1 ], [2, 2 ] ]

The input is [1,1] and [2,2]. The spec says intervals merge only if they overlap or touch. These two don’t touch, because the real numbers between 1 and 2 are in neither interval, so the correct output keeps them separate as [1,1] and [2,2]. The mutant merges them into [1,2], which wrongly covers the points between 1 and 2.


### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.


One function that would benefit from property based testing is recordEditDecision, the function in the permission module that records whether the user accepted or rejected an edit when they reply to a permission request. 

Property 1 (invariant): For any sequence of edit permission requests and replies, each reply produces exactly one decision record, and its outcome (accepted or rejected) matches the reply. So the number of records equals the number of replied edit requests.

Property 2 (conditional): If a permission request is not for an edit, replying to it records no edit decision.

Generator: I’d generate a random list of permission requests. Each one has a tool type (edit or not), a file path, and a reply of once, always, or reject. A naive generator would mess this up in a few ways. It could reply to a request that was never made, or reply to the same request twice. It could also give every request a different file path, so “always” would never apply to a later request for the same file. So mine would make the request first, answer each request only once, reuse a small set of file paths so repeats happen, and mix edit and non-edit requests so property 2 has something to check.