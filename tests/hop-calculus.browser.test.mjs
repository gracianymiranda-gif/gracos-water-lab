// Drives the built Hop Calculus page in a headless DOM.
//
// Run:  JSDOM_PATH=/path/to/node_modules/jsdom node tests/hop-calculus.browser.test.mjs
//
// jsdom is not a dependency of this repo (nothing is). The test looks for it at
// $JSDOM_PATH -- CI installs one into a temp dir -- and skips cleanly when it is
// not there, so `node tests/hop-calculus.browser.test.mjs` alone never fails for
// want of a package. Everything in here is a behaviour the pure-node tests could
// not see: four persistence bugs shipped before this file existed.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = require(process.env.JSDOM_PATH || "jsdom"));
} catch {
  console.log("skipped: jsdom not available -- set JSDOM_PATH to a jsdom install to run the browser tests");
  process.exit(0);
}

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, "hops", "hop-calculus.html"), "utf8");

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) pass++;
  else { fail++; console.error(`FAIL ${name}${detail ? ": " + detail : ""}`); }
};
const eq = (name, got, want) => ok(name, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));

/**
 * One "browser": a store that survives across boots stands in for the
 * reader's localStorage, so a reload is boot() again on the same store.
 */
function browser() {
  let store = {};
  const errors = [];
  const boot = () => {
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => { if (!/scrollTo/.test(e.message)) errors.push(e.message); });
    const dom = new JSDOM(html, {
      runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc,
      url: "http://localhost/hops/hop-calculus.html",
      beforeParse(win) {
        win.HTMLCanvasElement.prototype.getContext = () => null;   // no canvas package; the page guards on null
        win.alert = (m) => { win.__alerts.push(String(m)); };
        win.__alerts = [];
        win.confirm = (m) => { win.__confirms.push(String(m)); return true; };
        win.__confirms = [];
        for (const [k, v] of Object.entries(store)) win.localStorage.setItem(k, v);
      },
    });
    const win = dom.window;
    const page = {
      win, doc: win.document,
      ev: (src) => win.eval(src),                       // top-level let/const are not window properties
      $: (sel) => win.document.querySelector(sel),
      set: (id, v) => { win.document.getElementById(id).value = v; },
      persist() { store = {}; for (let i = 0; i < win.localStorage.length; i++) { const k = win.localStorage.key(i); store[k] = win.localStorage.getItem(k); } },
      stored: () => JSON.parse(store.hopCalculusLibrary_v2 || "null"),
      async importText(text) {
        win.__file = new win.File([text], "lib.json", { type: "application/json" });
        win.eval("importLibrary(window.__file)");
        await tick();
        this.persist();
      },
    };
    return page;
  };
  return { boot, errors, setStore: (s) => { store = s; } };
}

// ---- Set A: boots and renders ----
{
  const b = browser();
  const p = b.boot();
  eq("boot: library has every shipped entry", p.ev("Object.keys(HOPS).length"), 158);
  eq("boot: list shows every entry", p.doc.querySelectorAll("#hopList .hop-item").length, 158);
  ok("boot: counts line is right", /158 entries, all scored\. Showing 158\./.test(p.$("#libraryCounts").textContent));
  p.ev('toggleHop("Citra"); toggleHop("Mosaic")');
  eq("compare: two selected", p.ev("selected.length"), 2);
  eq("compare: label column, blend column, one column per hop", p.doc.querySelectorAll("#compareTable tr:first-child th").length, 4);
  ok("compare: blend note names both hops", /Citra/.test(p.$("#blendNote").textContent) && /Mosaic/.test(p.$("#blendNote").textContent));
  p.ev('toggleHop("Citra"); toggleHop("Mosaic")');
  for (let i = 0; i < 6; i++) p.ev(`toggleHop(Object.keys(HOPS).filter(scored)[${i}])`);
  eq("compare: a sixth selection is refused", p.ev("selected.length"), 5);
  ok("compare: and says so", p.win.__alerts.some((a) => /Max 5/.test(a)));
  eq("boot: no page errors", b.errors.length, 0);
}

// ---- Set B: deleting a shipped hop sticks ----
{
  const b = browser();
  let p = b.boot();
  p.ev('deleteHop("Citra")'); p.persist();
  p = b.boot();
  eq("delete: gone after reload", p.ev('Boolean(HOPS["Citra"])'), false);
  eq("delete: tombstone restored into memory", p.ev("deletedNames.includes('Citra')"), true);
  p.set("mName", "Any Other Hop"); p.ev("saveHopFromForm()"); p.persist();
  ok("delete: an unrelated save keeps the tombstone", p.stored().deleted.includes("Citra"));
  p = b.boot();
  eq("delete: still gone after a save and another reload", p.ev('Boolean(HOPS["Citra"])'), false);
  p.set("mName", "Citra"); p.ev("saveHopFromForm()"); p.persist();
  p = b.boot();
  eq("delete: re-adding under the same name clears the tombstone", p.ev('Boolean(HOPS["Citra"])'), true);
}

// ---- Set C: renaming a shipped hop sticks ----
{
  const b = browser();
  let p = b.boot();
  p.ev('loadFormForEdit("Mosaic")'); p.set("mName", "Mosaic (my lot)"); p.ev("saveHopFromForm()"); p.persist();
  p = b.boot();
  eq("rename: old name does not come back", p.ev('Boolean(HOPS["Mosaic"])'), false);
  eq("rename: new name is there", p.ev('Boolean(HOPS["Mosaic (my lot)"])'), true);
  eq("rename: profile travelled with it", p.ev('HOPS["Mosaic (my lot)"].d.join()'), "6,8,6,7,4,6,3,2,1,2");
}

// ---- Set D: import replaces the library, durably ----
{
  const b = browser();
  let p = b.boot();
  await p.importText(JSON.stringify({ "Only One": { aa: "5%", d: [1, 2, 3, 4, 5, 6, 7, 8, 9, 1], styles: ["Lager"] } }));
  ok("import: status reports the count", /Imported 1 entries/.test(p.$("#importStatus").textContent));
  eq("import: library is the file", p.ev("Object.keys(HOPS).length"), 1);
  p = b.boot();
  eq("import: and still is after a reload", p.ev("Object.keys(HOPS).length"), 1);

  // The export envelope round-trips, deletions included.
  const envelope = { version: "whatever", hops: { "Citra": { aa: "12%", d: [9, 9, 4, 3, 4, 5, 2, 1, 1, 1], styles: ["IPA"], touched: true } }, deleted: ["Mosaic"] };
  await p.importText(JSON.stringify(envelope));
  p = b.boot();
  eq("import envelope: entry present", p.ev('HOPS["Citra"] && HOPS["Citra"].aa'), "12%");
  eq("import envelope: a shipped hop the file omits stays gone", p.ev('Boolean(HOPS["Simcoe"])'), false);

  // A bad file leaves everything alone.
  const before = p.ev("Object.keys(HOPS).length");
  await p.importText(JSON.stringify({ "Broken": { d: [1, 2, 3] } }));
  ok("import: malformed file is refused with a reason", /Import failed.*descriptor array/.test(p.$("#importStatus").textContent));
  eq("import: and the library is untouched", p.ev("Object.keys(HOPS).length"), before);
}

// ---- Set E: a pasted article carries its stats to the saved entry ----
{
  const b = browser();
  const p = b.boot();
  const sizeBefore = p.ev("Object.keys(HOPS).length");
  p.set("chronUrl", "https://brulosophy.com/2030/01/01/the-hop-chronicles-fakehop-2029-pale-ale/");
  p.ev("lookupChronicle()");
  p.ev(`applyParsedText("Hop Stats Alpha: 10 - 12% Beta: 4 - 5% Cohumulone: 25 - 28% Total Oil: 1.5 - 2 mL/100g Myrcene: 50 - 60% " +
    "The most prominent aroma and flavor characteristics noted by blind tasters were citrus, pine, and tropical fruit.", "pasteStatus")`);
  eq("paste: nothing enters the library before Save", p.ev("Object.keys(HOPS).length"), sizeBefore);
  eq("paste: alpha lands in the form", p.$("#mAA").value, "10 - 12%");
  eq("paste: beta lands in the form", p.$("#mBeta").value, "4 - 5%");
  eq("paste: oil breakdown lands in the form", p.$("#mOils").value, "myrcene 50 - 60%");
  p.ev("saveHopFromForm()");
  const saved = p.ev('JSON.stringify(HOPS["Fakehop (2029 PA)"])');
  const h = JSON.parse(saved);
  eq("paste: cohumulone saved", h.coh, "25 - 28%");
  eq("paste: total oil saved", h.oil, "1.5 - 2 mL/100g");
  eq("paste: badged first-hand", h.src, "chronicle");
  eq("paste: ranked scores saved", h.d.join(), "9,7,2,2,8,2,2,2,2,2");
  eq("paste: library grew by exactly one", p.ev("Object.keys(HOPS).length"), sizeBefore + 1);
}

// ---- Set F: a data update keeps the reader's work ----
{
  const b = browser();
  const stale = {
    version: "older-build",
    hops: {
      "Citra": { aa: "99%", d: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], styles: ["X"], touched: true },          // edited -> kept
      "Mosaic": { aa: "99%", d: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], styles: ["X"] },                         // untouched -> refreshed
      "Simcoe": { aa: "99%", d: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], styles: ["X"], verified: { source: "my COA" } }, // verified -> kept
      "Home Grown": { aa: "7%", d: null, styles: ["Mine"] },                                                // reader's own -> kept
    },
    deleted: ["Galaxy"],
  };
  b.setStore({ hopCalculusLibrary_v2: JSON.stringify(stale) });
  const p = b.boot();
  eq("upgrade: edited entry kept", p.ev('HOPS["Citra"].aa'), "99%");
  eq("upgrade: untouched entry refreshed from the shipped data", p.ev('HOPS["Mosaic"].aa'), "11-14%");
  eq("upgrade: verified entry kept", p.ev('HOPS["Simcoe"].verified.source'), "my COA");
  eq("upgrade: reader's own entry kept", p.ev('Boolean(HOPS["Home Grown"])'), true);
  eq("upgrade: deletion honoured", p.ev('Boolean(HOPS["Galaxy"])'), false);
  ok("upgrade: reader is told", /Library updated/.test(p.$("#libraryCounts").textContent));
  ok("upgrade: verified count shown", /1 verified against a real source/.test(p.$("#libraryCounts").textContent));
}

// ---- Set G: the form never carries one hop's state onto another ----
{
  const b = browser();
  let p = b.boot();
  p.ev('loadFormForEdit("Citra")'); p.$("#mVerified").checked = true; p.set("mVerifiedSrc", "YCH spec sheet"); p.ev("saveHopFromForm()");
  eq("form: Citra verified", p.ev('HOPS["Citra"].verified.source'), "YCH spec sheet");
  const key = p.ev('Object.keys(HOPS).find(k => HOPS[k].src === "chronicle" && HOPS[k].styles.length > 2)');
  p.set("chronUrl", p.ev(`HOPS[${JSON.stringify(key)}].url`)); p.ev("lookupChronicle()");
  ok("lookup: paste box offered without a failed fetch first", !p.$("#pasteBlock").classList.contains("hidden"));
  p.ev("sendChronicleToForm(null)");
  eq("send to form: verified tick does not leak from the previous hop", p.$("#mVerified").checked, false);
  eq("send to form: verified source field cleared", p.$("#mVerifiedSrc").value, "");
  eq("send to form: style tags kept, not collapsed to the series", p.$("#mStyles").value, p.ev(`HOPS[${JSON.stringify(key)}].styles.join(", ")`));
  p.ev("saveHopFromForm()");
  eq("send to form: saved hop is not verified", p.ev(`HOPS[${JSON.stringify(key)}].verified`), null);
  eq("send to form: Citra still is", p.ev('HOPS["Citra"].verified.source'), "YCH spec sheet");
  p.ev("clearForm()"); p.set("mName", "Citra"); p.ev("saveHopFromForm()");
  ok("add: a name already in the library asks before replacing", p.win.__confirms.some((m) => /already in your library/.test(m)));
}

// ---- Set H: the update banner shows once ----
{
  const b = browser();
  b.setStore({ hopCalculusLibrary_v2: JSON.stringify({ version: "older-build", hops: { "Mine": { aa: "7%", d: null, styles: ["X"] } }, deleted: ["Galaxy"] }) });
  let p = b.boot();
  ok("upgrade: banner on the first load", /Library updated/.test(p.$("#libraryCounts").textContent));
  p.persist();
  eq("upgrade: tombstone survived the version bump", p.stored().deleted.join(), "Galaxy");
  p = b.boot();
  ok("upgrade: banner gone on the next load", !/Library updated/.test(p.$("#libraryCounts").textContent));
  eq("upgrade: reader's entry still there", p.ev('Boolean(HOPS["Mine"])'), true);
}

// ---- Set I: import validation and the blend note ----
{
  const b = browser();
  const p = b.boot();
  const before = p.ev("Object.keys(HOPS).length");
  await p.importText(JSON.stringify({ "Weird": { d: [99, -5, 3, 3, 3, 3, 3, 3, 3, 3] } }));
  ok("import: scores outside 0-10 are refused", /0 to 10/.test(p.$("#importStatus").textContent));
  eq("import: library untouched by the refusal", p.ev("Object.keys(HOPS).length"), before);
  const chron = p.ev('Object.keys(HOPS).find(k => HOPS[k].src === "chronicle")');
  p.ev(`toggleHop("Citra"); toggleHop(${JSON.stringify(chron)})`);
  ok("blend: the mixed-sources note names what it mixes", /mixes (composite and from post|from post and composite) profiles/.test(p.$("#blendNote").textContent));
  const toggle = p.$("#descToggles .desc-toggle");
  eq("search: descriptor toggles are real buttons", toggle.tagName, "BUTTON");
  toggle.click();
  eq("search: toggle reports its state", p.$("#descToggles .desc-toggle").getAttribute("aria-pressed"), "true");
  ok("search: results appear", p.doc.querySelectorAll("#targetResults tr").length > 1);
}

// ---- Set J: the Hop Chronicles tab end to end ----
{
  const b = browser();
  const p = b.boot();
  const chron = p.ev('Object.keys(HOPS).find(k => HOPS[k].src === "chronicle")');
  const url = p.ev(`HOPS[${JSON.stringify(chron)}].url`);
  const variants = [url.replace("https://", "http://www."), url.replace(/\/$/, "") + "/amp/", url.toUpperCase() + "?utm_source=x"];
  for (const v of variants) {
    p.set("chronUrl", v); const found = p.ev("lookupChronicle()");
    eq(`lookup: ${v.slice(0, 40)}… resolves to the indexed post`, found && found.how, "url");
  }
  // Stats only, no results sentence: chemistry still lands, sliders are left alone.
  p.set("chronUrl", "https://brulosophy.com/2030/01/01/the-hop-chronicles-fakehop-2029-pale-ale/"); p.ev("lookupChronicle()");
  p.ev(`applyParsedText("Fakehop Hop Stats Alpha: 10 - 12% Beta: 4 - 5% Cohumulone: 25 - 28% Total Oil: 1.5 - 2 mL/100g", "pasteStatus")`);
  eq("paste: stats-only text fills beta", p.$("#mBeta").value, "4 - 5%");
  eq("paste: and marks the hop unscored rather than guessing", p.$("#mUnscored").checked, true);
  ok("paste: the status says the sliders were not set", /sliders were left alone/.test(p.$("#pasteStatus").textContent));
  ok("paste: the summary also appears on the Manage tab", /Hop stats/.test(p.$("#mgmtNote").textContent));
  // The wrong article asks before applying; Cancel applies nothing.
  p.win.confirm = (m) => { p.win.__confirms.push(String(m)); return false; };
  const r = p.ev(`applyParsedText("The most prominent characteristics noted by tasters in the beer made with Vista hops were stone fruit, berry, and floral.", "pasteStatus")`);
  ok("paste: a post about a different hop asks first", p.win.__confirms.some((m) => /never mentions "Fakehop"/.test(m)));
  eq("paste: and Cancel applies nothing", r, null);
  ok("paste: with a status saying so", /Nothing applied/.test(p.$("#pasteStatus").textContent));
}

// ---- Set K: blends by parts ----
{
  const b = browser();
  const p = b.boot();
  p.ev('toggleHop("Citra"); toggleHop("Mosaic")');            // composites with known vectors
  eq("legend: one swatch per hop plus the blend", p.doc.querySelectorAll("#radarLegend .radar-legend-item").length, 3);
  eq("blend: equal parts to start", p.$("#compareTable tr:nth-child(2) td.blend-col").textContent, "7.5/10");  // Citrus (9+6)/2
  p.ev('adjustParts("Citra", 2)');                            // 3:1
  eq("blend: parts weight the mean", p.$("#compareTable tr:nth-child(2) td.blend-col").textContent, "8.3/10");  // (27+6)/4
  ok("blend: the recipe line shows the ratio", /3 parts Citra \(75%\) \+ 1 part Mosaic \(25%\)/.test(p.$("#blendNote").textContent));
  ok("blend: shared style tags are listed", /Styles every hop here is tagged for: .*American IPA/.test(p.$("#blendNote").textContent));
  const chemCell = (row) => [...p.doc.querySelectorAll("#compareTable tr")].find((tr) => tr.firstChild.textContent === row).querySelector("td.blend-col").textContent;
  eq("blend: alpha averaged from the printed ranges", chemCell("Alpha / Beta"), "~12.5% / \u2014");   // both 11-14%, no betas on composites
  eq("blend: rows with nothing to average show a dash", chemCell("Verified"), "\u2014");
  // Rename a selected hop: its share travels with it.
  p.ev('loadFormForEdit("Citra")'); p.set("mName", "Citra (mine)"); p.ev("saveHopFromForm()");
  eq("blend: parts survive a rename", p.ev('partsOf("Citra (mine)")'), 3);
  eq("blend: the old name holds none", p.ev('hopParts["Citra"]'), undefined);
  p.ev('toggleHop("Citra (mine)")');
  eq("blend: deselecting clears the share", p.ev('hopParts["Citra (mine)"]'), undefined);
  eq("legend: a single hop has no blend entry", p.doc.querySelectorAll("#radarLegend .radar-legend-item").length, 1);
  // A hop with no figure is left out of the average, and the cell says so.
  p.ev('toggleHop("Simcoe")');                                 // composite: alpha 11-14%, no beta
  const chron = p.ev('Object.keys(HOPS).find(k => HOPS[k].src === "chronicle" && HOPS[k].beta && HOPS[k].oils)');
  p.ev(`toggleHop(${JSON.stringify(chron)})`);
  ok("blend: a missing figure is skipped, not counted as zero", /\(1 of 3\)/.test(chemCell("Alpha / Beta")));
  ok("oil breakdown: shown when the entry has one", [...p.doc.querySelectorAll("#compareTable tr")].some((tr) => tr.firstChild.textContent === "Oil breakdown" && /myrcene/i.test(tr.textContent)));
}

// ---- Set L: library filters ----
{
  const b = browser();
  const p = b.boot();
  const click = (sel) => p.$(sel).click();
  click('#seriesPills [data-series="Pale Lager"]');
  eq("filter: Pale Lager shows the lager-tested hops", p.doc.querySelectorAll("#hopList .hop-item").length, 16);
  eq("filter: pill reports pressed", p.$('#seriesPills [data-series="Pale Lager"]').getAttribute("aria-pressed"), "true");
  click('#seriesPills [data-series="all"]'); click('#sourcePills [data-source="curated"]');
  eq("filter: composites are the twenty curated entries", p.doc.querySelectorAll("#hopList .hop-item").length, 20);
  click('#sourcePills [data-source="chronicle"]');
  eq("filter: from post is the 138 articles", p.doc.querySelectorAll("#hopList .hop-item").length, 138);
}

// ---- Set M: where the numbers come from ----
{
  const b = browser();
  const p = b.boot();
  p.ev('toggleHop("Amarillo (2016 PA)"); toggleHop("Amarillo (2021 PL)"); toggleHop("Citra")');
  const row = (label) => [...p.doc.querySelectorAll("#compareTable tr")].find((tr) => tr.firstChild.textContent === label);
  const cells = [...row("Figures from").querySelectorAll("td")].slice(1);   // skip label; blend col is first
  ok("figures: the entry whose article was not used names the one that was", /the 2021 PL article/.test(cells[1].textContent));
  ok("figures: and links to it", cells[1].querySelector("a").href.includes("amarillo-2021-pale-lager"));
  eq("figures: the article that was used says so", cells[2].querySelector("a").textContent.trim(), "this article \u2197");
  eq("figures: a composite has no article", cells[3].textContent.trim(), "composite judgement");
  ok("figures: the shared profile is declared on the source row", /profile shared with Amarillo \(2021 PL\)/.test(row("Profile source").textContent));
  ok("figures: no cell is a 100-character badge", [...p.doc.querySelectorAll("#compareTable .badge")].every((b) => b.textContent.length < 40));
  // The series is not a style any more.
  p.$("#styleSelect").value = "Pale Ale"; p.ev("renderStyleResults()");
  ok("style match: Pale Ale is the tagged hops, not every Pale Ale-tested article", p.doc.querySelectorAll("#styleResults .tag").length < 100 && p.doc.querySelectorAll("#styleResults .tag").length > 30);
  ok("style match: no alias spelling in the dropdown", ![...p.doc.querySelectorAll("#styleSelect option")].some((o) => ["APA", "NEIPA", "IPA", "Kolsch"].includes(o.value)));
  ok("key: an article without a crop year says so", p.ev('Boolean(HOPS["Sabro LUPOMAX (PA, crop n/a)"])'));
  ok("counts: no 'awaiting a profile' when nothing is", /158 entries, all scored/.test(p.$("#libraryCounts").textContent));
  ok("counts: the scored-only filter is hidden with nothing to filter", p.$("#scoredOnlyLabel").classList.contains("hidden"));
}

// ---- Set N: reachable without a mouse or a screen ----
{
  const b = browser();
  const p = b.boot();
  const tabs = [...p.doc.querySelectorAll('[role="tab"]')];
  eq("tabs: five tabs in a tablist", tabs.length, 5);
  eq("tabs: one tab stop", tabs.filter((t) => t.tabIndex === 0).length, 1);
  tabs[0].dispatchEvent(new p.win.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  eq("tabs: arrow moves selection", p.$('[role="tab"][aria-selected="true"]').id, "tabbtn-style");
  ok("tabs: and shows that panel", p.$("#tab-style").classList.contains("active"));
  tabs[1].dispatchEvent(new p.win.KeyboardEvent("keydown", { key: "End", bubbles: true }));
  eq("tabs: End reaches the last tab", p.$('[role="tab"][aria-selected="true"]').id, "tabbtn-manage");
  const unnamed = [...p.doc.querySelectorAll("input, select, textarea")].filter((c) => {
    if (c.type === "hidden" || c.type === "file" || c.type === "checkbox" || c.type === "range") return false;
    const byFor = c.id && p.doc.querySelector(`label[for="${c.id}"]`);
    return !(byFor || c.getAttribute("aria-label") || c.closest("label"));
  }).map((c) => c.id);
  eq("forms: every text control has a name", unnamed.join(), "");
  p.ev('toggleHop("Citra")');
  eq("list: selection is announced, not just coloured", p.$('#hopList .hop-item[aria-pressed="true"]').textContent.startsWith("Citra"), true);
  ok("status: outcomes are live regions", ["chronStatus", "pasteStatus", "importStatus", "mgmtNote"].every((id) => p.doc.getElementById(id).getAttribute("aria-live") === "polite"));
  ok("manage: edit and delete buttons name their hop", p.$('#mgmtList button[aria-label="Delete Citra"]') !== null);
  ok("radar: has a text alternative pointing at the table", p.$("#radar").getAttribute("aria-describedby") === "compareTable");
  ok("search: descriptor toggles reachable", p.$("#descToggles button") !== null);
}

console.log(`\n${pass} passed, ${fail} failed (${pass + fail} total)`);
process.exit(fail ? 1 : 0);
