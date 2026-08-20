// Graco's Water Lab - Application Logic & Calculation Engine

// Book-backed Preset Target Profiles with Specific Target Mash pH Values
const PRESETS = {
  "custom": {
    name: "\u2605 Custom Target Profile (User Defined)",
    book: "User Custom",
    ions: { ca: 100, mg: 10, na: 15, so4: 100, cl: 100, hco3: 50 },
    ph: 5.25,
    note: "Editable custom profile \u2014 type any target ion PPM values into the fields below."
  },
  "janish_hazy_neipa": {
    name: "Janish Juicy Hazy IPA / NEIPA",
    book: "The New IPA (Scott Janish)",
    ions: { ca: 125, mg: 10, na: 15, so4: 75, cl: 175, hco3: 40 },
    ph: 5.25,
    note: "Scott Janish (The New IPA): Target 5.25 mash pH. Lower mash pH compensates for the +0.15\u20130.25 pH rise caused by heavy dry hopping, preventing harsh polyphenolic astringency."
  },
  "janish_west_coast": {
    name: "Janish Crisp West Coast IPA",
    book: "The New IPA (Scott Janish)",
    ions: { ca: 110, mg: 12, na: 15, so4: 250, cl: 60, hco3: 35 },
    ph: 5.20,
    note: "Scott Janish (The New IPA): Target 5.20 mash pH for maximum beta-amylase attenuation, clean sharp hop bitterness, and quick, crisp finish."
  },
  "fat_head_ipa": {
    name: "Fat Head IPA",
    book: "Commercial IPA Benchmark",
    ions: { ca: 162, mg: 8.5, na: 21, so4: 285, cl: 23.5, hco3: 104 },
    ph: 5.20,
    note: "Scott Janish / West Coast IPA Model: Target 5.20 mash pH with high sulfate (285 ppm) for aggressive, sharp hop crispness."
  },
  "fidens_neipa": {
    name: "IPA #1 NEIPA Fidens",
    book: "Pro NEIPA Benchmark",
    ions: { ca: 124, mg: 3, na: 10, so4: 75, cl: 125, hco3: 0 },
    ph: 5.25,
    note: "Scott Janish NEIPA Model: Target 5.25 mash pH with elevated chloride (125 ppm) for soft mouthfeel and hop oil expression."
  },
  "julius_ipa": {
    name: "IPA #2 Julius",
    book: "Tree House Benchmark",
    ions: { ca: 15, mg: 26, na: 78, so4: 140, cl: 120, hco3: 0 },
    ph: 5.25,
    note: "Scott Janish Model: Target 5.25 mash pH. Balanced sulfate/chloride ratio for rounded mouthfeel and juicy aromatics."
  },
  "all_stars_west_coast": {
    name: "IPA #3 Homebrew All Stars (West Coast IPA)",
    book: "Homebrew All Stars",
    ions: { ca: 110, mg: 18, na: 17, so4: 352, cl: 50, hco3: 0 },
    ph: 5.20,
    note: "Scott Janish West Coast Model: Target 5.20 mash pH. Extreme sulfate (352 ppm) for intense dry hop bite."
  },
  "gold_nhc_2024": {
    name: "IPA gold NHC 2024",
    book: "NHC 2024 Gold Medal",
    ions: { ca: 83, mg: 8, na: 13, so4: 155, cl: 67, hco3: 2 },
    ph: 5.25,
    note: "NHC Gold Medal Model: Target 5.25 mash pH for clean hop brightness and balanced malt body."
  },
  "trillium_apa": {
    name: "NE APA #1/Trillium",
    book: "Trillium Benchmark",
    ions: { ca: 97, mg: 5, na: 15, so4: 61, cl: 128, hco3: 0 },
    ph: 5.28,
    note: "Scott Janish NEIPA Model: Target 5.28 mash pH for smooth mouthfeel and juicy hop expression."
  },
  "juicy_bits": {
    name: "Juicy Bits water profile",
    book: "WeldWerks Benchmark",
    ions: { ca: 125, mg: 8, na: 21, so4: 75, cl: 175, hco3: 104 },
    ph: 5.25,
    note: "Scott Janish NEIPA Model: Target 5.25 mash pH. High chloride (175 ppm) for pillowy soft hazy IPA texture."
  },
  "noonan_pilsen_soft": {
    name: "Bohemian / Pilsen Ultra-Soft",
    book: "Lager Brewing (Greg Noonan)",
    ions: { ca: 7, mg: 2, na: 4, so4: 6, cl: 6, hco3: 14 },
    ph: 5.25,
    note: "Greg Noonan (Lager Brewing): Target 5.25 mash pH for pale lagers. Essential for enzymatic conversion, crisp maltiness, and delicate Saaz hop balance."
  },
  "pale_lager_perplexity": {
    name: "Pale lager perplexity",
    book: "Lager Brewing (Greg Noonan)",
    ions: { ca: 55, mg: 3, na: 12, so4: 62, cl: 65, hco3: 23 },
    ph: 5.25,
    note: "Greg Noonan (Lager Brewing): Target 5.25 mash pH for crisp, clean attenuation and bright pale lager clarity."
  },
  "light_and_hoppy": {
    name: "Light & Hoppy",
    book: "Lager / Session IPA Benchmark",
    ions: { ca: 75, mg: 5, na: 10, so4: 150, cl: 50, hco3: 0 },
    ph: 5.25,
    note: "Greg Noonan / Scott Janish Model: Target 5.25 mash pH for hoppy session ales and crisp hoppy lagers."
  },
  "dark_lager_perplexity": {
    name: "Dark lager perplexity",
    book: "Lager Brewing & Water (Noonan & Palmer)",
    ions: { ca: 57, mg: 4, na: 55, so4: 45, cl: 67, hco3: 165 },
    ph: 5.40,
    note: "Greg Noonan & John Palmer: Target 5.40 mash pH for dark lagers. Higher bicarbonate buffers roasted malts, preventing sour acrid roast flavors."
  },
  "daniels_burton": {
    name: "Burton-on-Trent Historic Pale Ale",
    book: "Designing Great Beers (Ray Daniels)",
    ions: { ca: 275, mg: 40, na: 25, so4: 610, cl: 35, hco3: 270 },
    ph: 5.30,
    note: "Ray Daniels (Designing Great Beers): Target 5.30 mash pH. High calcium reacts with malt phosphate to lower mash pH despite high bicarbonate."
  },
  "palmer_yellow_balanced": {
    name: "Palmer Balanced Yellow Ale",
    book: "Water (John Palmer)",
    ions: { ca: 50, mg: 10, na: 15, so4: 80, cl: 60, hco3: 40 },
    ph: 5.35,
    note: "John Palmer (Water): Target 5.35 mash pH. Standard baseline for balanced pale and amber ales."
  }
};

// Source Water Presets
const SOURCE_PRESETS = {
  "my_water": { ca: 50, mg: 13, na: 17, so4: 42, cl: 27, hco3: 173 },
  "custom": { ca: 60, mg: 8, na: 20, so4: 50, cl: 35, hco3: 110 },
  "moderate": { ca: 60, mg: 8, na: 20, so4: 50, cl: 35, hco3: 110 },
  "ro": { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 },
  "soft": { ca: 20, mg: 4, na: 8, so4: 15, cl: 12, hco3: 45 },
  "hard": { ca: 110, mg: 25, na: 45, so4: 140, cl: 80, hco3: 240 }
};

// Salt Contributions in PPM per Gram per US Gallon
const SALTS = {
  gypsum: { name: "Gypsum", formula: "CaSO\u2084\u00b72H\u2082O", ca: 61.5, so4: 147.4, mg: 0, na: 0, cl: 0, hco3: 0, penalty: 0.15 },
  cacl2:  { name: "Calcium Chloride", formula: "CaCl\u2082\u00b72H\u2082O", ca: 72.0, cl: 127.4, mg: 0, na: 0, so4: 0, hco3: 0, penalty: 0.15 },
  epsom:  { name: "Epsom Salt", formula: "MgSO\u2084\u00b77H\u2082O", mg: 26.1, so4: 103.0, ca: 0, na: 0, cl: 0, hco3: 0, penalty: 0.3 },
  baking: { name: "Baking Soda", formula: "NaHCO\u2083", na: 72.3, hco3: 191.9, ca: 0, mg: 0, so4: 0, cl: 0, penalty: 4.0 },
  mgcl2:  { name: "Magnesium Chloride", formula: "MgCl\u2082\u00b76H\u2082O", mg: 31.6, cl: 92.3, ca: 0, na: 0, so4: 0, hco3: 0, penalty: 2.0 },
  salt:   { name: "Pickling Salt", formula: "NaCl", na: 103.9, cl: 160.3, ca: 0, mg: 0, so4: 0, hco3: 0, penalty: 2.5 },
  lime:   { name: "Slaked Lime", formula: "Ca(OH)\u2082", ca: 143.0, hco3: 435.0, mg: 0, na: 0, so4: 0, cl: 0, penalty: 5.0 }
};

// Malt Database reference based on "Malt: Discovering Malt" by John Mallett
const MALT_DATABASE = [
  {
    category: "Standard Processed Base Malts",
    malts: [
      { name: "Pilsner Malt", color: 1.6, type: "base", desc: "Very pale, clean, sweet maltiness (Mallett Ch 9)" },
      { name: "2-Row Pale Malt", color: 1.8, type: "base", desc: "Versatile North American base malt (Mallett Ch 9)" },
      { name: "6-Row Pale Malt", color: 1.8, type: "base", desc: "High diastatic power for adjunct mashing (Mallett Ch 9)" },
      { name: "Pale Ale Malt", color: 3.5, type: "base", desc: "Rich golden hue, biscuit & nutty notes (Mallett Ch 9)" },
      { name: "Maris Otter Heritage Base", color: 3.5, type: "base", desc: "Classic English heirloom pale ale malt (Mallett Ch 9, 12)" },
      { name: "Golden Promise Heritage Base", color: 3.0, type: "base", desc: "Scottish heirloom pale base malt (Mallett Ch 9, 12)" },
      { name: "Vienna Malt", color: 4.0, type: "base", desc: "Rich orange color, grainy-sweet malty flavor (Mallett Ch 9)" },
      { name: "Munich Light (10L)", color: 10.0, type: "base", desc: "Deep golden color, rich bread crust aroma (Mallett Ch 9)" },
      { name: "Munich Dark (20L)", color: 20.0, type: "base", desc: "Dark amber color, intense maltiness (Mallett Ch 9)" }
    ]
  },
  {
    category: "High-Dried & Kilned Specialty Malts",
    malts: [
      { name: "Melanoidin / Aromatic Malt", color: 25.0, type: "base", desc: "Honey sweetness & melanoidin aroma (Mallett Ch 6, 9)" },
      { name: "Biscuit Malt", color: 25.0, type: "crystal", desc: "Warm baked bread and biscuit aroma (Mallett Ch 6)" },
      { name: "Victory Malt", color: 28.0, type: "crystal", desc: "Nutty and toasted biscuit flavors (Mallett Ch 6)" },
      { name: "Amber Malt", color: 35.0, type: "crystal", desc: "Dry toasted, light coffee flavor (Mallett Ch 6)" },
      { name: "Brown Malt", color: 65.0, type: "crystal", desc: "Rich dark toast and chocolate notes (Mallett Ch 6)" }
    ]
  },
  {
    category: "Caramel & Crystal Malts (Drum Stewed/Roasted)",
    malts: [
      { name: "Carapils / Dextrin Malt", color: 1.5, type: "crystal", desc: "Enhances body & head retention (Mallett Ch 6)" },
      { name: "Caramel / Crystal 10L", color: 10.0, type: "crystal", desc: "Mild honey & light caramel sweetness (Mallett Ch 6, 9)" },
      { name: "Caramel / Crystal 20L", color: 20.0, type: "crystal", desc: "Subtle caramel sweetness & golden hue (Mallett Ch 6, 9)" },
      { name: "Caramel / Crystal 40L", color: 40.0, type: "crystal", desc: "Rich caramel & toasted sweet flavors (Mallett Ch 6, 9)" },
      { name: "Caramel / Crystal 60L", color: 60.0, type: "crystal", desc: "Classic reddish amber color & full caramel (Mallett Ch 6, 9)" },
      { name: "Caramel / Crystal 80L", color: 80.0, type: "crystal", desc: "Deep red color, dark caramel & plum (Mallett Ch 6, 9)" },
      { name: "Caramel / Crystal 120L", color: 120.0, type: "crystal", desc: "Dark copper color, raisin & dark sugar (Mallett Ch 6, 9)" },
      { name: "Special B (Dark Crystal)", color: 150.0, type: "crystal", desc: "Heavy dark fruit, raisin & caramel (Mallett Ch 6)" }
    ]
  },
  {
    category: "Roasted Malts & Grains (Drum Roasted)",
    malts: [
      { name: "Pale Chocolate Malt", color: 200.0, type: "roast", desc: "Smooth nutty roast and light coffee (Mallett Ch 6, 9)" },
      { name: "Chocolate Malt", color: 350.0, type: "roast", desc: "Rich dark chocolate & espresso notes (Mallett Ch 6, 9)" },
      { name: "Black Patent / Black Malt", color: 500.0, type: "roast", desc: "Sharp roasted bitterness & deep color (Mallett Ch 6, 9)" },
      { name: "Roasted Barley (Unmalted)", color: 450.0, type: "roast", desc: "Dry coffee roast aroma, stout staple (Mallett Ch 6, 9)" },
      { name: "Carafa Special (De-husked Roast)", color: 400.0, type: "roast", desc: "Smooth roast character without harsh husks (Mallett Ch 6)" }
    ]
  },
  {
    category: "Alternate Grains & Flaked Adjuncts",
    malts: [
      { name: "Malted Wheat", color: 2.0, type: "base", desc: "Foam retention, crisp creamy mouthfeel (Mallett Ch 6, 9)" },
      { name: "Dark Wheat Malt", color: 9.0, type: "base", desc: "Malty wheat flavor with amber hue (Mallett Ch 6)" },
      { name: "Malted Rye", color: 3.5, type: "base", desc: "Spicy, dry & complex mouthfeel (Mallett Ch 6, 9)" },
      { name: "Malted Oats", color: 2.5, type: "base", desc: "Silky texture & smooth body (Mallett Ch 6, 9)" },
      { name: "Flaked Barley", color: 1.5, type: "base", desc: "Grainy flavor, enhances body & foam (Mallett Ch 6)" },
      { name: "Flaked Oats", color: 1.0, type: "base", desc: "Smooth velvet mouthfeel (Mallett Ch 6)" },
      { name: "Flaked Wheat", color: 1.5, type: "base", desc: "Crisp haze & head retention (Mallett Ch 6)" },
      { name: "Smoked / Peated Malt", color: 3.0, type: "base", desc: "Wood or peat smoke aromatics (Mallett Ch 6)" }
    ]
  },
  {
    category: "Process & Acid Malts",
    malts: [
      { name: "Acidulated / Acid Malt", color: 3.0, type: "acid", desc: "Contains ~1-2% organic lactic acid for mash pH control (Mallett Ch 6, 9)" }
    ]
  }
];

function initMaltMenu() {
  const selectEl = document.getElementById("maltMenuSelect");
  const datalistEl = document.getElementById("maltBookDatalist");
  if (!selectEl) return;

  selectEl.innerHTML = `<option value="">-- Select Malt from John Mallett's Book --</option>`;
  if (datalistEl) datalistEl.innerHTML = "";

  MALT_DATABASE.forEach(group => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.category;

    group.malts.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.name;
      opt.textContent = `${m.name} (${m.color}\u00b0L)`;
      optgroup.appendChild(opt);

      if (datalistEl) {
        const dOpt = document.createElement("option");
        dOpt.value = m.name;
        dOpt.textContent = `${m.color}\u00b0L - ${m.desc}`;
        datalistEl.appendChild(dOpt);
      }
    });

    selectEl.appendChild(optgroup);
  });
}

function findMaltByName(name) {
  if (!name) return null;
  const search = name.trim().toLowerCase();
  for (const cat of MALT_DATABASE) {
    for (const m of cat.malts) {
      if (m.name.toLowerCase() === search) return m;
    }
  }
  return null;
}

// Application State
let state = {
  unit: "us",
  recipeName: "Graco's Homebrew Batch",
  sourcePresetKey: "my_water",
  sourceIons: { ca: 50, mg: 13, na: 17, so4: 42, cl: 27, hco3: 173 },
  roRatio: 0,
  targetKey: "janish_hazy_neipa",
  mashVol: 4.0,
  spargeVol: 3.5,
  noSparge: false,
  targetMashPh: 5.25,
  targetSpargePh: 5.60,
  grains: [
    { name: "Maris Otter Heritage Base", weight: 9.0, color: 3.5, type: "base" },
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
  loadSavedCustomProfiles();
  initMaltMenu();
  setupEventListeners();
  populateSourcePresets();
  populatePresets();
  updateSourceInputs();
  renderGrainBill();
  calculateAll();
});

function setupEventListeners() {
  document.getElementById("btn-us")?.addEventListener("click", () => setUnit("us"));
  document.getElementById("btn-metric")?.addEventListener("click", () => setUnit("metric"));

  document.getElementById("sourcePreset")?.addEventListener("change", (e) => {
    const key = e.target.value;
    state.sourcePresetKey = key;
    if (SOURCE_PRESETS[key]) {
      state.sourceIons = { ...SOURCE_PRESETS[key] };
      updateSourceInputs();
      calculateAll();
    }
  });

  document.getElementById("saveSourceProfileBtn")?.addEventListener("click", saveCustomSourceProfile);

  const updateSourceFromConv = () => {
    const caInput = document.getElementById("convCaCO3Ca");
    const mgInput = document.getElementById("convCaCO3Mg");
    const hco3Input = document.getElementById("convCaCO3Hco3");
    const so4sInput = document.getElementById("convSO4S");
    
    if (caInput && caInput.value) document.getElementById("src_ca").value = (parseFloat(caInput.value) * 0.401).toFixed(1);
    if (mgInput && mgInput.value) document.getElementById("src_mg").value = (parseFloat(mgInput.value) * 0.243).toFixed(1);
    if (hco3Input && hco3Input.value) document.getElementById("src_hco3").value = (parseFloat(hco3Input.value) * 1.22).toFixed(1);
    if (so4sInput && so4sInput.value) document.getElementById("src_so4").value = (parseFloat(so4sInput.value) * 3.0).toFixed(1);
    
    ["ca", "mg", "na", "so4", "cl", "hco3"].forEach(ion => {
      const el = document.getElementById(`src_${ion}`);
      if (el) {
        state.sourceIons[ion] = parseFloat(el.value) || 0;
        if (state.sourcePresetKey === "custom") {
          SOURCE_PRESETS.custom[ion] = state.sourceIons[ion];
        }
      }
    });
    calculateAll();
  };

  ["convCaCO3Ca", "convCaCO3Mg", "convCaCO3Hco3", "convSO4S"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", updateSourceFromConv);
  });

  ["ca", "mg", "na", "so4", "cl", "hco3"].forEach(ion => {
    document.getElementById(`src_${ion}`)?.addEventListener("input", (e) => {
      state.sourceIons[ion] = parseFloat(e.target.value) || 0;
      if (state.sourcePresetKey === "custom") {
        SOURCE_PRESETS.custom[ion] = state.sourceIons[ion];
      }
      calculateAll();
    });
  });

  document.getElementById("saveTargetProfileBtn")?.addEventListener("click", saveCustomTargetProfile);

  ["ca", "mg", "na", "so4", "cl", "hco3"].forEach(ion => {
    document.getElementById(`tgt_${ion}`)?.addEventListener("input", (e) => {
      if (state.targetKey === "custom") {
        PRESETS.custom.ions[ion] = parseFloat(e.target.value) || 0;
        calculateAll();
      }
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
      const phInput = document.getElementById("targetMashPh");
      if (phInput) phInput.value = PRESETS[key].ph;

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
    state.targetMashPh = parseFloat(e.target.value) || 5.25;
    calculateAll();
  });
  document.getElementById("acidType")?.addEventListener("change", (e) => {
    state.acidType = e.target.value;
    calculateAll();
  });

  document.getElementById("addMaltFromMenuBtn")?.addEventListener("click", () => {
    const selectEl = document.getElementById("maltMenuSelect");
    const mName = selectEl ? selectEl.value : "";
    const mMatch = findMaltByName(mName);
    if (mMatch) {
      state.grains.push({ name: mMatch.name, weight: 1.0, color: mMatch.color, type: mMatch.type });
      renderGrainBill();
      calculateAll();
    } else {
      alert("Please select a malt from the book menu dropdown.");
    }
  });

  document.getElementById("addGrainBtn")?.addEventListener("click", () => {
    state.grains.push({ name: "2-Row Pale Malt", weight: 1.0, color: 1.8, type: "base" });
    renderGrainBill();
    calculateAll();
  });

  document.getElementById("calcBtn")?.addEventListener("click", () => {
    calculateAll();
  });

  document.getElementById("openSheetBtn")?.addEventListener("click", openBrewSheet);
  document.getElementById("closeSheetBtn")?.addEventListener("click", closeBrewSheet);

  document.getElementById("saveBeerXmlBtn")?.addEventListener("click", saveBeerXml);
  document.getElementById("loadBeerXmlInput")?.addEventListener("change", loadBeerXml);
}

function setUnit(u) {
  state.unit = u;
  document.getElementById("btn-us")?.setAttribute("aria-pressed", u === "us");
  document.getElementById("btn-metric")?.setAttribute("aria-pressed", u === "metric");
  document.getElementById("volUnitlbl").textContent = u === "us" ? "GAL" : "L";
  document.getElementById("grainUnitlbl").textContent = u === "us" ? "LB" : "KG";
  calculateAll();
}

function populateSourcePresets() {
  const sel = document.getElementById("sourcePreset");
  if (!sel) return;
  sel.innerHTML = `
    <option value="my_water">\u2605 My Water (Tap Profile)</option>
    <option value="custom">\u2605 Custom Source Water (User Defined)</option>
    <option value="moderate">Moderate Tap Water (Baseline)</option>
    <option value="ro">RO / Distilled Water (0 ppm)</option>
    <option value="soft">Soft Tap Water</option>
    <option value="hard">Hard Alkaline Tap Water</option>
  `;

  const saved = JSON.parse(localStorage.getItem("gracos_saved_source_profiles") || "[]");
  saved.forEach((p, i) => {
    const key = `user_src_${i}`;
    SOURCE_PRESETS[key] = { ca: p.ca, mg: p.mg, na: p.na, so4: p.so4, cl: p.cl, hco3: p.hco3 };
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = `\ud83d\udcbe ${p.name}`;
    sel.appendChild(opt);
  });

  sel.value = state.sourcePresetKey;
}

function populatePresets() {
  const sel = document.getElementById("targetPreset");
  if (!sel) return;
  sel.innerHTML = "";

  const savedTarget = JSON.parse(localStorage.getItem("gracos_saved_target_profiles") || "[]");
  savedTarget.forEach((p, i) => {
    const key = `user_tgt_${i}`;
    PRESETS[key] = {
      name: p.name,
      book: "User Saved",
      ions: { ca: p.ca, mg: p.mg, na: p.na, so4: p.so4, cl: p.cl, hco3: p.hco3 },
      ph: p.ph || 5.25,
      note: "Saved custom target profile."
    };
  });

  Object.keys(PRESETS).forEach(k => {
    const opt = document.createElement("option");
    opt.value = k;
    const author = PRESETS[k].book.split(' ')[0];
    opt.textContent = `[${author}] ${PRESETS[k].name} (Target ${PRESETS[k].ph} pH)`;
    sel.appendChild(opt);
  });
  sel.value = state.targetKey;
  updateTargetInputs();
}

function saveCustomSourceProfile() {
  const name = prompt("Enter a name for your Source Water Profile (e.g. My Clermont Well Water):");
  if (!name || !name.trim()) return;

  const profile = {
    name: name.trim(),
    ca: state.sourceIons.ca,
    mg: state.sourceIons.mg,
    na: state.sourceIons.na,
    so4: state.sourceIons.so4,
    cl: state.sourceIons.cl,
    hco3: state.sourceIons.hco3
  };

  const saved = JSON.parse(localStorage.getItem("gracos_saved_source_profiles") || "[]");
  saved.push(profile);
  localStorage.setItem("gracos_saved_source_profiles", JSON.stringify(saved));

  const key = `user_src_${saved.length - 1}`;
  SOURCE_PRESETS[key] = { ca: profile.ca, mg: profile.mg, na: profile.na, so4: profile.so4, cl: profile.cl, hco3: profile.hco3 };
  state.sourcePresetKey = key;

  populateSourcePresets();
  alert(`Saved source water profile "${profile.name}" to browser memory!`);
}

function saveCustomTargetProfile() {
  const name = prompt("Enter a name for your Target Water Profile (e.g. My Secret DIPA Target):");
  if (!name || !name.trim()) return;

  const currentIons = PRESETS[state.targetKey] ? PRESETS[state.targetKey].ions : state.sourceIons;

  const profile = {
    name: name.trim(),
    ca: currentIons.ca,
    mg: currentIons.mg,
    na: currentIons.na,
    so4: currentIons.so4,
    cl: currentIons.cl,
    hco3: currentIons.hco3,
    ph: state.targetMashPh
  };

  const saved = JSON.parse(localStorage.getItem("gracos_saved_target_profiles") || "[]");
  saved.push(profile);
  localStorage.setItem("gracos_saved_target_profiles", JSON.stringify(saved));

  populatePresets();
  alert(`Saved target water profile "${profile.name}" to browser memory!`);
}

function loadSavedCustomProfiles() {
}

function updateSourceInputs() {
  const isCustom = state.sourcePresetKey === "custom";
  ["ca", "mg", "na", "so4", "cl", "hco3"].forEach(ion => {
    const el = document.getElementById(`src_${ion}`);
    if (el) {
      el.value = state.sourceIons[ion];
      if (isCustom) {
        el.style.backgroundColor = "var(--copper-soft)";
        el.style.borderColor = "var(--copper)";
      } else {
        el.style.backgroundColor = "var(--bg)";
        el.style.borderColor = "var(--line-2)";
      }
    }
  });
}

function updateTargetInputs() {
  const p = PRESETS[state.targetKey];
  if (!p) return;

  const isCustom = state.targetKey === "custom";

  ["ca", "mg", "na", "so4", "cl", "hco3"].forEach(ion => {
    const el = document.getElementById(`tgt_${ion}`);
    if (el) {
      el.value = p.ions[ion];
      el.readOnly = !isCustom;
      if (isCustom) {
        el.style.backgroundColor = "var(--copper-soft)";
        el.style.borderColor = "var(--copper)";
      } else {
        el.style.backgroundColor = "var(--bg)";
        el.style.borderColor = "var(--line-2)";
      }
    }
  });

  const noteEl = document.getElementById("bookTargetNote");
  if (noteEl) {
    noteEl.innerHTML = `<b>Ref: ${p.book}</b> (Target <b>${p.ph} pH</b>) \u2014 ${p.note}`;
  }
}

function renderGrainBill() {
  const container = document.getElementById("grainList");
  if (!container) return;
  container.innerHTML = "";

  state.grains.forEach((g, idx) => {
    const div = document.createElement("div");
    div.className = "grainrow";
    div.innerHTML = `
      <input type="text" list="maltBookDatalist" value="${escapeXml(g.name)}" placeholder="Malt Name" oninput="onMaltNameInput(${idx}, this.value)" onchange="updateGrain(${idx}, 'name', this.value)">
      <input type="number" id="grain_weight_${idx}" step="0.1" value="${g.weight}" onchange="updateGrain(${idx}, 'weight', parseFloat(this.value)||0)">
      <input type="number" id="grain_color_${idx}" step="0.1" value="${g.color}" onchange="updateGrain(${idx}, 'color', parseFloat(this.value)||0)">
      <select id="grain_type_${idx}" onchange="updateGrain(${idx}, 'type', this.value)">
        <option value="base" ${g.type==='base'?'selected':''}>Base</option>
        <option value="crystal" ${g.type==='crystal'?'selected':''}>Crystal</option>
        <option value="roast" ${g.type==='roast'?'selected':''}>Roast</option>
        <option value="acid" ${g.type==='acid'?'selected':''}>Acid</option>
      </select>
      <button class="del" onclick="removeGrain(${idx})">\u00d7</button>
    `;
    container.appendChild(div);
  });
}

window.onMaltNameInput = function(idx, val) {
  if (state.grains[idx]) {
    state.grains[idx].name = val;
    const match = findMaltByName(val);
    if (match) {
      state.grains[idx].color = match.color;
      state.grains[idx].type = match.type;

      const colorInput = document.getElementById(`grain_color_${idx}`);
      const typeSelect = document.getElementById(`grain_type_${idx}`);
      if (colorInput) colorInput.value = match.color;
      if (typeSelect) typeSelect.value = match.type;
    }
    calculateAll();
  }
};

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
    if (SALTS[k]) err += dosages[k] * SALTS[k].penalty * 1.0;
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

// ============================================================
// Mash pH model adapted from Bru'n Water 1.25 (Martin Brungard).
// Each grain contributes acidity (mEq) by TYPE + COLOR; that load
// is neutralized by the water's Kolbach residual alkalinity.
// Distilled-water mash sits at 5.76; each unit of net acidity per
// liter shifts pH by -0.17.
//
// AWARENESS ONLY: still an estimate, not a full ionic buffering
// model. Verify actual mash pH with a calibrated pH meter before
// finalizing a recipe.
// ============================================================
function estimateMashPh(ppm, grains, mashVolGal) {
  let grainAcid_mEq = 0;
  let totalWeightLb = 0;

  grains.forEach(g => {
    const wLb = state.unit === "metric" ? g.weight * 2.20462 : g.weight;
    const L = g.color;
    totalWeightLb += wLb;

    if (g.type === "acid") {
      grainAcid_mEq += wLb * 95;               // acid malt: strong lactic load
    } else if (g.type === "roast") {
      grainAcid_mEq += wLb * 38;               // roast: flat, color-independent
    } else if (g.type === "crystal") {
      grainAcid_mEq += wLb * (0.21 * L + 2.5); // crystal: color-scaled + base
    } else {
      grainAcid_mEq += wLb * (0.28 * L);       // base malt: color-scaled
    }
  });

  if (totalWeightLb <= 0) return 5.76;

  const mashL = mashVolGal * 3.785;

  // Water alkalinity as CaCO3, offset by Ca/Mg hardness (Kolbach RA).
  const alk_CaCO3 = ppm.hco3 * 0.8202;
  const RA = alk_CaCO3 - (ppm.ca / 1.4 + ppm.mg / 1.7);
  const alk_mEq = (RA / 50) * mashL;

  const netProton = (grainAcid_mEq - alk_mEq) / mashL;
  const estPh = 5.76 - 0.17 * netProton;

  return Math.round(Math.min(6.0, Math.max(4.0, estPh)) * 100) / 100;
}

// ============================================================
// Mash acid dosing, carbonate-equilibrium model adapted from
// Bru'n Water 1.25 (Martin Brungard) -- same carbonic-acid model
// used for the sparge acid calculation below (see
// calcSpargeAcidCarbonate / carbonateFractions), applied here so
// mash and sparge acid dosing are calculated consistently.
//
// Previously this function accepted an `alkPpm` parameter but
// never used it, applying a flat 25 mEq/pH-unit/gallon constant
// regardless of the water's actual bicarbonate buffering capacity.
// That meant two waters with very different alkalinity would get
// identical acid recommendations for the same pH gap. This version
// actually uses the water's alkalinity (as CaCO3 ppm) to compute
// the real proton demand needed to shift from currentPh to targetPh.
// ============================================================
function calcAcidMl(currentPh, targetPh, mashVolGal, alkPpmCaCO3) {
  if (currentPh <= targetPh || mashVolGal <= 0 || alkPpmCaCO3 <= 0) return 0;

  const o = carbonateFractions(currentPh);
  const b = carbonateFractions(4.3);     // standard alkalinity endpoint
  const c = carbonateFractions(targetPh);

  const denom = (b.f1 - o.f1) + (o.f3 - b.f3);
  if (denom === 0) return 0;

  const Ct = (alkPpmCaCO3 / 50) / denom;                // mmol/L total carbonate
  const meqPerL = Ct * ((c.f1 - o.f1) + (o.f3 - c.f3));  // proton demand current->target
  if (meqPerL <= 0) return 0;

  const volL = mashVolGal * 3.785;
  const meqTotal = meqPerL * volL;

  // Same acid strengths (mEq per mL) used for the sparge acid calc.
  const meqPerMl = state.acidType === "lactic88" ? 11.6 : 15.2;
  return Math.round((meqTotal / meqPerMl) * 10) / 10;
}

function estimateSpargePh(sourceHco3) {
  const alk = sourceHco3 * 0.82;
  return Math.round((5.60 + alk * 0.0018) * 100) / 100;
}

// ============================================================
// Sparge water acidification, carbonate-equilibrium model
// adapted from Bru'n Water 1.25 (Martin Brungard).
// Uses carbonic-acid pK1=6.38, pK2=10.33 and a 4.3 titration
// endpoint to derive total carbonate from starting alkalinity,
// then the proton demand to shift from start pH to target pH.
// Far more accurate than a flat linear estimate, and self-zeros
// on RO / low-alkalinity water.
// ============================================================
function carbonateFractions(pH) {
  const r1 = Math.pow(10, pH - 6.38);   // H2CO3 <-> HCO3-
  const r2 = Math.pow(10, pH - 10.33);  // HCO3- <-> CO3--
  const d = 1 + r1 + r1 * r2;
  return { f1: 1 / d, f2: r1 / d, f3: (r1 * r2) / d };
}

// Returns mL of acid needed to bring sparge water from startPh
// down to targetPh, given source alkalinity (as CaCO3 ppm)
// and volume in US gallons.
function calcSpargeAcidCarbonate(alkPpmCaCO3, startPh, targetPh, volGal) {
  if (volGal <= 0 || alkPpmCaCO3 <= 0 || startPh <= targetPh) return 0;

  const o = carbonateFractions(startPh);
  const b = carbonateFractions(4.3);     // standard alkalinity endpoint
  const c = carbonateFractions(targetPh);

  const denom = (b.f1 - o.f1) + (o.f3 - b.f3);
  if (denom === 0) return 0;

  const Ct = (alkPpmCaCO3 / 50) / denom;               // mmol/L total carbonate
  const meqPerL = Ct * ((c.f1 - o.f1) + (o.f3 - c.f3)); // proton demand start->target
  if (meqPerL <= 0) return 0;

  const volL = volGal * 3.785;
  const meqTotal = meqPerL * volL;

  // Same acid strengths (mEq per mL) used for the mash acid calc.
  const meqPerMl = state.acidType === "lactic88" ? 11.6 : 15.2;
  return Math.round((meqTotal / meqPerMl) * 10) / 10;
}

// Main Calculation Loop
function calculateAll() {
  const effSource = getEffectiveSource();
  
  // Ion Balance Check
  const cations = (effSource.ca / 20.039) + (effSource.mg / 12.152) + (effSource.na / 22.99);
  const anions = (effSource.so4 / 48.03) + (effSource.cl / 35.45) + (effSource.hco3 / 61.016);
  const diff = Math.abs(cations - anions);
  const ionBanner = document.getElementById("ionBalanceWarning");
  if (ionBanner) {
    if (diff > 0.5) {
      ionBanner.style.display = "block";
      ionBanner.innerHTML = `\u26a0\ufe0f <b>Ion Balance Warning</b>: Cations (${cations.toFixed(1)} meq/L) and Anions (${anions.toFixed(1)} meq/L) differ by >0.5 meq/L. Check your water report for typos.`;
    } else {
      ionBanner.style.display = "none";
    }
  }

  const targetObj = PRESETS[state.targetKey] ? PRESETS[state.targetKey].ions : PRESETS["janish_hazy_neipa"].ions;

  const mashGal = state.unit === "metric" ? state.mashVol * 0.264172 : state.mashVol;
  const spargeGal = state.noSparge ? 0 : (state.unit === "metric" ? state.spargeVol * 0.264172 : state.spargeVol);

  const mashDosages = solveSalts(effSource, targetObj, mashGal);
  const spargeDosages = state.noSparge ? {} : solveSalts(effSource, targetObj, spargeGal);

  state.dosages.mash = mashDosages;
  state.dosages.sparge = spargeDosages;

  const mashPpm = computeResultingPpm(mashDosages, effSource, mashGal);
  const totalGal = mashGal + spargeGal;

  const mergedDosages = {};
  Object.keys(mashDosages).forEach(k => { mergedDosages[k] = (mergedDosages[k] || 0) + mashDosages[k]; });
  Object.keys(spargeDosages).forEach(k => { mergedDosages[k] = (mergedDosages[k] || 0) + spargeDosages[k]; });
  const combinedPpm = computeResultingPpm(mergedDosages, effSource, totalGal > 0 ? totalGal : 1);
  const combinedTds = combinedPpm.ca + combinedPpm.mg + combinedPpm.na + combinedPpm.so4 + combinedPpm.cl + combinedPpm.hco3;
  const tdsBadge = document.getElementById("tdsEstimate");
  if (tdsBadge) {
    tdsBadge.innerHTML = `ESTIMATED TDS: <b>${combinedTds.toFixed(0)} PPM</b>`;
  }

  const estPh = estimateMashPh(mashPpm, state.grains, mashGal);
  const mashAcid = calcAcidMl(estPh, state.targetMashPh, mashGal, mashPpm.hco3 * 0.8202);

  const currentSpargePh = estimateSpargePh(effSource.hco3);
  const spargeAlkPpm = effSource.hco3 * 0.8202;
  const spargeAcid = state.noSparge ? 0 : calcSpargeAcidCarbonate(spargeAlkPpm, currentSpargePh, state.targetSpargePh, spargeGal);

  state.dosages.mashAcidMl = mashAcid;
  state.dosages.spargeAcidMl = spargeAcid;

  // Kettle Alkalinity Warning Check
  const spargeAcidMeq = spargeAcid * (state.acidType === "lactic88" ? 11.6 : 15.2);
  const spargeAlkMeq = (spargeAlkPpm / 50.04) * (spargeGal * 3.785);
  let residualAlkMeq = spargeAlkMeq - spargeAcidMeq;
  if (residualAlkMeq < 0) residualAlkMeq = 0;
  const residualAlkPpm = spargeGal > 0 ? (residualAlkMeq / (spargeGal * 3.785)) * 50.04 : 0;
  
  const kettleBanner = document.getElementById("kettleAlkalinityWarning");
  if (kettleBanner && !state.noSparge) {
    if (residualAlkPpm > 25) {
      kettleBanner.style.display = "block";
      kettleBanner.innerHTML = `\u26a0\ufe0f <b>Sparge Alkalinity High</b>: Residual alkalinity is ${residualAlkPpm.toFixed(1)} ppm as CaCO\u2083. Bru'n Water recommends < 25 ppm to prevent tannin extraction. Consider a lower Target Sparge pH or more acid.`;
    } else {
      kettleBanner.style.display = "none";
    }
  } else if (kettleBanner) {
    kettleBanner.style.display = "none";
  }

  renderOutputs(combinedPpm, targetObj, mashPpm, estPh, mashAcid, spargeAcid, mashDosages, spargeDosages);
}

function renderOutputs(combinedPpm, targetObj, mashPpm, estPh, mashAcid, spargeAcid, mashDosages, spargeDosages) {
  const ratio = combinedPpm.cl > 0 ? (combinedPpm.so4 / combinedPpm.cl).toFixed(2) : "N/A";
  document.getElementById("so4clRatio").textContent = ratio;

  let ratioDesc = "";
  if (ratio > 2.5) ratioDesc = "<b>Very Dry & Crisp</b> \u2014 High sulfate accentuates hop bitterness & crisp finish (Scott Janish & Ray Daniels Burton profile).";
  else if (ratio >= 1.5) ratioDesc = "<b>Slightly Dry / Balanced</b> \u2014 Suitable for Pale Ales and German Pilsners.";
  else if (ratio >= 0.8) ratioDesc = "<b>Balanced Malt & Hops</b> \u2014 Ideal baseline for lagers and amber ales.";
  else ratioDesc = "<b>Very Soft & Full</b> \u2014 High chloride enhances pillowy mouthfeel, juicy hop oils, and haze (Scott Janish NEIPA profile).";

  document.getElementById("ratioDesc").innerHTML = ratioDesc;

  renderYeastHealthNotes(combinedPpm);

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

  document.getElementById("phVal").textContent = estPh.toFixed(2);
  const markEl = document.getElementById("phMark");
  if (markEl) {
    const pct = Math.min(95, Math.max(5, ((estPh - 4.8) / (6.2 - 4.8)) * 100));
    markEl.style.left = `${pct}%`;
  }

  // Suggested-acid readout: shows the gap between the estimated mash pH
  // (from the Bru'n Water grain model) and the target, plus the acid dose
  // to close it. Falls back to guidance text when no acid is needed.
  const suggEl = document.getElementById("phSuggestion");
  if (suggEl) {
    const acidName = state.acidType === "lactic88" ? "Lactic Acid 88%" : "Phosphoric Acid 85%";
    const gap = Math.round((estPh - state.targetMashPh) * 100) / 100;
    if (mashAcid > 0) {
      suggEl.innerHTML = `\ud83e\uddea Est. mash pH <b>${estPh.toFixed(2)}</b> is <b>${gap > 0 ? "+" + gap : gap}</b> above target <b>${state.targetMashPh}</b>. Add <b>${mashAcid} mL ${acidName}</b> to the mash to hit target.`;
    } else if (estPh < state.targetMashPh - 0.03) {
      suggEl.innerHTML = `\u2139\ufe0f Est. mash pH <b>${estPh.toFixed(2)}</b> is already <b>below</b> target <b>${state.targetMashPh}</b>. No acid needed \u2014 consider a touch more alkalinity (baking soda) or less acid malt.`;
    } else {
      suggEl.innerHTML = `\u2705 Est. mash pH <b>${estPh.toFixed(2)}</b> is on target (<b>${state.targetMashPh}</b>). No acid addition required.`;
    }
  }

  renderDoseCard("mashDoses", mashDosages, mashAcid, "Mash Tun");
  if (!state.noSparge) {
    renderDoseCard("spargeDoses", spargeDosages, spargeAcid, "Sparge Tank");
  } else {
    const spargeCard = document.getElementById("spargeDosesCard");
    if (spargeCard) spargeCard.style.display = "none";
  }
}

function renderYeastHealthNotes(ppm) {
  const container = document.getElementById("yeastHealthNote");
  if (!container) return;

  let notes = [];
  if (ppm.ca < 50) {
    notes.push("\u26a0\ufe0f <b>Low Calcium (&lt; 50 ppm)</b>: <i>Yeast (White & Zainasheff)</i> recommends at least 50 ppm Ca\u00b2\u207a for yeast cell wall integrity, mash enzyme protection, and clean flocculation.");
  } else {
    notes.push("\u2705 <b>Calcium (&gt; 50 ppm)</b>: Adequate Ca\u00b2\u207a for yeast flocculation & mash alpha-amylase stability.");
  }

  if (ppm.mg < 10) {
    notes.push("\u26a0\ufe0f <b>Low Magnesium (&lt; 10 ppm)</b>: Mg\u00b2\u207a acts as an essential enzyme co-factor during yeast metabolism. Consider Epsom salt addition.");
  } else if (ppm.mg > 35) {
    notes.push("\u26a0\ufe0f <b>High Magnesium (&gt; 35 ppm)</b>: Mg\u00b2\u207a above 30 ppm can impart sour or astringent metallic bitterness.");
  }

  if (ppm.na > 150) {
    notes.push("\u26a0\ufe0f <b>High Sodium (&gt; 150 ppm)</b>: Elevated Na\u207a can taste harsh or overly salty when combined with high sulfate.");
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
        <div class="dg">${amt} <span>g</span></div>
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

function openBrewSheet() {
  const overlay = document.getElementById("sheetOverlay");
  const content = document.getElementById("sheetContent");
  if (!overlay || !content) return;

  const targetName = PRESETS[state.targetKey] ? PRESETS[state.targetKey].name : "Custom Water Profile";

  let html = `
    <div class="sheet-head">
      <img class="sh-logo" src="assets/logo_metal.png" alt="Graco's Brewing Logo">
      <div>
        <h3 class="sh-title">Graco's Water Lab \u00b7 Brew Day Sheet</h3>
        <div class="sh-meta">Recipe: <b>${escapeXml(state.recipeName)}</b> | Target: <b>${targetName}</b> | Date: ${new Date().toLocaleDateString()}</div>
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
            <small>Acidify sparge water to pH ${state.targetSpargePh}</small>
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

function saveBeerXml() {
  const targetName = PRESETS[state.targetKey] ? PRESETS[state.targetKey].name : state.targetKey;

  let xml = `<?xml version="1.0" encoding="ISO-8859-1"?>\n<RECIPES>\n<RECIPE>\n`;
  xml += ` <NAME>${escapeXml(state.recipeName)}</NAME>\n`;
  xml += ` <VERSION>1</VERSION>\n`;
  xml += ` <TYPE>All Grain</TYPE>\n`;
  xml += ` <BREWER>Graco's Brewing</BREWER>\n`;

  const batchL = state.unit === "us" ? (state.mashVol + state.spargeVol) * 3.78541 : state.mashVol + state.spargeVol;
  xml += ` <BATCH_SIZE>${batchL.toFixed(4)}</BATCH_SIZE>\n`;

  xml += ` <FERMENTABLES>\n`;
  state.grains.forEach(g => {
    const weightKg = state.unit === "us" ? g.weight * 0.453592 : g.weight;
    xml += `  <FERMENTABLE>\n`;
    xml += `   <NAME>${escapeXml(g.name)}</NAME>\n`;
    xml += `   <VERSION>1</VERSION>\n`;
    xml += `   <TYPE>${g.type === 'acid' ? 'Acid' : 'Grain'}</TYPE>\n`;
    xml += `   <AMOUNT>${weightKg.toFixed(4)}</AMOUNT>\n`;
    xml += `   <COLOR>${g.color.toFixed(1)}</COLOR>\n`;
    xml += `  </FERMENTABLE>\n`;
  });
  xml += ` </FERMENTABLES>\n`;

  xml += ` <WATERS>\n`;
  xml += `  <WATER>\n`;
  xml += `   <NAME>Source Water (${state.sourcePresetKey})</NAME>\n`;
  xml += `   <VERSION>1</VERSION>\n`;
  xml += `   <AMOUNT>${batchL.toFixed(4)}</AMOUNT>\n`;
  xml += `   <CALCIUM>${state.sourceIons.ca}</CALCIUM>\n`;
  xml += `   <MAGNESIUM>${state.sourceIons.mg}</MAGNESIUM>\n`;
  xml += `   <SODIUM>${state.sourceIons.na}</SODIUM>\n`;
  xml += `   <SULFATE>${state.sourceIons.so4}</SULFATE>\n`;
  xml += `   <CHLORIDE>${state.sourceIons.cl}</CHLORIDE>\n`;
  xml += `   <BICARBONATE>${state.sourceIons.hco3}</BICARBONATE>\n`;
  xml += `  </WATER>\n`;
  xml += ` </WATERS>\n`;

  xml += ` <MASH>\n`;
  xml += `  <NAME>Water Lab Mash Profile</NAME>\n`;
  xml += `  <VERSION>1</VERSION>\n`;
  xml += `  <PH>${state.targetMashPh}</PH>\n`;
  xml += ` </MASH>\n`;

  xml += `</RECIPE>\n</RECIPES>\n`;

  const blob = new Blob([xml], { type: "application/xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${state.recipeName.replace(/[^a-z0-9]/gi, '_')}_WaterLab.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeXml(unsafe) {
  return (unsafe || '').replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function loadBeerXml(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const xmlText = evt.target.result;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    const recipeNode = xmlDoc.querySelector("RECIPE");
    if (!recipeNode) {
      alert("Invalid BeerXML file. Could not find <RECIPE> tag.");
      return;
    }

    const nameNode = recipeNode.querySelector("NAME");
    if (nameNode && nameNode.textContent) {
      state.recipeName = nameNode.textContent.trim();
    }

    const waterNode = recipeNode.querySelector("WATERS WATER");
    if (waterNode) {
      state.sourceIons = {
        ca: parseFloat(waterNode.querySelector("CALCIUM")?.textContent) || 0,
        mg: parseFloat(waterNode.querySelector("MAGNESIUM")?.textContent) || 0,
        na: parseFloat(waterNode.querySelector("SODIUM")?.textContent) || 0,
        so4: parseFloat(waterNode.querySelector("SULFATE")?.textContent) || 0,
        cl: parseFloat(waterNode.querySelector("CHLORIDE")?.textContent) || 0,
        hco3: parseFloat(waterNode.querySelector("BICARBONATE")?.textContent) || 0
      };
      state.sourcePresetKey = "custom";
      const srcSel = document.getElementById("sourcePreset");
      if (srcSel) srcSel.value = "custom";
      updateSourceInputs();
    }

    const fermentables = recipeNode.querySelectorAll("FERMENTABLES FERMENTABLE");
    if (fermentables && fermentables.length > 0) {
      state.grains = [];
      fermentables.forEach(f => {
        const fname = f.querySelector("NAME")?.textContent || "Malt";
        const ftypeStr = (f.querySelector("TYPE")?.textContent || "").toLowerCase();
        const amtKg = parseFloat(f.querySelector("AMOUNT")?.textContent) || 0;
        const colorSrm = parseFloat(f.querySelector("COLOR")?.textContent) || 2.0;

        const weight = state.unit === "us" ? Math.round(amtKg * 2.20462 * 10) / 10 : Math.round(amtKg * 10) / 10;

        let gtype = "base";
        if (ftypeStr.includes("acid") || fname.toLowerCase().includes("acid")) {
          gtype = "acid";
        } else if (colorSrm > 100) {
          gtype = "roast";
        } else if (colorSrm > 15) {
          gtype = "crystal";
        }

        if (weight > 0) {
          state.grains.push({
            name: fname,
            weight: weight,
            color: colorSrm,
            type: gtype
          });
        }
      });
      renderGrainBill();
    }

    const mashPhNode = recipeNode.querySelector("MASH PH");
    if (mashPhNode && mashPhNode.textContent) {
      const targetPh = parseFloat(mashPhNode.textContent);
      if (targetPh > 4.5 && targetPh < 6.5) {
        state.targetMashPh = targetPh;
        const phInput = document.getElementById("targetMashPh");
        if (phInput) phInput.value = targetPh;
      }
    }

    // Parse total water from ingredients
    let totalWaterGal = 0;
    const waterIngredients = recipeNode.querySelectorAll("INGREDIENTS INGREDIENT");
    waterIngredients.forEach(ing => {
      const type = ing.querySelector("TYPE")?.textContent || "";
      if (type.toLowerCase() === "water") {
        const displayAmt = ing.querySelector("DISPLAY_AMOUNT")?.textContent || "";
        if (displayAmt.toLowerCase().includes("gal")) {
          totalWaterGal += parseFloat(displayAmt) || 0;
        } else if (displayAmt.toLowerCase().includes("qt")) {
          totalWaterGal += (parseFloat(displayAmt) || 0) / 4.0;
        } else {
          const amtL = parseFloat(ing.querySelector("AMOUNT")?.textContent) || 0;
          totalWaterGal += amtL * 0.264172;
        }
      }
    });

    // Parse mash water from MASH_STEPS
    let totalMashWaterGal = 0;
    const mashSteps = recipeNode.querySelectorAll("MASH MASH_STEPS MASH_STEP");
    mashSteps.forEach(step => {
      const type = step.querySelector("TYPE")?.textContent || "";
      if (type.toLowerCase() === "infusion") {
        const displayInfuse = step.querySelector("DISPLAY_INFUSE_AMT")?.textContent || "";
        if (displayInfuse.toLowerCase().includes("qt")) {
          totalMashWaterGal += (parseFloat(displayInfuse) || 0) / 4.0;
        } else if (displayInfuse.toLowerCase().includes("gal")) {
          totalMashWaterGal += parseFloat(displayInfuse) || 0;
        } else {
          const infuseL = parseFloat(step.querySelector("INFUSE_AMOUNT")?.textContent) || 0;
          totalMashWaterGal += infuseL * 0.264172;
        }
      }
    });

    if (totalWaterGal > 0 && totalMashWaterGal > 0) {
      state.mashVol = Math.round(totalMashWaterGal * 10) / 10;
      state.spargeVol = Math.round((totalWaterGal - totalMashWaterGal) * 10) / 10;
      if (state.spargeVol < 0) state.spargeVol = 0;
    } else if (totalMashWaterGal > 0) {
      state.mashVol = Math.round(totalMashWaterGal * 10) / 10;
      const batchSizeNode = recipeNode.querySelector("BATCH_SIZE");
      if (batchSizeNode && batchSizeNode.textContent) {
        const batchL = parseFloat(batchSizeNode.textContent);
        const totalGal = batchL * 0.264172;
        state.spargeVol = Math.round(totalGal * 0.45 * 10) / 10;
      }
    } else {
      const batchSizeNode = recipeNode.querySelector("BATCH_SIZE");
      if (batchSizeNode && batchSizeNode.textContent) {
        const batchL = parseFloat(batchSizeNode.textContent);
        if (batchL > 0) {
          const totalGal = batchL * 0.264172;
          state.mashVol = Math.round(totalGal * 0.55 * 10) / 10;
          state.spargeVol = Math.round(totalGal * 0.45 * 10) / 10;
        }
      }
    }

    const mv = document.getElementById("mashVol");
    const sv = document.getElementById("spargeVol");
    if (mv) mv.value = state.mashVol;
    if (sv) sv.value = state.spargeVol;

    calculateAll();
    alert(`Loaded BeerXML Recipe: ${state.recipeName}`);
  };

  reader.readAsText(file);
}
