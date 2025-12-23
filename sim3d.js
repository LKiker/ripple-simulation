import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js";

// User control values
let DAMPING = 0.99;
let C2 = 0.35;
let radius = 2;     // splash radius
let strength = 3.0; // splash strength

// Grid variables
const GRID_SIZE = 150;
let current = [];
let previous = [];

// three.js variables
let scene, camera, renderer;
let planeMesh, geometry;
let raycaster, mouse;

// animation variables
let isRunning = false;
let isInitialized = false;
let animationId = null;

// initialize three.js
function init() {
    // scene
    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera(
        60, // fov
        window.innerWidth / window.innerHeight, // aspect ratio
        0.1, // near
        100 // far
    );
    camera.position.set(0, 12, 12);
    camera.lookAt(0, 0, 0);

    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("canvas-container").appendChild(renderer.domElement);

    // light
    const light = new THREE.DirectionalLight(0x7dd3fc, 2);
    light.position.set(0, 10, 0);
    scene.add(light);
    const ambient = new THREE.AmbientLight(0x406080, 1);
    scene.add(ambient);

    // water plane
    geometry = new THREE.PlaneGeometry(15, 15, GRID_SIZE - 1, GRID_SIZE - 1);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
        color: 0x0c4a6e,
        metalness: 0,
        roughness: 0.5,
        emissive: 0x00111a,
        emissiveIntensity: 0.2,
    });

    planeMesh = new THREE.Mesh(geometry, material);
    scene.add(planeMesh);

    // interaction helpers
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("resize", onResize);

    document.getElementById("reset").addEventListener("click", reset);

    // create the simulation arrays
    initHeightmap();

    return true;
}

// initialize heightmap
function initHeightmap() {
    current = [];
    previous = [];

    for (let y = 0; y < GRID_SIZE; y++) {
        current[y] = new Array(GRID_SIZE).fill(0);
        previous[y] = new Array(GRID_SIZE).fill(0);
    }
}

// wave propagation using:
// ht+1(x,y)=2ht(x,y)−ht−1(x,y)+c2Δt2[h(x+1,y)+h(x−1,y)+h(x,y+1)+h(x,y−1)−4h(x,y)]
// simplified as: next[x][y]=(avg of neighbors−previous[x][y])×damping
// The new height is determined by the current height,
// the previous height, and how curved the surface is at that point.
// Each point oscillates based on the difference between its
// neighbors and its previous state, with damping to simulate energy loss.
function updateWaves() {
    C2 = document.getElementById("wavespeed").value;
    DAMPING = document.getElementById("damping").value;
    const next = [];

    for (let y = 0; y < GRID_SIZE; y++) {
        next[y] = new Array(GRID_SIZE).fill(0);
    }

    for (let y = 1; y < GRID_SIZE - 1; y++) {
        for (let x = 1; x < GRID_SIZE - 1; x++) {
            const center = current[y][x];
            const laplacian =
                current[y - 1][x] +
                current[y + 1][x] +
                current[y][x - 1] +
                current[y][x + 1] -
                4 * center;

            next[y][x] = (2 * center - previous[y][x] + C2 * laplacian) * DAMPING;
        }
    }

    previous = current;
    current = next;
}

// apply heightmap to 3d geometry
function updateGeometry() {
    const positions = geometry.attributes.position.array;

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const index = (y * GRID_SIZE + x) * 3 + 1; // vertical axis
            positions[index] = current[y][x] * 2; // scale height
        }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
}

// mouse click to add ripples
function addRipple(gridX, gridY) {
    radius = document.getElementById("splashradius").value;
    strength = document.getElementById("splashstrength").value;

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const nx = gridX + dx;
            const ny = gridY + dy;

            if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) continue;

            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius) {
                const falloff = 1 - dist / radius;
                current[ny][nx] += strength * falloff;
            }
        }
    }
}

// click -> raycast -> grid -> ripple
function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObject(planeMesh);
    if (hits.length == 0) return;

    const point = hits[0].point;

    const gridX = Math.floor(((point.x + 7.5) / 15) * GRID_SIZE);
    const gridY = Math.floor(((point.z + 7.5) / 15) * GRID_SIZE);

    addRipple(gridX, gridY);
}

// resize handling
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function reset() {
    // Reset simulation parameters to defaults
    C2 = 0.35;
    DAMPING = 0.99;
    radius = 2;
    strength = 1.0;

    // Reset sliders visually
    document.getElementById("wavespeed").value = C2;
    document.getElementById("damping").value = DAMPING;
    document.getElementById("splashradius").value = radius;
    document.getElementById("splashstrength").value = strength;

    // Reset output labels
    document.getElementById("wavespeed-val").value = C2;
    document.getElementById("damping-val").value = DAMPING;
    document.getElementById("splashradius-val").value = radius;
    document.getElementById("splashstrength-val").value = strength;

    // Clear the heightmap (flat water)
    if (current && previous) {
        for (let y = 0; y < GRID_SIZE; y++) {
            current[y].fill(0);
            previous[y].fill(0);
        }
    }

    console.log("3D water simulation reset");
}

// animation loop
function animate() {
    if (!isRunning) return;

    updateWaves();
    updateGeometry();

    renderer.render(scene, camera);

    animationId = requestAnimationFrame(animate);
}

// public api
export function start3D() {
    if (isRunning) return;

    console.log("Starting 3D simulation");
    isRunning = true;

    if (!isInitialized) {
        if (!init()) return;
        isInitialized = true;
    }

    animationId = requestAnimationFrame(animate);
}

export function stop3D() {
    console.log("Stopping 3D simulation");
    isRunning = false;

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}
