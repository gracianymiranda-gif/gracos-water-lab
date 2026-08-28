// Validates the app's chemistry engine against ground-truth outputs from
// Bru'n Water 5.5 (the licensed spreadsheet, driven via Excel COM automation
// across ~70 scenarios -- see tests/bw_calibration.csv).
//
// Run:  node tests/bw-calibration.test.mjs
//
// app.js is a browser script, so we load it in a VM sandbox with a stub DOM.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

// ---- stub browser environment ----
const noopEl = new Proxy({}, { get: (t, p) => {
  if (p === "addEventListener" || p === "appendChild") return () => {};
  if (p === "style") return {};
  if (p === "value" || p === "innerHTML" || p === "textContent") return "";
  return undefined;
}, set: () => true });
const documentStub = {
  addEventListener: () => {},
  getElementById: () => null,
  querySelectorAll: () => [],
  createElement: () => noopEl
};
const sandbox = {
  document: documentStub,
  window: {},
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  console, Math, JSON, parseFloat, parseInt, isNaN, Object, Array, Number, String
};
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(root, "app.js"), "utf8"), sandbox, { filename: "app.js" });

// top-level let/const live in the context's shared lexical scope, not on
// globalThis -- pull everything out with a second script in the same context
const { estimateMashPh, calcMashAcidMl, calcSpargeAcidCarbonate, acidMeqPerMl, state } = vm.runInContext(
  "({ estimateMashPh, calcMashAcidMl, calcSpargeAcidCarbonate, acidMeqPerMl, state })", sandbox);
state.unit = "us";
state.acidType = "lactic88";

// ---- tiny test harness ----
let pass = 0, fail = 0;
function check(name, actual, expected, tol) {
  const ok = Math.abs(actual - expected) <= tol;
  if (ok) { pass++; }
  else {
    fail++;
    console.error(`FAIL ${name}: got ${actual.toFixed(4)}, expected ${expected.toFixed(4)} (tol ${tol})`);
  }
}

const RO = { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 };
const V = 3.75; // gal mash water used in the calibration runs

// ---- Set A: single-malt mash pH vs Bru'n Water (in-range cases) ----
const singleMalt = [
  // [type, colorL, bwPh]
  ["base", 1.2, 5.71976], ["base", 1.7, 5.70299], ["base", 3, 5.65939],
  ["base", 5, 5.59232], ["base", 10, 5.42464], ["base", 20, 5.08928],
  ["wheat", 2, 6.01631], ["wheat", 9, 5.78156],
  ["crystal", 10, 5.20905], ["crystal", 20, 4.95753], ["crystal", 40, 4.45450]
];
for (const [type, L, bwPh] of singleMalt) {
  const ph = estimateMashPh(RO, [{ type, color: L, weight: 10 }], V);
  check(`mashPh 10lb ${type} L=${L}`, ph, bwPh, 0.02);
}

// acid malt blends
check("mashPh 9.5 pils + 0.5 acid malt",
  estimateMashPh(RO, [{ type: "base", color: 1.7, weight: 9.5 }, { type: "acid", color: 2, weight: 0.5 }], V),
  5.13693, 0.02);
check("mashPh 9.8 pils + 0.2 acid malt",
  estimateMashPh(RO, [{ type: "base", color: 1.7, weight: 9.8 }, { type: "acid", color: 2, weight: 0.2 }], V),
  5.47656, 0.02);

// ---- Set B: mash thickness ----
const pils10 = [{ type: "base", color: 1.7, weight: 10 }];
check("mashPh thin mash 7.5gal", estimateMashPh(RO, pils10, 7.5), 5.73149, 0.02);
check("mashPh thick mash 2.5gal", estimateMashPh(RO, pils10, 2.5), 5.67448, 0.02);

// ---- Set C: water alkalinity & Kolbach hardness offsets ----
check("mashPh HCO3=61", estimateMashPh({ ...RO, hco3: 61 }, pils10, V), 5.87302, 0.02);
check("mashPh HCO3=122 Ca=50", estimateMashPh({ ...RO, hco3: 122, ca: 50, so4: 60, cl: 40 }, pils10, V), 5.92163, 0.02);
check("mashPh HCO3=122 Ca=150", estimateMashPh({ ...RO, hco3: 122, ca: 150, so4: 180, cl: 120 }, pils10, V), 5.67876, 0.02);
check("mashPh HCO3=122 Mg=30", estimateMashPh({ ...RO, hco3: 122, mg: 30, so4: 60, cl: 40 }, pils10, V), 5.98309, 0.03);

// ---- Set E: realistic grain bills ----
check("mashPh pale ale bill alkaline water",
  estimateMashPh({ ...RO, hco3: 122, ca: 50, so4: 60, cl: 40 },
    [{ type: "base", color: 1.8, weight: 9 }, { type: "crystal", color: 40, weight: 1 }], V),
  5.79376, 0.02);
check("mashPh stout my-water",
  estimateMashPh({ ...RO, ca: 50, mg: 13, hco3: 173, so4: 42, cl: 27 },
    [{ type: "base", color: 1.8, weight: 8 }, { type: "crystal", color: 80, weight: 1 }, { type: "roast", color: 450, weight: 1 }], V),
  5.36023, 0.02);
check("mashPh hazy wheat bill + gypsum/CaCl2 calcium",
  // Bru'n Water E3: 0.5 g/gal gypsum (30.75 ppm Ca) + 0.75 g/gal ANHYDROUS
  // CaCl2 (71.5 ppm Ca) -> 102.3 ppm Ca lowering pH via Kolbach RA.
  estimateMashPh({ ...RO, ca: 102.3, so4: 73.7, cl: 96 },
    [{ type: "base", color: 1.8, weight: 7 }, { type: "wheat", color: 2, weight: 2 }, { type: "wheat", color: 1, weight: 1 }], V),
  5.54954, 0.02);

// ---- Set D: mash acid dosing (Bru'n Water moved pH linearly with lactic) ----
// BW: 1.0 mL/gal 88% lactic moved 10lb-pils RO mash from 5.70299 -> 5.18815.
state.acidType = "lactic88";
check("mash acid: lactic to drop 5.703->5.188 (BW used 3.75 mL)",
  calcMashAcidMl(5.70299, 5.18815, V), 3.75, 0.15);
// BW: 0.5 mL/gal -> pH 5.44557 (1.875 mL total)
check("mash acid: lactic to drop 5.703->5.446 (BW used 1.875 mL)",
  calcMashAcidMl(5.70299, 5.44557, V), 1.875, 0.1);
// BW: 2.0 mL/gal -> pH 4.67332 (7.5 mL). BW assumes a FIXED 97.2% lactic
// dissociation; we evaluate dissociation at the target pH (86.7% at 4.67),
// so we deliberately recommend more acid for extreme drops. Wide tolerance.
check("mash acid: extreme drop 5.703->4.673 (BW 7.5 mL, ours ~8.4)",
  calcMashAcidMl(5.70299, 4.67332, V), 7.95, 0.55);
// RO water MUST still get an acid recommendation (old carbonate model returned 0)
if (calcMashAcidMl(5.70, 5.25, 4.0) <= 0) { fail++; console.error("FAIL RO water acid: returned 0"); } else { pass++; }
// Phosphoric: BW 10% 1 mL/gal moved pH by -0.04896; our UI acid is 85%
// (14.6 mmol/mL vs 1.07): same mEq -> scale dose by 1.07/14.84.
state.acidType = "phos85";
check("mash acid: phos85 to drop 5.703->5.654 (BW-equiv ~0.27 mL)",
  calcMashAcidMl(5.70299, 5.65403, V), 0.27, 0.1);
state.acidType = "lactic88";

// ---- Set F: sparge acidification vs Bru'n Water ----
// (alk ppm CaCO3, start pH, target pH, gal, BW mL of 88% lactic)
const spargeCases = [
  [50, 8.3, 5.5, 5, 1.4796], [100, 8.3, 5.5, 5, 2.9427],
  [200, 8.3, 5.5, 5, 5.8665], [300, 8.3, 5.5, 5, 8.7904],
  [142, 8.3, 6.0, 5, 3.2814], [50, 7.6, 6.0, 5, 1.1400]
];
for (const [alk, sph, tph, gal, bwMl] of spargeCases) {
  check(`sparge alk=${alk} ${sph}->${tph}`, calcSpargeAcidCarbonate(alk, sph, tph, gal), bwMl, bwMl * 0.06);
}

// ---- acid strength sanity ----
check("lactic88 mEq/mL at 5.4", acidMeqPerMl("lactic88", 5.4), 11.46, 0.15);
check("phos85 mEq/mL at 5.4", acidMeqPerMl("phos85", 5.4), 14.84, 0.25);

console.log(`\n${pass} passed, ${fail} failed (${pass + fail} total)`);
process.exit(fail ? 1 : 0);
