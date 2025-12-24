# Ripple Simulation

This project is an interactive 2D and 3D water ripple simulation built from scratch using WebGL.
It visualizes real-time wave propagation on a heightmap and allows users to inject energy through mouse interaction, demonstrating core physics and real-time graphics concepts.

<img src="assets/2Ddemo.gif" width="700"/>
<img src="assets/3Ddemo.gif" width="700"/>

---

## Features

- Real-time wave simulation using a discrete wave equation
- Interactive clicks/taps to generate ripples
- Adjustable wave speed, damping, ripple radius, and ripple strength
- Color-mapped visualization for 2D (blue = low, white = high)
- Height-based mesh displacement visualization for 3D
- Ripple collision and interference patterns
- Runs entirely in the browser using JavaScript and WebGL

---

## How It Works

The simulation is based on a discrete wave equation, where each grid cell’s height evolves over time according to its neighbors and its previous state. This produces oscillating ripples that propagate outward while gradually losing energy through damping.

Users interact directly with the simulation by clicking on the canvas to create splashes. Each interaction injects energy into the heightmap, producing expanding circular waves with adjustable radius and strength. Real-time UI controls allow users to modify physical parameters such as wave speed and damping to explore how these values affect wave behavior.

Rendering is performed entirely with WebGL by converting the heightmap grid into a dense set of points mapped to clip space. Height values are visualized through color gradients, transitioning from deep blue to bright highlights as wave peaks rise. The simulation runs continuously using `requestAnimationFrame`, updating both physics and rendering every frame.

The project also includes a 3D version of the simulation. This version uses Three.js to render the wave surface as a deforming mesh, applying the same heightmap-based physics model to visualize wave propagation through mesh displacement.

---

## What I Learned

- Implementing numerical simulations for real-time interactive systems
- Understanding the relationship between physics equations and visual output
- Working with low-level WebGL rendering pipelines, including shader setup and GPU buffer management
- Structuring real-time applications with a clear separation between simulation logic and rendering
- Translating mathematical and physical concepts into interactive visual experiences

---

## Tools & Technologies

- JavaScript
- WebGL
- HTML / CSS
- Three.js


---

## Team
- **Landrey Kiker**
- **Kate Chavira** 

---
