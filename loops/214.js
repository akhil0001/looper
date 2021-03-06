import THREE from '../third_party/three.js';
import { renderer, getCamera } from '../modules/three.js';
import { MeshLine, MeshLineMaterial } from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';
import { Curves } from '../third_party/THREE.CurveExtras.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.5 });

palette.range = ["#296888", "#C39B4B", "#A24218", "#FCFCFB", "#093588", "#ffffff"];
//palette.range = ["#000000", "#555555"];

const gradient = new gradientLinear(palette.range);
const curve = new THREE.Curves.GrannyKnot();

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);

camera.position.set(.5, 15.5, -6.7);
camera.lookAt(group.position);
renderer.setClearColor(0x04031c, 1);

const strokeTexture = new THREE.TextureLoader().load('./assets/PaintBrushStroke05.png');
const resolution = new THREE.Vector2(canvas.width, canvas.height);

const POINTS = 50;
const meshes = [];

function prepareMesh(w, c) {

  var geo = new Float32Array(POINTS * 3);
  for (var j = 0; j < geo.length; j += 3) {
    geo[j] = geo[j + 1] = geo[j + 2] = 0;
  }

  var g = new MeshLine();
  g.setGeometry(geo, function(p) { return p; });

  const material = new MeshLineMaterial({
    map: strokeTexture,
    useMap: true,
    color: gradient.getAt(c),
    resolution: resolution,
    sizeAttenuation: true,
    lineWidth: w,
    near: camera.near,
    far: camera.far,
    depthWrite: false,
    depthTest: false,
    transparent: true,
    opacity: .85,
  });

  var mesh = new THREE.Mesh(g.geometry, material);
  mesh.geo = geo;
  mesh.g = g;

  return mesh;
}

const spread = .5;
for (let i = 0; i < 10; i++) {
  const w = 2 * Maf.randomInRange(.8, 1.2);
  const radius = .05 * Maf.randomInRange(4.5, 5.5);
  const color = i / 10; //Maf.randomInRange(0, 1);
  const offset = Maf.randomInRange(0, .01 * Maf.TAU);
  const range = 1 + Maf.randomInRange(0, .01 * Maf.TAU);
  const mesh = prepareMesh(w, color);
  mesh.position.set(Maf.randomInRange(-spread, spread), Maf.randomInRange(-spread, spread), Maf.randomInRange(-spread, spread));
  group.add(mesh);
  meshes.push({
    mesh,
    radius,
    offset,
    range,
  });

}
group.scale.setScalar(.5);
scene.add(group);

const loopDuration = 4;

function draw(startTime) {

  const time = (.001 * (performance.now() - startTime)) % loopDuration;
  const t = time / loopDuration;

  meshes.forEach((m) => {
    const geo = m.mesh.geo;
    const g = m.mesh.g;
    const range = m.range;
    const r = m.radius;
    for (var j = 0; j < geo.length; j += 3) {
      const t2 = Maf.TAU - (t * Maf.TAU + j * range / geo.length + m.offset);
      const p = curve.getPoint(1 - Maf.mod(t2 / Maf.TAU, 1));
      geo[j] = r * p.x;
      geo[j + 1] = r * p.y;
      geo[j + 2] = r * p.z;
    }
    g.setGeometry(geo);
  });

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };