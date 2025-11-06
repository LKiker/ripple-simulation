# 2D Ripple Simulation

## Overview
This project simulates **wave propagation** across a 2D surface using a **heightmap-based physics model**.  
When the user clicks or taps the canvas, a circular disturbance (“ripple”) forms and spreads outward, interacting with other waves in real time.  
The simulation visualizes the **2D wave equation** using color mapping to show height variations.

---

## Features
- Real-time **2D wave simulation** (discrete wave equation)  
- **Interactive clicks/taps** to generate ripples  
- Adjustable **wave speed** and **damping** controls  
- **Color-mapped visualization** (blue = low, white = high)  
- Ripple **collision and interference patterns**  
- Runs entirely in the **browser using WebGL and JavaScript**

---

## How It Works
The simulation models the surface as a **heightmap grid**, where each cell stores a height value.  
Each frame, the height at each cell is updated using a discrete approximation of the wave equation:

\[
h_{new}(x, y) = \frac{h_{prev}(x-1, y) + h_{prev}(x+1, y) + h_{prev}(x, y-1) + h_{prev}(x, y+1)}{2} - h_{curr}(x, y)
\]  
\[
h_{new}(x, y) *= damping
\]

This produces realistic ripple motion as energy spreads and fades across the grid.

---

## Controls

| Action | Description |
|---------|--------------|
| **Click / Tap** | Create a new ripple at cursor position |
| **Wave Speed** | Adjust how fast ripples travel |
| **Damping** | Adjust how quickly ripples lose energy |

---

## Tools & Technologies
- **JavaScript**  
- **WebGL**
- **HTML / CSS**  

---

## 👥 Team
- **Landrey Kiker**
- **Kate Chavira** 

---