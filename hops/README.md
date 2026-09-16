# Hop Calculus

A browser-based hop comparison tool: radar-chart flavour profiles, blend
prediction, style matching, and a library of Brülosophy Hop Chronicles data.
Like the rest of this repo it is a static page with no build step or
dependencies — open `hop-calculus.html` directly.

## Files

| File | Role |
| --- | --- |
| `hop-calculus.html` | **Generated.** The tool. Open this one. |
| `hop-calculus.template.html` | Source. Edit this, then rebuild. |
| `chronicle-parser.js` | Post parsers, shared with the build and the tests. |
| `build-hops.mjs` | Rebuilds the HTML from the template + CSVs. |
| `data/hop-profiles.csv` | One row per variety: chemistry, 10 descriptor axes. |
| `data/hop-chronicles.csv` | One row per article: variety, crop year, URL. |

Rebuild after editing the template, the parser, or either CSV:

```
node hops/build-hops.mjs
node tests/hop-calculus.test.mjs
```

No `npm install` — node built-ins only.

## The data is not uniformly trustworthy, and the tool says so

Every comparison shows four separate rows, because they answer four different
questions: **Alpha / Beta**, **Cohumulone / Oil**, **Cross-checked**,
**Verified**, and **Profile source**.

Profile source is one of:

| Badge | Meaning |
| --- | --- |
| `from post` | First-hand: read out of the article's own Hop Stats table |
| `composite` | Hand-tuned generalized variety character |
| `estimate` | Generalized variety character — judgement, not measurement |
| `reported` | Second-hand: descriptors from a *search summary* of an article |
| `unscored` | No reliable public character. Blank rather than guessed |

`reported` is styled as provisional deliberately. Those descriptors came
through a channel that was separately caught reporting one hop's lab figures
under two other hops' names, so they are marked weaker than the rest.

**Verified** is stronger than all of it and nothing ships verified — only you
can attest to a source. Ticking it under Manage Hops requires naming what the
hop was checked against; an unattributed tick is refused. A verified entry is
never overwritten by a later data update, because your measurement outranks a
shipped estimate.

## Accuracy

Alpha and beta for 81 entries were reconciled against a second hop database
(363 records); 64 of 75 comparable ranges already agreed. A separate 12-hop
spot-check against vendor and breeder sources matched on 10 of 12 alphas, and
was directionally right on flavour for all 12. Corrections from both passes are
applied.

Alpha figures are variety-typical ranges. **Confirm alpha acid on your actual
lot before any bittering calculation** — this tool covers flavour and aroma
character, not IBU maths.

## Adding data

Paste an article's Hop Stats block into the Hop Chronicles tab and the parser
reads it: alpha, beta, cohumulone, total oil and the oil breakdown, in either
the row-wise or column-wise table shape the articles use. A field printed as
`unknown` is left blank, never guessed.

Fetching an article directly will not work — Brülosophy sends no CORS headers,
so a browser refuses the cross-site read. The tool tries, explains the failure,
and falls back to pasting.

## Tests

```
node tests/hop-calculus.test.mjs
```

Covers URL parsing, both stat-table layouts, the cross-attribution guard,
descriptor ranking, fault descriptors never inflating a neighbouring axis, and
that the built page is in step with the CSVs.
