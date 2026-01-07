export function loadAssets(callback) {
  const flame = new Image();
  const ice = new Image();
  let loaded = 0;

  flame.src = "../assets/flame.png";
  ice.src = "../assets/ice.png";

  flame.onload = ice.onload = () => {
    loaded++;
    if (loaded === 2) callback({ flame, ice });
  };
}

export function drawScene(ctx, sim, images) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Ground
  ctx.fillStyle = "#94c6ff";
  ctx.fillRect(0, 340, ctx.canvas.width, 80);

  // Draw heat or cooling source
  if (sim.mode === "heat") {
    ctx.drawImage(images.flame, 290, 300, 100, 100);
  } else if (sim.mode === "cool") {
    ctx.drawImage(images.ice, 290, 300, 100, 100);
  }

  // ==========================================
  // OBJECT WITH SIZE BASED ON MASS
  // ==========================================

  const size = sim.size; // dynamic size from mass
  const color = tempToColor(sim.temperature); // <-- REQUIRED FIX

  // Keep object centered relative to original (290,230) spot
  const x = 290 + (100 - size) / 2;
  const y = 230 + (100 - size) / 2;

  // Draw object
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  // ==========================================
  // THERMOMETER + LABELS
  // ==========================================
  drawThermometer(ctx, 480, 200, sim.temperature);

  ctx.fillStyle = "#000";
  ctx.font = "18px Arial";
  ctx.fillText(`Temp: ${sim.temperature.toFixed(1)}°C`, 240, 60);
  ctx.fillText(`Material: ${capitalize(sim.material)}`, 210, 90);
}

function drawThermometer(ctx, x, y, t) {
  const height = 160;
  const bulbRadius = 18;
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#444";
  ctx.strokeRect(x, y, 20, height);

  const fillHeight = (t / 100) * height;
  const color = tempToColor(t);
  ctx.fillStyle = color;
  ctx.fillRect(x, y + height - fillHeight, 20, fillHeight);

  ctx.beginPath();
  ctx.arc(x + 10, y + height + bulbRadius, bulbRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function tempToColor(t) {
  const r = Math.min(255, Math.floor((t / 100) * 255));
  const b = 255 - r;
  return `rgb(${r}, 60, ${b})`;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
