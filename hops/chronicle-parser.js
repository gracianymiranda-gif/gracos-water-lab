/**
 * Parsers for Brulosophy "The Hop Chronicles" posts.
 *
 * Pure string-in / object-out: no DOM, no network. The browser tool inlines
 * this file verbatim; tests import it directly.
 */

/** The ten radar axes, in order. Must match DESCRIPTORS in the tool. */
export const AXES = [
  'Citrus', 'Tropical', 'Stone Fruit', 'Berry', 'Pine/Resin',
  'Dank', 'Floral', 'Herbal/Grassy', 'Spicy/Noble', 'Earthy',
];

/**
 * Brulosophy's descriptor vocabulary mapped onto the ten axes. Longer phrases
 * are listed first so "tropical fruit" wins over a bare "fruit"-style match.
 * @type {Array<[string, string]>}
 */
const VOCAB = [
  ['citrus', 'Citrus'],
  ['grapefruit', 'Citrus'],
  ['lemon', 'Citrus'],
  ['lime', 'Citrus'],
  ['orange', 'Citrus'],
  ['tangerine', 'Citrus'],
  ['tropical fruit', 'Tropical'],
  ['tropical', 'Tropical'],
  ['mango', 'Tropical'],
  ['pineapple', 'Tropical'],
  ['passion fruit', 'Tropical'],
  ['passionfruit', 'Tropical'],
  ['guava', 'Tropical'],
  ['lychee', 'Tropical'],
  ['melon', 'Tropical'],
  ['stone fruit', 'Stone Fruit'],
  ['peach', 'Stone Fruit'],
  ['apricot', 'Stone Fruit'],
  ['nectarine', 'Stone Fruit'],
  ['berry', 'Berry'],
  ['blackcurrant', 'Berry'],
  ['strawberry', 'Berry'],
  ['blueberry', 'Berry'],
  ['pine', 'Pine/Resin'],
  ['resin', 'Pine/Resin'],
  ['dank', 'Dank'],
  ['catty', 'Dank'],
  ['floral', 'Floral'],
  ['blossom', 'Floral'],
  ['herbal', 'Herbal/Grassy'],
  ['grassy', 'Herbal/Grassy'],
  ['hay', 'Herbal/Grassy'],
  ['spicy', 'Spicy/Noble'],
  ['noble', 'Spicy/Noble'],
  ['pepper', 'Spicy/Noble'],
  ['clove', 'Spicy/Noble'],
  ['earthy', 'Earthy'],
  ['woody', 'Earthy'],
  ['tobacco', 'Earthy'],
];

/**
 * Descriptors Brulosophy tracks that have no axis in this tool. Surfaced as
 * notes so a fault like onion/garlic is never silently folded into Dank.
 */
const UNMAPPED = ['onion/garlic', 'onion', 'garlic', 'apple/pear', 'apple', 'pear', 'sweet aromatic', 'cream caramel'];

/** Score awarded by rank within the post's "most prominent" list. */
const RANK_SCORES = [9, 8, 7, 6];
/** An axis mentioned in the prose but not among the most prominent. */
const SECONDARY_SCORE = 5;
/** An axis the post never mentions. */
const ABSENT_SCORE = 2;
/** An axis the post explicitly calls lowest-rated. */
const LOWEST_SCORE = 1;

/**
 * Pull the hop variety, crop year and series out of a Hop Chronicles URL.
 * Works offline — the slug alone carries all three.
 * @param {string} url
 * @returns {{variety: string, cropYear: string|null, series: string|null}|null}
 */
export function parseChronicleUrl(url) {
  if (typeof url !== 'string') return null;
  const m = url.match(/the-hop-chronicles-([a-z0-9-]+?)\/?$/i);
  if (!m) return null;

  let slug = m[1];
  let series = null;
  let cropYear = null;

  const seriesMatch = slug.match(/-(pale-ale|pale-lager)$/);
  if (seriesMatch) {
    series = seriesMatch[1] === 'pale-lager' ? 'Pale Lager' : 'Pale Ale';
    slug = slug.slice(0, -seriesMatch[0].length);
  }

  const yearMatch = slug.match(/-((?:19|20)\d{2})$/);
  if (yearMatch) {
    cropYear = yearMatch[1];
    slug = slug.slice(0, -yearMatch[0].length);
  }

  if (!slug) return null;

  const variety = slug
    .split('-')
    .map((w) => (/^(lupomax|ctz|us|hbc|007)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
    .replace(/\bLUPOMAX\b/i, 'LUPOMAX');

  return {variety, cropYear, series};
}

/**
 * Extract the measured alpha acid of the lot from post text.
 * @param {string} text
 * @returns {string|null} e.g. "12.4%"
 */
export function parseAlphaAcid(text) {
  if (typeof text !== 'string') return null;
  const m = text.match(/alpha\s*acids?[^0-9%]{0,40}?(\d{1,2}(?:\.\d+)?)\s*%/i);
  return m ? `${m[1]}%` : null;
}

/**
 * Split a descriptor list ("tropical fruit, citrus, and apple/pear") into terms.
 * @param {string} list
 * @returns {string[]}
 */
function splitList(list) {
  return list
    .split(/,|\band\b/i)
    .map((s) => s.trim().replace(/^(notes? of|characteristics|descriptors)\s+/i, '').trim())
    .filter(Boolean);
}

/**
 * Map one Brulosophy descriptor term to an axis, or null if it has none.
 * @param {string} term
 * @returns {string|null}
 */
function termToAxis(term) {
  const t = term.toLowerCase();
  for (const [needle, axis] of VOCAB) {
    if (t.includes(needle)) return axis;
  }
  return null;
}

/**
 * Derive 0-10 axis scores from the results prose of a Hop Chronicles post.
 *
 * The series uses a consistent sentence template — "The most prominent aroma
 * and flavor characteristics noted by blind tasters ... were X, Y and Z" and,
 * when relevant, "... were among the lowest rated descriptors". Scores come
 * from rank in those lists, so every number traces back to the post's own
 * wording rather than a guess.
 *
 * @param {string} text Plain text of the post.
 * @returns {{scores: number[]|null, prominent: string[], lowest: string[], unmapped: string[]}}
 */
export function parseDescriptorScores(text) {
  const empty = {scores: null, prominent: [], lowest: [], unmapped: []};
  if (typeof text !== 'string' || !text.trim()) return empty;

  const prose = text.replace(/\s+/g, ' ');

  const promMatch = prose.match(/most prominent[^.]*?\bwere\b([^.]*)/i);
  if (!promMatch) return empty;

  // "were X, Y and Z, while less desirable notes of A and B were among the
  // lowest rated" — keep only the part before the contrastive clause.
  const promSegment = promMatch[1].split(/\b(?:while|although|whereas)\b/i)[0];
  const promTerms = splitList(promSegment);

  const lowMatch = prose.match(/notes? of ([^.]*?)\bwere among the lowest/i);
  const lowTerms = lowMatch ? splitList(lowMatch[1]) : [];

  const scores = AXES.map(() => ABSENT_SCORE);
  const prominent = [];
  const unmapped = [];

  let rank = 0;
  for (const term of promTerms) {
    const axis = termToAxis(term);
    if (axis) {
      const idx = AXES.indexOf(axis);
      const score = RANK_SCORES[Math.min(rank, RANK_SCORES.length - 1)];
      // A repeated axis keeps its best rank.
      if (score > scores[idx] || scores[idx] === ABSENT_SCORE) scores[idx] = score;
      prominent.push(axis);
      rank++;
    } else if (UNMAPPED.some((u) => term.toLowerCase().includes(u))) {
      unmapped.push(term);
      rank++;
    }
  }

  if (prominent.length === 0) return empty;

  // Secondary mentions elsewhere in the prose sit between absent and prominent.
  AXES.forEach((axis, i) => {
    if (scores[i] !== ABSENT_SCORE) return;
    const hits = VOCAB.filter(([, a]) => a === axis).map(([needle]) => needle);
    if (hits.some((h) => prose.toLowerCase().includes(h))) scores[i] = SECONDARY_SCORE;
  });

  const lowest = [];
  for (const term of lowTerms) {
    const axis = termToAxis(term);
    if (axis) {
      scores[AXES.indexOf(axis)] = LOWEST_SCORE;
      lowest.push(axis);
    } else if (UNMAPPED.some((u) => term.toLowerCase().includes(u))) {
      unmapped.push(term);
    }
  }

  return {scores, prominent, lowest, unmapped};
}

/**
 * Strip markup to readable text, dropping script and style *contents* first so
 * stylesheet words never land in the descriptor scan.
 * @param {string} html
 * @returns {string}
 */
export function htmlToText(html) {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Stat labels, each with the spellings different sources use. Brulosophy
 * prints "Alpha"; BeerMaverick prints "Alpha Acid (aA)"; vendors print
 * "Alpha Acids %". All must land in the same field.
 * @type {Array<{field: string, unit: string, re: string}>}
 */
const STAT_LABELS = [
  {field: 'alpha', unit: '%', re: '(?:Alpha\\s*Acids?|Alpha|\\u03b1A|AA)'},
  {field: 'beta', unit: '%', re: '(?:Beta\\s*Acids?|Beta|\\u03b2A|BA)'},
  {field: 'cohumulone', unit: '%', re: '(?:Co[-\\s]?Humulone|Cohumulone|CoH)'},
  {field: 'totalOil', unit: 'oil', re: '(?:Total\\s*Oils?|Oil\\s*Total)'},
  {field: 'myrcene', unit: '%', re: 'Myrcene'},
  {field: 'humulene', unit: '%', re: 'Humulene'},
  {field: 'caryophyllene', unit: '%', re: 'Caryophyllene'},
  {field: 'farnesene', unit: '%', re: 'Farnesene'},
];

/** Which field a matched label belongs to, or null. */
function labelField(text) {
  const t = text.replace(/\s+/g, ' ').trim();
  for (const {field, re} of STAT_LABELS) {
    if (new RegExp(`^${re}$`, 'i').test(t)) return field;
  }
  return null;
}

/**
 * Pull the Hop Stats table out of a post.
 *
 * Works on the post's plain text, so it survives whether the stats are marked
 * up as a table, a list, or plain "Label: value" lines. Every value is returned
 * verbatim as printed (ranges, dashes and units intact) — never normalised into
 * a single number, because the source really does publish ranges.
 *
 * @param {string} text
 * @returns {{alpha: string|null, beta: string|null, cohumulone: string|null, totalOil: string|null,
 *            myrcene: string|null, humulene: string|null, caryophyllene: string|null, farnesene: string|null}}
 */
export function parseHopStats(text) {
  /** @type {Record<string, string|null>} */
  const out = {
    alpha: null, beta: null, cohumulone: null, totalOil: null,
    myrcene: null, humulene: null, caryophyllene: null, farnesene: null,
  };
  if (typeof text !== 'string' || !text) return /** @type {any} */ (out);

  const flat = text
    .replace(/[\t\u00a0]/g, ' ')
    // Drop a parenthetical symbol for the same stat, e.g. "Alpha Acid (\u03b1A) 9%".
    // Left in place it sits between a label and its value and blocks the match,
    // because the symbol is itself a label synonym.
    .replace(/\(\s*(?:\u03b1A|\u03b2A|CoH|AA|BA)\s*\)/gi, ' ')
    .replace(/ {2,}/g, ' ');
  const labelAlt = STAT_LABELS.map((l) => l.re).join('|');
  const valueAtom =
    '\\d[\\d.]*\\s*(?:[-–—]\\s*\\d[\\d.]*\\s*)?(?:%|(?:mL|ml)\\s*\\/\\s*100\\s*g)(?:\\s*of\\s+alpha\\s+acids)?';
  const clean = (raw) => raw.replace(/\s*of\s+alpha\s+acids\s*$/i, '').replace(/\s+/g, ' ').trim();

  // Column layout is checked FIRST and is unambiguous: a run of two or more
  // labels with no values between them, then the matching run of values.
  // Checking row-wise first would misread "Alpha | Beta | 10.5% | 4.5%" as
  // Beta=10.5%, silently attributing one stat's value to another.
  const sep = '[\\s|:,()]*';
  const runRe = new RegExp(
    `((?:(?:${labelAlt})${sep}){2,})((?:${valueAtom})${sep}(?:(?:${valueAtom})${sep})+)`,
    'i',
  );
  const run = flat.match(runRe);
  if (run) {
    const labels = run[1].match(new RegExp(labelAlt, 'gi')) || [];
    const values = run[2].match(new RegExp(valueAtom, 'gi')) || [];
    // Only trust a positional pairing when the two runs line up exactly.
    if (labels.length >= 2 && labels.length === values.length) {
      labels.forEach((label, i) => {
        const field = labelField(label);
        if (field) out[field] = clean(values[i]);
      });
      return /** @type {any} */ (out);
    }
  }

  // Row-wise: label, optional filler, value. The filler may not cross another
  // stat label or a digit, so a label with no value cannot borrow the next.
  const filler = `(?:(?!${labelAlt})[^\\d|\\n]){0,24}`;
  for (const {field, unit, re} of STAT_LABELS) {
    const value = unit === 'oil'
      ? `(\\d[\\d.]*\\s*(?:[-–—]\\s*\\d[\\d.]*\\s*)?(?:mL|ml)\\s*\\/\\s*100\\s*g)`
      : `(\\d[\\d.]*\\s*(?:[-–—]\\s*\\d[\\d.]*\\s*)?%)`;
    const m = flat.match(new RegExp(`\\b${re}\\b[\\s:|()]*${filler}${value}`, 'i'));
    if (m) out[field] = clean(m[1]);
  }

  return /** @type {any} */ (out);
}

/**
 * Extract a BeerMaverick hop page: the four stats plus the beer styles and
 * flavour descriptors it publishes. Styles answer "what do I brew with this"
 * from a source that actually states it, rather than by inference.
 *
 * @param {string} text Plain text of the page.
 * @returns {{stats: object, styles: string[], profile: string[], purpose: string|null}}
 */
export function parseBeerMaverickPage(text) {
  const empty = {stats: parseHopStats(''), styles: [], profile: [], purpose: null};
  if (typeof text !== 'string' || !text.trim()) return empty;
  const prose = text.replace(/\s+/g, ' ');

  const listAfter = (re) => {
    const m = prose.match(re);
    if (!m) return [];
    return m[1]
      .split(/,|&|\band\b/i)
      .map((s) => s.replace(/[.*]/g, '').trim())
      .filter((s) => s && s.length < 40);
  };

  const styles = listAfter(/beer styles that (?:make use of|use)[^:]*?(?:include|are)\s*:?\s*([^.]{3,200})\./i);
  const profile = listAfter(/(?:flavor|flavour)\s*(?:&|and)?\s*aroma\s*(?:profile)?\s*:?\s*([^.]{3,240})\./i)
    .concat(listAfter(/\bprofile\s*:\s*([^.]{3,240})(?:\.|$)/i));

  const purposeMatch = prose.match(/\b(dual[-\s]?purpose|aroma|bittering)\b\s*hop/i);

  return {
    stats: parseHopStats(prose),
    styles,
    profile: [...new Set(profile.map((p) => p.toLowerCase()))],
    purpose: purposeMatch ? purposeMatch[1].toLowerCase().replace(/\s+/g, '-') : null,
  };
}

/**
 * The characteristics participants endorsed as most prominent, in the order the
 * post lists them and using the post's own wording.
 *
 * @param {string} text
 * @returns {string[]} e.g. ["tropical fruit", "citrus", "apple/pear"]
 */
export function parseProminentCharacteristics(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  const prose = text.replace(/\s+/g, ' ');
  const m = prose.match(/most prominent[^.]*?\bwere\b([^.]*)/i)
    || prose.match(/(?:endorsed|noted|rated)[^.]*?\bas being the (?:most|strongest)[^.]*?\b([^.]*)/i);
  if (!m) return [];
  const segment = m[1].split(/\b(?:while|although|whereas|with)\b/i)[0];
  return splitList(segment)
    .map((t) => t.replace(/\s+/g, ' ').trim().toLowerCase())
    .filter((t) => t && t.length < 40);
}

/**
 * Best-effort grab of the breeder's suggested application, which the series
 * reports in the intro ("marketed as ideal for late kettle and dry hop
 * additions"). Returns null rather than a guess when no such claim is present.
 *
 * @param {string} text
 * @returns {string|null}
 */
export function parseSuggestedUse(text) {
  if (typeof text !== 'string') return null;
  const prose = text.replace(/\s+/g, ' ');
  const patterns = [
    /(?:marketed|said|purported|reputed|known|touted)\s+(?:as\s+|to\s+be\s+)?(?:being\s+)?(?:ideal(?:ly)?\s+|well[-\s]suited\s+|good\s+|great\s+)?(?:for|in)\s+([^.]{10,200})\./i,
    /commonly used (?:in|for) ([^.]{10,200})\./i,
    /(?:works|pairs) well (?:in|with) ([^.]{10,200})\./i,
  ];
  for (const re of patterns) {
    const m = prose.match(re);
    if (m) return m[1].trim();
  }
  return null;
}
