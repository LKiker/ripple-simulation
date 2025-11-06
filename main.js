"use strict";

// vertex shader code (vsc)
const vsc = "attribute vec2 vpos;" +
"void main() {" +
"gl_Position = vec4(vpos, 0.0, 1.0);" +
"gl_PointSize = 2.0;" +
"}";

// fragment shader code (fsc)
const fsc = "precision lowp float;" +
"uniform vec4 vcolor;" +
"void main() {" +
"gl_FragColor = vcolor;" +
"}";

let gl, gl_prog, canvas;
const N_DIM = 2;
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

function main() {
    init_gl();

    draw_point(to_clip_coord(500, 500), [1, 1, 0]); // yellow point in center
}

main();
