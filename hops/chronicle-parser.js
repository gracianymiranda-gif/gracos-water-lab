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
  ['watermelon', 'Tropical'],
  ['melon', 'Tropical'],
  ['stone fruit', 'Stone Fruit'],
  ['peach', 'Stone Fruit'],
  ['apricot', 'Stone Fruit'],
  ['nectarine', 'Stone Fruit'],
  ['cherry', 'Stone Fruit'],
  ['berries', 'Berry'],
  ['berry', 'Berry'],
  ['blackcurrant', 'Berry'],
  ['currant', 'Berry'],
  ['red fruit', 'Berry'],
  ['strawberry', 'Berry'],
  ['blueberry', 'Berry'],
  ['pine', 'Pine/Resin'],
  ['resin', 'Pine/Resin'],
  ['dank', 'Dank'],
  ['catty', 'Dank'],
  ['floral', 'Floral'],
  ['flowery', 'Floral'],
  ['blossom', 'Floral'],
  ['herbal', 'Herbal/Grassy'],
  ['herb', 'Herbal/Grassy'],
  ['grassy', 'Herbal/Grassy'],
  ['grass', 'Herbal/Grassy'],
  ['hay', 'Herbal/Grassy'],
  ['spicy', 'Spicy/Noble'],
  ['spice', 'Spicy/Noble'],
  ['noble', 'Spicy/Noble'],
  ['pepper', 'Spicy/Noble'],
  ['clove', 'Spicy/Noble'],
  ['earthy', 'Earthy'],
  ['woody', 'Earthy'],
  ['wood', 'Earthy'],
  ['tobacco', 'Earthy'],
];

/**
 * A needle as a whole word, with the plural and adjective endings the prose
 * uses. Substring matching raised Pine/Resin for "pineapple", Citrus for
 * "sublime" and Herbal/Grassy for "Hayward"; a word boundary stops all three
 * while "piney", "resinous" and "berries" still count.
 */
const wordRe = (needle) =>
  new RegExp('\\b' + needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:s|es|y|ey|ous)?\\b', 'i');

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
  // One 2018 post is published under "chronicals"; browsers also hand over
  // upper-case, /amp/ and tracking-parameter forms of the same address.
  const m = url.toLowerCase().replace(/[?#].*$/, '').replace(/\/amp\/?$/, '')
    .match(/the-hop-chronic(?:le|al)s-([a-z0-9-]+?)\/?$/);
  if (!m) return null;

  // WordPress appends -2 to a re-published slug; the hop is the same.
  let slug = m[1].replace(/^(.*(?:pale-ale|pale-lager|(?:19|20)\d{2}))-\d$/, '$1');
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
  const lead = /^(?:notes? of|hints? of|a (?:bit|touch|hint) of|some|slight(?:ly)?|strong(?:ly)?|mild(?:ly)?|less desirable|characteristics|descriptors|the|a|an|also|both|of)\s+/i;
  return list
    .split(/,|;|\band\b|\bas well as\b/i)
    .map((s) => {
      let t = s.trim();
      for (let i = 0; i < 3 && lead.test(t); i++) t = t.replace(lead, '').trim();
      return t.replace(/[.:]+$/, '').trim();
    })
    .filter((t) => t && !/^(?:the|a|an|also|both|some|of|notes?|hints?|were|was)$/i.test(t));
}

/** Periods that do not end a sentence, so "Dr. Rudi" cannot cut the results sentence in two. */
const normalizeProse = (text) => text.replace(/\s+/g, ' ').replace(/\b(Dr|Mt|St|Mr|Mrs|Ms|No|vs|approx)\.\s*/gi, '$1 ');

/**
 * Every "the most prominent ... were X, Y and Z" list in the text, in order.
 * A post may rank aroma and flavour separately, in one sentence or two; each
 * list is returned on its own, cut before any contrastive clause and before
 * the next "most prominent" so the second list is never swallowed by the first.
 * @param {string} prose Whitespace-normalised text.
 * @returns {Array<{terms: string[], index: number, end: number}>}
 */
function prominentLists(prose) {
  const re = /most prominent[^.]*?\b(?:were|was|included?)\b:?\s*((?:(?!\bmost prominent\b|\bwhile\b|\bwhereas\b|\balthough\b|\bthough\b|\bhowever\b|\bwith\b)[^.])*)/gi;
  const lists = [];
  for (const m of prose.matchAll(re)) {
    lists.push({terms: splitList(m[1]), index: m.index, end: m.index + m[0].length});
  }
  return lists;
}

/**
 * Descriptor lists the post calls lowest rated, in any of the phrasings the
 * series uses: "notes of X and Y were among the lowest rated", "while X and Y
 * were among the lowest rated descriptors", "X was the least prominent".
 * @param {string} prose
 * @returns {string[]}
 */
function lowestTerms(prose) {
  const re = /\b(?:were|was|being)\s+(?:among\s+)?the\s+(?:lowest|least)\b/gi;
  const starts = /\b(?:while|whereas|although|though|however|but)\b|[.;]\s/gi;
  const terms = [];
  for (const m of prose.matchAll(re)) {
    const before = prose.slice(0, m.index);
    let start = 0;
    for (const b of before.matchAll(starts)) start = b.index + b[0].length;
    const clause = before.slice(start)
      .replace(/^\s*(?:while|whereas|although|though|however|but)\b/i, '')
      .replace(/^\s*(?:less desirable|less appealing|undesirable|off[- ]?flavou?rs?)?\s*(?:notes?|characteristics|descriptors|flavou?rs?|aromas?)?\s*(?:of|such as|like|including)?\s*/i, '');
    terms.push(...splitList(clause));
  }
  return terms;
}

/**
 * The part of a full-page paste that is the article. Everything after the
 * results -- related-post titles, comments, navigation -- is dropped so a
 * commenter's "I got a lot of pine out of mine" never counts as a mention.
 * Text before the results is kept: the breeder's description is part of the post.
 * @param {string} prose
 * @param {number} resultsEnd Index just past the last results sentence.
 */
function articleBody(prose, resultsEnd) {
  const stop = /\b(?:leave a (?:reply|comment)|\d+\s+(?:comments?|responses?|replies)\b|comments?\s*[:(]|related(?:\s+(?:posts?|articles?|reading)|:)|you may also like|share this|post navigation|previous post|next post|support br[uü]losophy|if you have (?:any )?thoughts)/i;
  const tail = prose.slice(resultsEnd);
  const m = tail.match(stop);
  return m ? prose.slice(0, resultsEnd + m.index) : prose;
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

  const prose = normalizeProse(text);
  const scores = AXES.map(() => ABSENT_SCORE);
  const prominent = [];
  const unmapped = [];
  let resultsEnd = 0;
  let used = 0;

  for (const list of prominentLists(prose)) {
    // A list naming nothing the series tracks ("the most prominent new
    // varieties were Citra and Mosaic") is prose, not results; skip it.
    const relevant = list.terms.some((t) => termToAxis(t) || UNMAPPED.some((u) => t.toLowerCase().includes(u)));
    if (!relevant) continue;
    used++;
    resultsEnd = list.end;
    let rank = 0;
    for (const term of list.terms) {
      const axis = termToAxis(term);
      const score = RANK_SCORES[Math.min(rank, RANK_SCORES.length - 1)];
      if (axis) {
        const idx = AXES.indexOf(axis);
        // An axis ranked in both the aroma and the flavour list keeps its best rank.
        if (score > scores[idx]) scores[idx] = score;
        if (!prominent.includes(axis)) prominent.push(axis);
      } else {
        // A term with no axis still holds its place in the ranking: dropping
        // it would promote everything after it by one.
        unmapped.push(term);
      }
      rank++;
    }
  }

  if (!used) return empty;

  // Secondary mentions elsewhere in the article sit between absent and prominent.
  const body = articleBody(prose, resultsEnd);
  AXES.forEach((axis, i) => {
    if (scores[i] !== ABSENT_SCORE) return;
    const needles = VOCAB.filter(([, a]) => a === axis).map(([needle]) => needle);
    if (needles.some((n) => wordRe(n).test(body))) scores[i] = SECONDARY_SCORE;
  });

  const lowest = [];
  for (const term of lowestTerms(body)) {
    const axis = termToAxis(term);
    if (axis) {
      scores[AXES.indexOf(axis)] = LOWEST_SCORE;
      if (!lowest.includes(axis)) lowest.push(axis);
    } else if (!unmapped.includes(term)) {
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
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    // A tag starts with a letter. The old /<[^>]+>/ also ran on plain pasted
    // text, where "Farnesene: <1%" followed by any later ">" deleted the body.
    .replace(/<\/?[a-zA-Z][^<>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;|&quot;/g, '"')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Stat labels, each with the spellings different sources use. Brulosophy
 * prints "Alpha"; merchant spec sheets print "Alpha Acid (aA)" or
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

/** Words an article prints where a figure is missing. Each maps to null, never to a neighbour's value. */
const PLACEHOLDER = '(?:unknown|unavailable|n\\/a|not\\s+(?:reported|available|listed|published)|tbd|\u2014|\u2013)';
/** Oil fractions the series sometimes lists that this tool does not track; a tracked label may not borrow their value. */
const NON_STAT_LABELS = '(?:Linalool|Geraniol|Pinene|Selinene|Limonene|Nerol|Citral|Caryophyllene\\s+oxide)';

/**
 * Pull the Hop Stats table out of a post.
 *
 * Works on the post's plain text, so it survives whether the stats are marked
 * up as a table, a list, or plain "Label: value" lines. Every value is returned
 * verbatim as printed (ranges, dashes, "<1%" and units intact) -- never
 * normalised into a single number, because the source really does publish
 * ranges. A cell printed "unknown" is null, never guessed.
 *
 * When the text has a "Hop Stats" heading, only what follows it is read, so a
 * figure in the introduction ("alpha acids in the 15-17% range") cannot stand
 * in for the lot's.
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
    .replace(/\(\s*(?:\u03b1A|\u03b2A|CoH|AA|BA)\s*%?\s*\)/gi, ' ')
    .replace(/ {2,}/g, ' ');

  const heading = flat.match(/\b(?:hop stats|hop statistics|vital stat(?:istic)?s)\b/i);
  if (heading) {
    readStats(out, flat.slice(heading.index + heading[0].length));
    if (Object.values(out).some(Boolean)) return /** @type {any} */ (out);
  }
  readStats(out, flat);
  return /** @type {any} */ (out);
}

/** Fill the null fields of `out` from `flat`. */
function readStats(out, flat) {
  const labelAlt = STAT_LABELS.map((l) => l.re).join('|');
  const valueAtom =
    '(?:[<>~\u2264\u2265]\\s*)?\\d[\\d.]*\\s*(?:[-\u2013\u2014]\\s*\\d[\\d.]*\\s*)?(?:%|(?:mL|ml)\\s*\\/\\s*100\\s*m?g)(?:\\s*of\\s+(?:alpha\\s+acids?|total\\s+oils?))?';
  const cell = `(?:${valueAtom}|${PLACEHOLDER})`;
  const clean = (raw) => raw.replace(/\s*of\s+(?:alpha\s+acids?|total\s+oils?)\s*$/i, '').replace(/\s+/g, ' ').trim();
  const isPlaceholder = (raw) => new RegExp(`^${PLACEHOLDER}$`, 'i').test(raw.trim());

  // Column layout is checked FIRST and is unambiguous: a run of two or more
  // labels with no values between them, then the matching run of cells.
  // Checking row-wise first would misread "Alpha | Beta | 10.5% | 4.5%" as
  // Beta=10.5%, silently attributing one stat's value to another.
  const sep = '[\\s|:,()]*';
  const runRe = new RegExp(
    `((?:(?:${labelAlt})${sep}){2,})((?:${cell})${sep}(?:(?:${cell})${sep})+)`,
    'i',
  );
  let rest = flat;
  const run = flat.match(runRe);
  if (run) {
    const labels = run[1].match(new RegExp(labelAlt, 'gi')) || [];
    const values = run[2].match(new RegExp(cell, 'gi')) || [];
    // Only trust a positional pairing when the two runs line up exactly.
    if (labels.length >= 2 && labels.length === values.length) {
      labels.forEach((label, i) => {
        const field = labelField(label);
        if (field && out[field] == null && !isPlaceholder(values[i])) out[field] = clean(values[i]);
      });
      // The table is spent; anything printed below it (an oil breakdown,
      // usually) is still read row-wise.
      rest = flat.replace(run[0], ' ');
    }
  }

  // Row-wise: label, optional filler, value. The filler may not cross another
  // stat label, a placeholder, an untracked oil label or a digit, so a label
  // with no value cannot borrow the next one's.
  const filler = `(?:(?!${labelAlt}|${PLACEHOLDER}|${NON_STAT_LABELS})[^\\d|\\n<>~]){0,24}`;
  for (const {field, unit, re} of STAT_LABELS) {
    if (out[field] != null) continue;
    const value = unit === 'oil'
      ? `((?:[<>~\u2264\u2265]\\s*)?\\d[\\d.]*\\s*(?:[-\u2013\u2014]\\s*\\d[\\d.]*\\s*)?(?:mL|ml)\\s*\\/\\s*100\\s*m?g)`
      : `((?:[<>~\u2264\u2265]\\s*)?\\d[\\d.]*\\s*(?:[-\u2013\u2014]\\s*\\d[\\d.]*\\s*)?%)`;
    const m = rest.match(new RegExp(`\\b${re}\\b[\\s:|()]*${filler}${value}`, 'i'));
    if (m) out[field] = clean(m[1]);
  }
}

/**
 * The number a printed chemistry figure stands for. "12.2 - 15.4%" is a
 * range, "27%" a point; both come back as {low, high, mid} so a caller can
 * tell them apart. Anything without a number -- "", "n/a", "unavailable" --
 * is null, and a caller averaging figures must leave such a hop out rather
 * than count it as zero.
 * @param {string} s
 * @returns {{low: number, high: number, mid: number}|null}
 */
export function parseNumericRange(s) {
  if (typeof s !== 'string') return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*(?:[-\u2013\u2014]|to)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const low = parseFloat(m[1] ?? m[3]);
  const high = parseFloat(m[2] ?? m[3]);
  return {low, high, mid: (low + high) / 2};
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
  const list = prominentLists(normalizeProse(text))
    .find((l) => l.terms.some((t) => termToAxis(t) || UNMAPPED.some((u) => t.toLowerCase().includes(u))));
  return list ? list.terms.map((t) => t.toLowerCase()).filter((t) => t.length < 40) : [];
}
