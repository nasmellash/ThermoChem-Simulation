export class Simulation {
  constructor(canvas, ctx) {

    // --- material specific heat values ---
    this.materials = {
      aluminum: 0.897,
      copper: 0.385,
      iron: 0.449,
      lead: 0.128,
      water: 4.18
    };

    // --- default properties ---
    this.material = "aluminum";
    this.c = this.materials[this.material];
    this.m = 100; // grams
    this.temperature = 25;
    this.mode = "stop";
    this.Qrate = 25; 
    this.dt = 0.1;

    // --- drawing properties ---
    this.color = "red";       // will change with material
    this.size = 40;           // will change with mass
    this.canvas = canvas;
    this.ctx = ctx;
  }

  // --------------------------------------------------
  // Update color based on material selection
  // --------------------------------------------------
  updateColorFromMaterial(material) {
    const colors = {
      aluminum: "#4e8cff",
      copper: "#b87333",
      iron: "#555555",
      lead: "#6e6e6e",
      water: "#3fa9f5"
    };

    this.color = colors[material] || "gray";
  }

  // --------------------------------------------------
  // Update size based on mass (shape stays same)
  // --------------------------------------------------
  updateSizeFromMass() {
  // Size grows 4px every 25 grams
  // Base size = 30 px at 0g
  this.size = 30 + Math.floor(this.m / 25) * 4;

  // Optional: prevent tiny/invisible shape
  if (this.size < 10) this.size = 10;
}


  // --------------------------------------------------
  // Set material + update corresponding properties
  // --------------------------------------------------
  setMaterial(name) {
  if (name === "unknown") {
    this.setUnknownMaterial();
    return;
  }

  this.material = name;
  this.c = this.materials[name];
  this.updateColorFromMaterial(name);
}


  // --------------------------------------------------
  // Set mass + update size
  // --------------------------------------------------
  setMass(mass) {
    this.m = parseFloat(mass);
    this.updateSizeFromMass();
  }

  reset() {
    this.temperature = 25;
    this.mode = "stop";
  }

  step() {
    const { m, c, Qrate, dt } = this;

    if (this.mode === "heat") {
      this.temperature = Math.min(
        100,
        this.temperature + (Qrate * dt) / (m * c)
      );
    } else if (this.mode === "cool") {
      this.temperature = Math.max(
        0,
        this.temperature - (Qrate * dt) / (m * c)
      );
    }
  }

  // -----------------------------------------
  // Heat calculations
  // -----------------------------------------
  calcHeatTransferred(initialT, finalT) {
    return this.m * this.c * (finalT - initialT);
  }

  applyHeat(q) {
    const deltaT = q / (this.m * this.c);
    this.temperature += deltaT;
    return this.temperature;
  }

  computeCalorimetry(matA, mA, tA, matB, mB, tB) {
    const cA = this.materials[matA];
    const cB = this.materials[matB];

    const numerator = mA * cA * tA + mB * cB * tB;
    const denominator = mA * cA + mB * cB;

    return numerator / denominator;
  }

  // -----------------------------------------
  // Drawing the object
  // -----------------------------------------
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = this.color;

    // Circle that changes size with mass
    ctx.beginPath();
    ctx.arc(350, 200, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
  setUnknownMaterial() {
  // random c from ~0.10 to ~4.20 (J/g°C)
  const minC = 0.10;
  const maxC = 4.20;
  this.material = "unknown";
  this.c = +(minC + Math.random() * (maxC - minC)).toFixed(3);

  // random but readable color
  const hue = Math.floor(Math.random() * 360);
  this.color = `hsl(${hue}, 70%, 55%)`;
}

}

