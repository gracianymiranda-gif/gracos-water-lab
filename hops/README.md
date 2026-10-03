# Hop Calculus

A browser-based hop comparison tool: radar-chart flavour profiles, blend
prediction by parts, style matching, nearest-profile substitutes, and a
library of 158 hops — 138 of them read from Brülosophy's Hop Chronicles
articles. Like the rest of this repo it is a static page: open
`hop-calculus.html` and it works. There is nothing to install.

## Files

| File | Role |
| --- | --- |
| `hop-calculus.html` | **Generated.** The tool. Open this one. |
| `hop-calculus.template.html` | Source. Edit this, then rebuild. |
| `chronicle-parser.js` | Post parsers, injected into the page by the build and imported by the tests. |
| `csv.js` | The one CSV reader the build and the tests share. |
| `build-hops.mjs` | Rebuilds the HTML from the template + CSVs. Deterministic. |
| `data/hop-profiles.csv` | One row per variety: chemistry, 10 descriptor axes, styles. |
| `data/hop-chronicles.csv` | One row per article: variety, crop year, origin, series (the test beer), publication date, URL and a one-line background note. The page names each article's entry `Variety (YYYY PA)` or `(YYYY PL)`; a bare name is a composite. |

No build step to *use* the page. To *change* it, edit the template, the parser
or either CSV and rebuild:

```
node hops/build-hops.mjs
node tests/hop-calculus.test.mjs
JSDOM_PATH=/path/to/node_modules/jsdom node tests/hop-calculus.browser.test.mjs
```

Node built-ins only — no `npm install`, no `package.json`. The browser test
takes jsdom from `$JSDOM_PATH` and skips itself when that is unset; CI
installs one into the runner's temp directory, never into the checkout.
CI also fails if the committed `hop-calculus.html` is not byte-identical to a
fresh build, so the page can never drift from its sources.

## What is in the library, and how much to trust it

Every comparison shows where each number came from:

| Row | Meaning |
| --- | --- |
| **Figures from** | The Brülosophy article the chemistry and the ranking were read out of. For the eleven varieties with two articles (a different crop year or test beer) the two entries share one profile; the entry whose article was not the source says so and links the one that was. A composite has no article. |
| **Notes** | Anything the extraction flagged about that entry — a descriptor with no axis, or the Enigma/Pekko warning below. |
| **Verified** | Nothing ships verified. Only you can tick it, under Manage Hops, and only by naming what you checked against (a spec sheet, a lab report, your lot's COA). A verified entry is never overwritten by a later data update. |
| **Article** | Crop year, origin, the beer it was tested in and the publication date — Hop Chronicles entries only. |
| **Background** | The one-line variety note from the article index; also the tooltip on each library row and a column of the article table on the Hop Chronicles tab. |
| **Profile source** | `from post` (138): first-hand, from the article. `composite` (20): a hand-tuned general character for a well-known variety. `yours`: whatever you entered. |

Earlier builds carried `estimate` and `reported` tiers for profiles drawn from
judgement or search summaries. The full extraction of all 138 articles replaced
them; a browser holding a saved copy from that era may still show a few, and
they are the weakest thing on the page.

### How a descriptor score is made

Brülosophy publishes descriptor votes, not oil analysis, and most posts rank
aroma and flavour separately. A descriptor ranked 1st / 2nd / 3rd in a
"most prominent" list scores 9 / 8 / 7 (6 for 4th or later); an axis keeps
its best rank across the two lists, which is why two or three axes on one hop
can all read 9. Everything else is 2. The shipped entries were built from the
ranked lists alone. When you paste a whole article, two more steps apply: a
descriptor mentioned elsewhere in the post scores 5, and one the post calls
lowest-rated scores 1. Descriptors the series tracks but this tool has no axis
for (onion/garlic, apple/pear) are reported as notes, never folded into a
neighbouring axis. It is a ranking translated to a scale, not a measurement.

### Composites sit on a different scale

The twenty composites are informed judgement about how a variety usually
reads, on a 0–10 scale that uses the whole range; the post-derived profiles
are ranks. A blend that mixes the two says so, and the nearest-profile
distances across that line mean less. Every one of the twenty varieties also
has at least one Hop Chronicles entry (Columbus/CTZ as CTZ, Tettnang as
Tettnanger, Idaho 7 also as 007 Golden Hop), so each appears twice in the
library. The Source pill in the library panel applies to the list, Style Match
and Characteristic Search, so you can see one tier at a time.

## Accuracy

The extraction was checked against 14 hops whose Hop Stats blocks were
transcribed from the articles by hand — 16 field comparisons, 15 of which
agreed. The one that did not was a parser fault: Vista is the only article
printing two stats on one line, and its alpha field had swallowed
`Beta: 3.5 - 5.5%`. Fixed, with a regression test.

An earlier pass reconciled alpha and beta against a second hop database (363
records) and spot-checked 12 hops against vendor and breeder sources; both
agreed with the extraction. That reconciliation is not recorded per entry,
which is why the page says "Figures from" and not "cross-checked".

### One entry is wrong at source

**Enigma and Pekko publish identical chemistry and identical parentage text.**
One of those two articles carries the other hop's figures — the error is
Brülosophy's, not the extraction's. Both entries say so in their Notes row, and
`tests/hop-calculus.test.mjs` records the pair as a known source duplicate so it
warns rather than failing. Verify either against a merchant spec sheet before
brewing.

Alpha figures are variety-typical ranges. **Confirm alpha acid on your actual
lot before any bittering calculation** — this tool covers flavour and aroma
character, not IBU maths.

## Adding data

The Hop Chronicles tab lists every article; filter it, open a post, and paste
its text (or just its Hop Stats block). The parser reads alpha, beta,
cohumulone, total oil and the oil breakdown in either table shape the
articles use, and the ranked descriptors from the results sentence — both
lists when aroma and flavour are ranked apart. A field printed `unknown` is
left blank, never guessed. If the pasted text never mentions the hop you
looked up, the page asks before applying it. Nothing enters the library until
you press Save.

Fetching an article directly will not work — Brülosophy sends no CORS headers,
so a browser refuses the cross-site read. The tool tries, explains the failure,
and falls back to pasting.

To add rows for a new article, append to both CSVs (one row per article in
`hop-chronicles.csv`; one row per variety in `hop-profiles.csv`, chemistry in
the shape `9 - 12%` and `1.5 - 2.0 mL/100g`), rebuild, and run the tests. The
build refuses a profile row that matches no article and an article with no
profile row.

## Tests

`tests/hop-calculus.test.mjs` (plain node) covers the parsers against fixtures
taken from the articles' own phrasing, the CSV reader, the shipped data's shape
and hygiene, and that the committed page is a fresh build.
`tests/hop-calculus.browser.test.mjs` (jsdom, optional locally, always in CI)
drives the built page: persistence across reloads, import/export, the paste
flow, blends by parts, filters, the shareable URL, and the accessibility
contract (tabs, names, live regions).
