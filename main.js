import { start2D, stop2D } from "./sim2d.js";
import { start3D, stop3D } from "./sim3d.js";

const btn2d = document.getElementById("view-2d");
const btn3d = document.getElementById("view-3d");

const container2d = document.getElementById("container-2d");
const container3d = document.getElementById("container-3d");

// Start in 2D mode by default
let currentView = "2d";
start2D();

btn2d.addEventListener("click", () => {
  if (currentView === "2d") return; // Already in 2D
  currentView = "2d";

  // Update button states
  btn2d.classList.add("active");
  btn3d.classList.remove("active");

  // Show/hide containers
  container2d.style.display = "flex";
  container3d.style.display = "none";

  // Switch simulations
  stop3D();
  start2D();
});

btn3d.addEventListener("click", () => {
  if (currentView === "3d") return; // Already in 3D
  currentView = "3d";

  // Update button states
  btn3d.classList.add("active");
  btn2d.classList.remove("active");

  // Show/hide containers
  container2d.style.display = "none";
  container3d.style.display = "flex";

  // Switch simulations
  stop2D();
  start3D();
});
