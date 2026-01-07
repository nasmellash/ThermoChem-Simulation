import { renderLesson, nextLesson } from "./learning.js";

export function setupUI(sim) {

  // ================================
  // Grab All DOM Sections
  // ================================
  const simulationSection = document.getElementById("simulationSection");
  const calorimetryLab = document.getElementById("calorimetryLab");
  const calcSection = document.getElementById("calcSection");

  const learnBtn = document.getElementById("learnBtn");
  const caloBtn = document.getElementById("caloBtn");
  const simBtn = document.getElementById("simBtn");

  const canvas = document.getElementById("scene");

  // ================================
  // Simulation Controls
  // ================================
  const materialSelect = document.getElementById("materialSelect");
  const massInput = document.getElementById("massInput");
  const heatBtn = document.getElementById("heatBtn");
  const coolBtn = document.getElementById("coolBtn");
  const stopBtn = document.getElementById("stopBtn");
  const resetBtn = document.getElementById("resetBtn");

  // ================================
  // Calorimetry DOM
  // ================================
  const matA = document.getElementById("matA");
  const matB = document.getElementById("matB");
  const massA = document.getElementById("massA");
  const massB = document.getElementById("massB");
  const tempA = document.getElementById("tempA");
  const tempB = document.getElementById("tempB");
  const runCal = document.getElementById("runCalorimetry");
  const caloPrompt = document.getElementById("caloPrompt");
  const caloResult = document.getElementById("caloResult");
  const specificHeatTable = document.getElementById("specificHeatTable");

  // ================================
// Calorimetry Animation Canvas
// ================================
const caloCanvas = document.getElementById("caloCanvas");
const caloCtx = caloCanvas ? caloCanvas.getContext("2d") : null;

let caloAnimId = null;

function tempToColor(t) {
  // blue (cold) -> red (hot)
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const norm = clamp((t - 0) / 100, 0, 1); // 0°C..100°C mapped
  const r = Math.floor(50 + 205 * norm);
  const g = Math.floor(80 + 60 * (1 - Math.abs(norm - 0.5) * 2));
  const b = Math.floor(255 - 205 * norm);
  return `rgb(${r},${g},${b})`;
}

function stopCaloAnim() {
  if (caloAnimId) cancelAnimationFrame(caloAnimId);
  caloAnimId = null;
}

function drawBeaker(ctx, x, y, w, h, fill, label, temp) {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#333";
  ctx.fillStyle = "#fff";
  ctx.strokeRect(x, y, w, h);
  ctx.fillRect(x, y, w, h);

  // liquid
  ctx.fillStyle = fill;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(x + 2, y + h * 0.35, w - 4, h * 0.65 - 2);
  ctx.globalAlpha = 1;

  // label + temp
  ctx.fillStyle = "#111";
  ctx.font = "14px Arial";
  ctx.fillText(label, x + 8, y + 18);
  ctx.fillText(`${temp.toFixed(1)}°C`, x + 8, y + 38);

  ctx.restore();
}

function drawThermometer(ctx, x, y, w, h, temp, minT, maxT) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const p = clamp((temp - minT) / (maxT - minT), 0, 1);

  ctx.save();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = tempToColor(temp);
  ctx.fillRect(x + 2, y + h - (h - 4) * p - 2, w - 4, (h - 4) * p);

  ctx.fillStyle = "#111";
  ctx.font = "12px Arial";
  ctx.fillText(`T`, x + 2, y - 6);
  ctx.restore();
}

function animateMixing(TA, TB, TF) {
  if (!caloCtx) return;

  stopCaloAnim();

  const ctx = caloCtx;
  const W = caloCanvas.width;
  const H = caloCanvas.height;

  const start = performance.now();
  const duration = 1400; // quick animation (~1.4s)

  const leftStartX = 60;
  const rightStartX = W - 180;
  const beakerY = 40;
  const beakerW = 120;
  const beakerH = 90;

  const meetX = (W / 2) - (beakerW / 2);

  const minT = Math.min(TA, TB, TF) - 10;
  const maxT = Math.max(TA, TB, TF) + 10;

  function frame(now) {
    const t = (now - start) / duration;
    const p = Math.min(1, t);

    ctx.clearRect(0, 0, W, H);

    // phase 1: slide together (0 -> 0.55)
    const slideP = Math.min(1, p / 0.55);
    const xA = leftStartX + (meetX - leftStartX) * slideP;
    const xB = rightStartX + (meetX - rightStartX) * slideP;

    // phase 2: mix + temp converge (0.55 -> 1)
    const mixP = p < 0.55 ? 0 : (p - 0.55) / 0.45;

    // temps shown during mixing converge to TF
    const TA_now = TA + (TF - TA) * mixP;
    const TB_now = TB + (TF - TB) * mixP;

    // draw title
    ctx.fillStyle = "#111";
    ctx.font = "16px Arial";
    ctx.fillText("Mixing Animation", 10, 22);

    if (mixP < 1) {
      // draw two beakers approaching / beginning to mix
      drawBeaker(ctx, xA, beakerY, beakerW, beakerH, tempToColor(TA_now), "A", TA_now);
      drawBeaker(ctx, xB, beakerY, beakerW, beakerH, tempToColor(TB_now), "B", TB_now);

      // hint "mixing" splash at the center once they meet
      if (slideP >= 1) {
        ctx.save();
        ctx.globalAlpha = 0.3 + 0.4 * Math.sin(mixP * Math.PI);
        ctx.fillStyle = "#999";
        ctx.beginPath();
        ctx.arc(W / 2, beakerY + beakerH / 2 + 8, 18 + 10 * mixP, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // thermometer shows approaching equilibrium
      const midT = (TA_now + TB_now) / 2;
      drawThermometer(ctx, W - 40, 40, 16, 90, midT, minT, maxT);
    } else {
      // final: one combined beaker in center
      drawBeaker(ctx, meetX, beakerY, beakerW, beakerH, tempToColor(TF), "A+B", TF);
      drawThermometer(ctx, W - 40, 40, 16, 90, TF, minT, maxT);

      ctx.fillStyle = "#111";
      ctx.font = "14px Arial";
      ctx.fillText(`Equilibrium: ${TF.toFixed(2)}°C`, meetX - 10, beakerY + beakerH + 22);
    }

    if (p < 1) {
      caloAnimId = requestAnimationFrame(frame);
    } else {
      caloAnimId = null;
    }
  }

  caloAnimId = requestAnimationFrame(frame);
}

  // ================================
  // Fill A/B Material menus
  // ================================
  for (const key in sim.materials) {
    const c = sim.materials[key];
    const label = `${key.charAt(0).toUpperCase() + key.slice(1)} (${c} J/g·°C)`;
    matA.innerHTML += `<option value="${key}">${label}</option>`;
    matB.innerHTML += `<option value="${key}">${label}</option>`;
  }

  matA.innerHTML += `<option value="unknown">❓ Unknown Material</option>`;

  // ================================
  // SECTION SWITCHING
  // ================================

  function showSimulation() {
    simulationSection.style.display = "block";
    calorimetryLab.style.display = "none";
    calcSection.style.display = "none";
    simBtn.style.display = "none";
    learnBtn.style.display = "inline-block";
    caloBtn.style.display = "inline-block";
    sim.currentMode = "simulation";
  }

  function showCalorimetry() {
    simulationSection.style.display = "none";
    calorimetryLab.style.display = "block";
    calcSection.style.display = "none";
    learnBtn.style.display = "inline-block";
    caloBtn.style.display = "inline-block";
    simBtn.style.display = "block";
    sim.currentMode = "calorimetry";
  }

  function showLearning() {
    simulationSection.style.display = "none";
    calorimetryLab.style.display = "none";
    calcSection.style.display = "none";
    learnBtn.style.display = "none";
    caloBtn.style.display = "inline-block";
    simBtn.style.display = "block";
    sim.currentMode = "learning";
  }

  // Buttons
  caloBtn.onclick = showCalorimetry;
  simBtn.onclick = showSimulation;
  learnBtn.onclick = showLearning;

  // ================================
  // Temperature Calculation Toggle
  // ================================
  const calcToggleBtn = document.getElementById("calcToggleBtn");
  let calcVisible = false;

  calcToggleBtn.onclick = () => {
  const opening = !calcVisible;     // calcVisible is still the old value here
  calcVisible = !calcVisible;

  calcSection.style.display = calcVisible ? "block" : "none";
  calcToggleBtn.textContent = calcVisible
    ? "▲ Temperature Calculation"
    : "▼ Temperature Calculation";

  if (opening) syncCalcFromSim();   // ✅ sync when opening
};


  // ================================
  // Calorimetry Logic
  // ================================
  matA.onchange = () => {
    if (matA.value === "unknown") {
      generateUnknownScenario();
      specificHeatTable.style.display = "block";
    } else {
      specificHeatTable.style.display = "none";
      caloPrompt.textContent =
        "Mix two materials and calculate the final equilibrium temperature.";
    }
  };

  function generateUnknownScenario() {
  // Random temperatures (ensure A is hotter than B)
  const TA = Math.floor(Math.random() * 30) + 60; // 60..89
  const TB = Math.floor(Math.random() * 25) + 10; // 10..34

  tempA.value = TA;
  tempB.value = TB;

  const mA = parseFloat(massA.value);
  const mB = parseFloat(massB.value);

  const cB = sim.materials[matB.value] ?? sim.materials["water"];

  // Random unknown c for material A
  sim.unknownCaloC = +(0.10 + Math.random() * (4.20 - 0.10)).toFixed(3);

  // Compute a physically consistent TF from energy balance:
  // mA*cA*(TF-TA) + mB*cB*(TF-TB) = 0
  const TF = (mA * sim.unknownCaloC * TA + mB * cB * TB) / (mA * sim.unknownCaloC + mB * cB);

  sim.equilibriumTemp = TF;

  caloPrompt.textContent =
    `Material A is UNKNOWN at ${TA}°C. Material B at ${TB}°C. ` +
    `After mixing they reach ${TF.toFixed(2)}°C. Solve for specific heat of UNKNOWN.`;
}


  runCal.onclick = () => {
  // Unknown scenario (solve for c)
  if (matA.value === "unknown") {
    const TA = parseFloat(tempA.value);
    const TB = parseFloat(tempB.value);
    const TF = sim.equilibriumTemp;

    animateMixing(TA, TB, TF);

    const cUnknown = computeUnknownSpecificHeat();
    caloResult.textContent =
      `Specific Heat of UNKNOWN: ${cUnknown.toFixed(3)} J/g·°C`;
    return;
  }

  const TA = parseFloat(tempA.value);
  const TB = parseFloat(tempB.value);

  const finalT = sim.computeCalorimetry(
    matA.value, parseFloat(massA.value), TA,
    matB.value, parseFloat(massB.value), TB
  );

  animateMixing(TA, TB, finalT);

  caloResult.textContent = `Equilibrium Temp: ${finalT.toFixed(2)}°C`;
};


  function computeUnknownSpecificHeat() {
  const mA = parseFloat(massA.value);
  const TA = parseFloat(tempA.value);
  const TF = sim.equilibriumTemp;

  const mB = parseFloat(massB.value);
  const TB = parseFloat(tempB.value);
  const cB = sim.materials[matB.value] ?? sim.materials["water"];

  return (mB * cB * (TB - TF)) / (mA * (TF - TA));
}


  // ================================
  // Simulation Controls
  // ================================

materialSelect.onchange = () => {
  if (materialSelect.value === "unknown") {
    sim.setUnknownMaterial();

    // optional: show the generated c in the dropdown text
    materialSelect.selectedOptions[0].textContent = `❓ Unknown (c = ${sim.c} J/g°C)`;
  } else {
    // restore label if user leaves unknown
    const unknownOpt = [...materialSelect.options].find(o => o.value === "unknown");
    if (unknownOpt) unknownOpt.textContent = "❓ Unknown (random c)";

    sim.setMaterial(materialSelect.value);
  }

  if (sim.draw) sim.draw();
  syncCalcFromSim();

};
  massInput.oninput = () => {
    sim.setMass(parseFloat(massInput.value));
    if (sim.draw) sim.draw();
    syncCalcFromSim();
  };

  heatBtn.onclick = () => (sim.mode = "heat");
  coolBtn.onclick = () => (sim.mode = "cool");
  stopBtn.onclick = () => (sim.mode = "stop");
  resetBtn.onclick = () => sim.reset();

  sim.currentMode = "simulation";
  showSimulation();   // THIS makes the simulation appear immediately

  const unknownSelect = document.getElementById("unknownSelect");
const inputs = {
  q: document.getElementById("qInput"),
  m: document.getElementById("mInput"),
  c: document.getElementById("cInput"),
  Ti: document.getElementById("TiInput"),
  Tf: document.getElementById("TfInput")
};

function updateDisabledInput() {
  Object.values(inputs).forEach(i => i.disabled = false);
  inputs[unknownSelect.value].disabled = true;
}

unknownSelect.addEventListener("change", updateDisabledInput);
updateDisabledInput();

document.getElementById("solveBtn").addEventListener("click", () => {
  const q = parseFloat(inputs.q.value);
  const m = parseFloat(inputs.m.value);
  const c = parseFloat(inputs.c.value);
  const Ti = parseFloat(inputs.Ti.value);
  const Tf = parseFloat(inputs.Tf.value);

  const dT = Tf - Ti;
  let result;

  switch (unknownSelect.value) {
    case "q":
      result = m * c * dT;
      inputs.q.value = result.toFixed(2);
      break;

    case "m":
      result = q / (c * dT);
      inputs.m.value = result.toFixed(2);
      break;

    case "c":
      result = q / (m * dT);
      inputs.c.value = result.toFixed(4);
      break;

    case "Ti":
      result = Tf - q / (m * c);
      inputs.Ti.value = result.toFixed(2);
      break;

    case "Tf":
      result = Ti + q / (m * c);
      inputs.Tf.value = result.toFixed(2);
      break;
  }
});

document.getElementById("applyHeatBtn").addEventListener("click", () => {
  const q = parseFloat(inputs.q.value);
  if (!isNaN(q)) {
    const newT = sim.applyHeat(q); 

    const qOutput = document.getElementById("qOutput");
    const finalTempOutput = document.getElementById("finalTempOutput");

    if (qOutput) qOutput.textContent = `Applied Heat: ${q.toFixed(2)} J`;
    if (finalTempOutput) finalTempOutput.textContent = `New Temp: ${newT.toFixed(2)}°C`;
  }
});

matB.onchange = () => {
  if (matA.value === "unknown") generateUnknownScenario();
};

massA.oninput = () => {
  if (matA.value === "unknown") generateUnknownScenario();
};

massB.oninput = () => {
  if (matA.value === "unknown") generateUnknownScenario();
};

function syncCalcFromSim() {
  if (inputs.m) inputs.m.value = sim.mass?.toFixed(2) ?? massInput.value;
  if (inputs.c) inputs.c.value = sim.c?.toFixed(3) ?? "";

  const Tnow = sim.temp ?? sim.temperature ?? sim.T ?? null;
  if (Tnow !== null && inputs.Ti) inputs.Ti.value = (+Tnow).toFixed(2);
}

function previewTfFromQ() {
  const q = parseFloat(inputs.q.value);
  const m = parseFloat(inputs.m.value);
  const c = parseFloat(inputs.c.value);
  const Ti = parseFloat(inputs.Ti.value);

  if ([q, m, c, Ti].some(v => Number.isNaN(v)) || m === 0 || c === 0) return;

  const Tf = Ti + q / (m * c);
  if (inputs.Tf) inputs.Tf.value = Tf.toFixed(2);
}

inputs.q.addEventListener("input", previewTfFromQ);  // ✅ add this
inputs.m.addEventListener("input", previewTfFromQ);
inputs.c.addEventListener("input", previewTfFromQ);
inputs.Ti.addEventListener("input", previewTfFromQ);


} 