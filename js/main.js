import { Simulation } from "./model/simulation.js";
import { drawScene, loadAssets } from "./view/draw.js";
import { setupUI } from "./view/ui.js";

const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const sim = new Simulation();
setupUI(sim);

loadAssets((images) => {
  function loop() {
  if (sim.currentMode === "simulation") {
  sim.step();
  drawScene(ctx, sim, images);
} else {
  // Stop drawing while in calorimetry or learning mode
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
  requestAnimationFrame(loop);
}
  loop();
});
