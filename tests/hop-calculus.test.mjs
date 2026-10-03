// Validates the hop library data and the Hop Chronicles parsers.
//
// Run:  node tests/hop-calculus.test.mjs
//
// No dependencies, in keeping with the rest of this repo. The parsers are pure
// string-in/object-out functions, so no DOM stub is needed; the data checks
// read the CSVs and the built HTML directly.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const hops = join(root, "hops");
const {
  AXES, htmlToText, parseAlphaAcid, parseChronicleUrl,
  parseDescriptorScores, parseHopStats, parseNumericRange, parseProminentCharacteristics,
} = await import(join(hops, "chronicle-parser.js"));

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) pass++;
  else { fail++; console.error(`FAIL ${name}${detail ? ": " + detail : ""}`); }
};
const eq = (name, got, want) => ok(name, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// ---- Set A: URL parsing ----
const u = parseChronicleUrl("https://brulosophy.com/2023/12/28/the-hop-chronicles-ctz-2022-pale-lager/");
eq("url: variety", u.variety, "CTZ");
eq("url: crop year", u.cropYear, "2022");
eq("url: series", u.series, "Pale Lager");
ok("url: rejects a non-series URL",
  parseChronicleUrl("https://brulosophy.com/2022/12/29/announcing-the-brulosophy-show/") === null);

// ---- Set B: hop stats, both real table shapes ----
// Row-wise, as the articles print it.
const rowWise = parseHopStats(
  "Alpha: 9 – 12%\nBeta: 7 – 9%\nCohumulone: 27 – 31% of alpha acids\nTotal Oil: 1.0 – 1.8 mL/100g");
eq("stats row-wise: alpha", rowWise.alpha, "9 – 12%");
eq("stats row-wise: cohumulone strips 'of alpha acids'", rowWise.cohumulone, "27 – 31%");
eq("stats row-wise: total oil", rowWise.totalOil, "1.0 – 1.8 mL/100g");

// Column-wise: a header row of labels above a row of values. Checked BEFORE
// row-wise on purpose -- row-first reads "Alpha | Beta | 10.5% | 4.5%" as
// Beta=10.5%, silently attributing one stat's value to another.
const colWise = parseHopStats("Alpha | Beta | Cohumulone | Total Oil | | 10.5 – 11.5% | 4.5 – 5.0% | 26 – 28% | 1.5 – 2.0 mL/100g");
eq("stats column-wise: alpha", colWise.alpha, "10.5 – 11.5%");
eq("stats column-wise: beta", colWise.beta, "4.5 – 5.0%");
eq("stats column-wise: no cross-attribution", parseHopStats("Alpha | Beta | 10.5% | 4.5%").alpha, "10.5%");
// Vista prints two stats on one line; alpha once swallowed "Beta: 3.5 - 5.5%".
const oneLine = parseHopStats("Alpha: 7.5 - 9.5% Beta: 3.5 - 5.5% Cohumulone: 25 - 30% of alpha acids Total Oil: 1.2 mL/100g");
eq("stats one line: alpha does not swallow beta", oneLine.alpha, "7.5 - 9.5%");
eq("stats one line: beta", oneLine.beta, "3.5 - 5.5%");

// "Alpha Acid (aA)" -- the parenthetical symbol is itself a label synonym and
// would otherwise sit between a label and its value.
eq("stats: parenthetical symbol", parseHopStats("Alpha Acid (αA) 9.5%").alpha, "9.5%");

// An article printing "unknown" must yield nothing, never a guess.
ok("stats: 'unknown' stays blank", parseHopStats("Cohumulone: unknown").cohumulone === null);
ok("stats: absent stays blank", parseHopStats("The brew day went smoothly.").alpha === null);

// ---- Set C: taster descriptors ----
const scores = parseDescriptorScores(
  "The most prominent characteristics noted by tasters were tropical fruit, citrus, and apple/pear, " +
  "while less desirable notes of onion/garlic and earthy woody were among the lowest rated descriptors.");
eq("descriptors: rank 1 scores 9", scores.scores[AXES.indexOf("Tropical")], 9);
eq("descriptors: rank 2 scores 8", scores.scores[AXES.indexOf("Citrus")], 8);
eq("descriptors: lowest-rated scores 1", scores.scores[AXES.indexOf("Earthy")], 1);
// onion/garlic is a fault descriptor and must never inflate Dank.
ok("descriptors: unmapped reported, not folded in",
  scores.unmapped.join(" ").includes("onion/garlic") && scores.scores[AXES.indexOf("Dank")] !== 9);
ok("descriptors: no results sentence yields nothing",
  parseDescriptorScores("A fine beer all round.").scores === null);
eq("descriptors: post wording preserved",
  parseProminentCharacteristics("The most prominent characteristics were peach, citrus, and pine.").length, 3);

// ---- Set B2: stats shapes seen in the articles ----
// A column table with an "unknown" cell used to parse to nothing at all.
const colUnknown = parseHopStats("Alpha | Beta | Cohumulone | Total Oil\n12.2 – 15.4% | unknown | 25 – 30% | 1 – 1.6 mL/100g");
eq("stats column-wise: unknown cell is null, neighbours intact", [colUnknown.alpha, colUnknown.beta, colUnknown.cohumulone].join("|"), "12.2 – 15.4%||25 – 30%");
// An oil breakdown printed below the table used to be lost to an early return.
const belowTable = parseHopStats("Alpha\tBeta\tCohumulone\tTotal Oil\n9 – 12%\t7 – 9%\t27 – 31%\t1.0 – 1.8 mL/100g\nMyrcene: 55 – 65%\nFarnesene: 5 – 15%");
eq("stats: oil breakdown below a column table is read", belowTable.myrcene + "|" + belowTable.farnesene, "55 – 65%|5 – 15%");
// A tracked label printed "unknown" must not borrow the next, untracked figure.
ok("stats: farnesene 'unknown' does not take linalool's value",
  parseHopStats(htmlToText("Farnesene: unknown\nLinalool: 0.4 – 0.8%")).farnesene === null);
eq("stats: a qualifier is kept verbatim", parseHopStats("Farnesene: <1%").farnesene, "<1%");
eq("stats: 'of total oil' suffix stripped", parseHopStats("Myrcene: 55 – 65% of total oil").myrcene, "55 – 65%");
eq("stats: (AA%) label form", parseHopStats("Alpha Acid (AA%): 9.5%").alpha, "9.5%");
// The lot's alpha is the one under the Hop Stats heading, not the breeder's range in the intro.
eq("stats: Hop Stats section outranks prose", parseHopStats("Brewers love it for alpha acids in the 15 – 17% range. HOP STATS Alpha: 12 – 14%").alpha, "12 – 14%");
const nr = parseNumericRange("12.2 - 15.4%");
ok("numeric range: midpoint of a range", nr && nr.low === 12.2 && nr.high === 15.4 && Math.abs(nr.mid - 13.8) < 1e-9);
eq("numeric range: a point value", parseNumericRange("27%").mid, 27);
ok("numeric range: nothing numeric is null, not zero", parseNumericRange("n/a") === null && parseNumericRange("") === null);

// ---- Set C2: results sentences as the posts actually write them ----
const two = parseDescriptorScores("The most prominent aroma characteristics noted by tasters were tropical fruit, citrus and stone fruit, while the most prominent flavor characteristics were berry, floral and spicy.");
eq("descriptors: aroma and flavour lists both count", two.scores[AXES.indexOf("Berry")], 9);
eq("descriptors: an axis keeps its best rank across lists", two.scores[AXES.indexOf("Tropical")], 9);
const unknownTerm = parseDescriptorScores("The most prominent characteristics noted by tasters were tropical fruit, coconut, and citrus.");
eq("descriptors: an unknown term holds its rank instead of promoting the next", unknownTerm.scores[AXES.indexOf("Citrus")], 7);
ok("descriptors: and is reported", unknownTerm.unmapped.includes("coconut"));
const pineapple = parseDescriptorScores("Breeder notes say it smells of pineapple and mango. The most prominent characteristics noted by tasters were citrus and floral.");
eq("descriptors: 'pineapple' is not a pine mention", pineapple.scores[AXES.indexOf("Pine/Resin")], 2);
eq("descriptors: but is a tropical one", pineapple.scores[AXES.indexOf("Tropical")], 5);
ok("descriptors: 'Dr. Rudi' inside the sentence does not break it",
  parseDescriptorScores("The most prominent characteristics noted by tasters in the beer made with Dr. Rudi hops were citrus, pine and tropical fruit.").scores !== null);
const intro = parseDescriptorScores("Among the most prominent new varieties of that era were Citra and Mosaic. The most prominent characteristics noted by tasters were tropical fruit, citrus and stone fruit.");
eq("descriptors: a 'most prominent' sentence naming no descriptor is skipped", intro.scores[AXES.indexOf("Tropical")], 9);
eq("descriptors: lowest-rated clause without 'notes of'",
  parseDescriptorScores("The most prominent characteristics were tropical fruit and citrus, while onion/garlic and earthy/woody were among the lowest rated descriptors.").scores[AXES.indexOf("Earthy")], 1);
const fullPage = parseDescriptorScores("The most prominent characteristics noted by tasters were citrus and floral. Related: The Hop Chronicles | Strata 2018 (dank, berry). Comments: I got a lot of pine out of mine.");
eq("descriptors: related posts and comments after the article are not mentions", [fullPage.scores[AXES.indexOf("Dank")], fullPage.scores[AXES.indexOf("Pine/Resin")]].join(), "2,2");

// ---- Set A2: URL forms a browser hands over ----
ok("url: http, www, /amp/ and a query all resolve",
  ["http://www.brulosophy.com/2025/10/13/the-hop-chronicles-harlequin-2023-pale-ale/",
   "https://brulosophy.com/2025/10/13/the-hop-chronicles-harlequin-2023-pale-ale/amp/",
   "HTTPS://BRULOSOPHY.COM/2025/10/13/THE-HOP-CHRONICLES-HARLEQUIN-2023-PALE-ALE/?utm_source=x"]
    .every((x) => { const r = parseChronicleUrl(x); return r && r.variety === "Harlequin" && r.cropYear === "2023" && r.series === "Pale Ale"; }));
eq("url: the 2018 'chronicals' post", parseChronicleUrl("https://brulosophy.com/2018/04/05/the-hop-chronicals-citra-2017/").variety, "Citra");
eq("url: WordPress -2 suffix is not part of the hop", parseChronicleUrl("https://brulosophy.com/x/the-hop-chronicles-harlequin-2023-pale-ale-2/").variety, "Harlequin");

// ---- Set D: markup handling ----
const text = htmlToText('<style>.a{color:green}</style><script>var pine="tea";</script><p>Citrus notes.</p>');
eq("html: script and style contents dropped", text, "Citrus notes.");
// Plain pasted text goes through the same function; "<1%" is not a tag.
ok("html: '<1%' in plain text does not swallow the body",
  htmlToText("Farnesene: <1% Linalool: 0.5% The most prominent characteristics were citrus. Comments > 3").includes("most prominent"));
eq("html: numeric and named entities decoded", htmlToText("9 &#8211; 12% &ndash; &amp;lt;"), "9 – 12% – &lt;");
eq("alpha acid helper", parseAlphaAcid("Alpha Acid: 12.4%"), "12.4%");

// ---- Set E: shipped data integrity ----
const {parseCsv} = await import(join(hops, "csv.js"));
const csv = (p) => parseCsv(readFileSync(p, "utf8")).filter((r) => r.length > 1);
// The one CSV reader the build and these checks share, on the shapes that bite.
eq("csv: quoted comma", JSON.stringify(parseCsv('"a,b",c\n')), JSON.stringify([["a,b", "c"]]));
eq("csv: doubled quote", parseCsv('"he said ""hi"" twice",x\n')[0][0], 'he said "hi" twice');
eq("csv: a line break inside quotes stays one field, verbatim", parseCsv('"l1\r\nl2",x\n')[0][0], "l1\r\nl2");
eq("csv: byte-order mark is not part of the header", parseCsv("\ufeffVariety,Alpha\n")[0][0], "Variety");

const prof = csv(join(hops, "data/hop-profiles.csv"));
const ph = prof.shift();
const col = Object.fromEntries(ph.map((h, i) => [h, i]));
ok("profiles: header has every axis", AXES.every((a) => col[a] !== undefined));

// The same hop appears under more than one article title. These are documented
// rather than treated as contamination -- 007 Golden Hop IS Idaho 7, and a
// German-grown Perle is still Perle.
const ALIASES = [
  ["Chinook", "California Chinook"],
  ["Cascade", "California Cascade"],
  ["Idaho 7", "007 Golden Hop"],
  ["Northern Brewer", "German Northern Brewer"],
  ["Perle", "German Perle"],
  ["Tettnanger", "German Tettnanger"],
];
const aliased = (a, b) => ALIASES.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

// Pairs that share chemistry because the SOURCE published it that way. These
// warn rather than fail -- the duplication is real and already recorded in the
// entry's Cross-check note, so failing here forever would only train someone
// to ignore the check. A pair not listed here is a new problem.
const KNOWN_SOURCE_DUPES = [
  ["Enigma", "Pekko", "Brulosophy published identical stats and parentage text for both; one carries the wrong hop's figures at source"],
];
const sourceDupe = (a, b) =>
  KNOWN_SOURCE_DUPES.find(([x, y]) => (a === x && b === y) || (a === y && b === x));

let badScore = 0, dupStats = 0;
const statKeys = new Map();
for (const r of prof) {
  if (AXES.some((a) => { const n = Number(r[col[a]]); return !Number.isFinite(n) || n < 0 || n > 10; })) badScore++;
  const figures = [r[col["Alpha Acid"]], r[col["Beta Acid"]], r[col["Cohumulone"]], r[col["Total Oil"]]];
  // Alpha and beta alone can coincide between unrelated hops, so require at
  // least three populated figures before calling a match suspicious. All four
  // matching across DIFFERENT hops is the signature of one row copied onto
  // another -- how Citra's chemistry once turned up under two other names.
  if (figures.filter((f) => f.trim()).length < 3) continue;
  const k = figures.join("|");
  const prev = statKeys.get(k);
  if (prev && !aliased(prev, r[0])) {
    const known = sourceDupe(prev, r[0]);
    if (known) console.warn(`  known source duplicate: ${r[0]} == ${prev} -- ${known[2]}`);
    else { dupStats++; console.error(`  duplicate stats: ${r[0]} == ${prev}`); }
  } else if (!prev) statKeys.set(k, r[0]);
}
// Chemistry is printed verbatim from the source, but in one shape: "9 - 12%",
// "27%", "1.5 - 2.0 mL/100g". The extraction arrived with "mL / 100g",
// "ml/100g", "4% vol/wt mL/100g", "27 %", "24 - 26" with no unit, and
// "unavailable" as a value; a reader comparing two columns should not have
// to notice that, and the blend averages have to parse every one of them.
const PCT = /^\d[\d.]*( - \d[\d.]*)?%( \([^)]*\))?$/;
const OIL = /^\d[\d.]*( - \d[\d.]*)? mL\/100g$/;
const offShape = [];
for (const r of prof) {
  for (const c of ["Alpha Acid", "Beta Acid", "Cohumulone"]) {
    const v = r[col[c]]; if (v && !PCT.test(v)) offShape.push(`${r[0]} ${c}=${JSON.stringify(v)}`);
  }
  const o = r[col["Total Oil"]]; if (o && !OIL.test(o)) offShape.push(`${r[0]} Total Oil=${JSON.stringify(o)}`);
}
eq("profiles: chemistry cells share one shape", offShape.length, 0);
if (offShape.length) console.error("  " + offShape.join("\n  "));
eq("profiles: every descriptor score is 0-10", badScore, 0);
eq("profiles: no two hops share all four stat figures", dupStats, 0);

const idx = csv(join(hops, "data/hop-chronicles.csv"));
idx.shift();
ok("index: every row cites a Brulosophy URL",
  idx.every((r) => /^https:\/\/brulosophy\.com\//.test(r[6])), "a Source URL is missing or off-site");

// ---- Set E2: index hygiene ----
// The slug carries the crop year and series; the columns must agree with it,
// or the entry's key names a crop the article is not about (Riwaka once did).
const disagree = idx.filter((r) => {
  const m = r[6].toLowerCase().match(/-((?:19|20)\d{2})(?:-pale-(ale|lager))?\/?$/);
  if (!m) return false;
  return m[1] !== r[1] || (m[2] && (m[2] === "lager" ? "Pale Lager" : "Pale Ale") !== r[3]);
});
eq("index: slug year and series agree with the columns", disagree.map((r) => r[0]).join(), "");
// A note is variety background, not the article's opening line.
const openers = /^(?:We |Back in|Lately|Following the last|For the first foray|In the quest|As hinted|Most of the hops reviewed)/;
const badNotes = idx.filter((r) => r[5] && (openers.test(r[5]) || /(?:\bDr|\bMr|,)$/.test(r[5].trim())));
eq("index: notes are background, not article openers", badNotes.map((r) => r[0]).join(), "");
// Shipped scores come from ranked lists: 9/8/7/6 by rank, 2 for absent, and
// 5 or 1 only when a whole article was read. Anything else is a typo.
const offScale = prof.filter((r) => {
  const d = AXES.map((a) => Number(r[col[a]]));
  return d.some((v) => ![1, 2, 5, 6, 7, 8, 9].includes(v)) || !d.includes(9);
});
eq("profiles: every score is on the ranked-list scale with a top descriptor", offScale.map((r) => r[0]).join(), "");

// ---- Set F: the built page is in step with the CSVs ----
const built = readFileSync(join(hops, "hop-calculus.html"), "utf8");
// The strongest form of the check: the committed page IS a fresh build.
const {build} = await import(join(hops, "build-hops.mjs"));
ok("built page: byte-identical to a fresh build", built === build().html, "run node hops/build-hops.mjs and commit the result");
// The twenty composites live in the template, outside the CSV checks above.
{
  const m = built.match(/const CURATED_HOPS = (\{[\s\S]*?\n\});/);
  const curated = m ? new Function("return " + m[1])() : {};
  const names = Object.keys(curated);
  eq("composites: twenty of them", names.length, 20);
  ok("composites: every vector is ten scores in 0-10",
    names.every((n) => Array.isArray(curated[n].d) && curated[n].d.length === AXES.length && curated[n].d.every((v) => Number.isInteger(v) && v >= 0 && v <= 10)));
  ok("composites: every entry has an alpha range and a style", names.every((n) => /\d/.test(curated[n].aa) && curated[n].styles.length > 0));
}
ok("built page: has no unreplaced build marker", !built.includes("INJECT:"));
// Any non-empty version works — it only has to differ between builds so a
// browser holding an older copy can tell. It need not be a hash.
ok("built page: carries a data version", /const DATA_VERSION = "[^"]+"/.test(built));
const m = built.match(/const CHRONICLE_INDEX = \[/);
ok("built page: embeds the index", Boolean(m));
// A \uXXXX escape means something in JavaScript and nothing in HTML, so one
// written into the page's prose renders as the six literal characters. That
// shipped once in the provenance legend. Only the markup outside <script> is
// checked -- inside a script the escapes are correct and intended.
const prose = built.replace(/<script[\s\S]*?<\/script>/gi, "");
const strayEscapes = prose.match(/\\u[0-9a-fA-F]{4}/g) || [];
ok("built page: no JS unicode escape left in HTML prose",
  strayEscapes.length === 0,
  `renders literally: ${strayEscapes.join(", ")}`);

// Style tags on the page are the controlled vocabulary, never a series, and a
// shared profile points at an entry that exists.
{
  const start = built.indexOf("const CHRONICLE_INDEX = [");
  const end = built.indexOf("\n];", start);
  const index = JSON.parse(built.slice(start + "const CHRONICLE_INDEX = ".length, end + 2));
  const tags = new Set(index.flatMap((e) => e.styles || []));
  ok("built page: no alias spellings survive the build", !["APA", "NEIPA", "IPA", "Kolsch", "Bohemian Pilsner", "Munich Helles"].some((t) => tags.has(t)),
    [...tags].filter((t) => ["APA", "NEIPA", "IPA", "Kolsch"].includes(t)).join());
  const keys = new Set(index.map((e) => e.cropYear ? `${e.variety} (${e.cropYear} ${e.series === "Pale Lager" ? "PL" : "PA"})` : `${e.variety} (${e.series === "Pale Lager" ? "PL" : "PA"}, crop n/a)`));
  const shared = index.filter((e) => e.profileFrom);
  eq("built page: eleven entries share a sibling's profile", shared.length, 11);
  ok("built page: every shared profile names an entry that exists", shared.every((e) => keys.has(e.profileFrom)), shared.filter((e) => !keys.has(e.profileFrom)).map((e) => e.profileFrom).join());
  ok("built page: a shared profile's figures link is the sibling's article", shared.every((e) => e.figures && e.figures !== e.url));
}
ok("built page: entry count matches the CSV",
  (built.match(/"variety":/g) || []).length === idx.length,
  `page has ${(built.match(/"variety":/g) || []).length}, CSV has ${idx.length} -- re-run node hops/build-hops.mjs`);

console.log(`\n${pass} passed, ${fail} failed (${pass + fail} total)`);
process.exit(fail ? 1 : 0);
