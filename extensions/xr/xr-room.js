// xr-room.js
// CyberCrowd WebXR Entry Point
// Boots a VR session + creates a spatial room for surfaces/panels.

import * as THREE from "three";

let renderer, scene, camera;
let xrSessionActive = false;

export async function startXRRoom() {
  if (!navigator.xr) {
    console.error("WebXR not supported");
    return;
  }

  try {
    const session = await navigator.xr.requestSession("immersive-vr", {
      optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"]
    });

    xrSessionActive = true;

    setupThree(session);
    setupRoom();
    renderer.setAnimationLoop(onXRFrame);

  } catch (err) {
    console.error("Failed to start XR session:", err);
  }
}

function setupThree(session) {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.xr.enabled = true;
  renderer.xr.setSession(session);

  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 200);
  scene.add(camera);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupRoom() {
  // Floor plane
  const floorGeo = new THREE.PlaneGeometry(20, 20);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Ambient light
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  // Directional light
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(3, 5, 2);
  scene.add(dir);

  // Placeholder: central “operator station”
  const stationGeo = new THREE.BoxGeometry(1.5, 0.1, 1.5);
  const stationMat = new THREE.MeshStandardMaterial({ color: 0x222244 });
  const station = new THREE.Mesh(stationGeo, stationMat);
  station.position.set(0, 1, -2);
  scene.add(station);

  // Hook for surfaces → 3D panels
  window.CyberCrowdXR = {
    addPanel: addPanelToRoom,
    removePanel: removePanelFromRoom
  };
}

function addPanelToRoom(mesh) {
  // mesh = THREE.Mesh representing a surface panel
  scene.add(mesh);
}

function removePanelFromRoom(mesh) {
  scene.remove(mesh);
}

function onXRFrame(time, frame) {
  if (!xrSessionActive) return;
  renderer.render(scene, camera);
}
