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

| Badge | n | Meaning |
| --- | --- | --- |
| `from post` | 138 | First-hand: extracted from the article's own tables |
| `composite` | 20 | Hand-tuned generalized variety character |

Every Hop Chronicles entry is now first-hand. Earlier builds carried `estimate`
and `reported` tiers for profiles derived from judgement or from search
summaries; a full extraction of all 138 articles replaced them, and those tiers
no longer appear.

`reported` is styled as provisional deliberately. Those descriptors came
through a channel that was separately caught reporting one hop's lab figures
under two other hops' names, so they are marked weaker than the rest.

**Verified** is stronger than all of it and nothing ships verified — only you
can attest to a source. Ticking it under Manage Hops requires naming what the
hop was checked against; an unattributed tick is refused. A verified entry is
never overwritten by a later data update, because your measurement outranks a
shipped estimate.

## Accuracy

The library was cross-checked against 14 hops whose Hop Stats were transcribed
from the articles by hand: **15 of 16 chemistry fields agreed**. The one that
did not was a parser fault — Vista is the only article printing two stats on one
line, and its alpha field had swallowed `Beta: 3.5 - 5.5%`. Fixed.

An earlier pass reconciled alpha and beta against a second hop database (363
records), and spot-checked 12 hops against vendor and breeder sources. Both
agreed with the extraction.

### One entry is wrong at source

**Enigma and Pekko publish identical chemistry and identical parentage text.**
One of those two articles carries the other hop's figures — the error is
Brülosophy's, not the extraction's. Both entries are annotated, and
`tests/hop-calculus.test.mjs` records the pair as a known source duplicate so it
warns rather than failing. Verify either against a merchant spec sheet before
brewing.

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
