/**
 * Regenerates hops/hop-calculus.html from the template, the shared parser and
 * the two CSVs in hops/data.
 *
 *   node hops/build-hops.mjs
 *
 * Zero dependencies — node built-ins only, in keeping with the rest of this
 * repo having no build step or package.json.
 */
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Minimal RFC-4180 reader: handles quoted fields containing commas. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; }
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// --- post index -----------------------------------------------------------
const idxRows = parseCsv(readFileSync(resolve(here, 'data/hop-chronicles.csv'), 'utf8'))
  .filter((r) => r.length > 1);
const idxHeader = idxRows.shift();
if (!idxHeader || idxHeader[0] !== 'Hop Variety') {
  throw new Error('Unexpected header in data/hop-chronicles.csv');
}
const entries = idxRows.map((r) => ({
  variety: r[0], cropYear: r[1], origin: r[2], series: r[3],
  published: r[4], notes: r[5], url: r[6],
}));

const seen = new Set();
for (const e of entries) {
  const k = `${e.variety}|${e.cropYear}|${e.series}`;
  if (seen.has(k)) throw new Error(`Duplicate index entry: ${k}`);
  seen.add(k);
  if (!/^https:\/\/brulosophy\.com\//.test(e.url)) {
    throw new Error(`Entry "${e.variety}" has a non-Brulosophy source URL: ${e.url}`);
  }
}

// --- descriptor profiles --------------------------------------------------
const profRows = parseCsv(readFileSync(resolve(here, 'data/hop-profiles.csv'), 'utf8'))
  .filter((r) => r.length > 1);
const profHeader = profRows.shift();
if (!profHeader || profHeader[0] !== 'Variety') {
  throw new Error('Unexpected header in data/hop-profiles.csv');
}
const pcol = Object.fromEntries(profHeader.map((h, i) => [h, i]));
const AXIS_COLS = ['Citrus', 'Tropical', 'Stone Fruit', 'Berry', 'Pine/Resin',
  'Dank', 'Floral', 'Herbal/Grassy', 'Spicy/Noble', 'Earthy'];
for (const col of [...AXIS_COLS, 'Variety', 'Alpha Acid', 'Beta Acid', 'Cohumulone',
  'Total Oil', 'Oils', 'Styles', 'Basis', 'Cross-check']) {
  if (pcol[col] === undefined) throw new Error(`hop-profiles.csv is missing the "${col}" column`);
}

/** Diacritic- and punctuation-insensitive key, so "Mittelfrüh" matches "Mittelfruh". */
const key = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]/g, '');

const profiles = new Map();
for (const r of profRows) {
  const d = AXIS_COLS.map((c) => Number(r[pcol[c]]));
  if (d.length !== 10 || d.some((n) => !Number.isFinite(n) || n < 0 || n > 10)) {
    throw new Error(`Profile for "${r[0]}" must have 10 scores in 0-10`);
  }
  if (profiles.has(key(r[0]))) throw new Error(`Duplicate profile: ${r[0]}`);
  profiles.set(key(r[0]), {
    aa: r[pcol['Alpha Acid']], beta: r[pcol['Beta Acid']],
    coh: r[pcol['Cohumulone']], oil: r[pcol['Total Oil']], oils: r[pcol['Oils']],
    d, styles: r[pcol['Styles']].split(';').map((x) => x.trim()).filter(Boolean),
    basis: r[pcol['Basis']], xcheck: r[pcol['Cross-check']],
  });
}

const scored = entries.filter((e) => profiles.has(key(e.variety))).length;
process.stdout.write(`  ${scored}/${entries.length} index entries have a descriptor profile\n`);

const withProfiles = entries.map((e) => {
  const p = profiles.get(key(e.variety));
  return p
    ? {...e, aa: p.aa, beta: p.beta, coh: p.coh, oil: p.oil, oils: p.oils,
       d: p.d, styles: p.styles, basis: p.basis, xcheck: p.xcheck}
    : e;
});

// --- assemble -------------------------------------------------------------
const parserSrc = readFileSync(resolve(here, 'chronicle-parser.js'), 'utf8')
  .replace(/^export /gm, '').trim();
const template = readFileSync(resolve(here, 'hop-calculus.template.html'), 'utf8');

// Replacer FUNCTIONS, not strings: a replacement string treats $&, $` and $'
// as special, and the parser source contains `$` + backtick inside template
// literals, which would splice the document into itself.
const out = template
  .replace('/* INJECT:PARSER */', () => parserSrc)
  .replace('/* INJECT:CHRONICLES */', () =>
    `const DATA_VERSION = ${JSON.stringify(createHash('sha1').update(JSON.stringify(withProfiles)).digest('hex').slice(0, 12))};\n`
    + `const CHRONICLE_INDEX = ${JSON.stringify(withProfiles, null, 1)};`)
  .replace('<!-- INJECT:COUNT -->', () => String(entries.length));

if (out.includes('INJECT:')) throw new Error('An injection marker was left unreplaced');

writeFileSync(resolve(here, 'hop-calculus.html'), out);
process.stdout.write(`Built hops/hop-calculus.html with ${entries.length} Hop Chronicles entries\n`);
