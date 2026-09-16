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
  parseDescriptorScores, parseHopStats, parseProminentCharacteristics,
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

// ---- Set D: markup handling ----
const text = htmlToText('<style>.a{color:green}</style><script>var pine="tea";</script><p>Citrus notes.</p>');
eq("html: script and style contents dropped", text, "Citrus notes.");
eq("alpha acid helper", parseAlphaAcid("Alpha Acid: 12.4%"), "12.4%");

// ---- Set E: shipped data integrity ----
const csv = (p) => {
  const rows = [];
  let row = [], f = "", q = false;
  const t = readFileSync(p, "utf8");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.length > 1);
};

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
eq("profiles: every descriptor score is 0-10", badScore, 0);
eq("profiles: no two hops share all four stat figures", dupStats, 0);

const idx = csv(join(hops, "data/hop-chronicles.csv"));
idx.shift();
ok("index: every row cites a Brulosophy URL",
  idx.every((r) => /^https:\/\/brulosophy\.com\//.test(r[6])), "a Source URL is missing or off-site");

// ---- Set F: the built page is in step with the CSVs ----
const built = readFileSync(join(hops, "hop-calculus.html"), "utf8");
ok("built page: has no unreplaced build marker", !built.includes("INJECT:"));
// Any non-empty version works — it only has to differ between builds so a
// browser holding an older copy can tell. It need not be a hash.
ok("built page: carries a data version", /const DATA_VERSION = "[^"]+"/.test(built));
const m = built.match(/const CHRONICLE_INDEX = \[/);
ok("built page: embeds the index", Boolean(m));
ok("built page: entry count matches the CSV",
  (built.match(/"variety":/g) || []).length === idx.length,
  `page has ${(built.match(/"variety":/g) || []).length}, CSV has ${idx.length} -- re-run node hops/build-hops.mjs`);

console.log(`\n${pass} passed, ${fail} failed (${pass + fail} total)`);
process.exit(fail ? 1 : 0);
