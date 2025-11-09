"use strict";

// vertex shader code (vsc)
const vsc = "attribute vec3 vpos;" +  // position
"attribute vec3 vcol;" +              // color
"varying vec3 fcol;" +                // passed to fragment shader
"void main() {" +
" gl_Position = vec4(vpos.xy, 0.0, 1.0);" +
" gl_PointSize = 4.0;" +
" fcol = vcol;" +                     // send color to fragment shader
"}";

// fragment shader code (fsc)
const fsc = "precision lowp float;" +
"varying vec3 fcol;" +                // receive color from vertex shader
"void main() {" +
" gl_FragColor = vec4(fcol, 1.0);" +
"}";

// User control values
let DAMPING = 0.99;   // energy loss per frame
let C2 = 0.5;         // wave speed
let radius = 2;     // splash radius
let strength = 3.0; // splash strength

// Grid variables
let GRID_SIZE = 250;  // heightmap grid
let current = [];     // current wave heights
let previous = [];    // previous wave heights

let gl, gl_prog, canvas;
const N_DIM = 3;
let unif_vcolor;
let width, height;

function checkShader(shader) {
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }
}

function checkProgram(program) {
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
  }
}

// create shader program
function create_gl_program() {
    let vs = gl.createShader(gl.VERTEX_SHADER);
    let fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vs, vsc);
    gl.shaderSource(fs, fsc);
    gl.compileShader(vs);
    checkShader(vs);
    gl.compileShader(fs);
    checkShader(fs);
    gl_prog = gl.createProgram();
    gl.attachShader(gl_prog, vs);
    gl.attachShader(gl_prog, fs);
    gl.linkProgram(gl_prog);
    checkProgram(gl_prog);
}

// setup webGL
function init_gl() {
    canvas = document.getElementById("webgl_canvas");
    width = canvas.width;
    height = canvas.height;
    gl = canvas.getContext("webgl");
    create_gl_program();
    gl.useProgram(gl_prog);
    gl.viewport(0, 0, width, height);
    
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);    

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    let attr_vpos = gl.getAttribLocation(gl_prog, "vpos");
    gl.vertexAttribPointer(attr_vpos, N_DIM, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attr_vpos);
}

// initialize heightmap
function init_heightmap() {
  for (let y = 0; y < GRID_SIZE; y++) {
    current[y] = [];
    previous[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      current[y][x] = 0;
      previous[y][x] = 0;
    }
  }
}

// convert grid to vertices
function build_vertex_data() {
  const verts = [];
  const colors = [];
  const step = 2 / GRID_SIZE; // map grid to clip space (-1..1)

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const vx = -1 + x * step;
      const vy = -1 + y * step;
      const h = current[y][x];

      // normalize height to [-1, 1]
      const n = Math.max(-1, Math.min(1, h));

      // map height to color
      const t = (n + 1) / 2;  // normalize 0..1
      const r = 0.1 + 0.9 * t;            // white increases with height
      const g = 0.3 + 0.7 * t;
      const b = 0.6 + 0.4 * t; // 0.3 = deep blue, 1.0 = bright white

      verts.push(vx, vy, 0);
      colors.push(r, g, b);
    }
  }

  return {
    verts: new Float32Array(verts),
    colors: new Float32Array(colors),
  }
}

// wave propagation using:
// ht+1(x,y)=2ht(x,y)−ht−1(x,y)+c2Δt2[h(x+1,y)+h(x−1,y)+h(x,y+1)+h(x,y−1)−4h(x,y)]
// simplified as: next[x][y]=(avg of neighbors−previous[x][y])×damping
// The new height is determined by the current height,
// the previous height, and how curved the surface is at that point.
// Each point oscillates based on the difference between its 
// neighbors and its previous state, with damping to simulate energy loss.
function update_waves() {
  C2 = parseFloat(document.getElementById("wavespeed").value);
  DAMPING = parseFloat(document.getElementById("damping").value);
  const next = [];

  // initialize rows so next[y] is always defined
  for (let y = 0; y < GRID_SIZE; y++) {
    next[y] = new Array(GRID_SIZE).fill(0);
  }

  // sums neighbors of each cell in the grid
  for (let y = 1; y < GRID_SIZE - 1; y++) {
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      const center = current[y][x];
      const lap =
        current[y-1][x] + current[y+1][x] +
        current[y][x-1] + current[y][x+1] -
        4 * center;

      // discrete wave: h_{t+1} = 2*h_t - h_{t-1} + C2 * lap
      next[y][x] = (2 * center - previous[y][x] + C2 * lap) * DAMPING;
    }
  }

  previous = current;
  current = next;
}

// render points
function render() {
  update_waves();

  const { verts, colors } = build_vertex_data();
  const totalVerts = GRID_SIZE * GRID_SIZE;

  gl.clear(gl.COLOR_BUFFER_BIT);

  // Upload vertex positions
  const attr_vpos = gl.getAttribLocation(gl_prog, "vpos");
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(attr_vpos, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attr_vpos);

  // Upload vertex colors
  const attr_vcol = gl.getAttribLocation(gl_prog, "vcol");
  const colBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(attr_vcol, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attr_vcol);

  // Draw all points
  gl.drawArrays(gl.POINTS, 0, totalVerts);

  requestAnimationFrame(render);
}

// mouse click to add ripples
function add_ripple(event) {
  let radius = parseFloat(document.getElementById("splashradius").value);
  let strength = parseFloat(document.getElementById("splashstrength").value);

  const rect = canvas.getBoundingClientRect();

  const gridX = Math.floor(((event.clientX - rect.left) / rect.width) * GRID_SIZE);
  // Have to mirror Y because clip space and canvas space have opposite origins
  const gridY = GRID_SIZE - 1 - Math.floor(
    ((event.clientY - rect.top) / rect.height) * GRID_SIZE
  );

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const dx = gridX + x;
      const dy = gridY + y;

      // stay inside the grid
      if (dx >= 0 && dx < GRID_SIZE && dy >= 0 && dy < GRID_SIZE) {
        const dist = Math.sqrt(x * x + y * y);
        if (dist <= radius) {
          // optional smooth falloff: stronger in center, fades at edges
          const falloff = 1 - dist / radius; // linear fade
          current[dy][dx] += strength * falloff;
        }
      }
    }
  }
}

function main() {
  init_gl();
  init_heightmap();
  canvas.addEventListener("mousedown", add_ripple);
  requestAnimationFrame(render);
}

main();
