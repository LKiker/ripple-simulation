"use strict";

// vertex shader code (vsc)
const vsc = "attribute vec3 vpos;" +
"void main() {" +
"gl_Position = vec4(vpos.xy, 0.0, 1.0);" +
"gl_PointSize = 3.0;" +
"}";

// fragment shader code (fsc)
const fsc = "precision lowp float;" +
"uniform vec4 vcolor;" +
"void main() {" +
"gl_FragColor = vcolor;" +
"}";

const GRID_SIZE = 200;  // 200x200 heightmap grid
const DAMPING = 0.99;   // energy loss per frame
let current = [];   // current wave heights
let previous = [];  // previous wave heights
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

    unif_vcolor = gl.getUniformLocation(gl_prog, "vcolor");
}

function to_clip_coord(x, y) {
  let clip_x =  2 * x / width  - 1;
  let clip_y =  1 - 2 * y / height;
  return [clip_x, clip_y, 1];
}

function draw_point(point, color=[1,1,1]) {
  gl.uniform4f(unif_vcolor, color[0], color[1], color[2], 1.0);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(point), gl.STATIC_DRAW);
  gl.drawArrays(gl.POINTS, 0, 1);
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
  const step = 2 / GRID_SIZE; // map grid to clip space (-1..1)
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const vx = -1 + x * step;
      const vy = -1 + y * step;

      let heightValue;
      if (current[y] !== undefined && current[y][x] !== undefined) {
        heightValue = current[y][x];  // use stored wave height
      } else {
        heightValue = 0;              // default to flat (no wave)
      }
      verts.push(vx);
      verts.push(vy);
      verts.push(heightValue);
    }
  }
  return new Float32Array(verts);
}

// wave propagation using:
// ht+1(x,y)=2ht(x,y)−ht−1(x,y)+c2Δt2[h(x+1,y)+h(x−1,y)+h(x,y+1)+h(x,y−1)−4h(x,y)]
// simplified as: next[x][y]=(avg of neighbors−previous[x][y])×damping
// The new height is determined by the current height,
// the previous height, and how curved the surface is at that point.
// Each point oscillates based on the difference between its 
// neighbors and its previous state, with damping to simulate energy loss.
function update_waves() {
  const next = [];

   // initialize rows so next[y] is always defined
  for (let y = 0; y < GRID_SIZE; y++) {
    next[y] = new Array(GRID_SIZE).fill(0);
  }

  for (let y = 1; y < GRID_SIZE - 1; y++) {
    next[y] = [];
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      const sumNeighbors =
        current[y - 1][x] +
        current[y + 1][x] +
        current[y][x - 1] +
        current[y][x + 1];

      // Discrete wave equation
      next[y][x] = (sumNeighbors / 2 - previous[y][x]) * DAMPING;
    }
  }

  previous = current;
  current = next;
}

// render points
function render() {
  // update the simulation
  update_waves();
  // rebuild vertex data from current heightmap
  const verts = build_vertex_data();
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
  // draw all points
  const totalVerts = GRID_SIZE * GRID_SIZE;
  gl.uniform4f(unif_vcolor, 0.2, 0.6, 1.0, 1.0); // blueish color
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, totalVerts);
  // repeat each frame
  requestAnimationFrame(render);
}

// mouse click to add ripples
function add_ripple(event) {
  const rect = canvas.getBoundingClientRect();
  const cx = Math.floor(((event.clientX - rect.left) / rect.width) * GRID_SIZE);
  const cy = Math.floor(((event.clientY - rect.top) / rect.height) * GRID_SIZE);

  const radius = 3;   // bump size (try 3–6)
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const dx = cx + x;
      const dy = cy + y;
      if (dx >= 0 && dx < GRID_SIZE && dy >= 0 && dy < GRID_SIZE) {
        const dist = Math.sqrt(x*x + y*y);
        if (dist <= radius) {
          current[dy][dx] = 1.0; // initial height pulse
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
