// Graco's Water Lab - Application Logic & Calculation Engine

// Book-backed Preset Target Profiles (Expanded with Palmer, Janish, Noonan, Daniels, Mosher, White & Zainasheff)
const PRESETS = {
  // Scott Janish - The New IPA
  "janish_hazy_neipa": {
    name: "Janish Juicy Hazy IPA / NEIPA",
    book: "The New IPA (Scott Janish)",
    ions: { ca: 125, mg: 10, na: 15, so4: 75, cl: 175, hco3: 40 },
    ph: 5.30,
    note: "High Chloride-to-Sulfate ratio (2.3:1) for pillowy mouthfeel, hop oil biotransformation, and haze stability."
  },
  "janish_juicy_double": {
    name: "Janish Imperial Hazy DIPA",
    book: "The New IPA (Scott Janish)",
    ions: { ca: 140, mg: 10, na: 20, so4: 90, cl: 200, hco3: 45 },
    ph: 5.28,
    note: "Elevated Calcium (140 ppm) and Chloride (200 ppm) to support high-gravity dry hop rates without harshness."
  },
  "janish_west_coast": {
    name: "Janish Crisp West Coast IPA",
    book: "The New IPA (Scott Janish)",
    ions: { ca: 110, mg: 12, na: 15, so4: 250, cl: 60, hco3: 35 },
    ph: 5.25,
    note: "High Sulfate-to-Chloride ratio (4.1:1) for dry, assertive hop bitterness and quick finish."
  },

  // Greg Noonan & Lager Books
  "noonan_pilsen_soft": {
    name: "Bohemian / Pilsen Ultra-Soft",
    book: "Lager Brewing (Greg Noonan)",
    ions: { ca: 7, mg: 2, na: 4, so4: 6, cl: 6, hco3: 14 },
    ph: 5.25,
    note: "Ultra-soft water profile matching Pilsen, Czechia. Enhances subtle Saaz hop aroma and soft pale malt."
  },
  "noonan_german_pils": {
    name: "German Pilsner Crisp",
    book: "Lager Brewing (Greg Noonan)",
    ions: { ca: 60, mg: 8, na: 10, so4: 120, cl: 40, hco3: 30 },
    ph: 5.30,
    note: "Higher sulfate level (120 ppm) to accentuate noble hop bitterness and snappy attenuation."
  },
  "noonan_munich_helles": {
    name: "Munich Helles / Vienna Lager",
    book: "Lager Brewing (Greg Noonan)",
    ions: { ca: 50, mg: 8, na: 10, so4: 30, cl: 55, hco3: 50 },
    ph: 5.35,
    note: "Balanced, low-sulfate profile designed for rich bready malt character and round lager finish."
  },
  "noonan_dark_lager": {
    name: "Munich Dunkel / Doppelbock",
    book: "Lager Brewing (Greg Noonan)",
    ions: { ca: 80, mg: 15, na: 20, so4: 40, cl: 40, hco3: 140 },
    ph: 5.40,
    note: "Higher bicarbonate (140 ppm) to balance dark roast malts and maintain mash pH above 5.2."
  },

  // Ray Daniels & Randy Mosher - Historic Brewing Profiles
  "daniels_burton": {
    name: "Burton-on-Trent Historic Pale Ale",
    book: "Designing Great Beers (Ray Daniels)",
    ions: { ca: 275, mg: 40, na: 25, so4: 610, cl: 35, hco3: 270 },
    ph: 5.30,
    note: "Extreme historic sulfate level (610 ppm) famous for traditional Burton Pale Ales and IPA hop bite."
  },
  "daniels_dublin": {
    name: "Dublin Dry Irish Stout",
    book: "Designing Great Beers (Ray Daniels)",
    ions: { ca: 120, mg: 10, na: 12, so4: 55, cl: 20, hco3: 320 },
    ph: 5.45,
    note: "High bicarbonate (320 ppm) buffer to balance heavy roasted barley acids in classic Irish Dry Stouts."
  },
  "daniels_london": {
    name: "London English Porter / Mild",
    book: "Designing Great Beers (Ray Daniels)",
    ions: { ca: 90, mg: 5, na: 15, so4: 40, cl: 50, hco3: 180 },
    ph: 5.40,
    note: "Moderate chloride and high bicarbonate matching historic Thames water for full malt body in Porters."
  },
  "daniels_dortmund": {
    name: "Dortmunder Export Lager",
    book: "Designing Great Beers (Ray Daniels)",
    ions: { ca: 220, mg: 40, na: 60, so4: 330, cl: 130, hco3: 220 },
    ph: 5.35,
    note: "High-mineral lager water profile giving Dortmunder Export its characteristic firm, minerally finish."
  },

  // John Palmer - Water
  "palmer_yellow_balanced": {
    name: "Palmer Balanced Yellow Ale",
    book: "Water (John Palmer)",
    ions: { ca: 50, mg: 10, na: 15, so4: 80, cl: 60, hco3: 40 },
    ph: 5.40,
    note: "Standard baseline profile for Blonde Ales, Pale Ales, and Saison."
  },
  "palmer_malty_amber": {
    name: "Palmer Malty Amber / Brown",
    book: "Water (John Palmer)",
    ions: { ca: 75, mg: 15, na: 25, so4: 50, cl: 100, hco3: 90 },
    ph: 5.40,
    note: "Chloride-forward amber profile for caramel sweetness and body."
  },
  "palmer_dark_stout": {
    name: "Palmer Imperial Stout / Porter",
    book: "Water (John Palmer)",
    ions: { ca: 100, mg: 20, na: 35, so4: 60, cl: 60, hco3: 160 },
    ph: 5.45,
    note: "High alkalinity buffer to neutralize heavy dark chocolate and black patent roast acids."
  }
};

// Source Water Presets
const SOURCE_PRESETS = {
  "ro": { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 },
  "soft": { ca: 20, mg: 4, na: 8, so4: 15, cl: 12, hco3: 45 },
  "moderate": { ca: 60, mg: 8, na: 20, so4: 50, cl: 35, hco3: 110 },
  "hard": { ca: 110, mg: 25, na: 45, so4: 140, cl: 80, hco3: 240 }
};

// Salt Contributions in PPM per Gram per US Gallon
const SALTS = {
  gypsum: { name: "Gypsum", formula: "CaSO₄·2H₂O", ca: 61.5, so4: 147.4, mg: 0, na: 0, cl: 0, hco3: 0, penalty: 1.0 },
  cacl2:  { name: "Calcium Chloride", formula: "CaCl₂·2H₂O", ca: 72.0, cl: 127.4, mg: 0, na: 0, so4: 0, hco3: 0, penalty: 1.0 },
  epsom:  { name: "Epsom Salt", formula: "MgSO₄·7H₂O", mg: 26.1, so4: 103.0, ca: 0, na: 0, cl: 0, hco3: 0, penalty: 1.2 },
  baking: { name: "Baking Soda", formula: "NaHCO₃", na: 72.3, hco3: 191.9, ca: 0, mg: 0, so4: 0, cl: 0, penalty: 4.0 },
  mgcl2:  { name: "Magnesium Chloride", formula: "MgCl₂·6H₂O", mg: 31.6, cl: 92.3, ca: 0, na: 0, so4: 0, hco3: 0, penalty: 2.0 },
  salt:   { name: "Pickling Salt", formula: "NaCl", na: 103.9, cl: 160.3, ca: 0, mg: 0, so4: 0, hco3: 0, penalty: 2.5 },
  lime:   { name: "Slaked Lime", formula: "Ca(OH)₂", ca: 143.0, hco3: 435.0, mg: 0, na: 0, so4: 0, cl: 0, penalty: 5.0 }
};

// Application State
let state = {
  unit: "us",
  sourceIons: { ca: 60, mg: 8, na: 20, so4: 50, cl: 35, hco3: 110 },
  roRatio: 0,
  targetKey: "janish_hazy_neipa",
  mashVol: 4.0,
  spargeVol: 3.5,
  noSparge: false,
  targetMashPh: 5.30,
  targetSpargePh: 5.60,
  grains: [
    { name: "Maris Otter Base Malt", weight: 9.0, color: 3.5, type: "base" },
    { name: "Caramel / Crystal 60L", weight: 1.0, color: 60.0, type: "crystal" }
  ],
  activeSalts: ["gypsum", "cacl2", "epsom", "baking"],
  acidType: "lactic88",
  dosages: {
    mash: { gypsum: 0, cacl2: 0, epsom: 0, baking: 0, mgcl2: 0, salt: 0, lime: 0 },
    sparge: { gypsum: 0, cacl2: 0, epsom: 0, baking: 0, mgcl2: 0, salt: 0, lime: 0 },
    mashAcidMl: 0,
    spargeAcidMl: 0
  }
};

// Init on DOM Load
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  populatePresets();
  renderGrainBill();
  calculateAll();
});

function setupEventListeners() {
  document.getElementById("btn-us")?.addEventListener("click", () => setUnit("us"));
  document.getElementById("btn-metric")?.addEventListener("click", () => setUnit("metric"));

  document.getElementById("sourcePreset")?.addEventListener("change", (e) => {
    const key = e.target.value;
    if (SOURCE_PRESETS[key]) {
      state.sourceIons = { ...SOURCE_PRESETS[key] };
      updateSourceInputs();
      calculateAll();
    }
  });

  ["ca", "mg", "na", "so4", "cl", "hco3"].forEach(ion => {
    document.getElementById(`src_${ion}`)?.addEventListener("input", (e) => {
      state.sourceIons[ion] = parseFloat(e.target.value) || 0;
      calculateAll();
    });
  });

  document.getElementById("roSlider")?.addEventListener("input", (e) => {
    state.roRatio = parseFloat(e.target.value) || 0;
    document.getElementById("roVal").textContent = `${state.roRatio}%`;
    calculateAll();
  });

  document.getElementById("targetPreset")?.addEventListener("change", (e) => {
    const key = e.target.value;
    if (PRESETS[key]) {
      state.targetKey = key;
      state.targetMashPh = PRESETS[key].ph;
      document.getElementById("targetMashPh").value = PRESETS[key].ph;
      updateTargetInputs();
      calculateAll();
    }
  });

  document.getElementById("mashVol")?.addEventListener("input", (e) => {
    state.mashVol = parseFloat(e.target.value) || 0;
    calculateAll();
  });
  document.getElementById("spargeVol")?.addEventListener("input", (e) => {
    state.spargeVol = parseFloat(e.target.value) || 0;
    calculateAll();
  });
  document.getElementById("noSparge")?.addEventListener("change", (e) => {
    state.noSparge = e.target.checked;
    document.getElementById("spargeVolGroup").style.display = state.noSparge ? "none" : "block";
    calculateAll();
  });
  document.getElementById("targetMashPh")?.addEventListener("input", (e) => {
    state.targetMashPh = parseFloat(e.target.value) || 5.3;
    calculateAll();
  });
  document.getElementById("acidType")?.addEventListener("change", (e) => {
    state.acidType = e.target.value;
    calculateAll();
  });

  document.getElementById("addGrainBtn")?.addEventListener("click", () => {
    state.grains.push({ name: "2-Row Base Malt", weight: 1.0, color: 2.0, type: "base" });
    renderGrainBill();
    calculateAll();
  });

  document.getElementById("calcBtn")?.addEventListener("click", () => {
    calculateAll();
  });

  document.getElementById("openSheetBtn")?.addEventListener("click", openBrewSheet);
  document.getElementById("closeSheetBtn")?.addEventListener("click", closeBrewSheet);

  document.getElementById("saveCsvBtn")?.addEventListener("click", saveRecipeCsv);
  document.getElementById("loadCsvInput")?.addEventListener("change", loadRecipeCsv);
}

function setUnit(u) {
  state.unit = u;
  document.getElementById("btn-us")?.setAttribute("aria-pressed", u === "us");
  document.getElementById("btn-metric")?.setAttribute("aria-pressed", u === "metric");
  document.getElementById("volUnitlbl").textContent = u === "us" ? "GAL" : "L";
  document.getElementById("grainUnitlbl").textContent = u === "us" ? "LB" : "KG";
  calculateAll();
}

function populatePresets() {
  const sel = document.getElementById("targetPreset");
  if (!sel) return;
  sel.innerHTML = "";

  Object.keys(PRESETS).forEach(k => {
    const opt = document.createElement("option");
    opt.value = k;
    const author = PRESETS[k].book.split(' ')[0];
    opt.textContent = `[${author}] ${PRESETS[k].name}`;
    sel.appendChild(opt);
  });
  sel.value = state.targetKey;
  updateTargetInputs();
}

function updateSourceInputs() {
  ["ca", "mg", "na", "so4", "cl", "hco3"].forEach(ion => {
    const el = document.getElementById(`src_${ion}`);
    if (el) el.value = state.sourceIons[ion];
  });
}

function updateTargetInputs() {
  const p = PRESETS[state.targetKey];
  if (!p) return;
  ["ca", "mg", "na", "so4", "cl", "hco3"].forEach(ion => {
    const el = document.getElementById(`tgt_${ion}`);
    if (el) el.value = p.ions[ion];
  });
  const noteEl = document.getElementById("bookTargetNote");
  if (noteEl) noteEl.innerHTML = `<b>Ref: ${p.book}</b> — ${p.note}`;
}

function renderGrainBill() {
  const container = document.getElementById("grainList");
  if (!container) return;
  container.innerHTML = "";

  state.grains.forEach((g, idx) => {
    const div = document.createElement("div");
    div.className = "grainrow";
    div.innerHTML = `
      <input type="text" value="${g.name}" placeholder="Malt Name" onchange="updateGrain(${idx}, 'name', this.value)">
      <input type="number" step="0.1" value="${g.weight}" onchange="updateGrain(${idx}, 'weight', parseFloat(this.value)||0)">
      <input type="number" step="0.1" value="${g.color}" onchange="updateGrain(${idx}, 'color', parseFloat(this.value)||0)">
      <select onchange="updateGrain(${idx}, 'type', this.value)">
        <option value="base" ${g.type==='base'?'selected':''}>Base</option>
        <option value="crystal" ${g.type==='crystal'?'selected':''}>Crystal</option>
        <option value="roast" ${g.type==='roast'?'selected':''}>Roast</option>
        <option value="acid" ${g.type==='acid'?'selected':''}>Acid</option>
      </select>
      <button class="del" onclick="removeGrain(${idx})">×</button>
    `;
    container.appendChild(div);
  });
}

window.updateGrain = function(idx, field, val) {
  if (state.grains[idx]) {
    state.grains[idx][field] = val;
    calculateAll();
  }
};

window.removeGrain = function(idx) {
  state.grains.splice(idx, 1);
  renderGrainBill();
  calculateAll();
};

function getEffectiveSource() {
  const factor = (100 - state.roRatio) / 100.0;
  return {
    ca: state.sourceIons.ca * factor,
    mg: state.sourceIons.mg * factor,
    na: state.sourceIons.na * factor,
    so4: state.sourceIons.so4 * factor,
    cl: state.sourceIons.cl * factor,
    hco3: state.sourceIons.hco3 * factor
  };
}

function solveSalts(effSource, targetIons, volGal) {
  const activeKeys = Array.from(document.querySelectorAll('.salt input[type=checkbox]:checked')).map(cb => cb.value);
  state.activeSalts = activeKeys;

  let bestDosages = {};
  activeKeys.forEach(k => bestDosages[k] = 0);

  if (volGal <= 0 || activeKeys.length === 0) return bestDosages;

  const stepSize = 0.05;
  const maxIter = 400;

  for (let iter = 0; iter < maxIter; iter++) {
    let improved = false;
    activeKeys.forEach(key => {
      const currentErr = calcError(bestDosages, effSource, targetIons, volGal);

      bestDosages[key] += stepSize;
      const addErr = calcError(bestDosages, effSource, targetIons, volGal);

      bestDosages[key] = Math.max(0, bestDosages[key] - 2 * stepSize);
      const subErr = calcError(bestDosages, effSource, targetIons, volGal);

      if (addErr < currentErr && addErr <= subErr) {
        bestDosages[key] += 2 * stepSize;
        improved = true;
      } else if (subErr < currentErr) {
        improved = true;
      } else {
        bestDosages[key] += stepSize;
      }
    });
    if (!improved) break;
  }

  Object.keys(bestDosages).forEach(k => {
    bestDosages[k] = Math.round(bestDosages[k] * 100) / 100;
  });

  return bestDosages;
}

function calcError(dosages, effSource, targetIons, volGal) {
  let res = { ...effSource };
  Object.keys(dosages).forEach(k => {
    const g = dosages[k];
    if (g > 0 && SALTS[k]) {
      const ppmPerGram = 1.0 / volGal;
      res.ca += SALTS[k].ca * g * ppmPerGram;
      res.mg += SALTS[k].mg * g * ppmPerGram;
      res.na += SALTS[k].na * g * ppmPerGram;
      res.so4 += SALTS[k].so4 * g * ppmPerGram;
      res.cl += SALTS[k].cl * g * ppmPerGram;
      res.hco3 += SALTS[k].hco3 * g * ppmPerGram;
    }
  });

  let err = 0;
  err += Math.pow(res.ca - targetIons.ca, 2) * 1.2;
  err += Math.pow(res.mg - targetIons.mg, 2) * 0.8;
  err += Math.pow(res.na - targetIons.na, 2) * 1.0;
  err += Math.pow(res.so4 - targetIons.so4, 2) * 1.5;
  err += Math.pow(res.cl - targetIons.cl, 2) * 1.5;
  err += Math.pow(res.hco3 - targetIons.hco3, 2) * 1.0;

  Object.keys(dosages).forEach(k => {
    if (SALTS[k]) err += dosages[k] * SALTS[k].penalty * 5.0;
  });

  return err;
}

function computeResultingPpm(dosages, effSource, volGal) {
  let res = { ...effSource };
  if (volGal <= 0) return res;

  Object.keys(dosages).forEach(k => {
    const g = dosages[k];
    if (g > 0 && SALTS[k]) {
      const ppmPerGram = 1.0 / volGal;
      res.ca += SALTS[k].ca * g * ppmPerGram;
      res.mg += SALTS[k].mg * g * ppmPerGram;
      res.na += SALTS[k].na * g * ppmPerGram;
      res.so4 += SALTS[k].so4 * g * ppmPerGram;
      res.cl += SALTS[k].cl * g * ppmPerGram;
      res.hco3 += SALTS[k].hco3 * g * ppmPerGram;
    }
  });
  return res;
}

function estimateMashPh(ppm, grains, mashVolGal) {
  let totalWeightLb = 0;
  let weightedColor = 0;
  let acidMaltLb = 0;

  grains.forEach(g => {
    const wt = state.unit === "metric" ? g.weight * 2.20462 : g.weight;
    totalWeightLb += wt;
    if (g.type === "acid") {
      acidMaltLb += wt;
    } else {
      weightedColor += wt * g.color;
    }
  });

  if (totalWeightLb <= 0) return 5.60;

  const avgColorL = weightedColor / (totalWeightLb - acidMaltLb || 1);

  let phDi = 5.60;
  if (avgColorL <= 3) phDi = 5.70;
  else if (avgColorL <= 15) phDi = 5.60 - (avgColorL - 3) * 0.012;
  else phDi = 5.45 - (avgColorL - 15) * 0.004;

  const alk = ppm.hco3 * 0.82;
  const ra = alk - (ppm.ca / 3.5 + ppm.mg / 7.0);

  const gristRatio = mashVolGal / totalWeightLb;
  const waterShift = (ra * 0.0028) / (gristRatio > 0 ? gristRatio * 0.4 : 1.0);

  const acidMaltPct = (acidMaltLb / totalWeightLb) * 100;
  const acidMaltShift = acidMaltPct * 0.10;

  let estPh = phDi + waterShift - acidMaltShift;
  return Math.round(estPh * 100) / 100;
}

function calcAcidMl(currentPh, targetPh, mashVolGal, alkPpm) {
  if (currentPh <= targetPh) return 0;
  const phDiff = currentPh - targetPh;
  const mEqReq = phDiff * 25.0 * mashVolGal;

  if (state.acidType === "lactic88") {
    return Math.round((mEqReq / 11.6) * 10) / 10;
  } else {
    return Math.round((mEqReq / 15.2) * 10) / 10;
  }
}

// Main Calculation Loop
function calculateAll() {
  const effSource = getEffectiveSource();
  const targetObj = PRESETS[state.targetKey] ? PRESETS[state.targetKey].ions : PRESETS["janish_hazy_neipa"].ions;

  const mashGal = state.unit === "metric" ? state.mashVol * 0.264172 : state.mashVol;
  const spargeGal = state.noSparge ? 0 : (state.unit === "metric" ? state.spargeVol * 0.264172 : state.spargeVol);

  const mashDosages = solveSalts(effSource, targetObj, mashGal);
  const spargeDosages = state.noSparge ? {} : solveSalts(effSource, targetObj, spargeGal);

  state.dosages.mash = mashDosages;
  state.dosages.sparge = spargeDosages;

  const mashPpm = computeResultingPpm(mashDosages, effSource, mashGal);
  const totalGal = mashGal + spargeGal;
  const combinedPpm = computeResultingPpm(mashDosages, effSource, totalGal > 0 ? totalGal : 1);

  const estPh = estimateMashPh(mashPpm, state.grains, mashGal);
  const mashAcid = calcAcidMl(estPh, state.targetMashPh, mashGal, mashPpm.hco3);
  const spargeAcid = state.noSparge ? 0 : calcAcidMl(5.90, 5.50, spargeGal, effSource.hco3);

  state.dosages.mashAcidMl = mashAcid;
  state.dosages.spargeAcidMl = spargeAcid;

  renderOutputs(combinedPpm, targetObj, mashPpm, estPh, mashAcid, spargeAcid, mashDosages, spargeDosages);
}

function renderOutputs(combinedPpm, targetObj, mashPpm, estPh, mashAcid, spargeAcid, mashDosages, spargeDosages) {
  // SO4 : Cl Ratio
  const ratio = combinedPpm.cl > 0 ? (combinedPpm.so4 / combinedPpm.cl).toFixed(2) : "N/A";
  document.getElementById("so4clRatio").textContent = ratio;

  let ratioDesc = "";
  if (ratio > 2.5) ratioDesc = "<b>Very Dry & Crisp</b> — High sulfate accentuates hop bitterness & crisp finish (Scott Janish & Ray Daniels Burton profile).";
  else if (ratio >= 1.5) ratioDesc = "<b>Slightly Dry / Balanced</b> — Suitable for Pale Ales and German Pilsners.";
  else if (ratio >= 0.8) ratioDesc = "<b>Balanced Malt & Hops</b> — Ideal baseline for lagers and amber ales.";
  else ratioDesc = "<b>Very Soft & Full</b> — High chloride enhances pillowy mouthfeel, juicy hop oils, and haze (Scott Janish NEIPA profile).";

  document.getElementById("ratioDesc").innerHTML = ratioDesc;

  // Yeast Mineral Health Checks (White & Zainasheff - Yeast)
  renderYeastHealthNotes(combinedPpm);

  // Ion Comparison Table
  ["ca", "mg", "na", "so4", "cl", "hco3"].forEach(ion => {
    const val = Math.round(combinedPpm[ion]);
    const tgt = targetObj[ion];
    const diff = val - tgt;
    const diffText = diff > 0 ? `+${diff}` : `${diff}`;

    document.getElementById(`res_${ion}`).textContent = val;
    document.getElementById(`tgt_val_${ion}`).textContent = tgt;
    document.getElementById(`diff_${ion}`).textContent = diffText;

    const fillEl = document.getElementById(`fill_${ion}`);
    if (fillEl) {
      const pct = Math.min(100, Math.max(5, (val / (tgt || 1)) * 50));
      fillEl.style.width = `${pct}%`;
      fillEl.className = `fill ${Math.abs(diff) < 15 ? 'ok' : Math.abs(diff) < 40 ? 'wn' : 'bd'}`;
    }
  });

  // pH Gauge
  document.getElementById("phVal").textContent = estPh.toFixed(2);
  const markEl = document.getElementById("phMark");
  if (markEl) {
    const pct = Math.min(95, Math.max(5, ((estPh - 4.8) / (6.2 - 4.8)) * 100));
    markEl.style.left = `${pct}%`;
  }

  // Doses Breakdown
  renderDoseCard("mashDoses", mashDosages, mashAcid, "Mash Tun");
  if (!state.noSparge) {
    renderDoseCard("spargeDoses", spargeDosages, spargeAcid, "Sparge Tank");
  } else {
    document.getElementById("spargeDosesCard").style.display = "none";
  }
}

// Yeast Health Callouts based on Chris White & Jamil Zainasheff (Yeast)
function renderYeastHealthNotes(ppm) {
  const container = document.getElementById("yeastHealthNote");
  if (!container) return;

  let notes = [];
  if (ppm.ca < 50) {
    notes.push("⚠️ <b>Low Calcium (&lt; 50 ppm)</b>: <i>Yeast (White & Zainasheff)</i> recommends at least 50 ppm Ca²⁺ for yeast cell wall integrity, mash enzyme protection, and clean flocculation.");
  } else {
    notes.push("✅ <b>Calcium (&gt; 50 ppm)</b>: Adequate Ca²⁺ for yeast flocculation & mash alpha-amylase stability.");
  }

  if (ppm.mg < 10) {
    notes.push("⚠️ <b>Low Magnesium (&lt; 10 ppm)</b>: Mg²⁺ acts as an essential enzyme co-factor during yeast metabolism. Consider Epsom salt addition.");
  } else if (ppm.mg > 35) {
    notes.push("⚠️ <b>High Magnesium (&gt; 35 ppm)</b>: Mg²⁺ above 30 ppm can impart sour or astringent metallic bitterness.");
  }

  if (ppm.na > 150) {
    notes.push("⚠️ <b>High Sodium (&gt; 150 ppm)</b>: Elevated Na⁺ can taste harsh or overly salty when combined with high sulfate.");
  }

  container.innerHTML = notes.join("<br>");
}

function renderDoseCard(elementId, dosages, acidMl, label) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = "";

  let count = 0;
  Object.keys(dosages).forEach(k => {
    const amt = dosages[k];
    if (amt > 0 && SALTS[k]) {
      count++;
      const div = document.createElement("div");
      div.className = "dose";
      div.innerHTML = `
        <div class="dn">${SALTS[k].name} (${SALTS[k].formula})</div>
        <div class="dg">${amt} <span>${state.unit === 'us' ? 'g' : 'g'}</span></div>
      `;
      container.appendChild(div);
    }
  });

  if (acidMl > 0) {
    count++;
    const acidName = state.acidType === "lactic88" ? "Lactic Acid (88%)" : "Phosphoric Acid (85%)";
    const div = document.createElement("div");
    div.className = "dose acid";
    div.innerHTML = `
      <div class="dn">${acidName}</div>
      <div class="dg">${acidMl} <span>mL</span></div>
    `;
    container.appendChild(div);
  }

  if (count === 0) {
    container.innerHTML = `<div class="dose"><div class="dn">No additions needed</div><div class="dg">0 <span>g</span></div></div>`;
  }
}

// Brew Day Printable Checklist Overlay
function openBrewSheet() {
  const overlay = document.getElementById("sheetOverlay");
  const content = document.getElementById("sheetContent");
  if (!overlay || !content) return;

  const targetName = PRESETS[state.targetKey] ? PRESETS[state.targetKey].name : "Custom Water Profile";

  let html = `
    <div class="sheet-head">
      <img class="sh-logo" src="assets/logo_metal.png" alt="Graco's Brewing Logo">
      <div>
        <h3 class="sh-title">Graco's Water Lab · Brew Day Sheet</h3>
        <div class="sh-meta">Target: <b>${targetName}</b> | Date: ${new Date().toLocaleDateString()}</div>
      </div>
    </div>

    <div class="vessel-h">
      MASH TUN ADDITIONS (${state.mashVol} ${state.unit === 'us' ? 'GAL' : 'L'})
    </div>
  `;

  Object.keys(state.dosages.mash).forEach(k => {
    const amt = state.dosages.mash[k];
    if (amt > 0 && SALTS[k]) {
      html += `
        <label class="check-item">
          <input type="checkbox">
          <div class="amt">${amt} <span>g</span></div>
          <div class="txt">
            ${SALTS[k].name} (${SALTS[k].formula})
            <small>Stir into mash water prior to dough-in</small>
          </div>
        </label>
      `;
    }
  });

  if (state.dosages.mashAcidMl > 0) {
    const acidName = state.acidType === "lactic88" ? "Lactic Acid 88%" : "Phosphoric Acid 85%";
    html += `
      <label class="check-item">
        <input type="checkbox">
        <div class="amt">${state.dosages.mashAcidMl} <span>mL</span></div>
        <div class="txt">
          ${acidName}
          <small>Target Mash pH: ${state.targetMashPh}</small>
        </div>
      </label>
    `;
  }

  if (!state.noSparge) {
    html += `
      <div class="vessel-h" style="margin-top:24px;">
        SPARGE TANK ADDITIONS (${state.spargeVol} ${state.unit === 'us' ? 'GAL' : 'L'})
      </div>
    `;

    Object.keys(state.dosages.sparge).forEach(k => {
      const amt = state.dosages.sparge[k];
      if (amt > 0 && SALTS[k]) {
        html += `
          <label class="check-item">
            <input type="checkbox">
            <div class="amt">${amt} <span>g</span></div>
            <div class="txt">
              ${SALTS[k].name} (${SALTS[k].formula})
              <small>Stir into hot sparge water</small>
            </div>
          </label>
        `;
      }
    });

    if (state.dosages.spargeAcidMl > 0) {
      const acidName = state.acidType === "lactic88" ? "Lactic Acid 88%" : "Phosphoric Acid 85%";
      html += `
        <label class="check-item">
          <input type="checkbox">
          <div class="amt">${state.dosages.spargeAcidMl} <span>mL</span></div>
          <div class="txt">
            ${acidName}
            <small>Acidify sparge water to pH &lt; 5.80</small>
          </div>
        </label>
      `;
    }
  }

  content.innerHTML = html;
  overlay.hidden = false;
}

function closeBrewSheet() {
  const overlay = document.getElementById("sheetOverlay");
  if (overlay) overlay.hidden = true;
}

// Save Recipe CSV
function saveRecipeCsv() {
  const lines = [
    ["Parameter", "Value"],
    ["Recipe Target", PRESETS[state.targetKey] ? PRESETS[state.targetKey].name : state.targetKey],
    ["Unit System", state.unit],
    ["Mash Volume", state.mashVol],
    ["Sparge Volume", state.noSparge ? 0 : state.spargeVol],
    ["Target Mash pH", state.targetMashPh],
    ["RO Dilution Pct", state.roRatio],
    ["Source Ca", state.sourceIons.ca],
    ["Source Mg", state.sourceIons.mg],
    ["Source Na", state.sourceIons.na],
    ["Source SO4", state.sourceIons.so4],
    ["Source Cl", state.sourceIons.cl],
    ["Source HCO3", state.sourceIons.hco3]
  ];

  const csvContent = "data:text/csv;charset=utf-8," + lines.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Graco_Water_Lab_Recipe_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Load Recipe CSV
function loadRecipeCsv(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    const lines = text.split("\n");
    lines.forEach(line => {
      const parts = line.split(",");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts[1].trim();
        if (key === "Mash Volume") state.mashVol = parseFloat(val) || 4.0;
        if (key === "Sparge Volume") state.spargeVol = parseFloat(val) || 3.5;
        if (key === "RO Dilution Pct") state.roRatio = parseFloat(val) || 0;
      }
    });
    document.getElementById("mashVol").value = state.mashVol;
    document.getElementById("spargeVol").value = state.spargeVol;
    document.getElementById("roSlider").value = state.roRatio;
    document.getElementById("roVal").textContent = `${state.roRatio}%`;
    calculateAll();
  };
  reader.readAsText(file);
}
