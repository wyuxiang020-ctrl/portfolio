import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

type RoomId = 'ai' | 'architecture' | 'about';
type WorldState = { time: number; form: number; open: number; selected: string | null; night: number };
type Ribbon = { mesh: THREE.Mesh; radius: number; start: number; end: number; phase: number; height: number; room: RoomId; center: THREE.Vector3 };

/** A deliberately small, explorable architectural toy, built without external assets. */
export function createRibbonWorld() {
  const group = new THREE.Group();
  group.name = 'Ribbon atelier';
  const pickables: THREE.Object3D[] = [];
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const geometryCache = new Map<string, THREE.BufferGeometry>();
  const materialCache = new Map<string, THREE.MeshStandardMaterial>();
  const ribbons: Ribbon[] = [];
  const roofs: { group: THREE.Group; room: RoomId; base: number }[] = [];
  const interiors: THREE.Group[] = [];
  const lights: THREE.PointLight[] = [];
  const illuminated: THREE.MeshStandardMaterial[] = [];
  const looseThings: { mesh: THREE.Object3D; y: number; phase: number }[] = [];
  const treeCrowns: THREE.Object3D[] = [];
  const rooms = {
    ai: { target: new THREE.Vector3(-3.3, 0.7, -1.8), labelAnchor: new THREE.Vector3(-3.3, 3.6, -1.8) },
    architecture: { target: new THREE.Vector3(2.65, 0.7, -1.2), labelAnchor: new THREE.Vector3(2.65, 3.5, -1.2) },
    about: { target: new THREE.Vector3(0.05, 0.6, 3.6), labelAnchor: new THREE.Vector3(0.05, 3.35, 3.6) },
  };
  const colors = { ivory: '#eee5d3', milk: '#fff8e9', wood: '#bb8152', woodLight: '#d8a879', earth: '#c88966', dark: '#324744', sage: '#98ada1', mint: '#c1d1bb', coral: '#cd795b', mustard: '#d3ae65', ink: '#405c57', paper: '#f5eee1', soil: '#85624d' };
  const smooth = (a: number, b: number, x: number) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  function mat(color: string, roughness = 0.76, emissive = false) {
    const key = `${color}/${roughness}/${emissive}`;
    if (!materialCache.has(key)) {
      const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...(emissive ? { emissive: color, emissiveIntensity: 0.1 } : {}) });
      materialCache.set(key, m); materials.add(m); if (emissive) illuminated.push(m);
    }
    return materialCache.get(key)!;
  }
  function geo(key: string, make: () => THREE.BufferGeometry) {
    if (!geometryCache.has(key)) { const g = make(); geometryCache.set(key, g); geometries.add(g); }
    return geometryCache.get(key)!;
  }
  function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, color: string, radius = 0.055) {
    const r = Math.min(radius, w / 3, h / 3, d / 3);
    return mesh(parent, geo(`b:${w}:${h}:${d}:${r}`, () => new RoundedBoxGeometry(w, h, d, 2, r)), mat(color), x, y, z);
  }
  function cylinder(parent: THREE.Object3D, x: number, y: number, z: number, r: number, h: number, color: string, top = r, segments = 48) {
    return mesh(parent, geo(`c:${r}:${top}:${h}:${segments}`, () => new THREE.CylinderGeometry(top, r, h, segments)), mat(color), x, y, z);
  }
  function orb(parent: THREE.Object3D, x: number, y: number, z: number, r: number, color: string, scale?: number[]) {
    const m = mesh(parent, geo('sphere', () => new THREE.SphereGeometry(1, 20, 14)), mat(color), x, y, z);
    m.scale.set(r * (scale?.[0] ?? 1), r * (scale?.[1] ?? 1), r * (scale?.[2] ?? 1)); return m;
  }
  function tube(parent: THREE.Object3D, points: THREE.Vector3[], r: number, color: string, closed = false) {
    const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), Math.max(20, points.length * 5), r, 8, closed);
    geometries.add(geometry); return mesh(parent, geometry, mat(color));
  }
  function segment(parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
    const m = cylinder(parent, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, r, a.distanceTo(b), color, r, 12);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m;
  }
  function ring(parent: THREE.Object3D, radius: number, thickness: number, y: number, color: string) {
    const m = mesh(parent, geo(`torus:${radius}:${thickness}`, () => new THREE.TorusGeometry(radius, thickness, 10, 72)), mat(color), 0, y, 0);
    m.rotation.x = -Math.PI / 2; return m;
  }
  function sector(parent: THREE.Object3D, inner: number, outer: number, start: number, end: number, depth: number, color: string, y = 0) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outer, start, end, false);
    shape.lineTo(inner * Math.cos(end), inner * Math.sin(end));
    shape.absarc(0, 0, inner, end, start, true); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth, steps: 1, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.045, bevelThickness: 0.035, curveSegments: 40 });
    g.rotateX(Math.PI / 2); geometries.add(g);
    return mesh(parent, g, mat(color), 0, y + depth, 0);
  }
  function plant(parent: THREE.Object3D, x: number, z: number, size = 1, color = colors.sage) {
    const p = new THREE.Group(); p.position.set(x, 0.21, z); p.scale.setScalar(size); parent.add(p);
    cylinder(p, 0, 0.18, 0, 0.18, 0.33, colors.coral, 0.24, 24);
    cylinder(p, 0, 0.346, 0, 0.205, 0.035, colors.soil);
    for (let i = 0; i < 5; i++) {
      const a = i * 2.4; const h = 0.58 + (i % 3) * 0.11;
      const leaf = orb(p, Math.cos(a) * 0.13, h, Math.sin(a) * 0.13, 0.13, i % 2 ? color : colors.mint, [0.65, 1.65, 1]);
      leaf.rotation.z = Math.cos(a) * 0.52; leaf.rotation.x = Math.sin(a) * 0.5;
      segment(p, new THREE.Vector3(0, 0.33, 0), leaf.position, 0.018, color);
    }
    return p;
  }
  function tree(parent: THREE.Object3D, x: number, z: number, scale = 1) {
    const p = new THREE.Group(); p.position.set(x, 0.02, z); p.scale.setScalar(scale); parent.add(p);
    cylinder(p, 0, 0.105, 0, 0.45, 0.16, colors.ivory);
    cylinder(p, 0, 0.2, 0, 0.34, 0.08, colors.soil);
    segment(p, new THREE.Vector3(0, 0.19, 0), new THREE.Vector3(0.02, 1.4, 0), 0.065, colors.wood);
    segment(p, new THREE.Vector3(0, 0.88, 0), new THREE.Vector3(-0.31, 1.45, 0.04), 0.041, colors.wood);
    const crown = new THREE.Group(); crown.position.y = 0.8; p.add(crown); treeCrowns.push(crown);
    orb(crown, -0.23, 0.7, 0, 0.47, colors.sage, [1, 1.2, 0.9]);
    orb(crown, 0.19, 0.8, 0.02, 0.46, colors.mint, [0.85, 1.25, 0.88]);
    orb(crown, 0, 1.15, 0.07, 0.34, colors.sage, [0.88, 1, 0.85]);
    return p;
  }
  function book(parent: THREE.Object3D, x: number, y: number, z: number, w: number, d: number, color: string, rotation = 0) {
    const b = new THREE.Group(); b.position.set(x, y, z); b.rotation.y = rotation; parent.add(b);
    box(b, 0, 0, 0, w, 0.065, d, color, 0.012); box(b, 0.009, 0.003, 0, w - 0.025, 0.039, d - 0.04, colors.paper, 0.005); return b;
  }
  function person(parent: THREE.Object3D, x: number, z: number, color: string, angle = 0, seated = false) {
    const p = new THREE.Group(); p.position.set(x, 0.22, z); p.rotation.y = angle; parent.add(p);
    const by = seated ? 0.26 : 0;
    if (seated) {
      box(p, -0.085, 0.14, 0.12, 0.12, 0.27, 0.13, colors.dark); box(p, 0.085, 0.14, 0.12, 0.12, 0.27, 0.13, colors.dark);
    } else {
      cylinder(p, -0.07, 0.14, 0, 0.053, 0.28, colors.dark); cylinder(p, 0.07, 0.14, 0, 0.053, 0.28, colors.dark);
    }
    orb(p, 0, 0.42 + by, 0, 0.15, color, [0.92, 1.4, 0.72]);
    orb(p, 0, 0.67 + by, 0, 0.12, '#d9aa81'); orb(p, 0, 0.733 + by, -0.015, 0.107, colors.dark, [1.06, 0.68, 1]);
    return p;
  }
  function light(parent: THREE.Object3D, x: number, y: number, z: number, intensity = 0.8) {
    const bulb = mesh(parent, geo('bulb', () => new THREE.SphereGeometry(0.065, 12, 8)), mat('#ffcc80', 0.5, true), x, y, z);
    bulb.castShadow = false;
    const l = new THREE.PointLight('#ffcf91', intensity, 4, 1.7); l.position.copy(bulb.position); parent.add(l); lights.push(l); return l;
  }

  // One seamless, thick ribbon per pavilion. Rounded cross-sections avoid paper-thin walls.
  const STEPS = 116, CROSS = 16;
  function addRibbon(room: RoomId, radius: number, height: number, color: string, phase: number) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array((STEPS + 1) * CROSS * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    const indices: number[] = [];
    for (let i = 0; i < STEPS; i++) for (let j = 0; j < CROSS; j++) {
      const a = i * CROSS + j, b = i * CROSS + (j + 1) % CROSS, c = (i + 1) * CROSS + j, d = (i + 1) * CROSS + (j + 1) % CROSS;
      indices.push(a, b, c, b, d, c);
    }
    for (let j = 1; j < CROSS - 1; j++) { indices.push(0, j + 1, j); const b = STEPS * CROSS; indices.push(b, b + j, b + j + 1); }
    geometry.setIndex(indices); geometries.add(geometry);
    const ribbonMesh = mesh(group, geometry, mat(color)); ribbonMesh.userData.room = room; pickables.push(ribbonMesh);
    ribbons.push({ mesh: ribbonMesh, radius, height, room, start: 0.09 * Math.PI, end: 1.92 * Math.PI, phase, center: rooms[room].target.clone().setY(0) });
  }
  function reshapeRibbon(r: Ribbon, form: number, opening: number) {
    const points: { x: number; z: number; h: number; theta: number }[] = [];
    for (let i = 0; i <= STEPS; i++) {
      const u = i / STEPS, theta = THREE.MathUtils.lerp(r.start, r.end, u);
      const rear = Math.pow(0.5 - 0.5 * Math.sin(theta), 1.25);
      const frontDip = 1 - 0.35 * Math.exp(-Math.pow((u - 0.25) / 0.17, 2));
      const waveHeight = (0.55 + rear * r.height + 0.13 * Math.sin(u * Math.PI * 4 + r.phase)) * frontDip;
      const radius = r.radius + Math.sin(u * Math.PI) * opening * 0.31;
      const circleX = Math.cos(theta) * radius, circleZ = Math.sin(theta) * radius;
      const flatX = (u - 0.5) * 5.9;
      const flatZ = Math.sin(u * Math.PI * 2.1 + r.phase * 0.5) * 0.86;
      points.push({ x: r.center.x + THREE.MathUtils.lerp(flatX, circleX, form), z: r.center.z + THREE.MathUtils.lerp(flatZ, circleZ, form), h: THREE.MathUtils.lerp(0.40 + 0.18 * Math.sin(u * Math.PI * 2 + r.phase), waveHeight, form) * (1 - opening * (0.10 + 0.12 * (1 - rear))), theta });
    }
    const a = r.mesh.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i <= STEPS; i++) {
      const p = points[i], before = points[Math.max(0, i - 1)], after = points[Math.min(STEPS, i + 1)];
      const dx = after.x - before.x, dz = after.z - before.z, length = Math.hypot(dx, dz) || 1;
      const nx = dz / length, nz = -dx / length;
      // Four arcs of a round-cornered rectangle, in continuous counter-clockwise order.
      const half = 0.105, corner = 0.078, bottom = 0.23, top = bottom + p.h;
      for (let j = 0; j < CROSS; j++) {
        const quadrant = Math.floor(j / 4), t = (j % 4) / 3 * Math.PI / 2;
        const angle = quadrant * Math.PI / 2 + t;
        const cx = (quadrant === 0 || quadrant === 3) ? half - corner : -half + corner;
        const cy = quadrant < 2 ? top - corner : bottom + corner;
        const side = cx + Math.cos(angle) * corner;
        const y = cy + Math.sin(angle) * corner;
        a.setXYZ(i * CROSS + j, p.x + nx * side, y, p.z + nz * side);
      }
    }
    a.needsUpdate = true; r.mesh.geometry.computeVertexNormals(); r.mesh.geometry.computeBoundingSphere();
  }

  const groundDetails = new THREE.Group(); group.add(groundDetails); interiors.push(groundDetails);
  // Broad connecting decks make the three round rooms read as one walkable place.
  function connection(a: RoomId, b: RoomId, width: number) {
    const p = rooms[a].target.clone().setY(0), q = rooms[b].target.clone().setY(0);
    const distance = p.distanceTo(q), center = p.clone().add(q).multiplyScalar(0.5);
    const deck = box(groundDetails, center.x, 0.10, center.z, width, 0.16, distance - 3.75, colors.ivory, 0.065);
    deck.rotation.y = Math.atan2(q.x - p.x, q.z - p.z);
    const detail = box(groundDetails, center.x, 0.19, center.z, width - 0.13, 0.035, distance - 3.78, colors.woodLight, 0.014);
    detail.rotation.y = deck.rotation.y;
    for (let i = -2; i <= 2; i++) {
      const offset = new THREE.Vector3(0, 0, i * 0.19).applyAxisAngle(new THREE.Vector3(0, 1, 0), deck.rotation.y);
      const stripe = box(groundDetails, center.x + offset.x, 0.211, center.z + offset.z, width - 0.16, 0.008, 0.011, colors.wood, 0.002); stripe.rotation.y = deck.rotation.y;
    }
  }
  connection('ai', 'architecture', 1.2); connection('ai', 'about', 1.08); connection('architecture', 'about', 1.15);

  function pavilion(id: RoomId, color: string, roofColor: string, wallHeight: number, phase: number) {
    const c = rooms[id].target;
    const floor = new THREE.Group(); floor.position.set(c.x, 0, c.z); group.add(floor); interiors.push(floor);
    cylinder(floor, 0, 0.075, 0, 2.35, 0.15, '#ddd3bc');
    cylinder(floor, 0, 0.17, 0, 2.27, 0.13, colors.ivory);
    cylinder(floor, 0, 0.238, 0, 2.06, 0.025, id === 'ai' ? '#dedfc9' : id === 'architecture' ? '#e6d4b5' : '#e8d4be');
    ring(floor, 2.20, 0.022, 0.24, '#cabda4');
    addRibbon(id, 2.05, wallHeight, color, phase);
    const content = new THREE.Group(); content.position.copy(floor.position); group.add(content); interiors.push(content);
    const roof = new THREE.Group(); roof.position.set(c.x, 2.48, c.z); group.add(roof);
    sector(roof, id === 'architecture' ? 1.00 : 0.58, 2.24, Math.PI * 1.05, Math.PI * 1.93, 0.17, roofColor);
    // A slender timber soffit beneath the hovering, rounded canopy.
    sector(roof, id === 'architecture' ? 1.08 : 0.66, 2.14, Math.PI * 1.07, Math.PI * 1.91, 0.045, colors.woodLight, -0.055);
    for (let i = 0; i < 7; i++) {
      const t = Math.PI * (1.13 + i * 0.115);
      const rib = box(roof, Math.cos(t) * 1.43, -0.047, Math.sin(t) * 1.43, 0.035, 0.04, 1.2, colors.wood, 0.012); rib.rotation.y = -t + Math.PI / 2;
    }
    roofs.push({ group: roof, room: id, base: 2.48 });
    // Discreet entrance threshold and two warmly lit wall bollards.
    const threshold = box(content, 2.00, 0.245, 0.0, 0.56, 0.04, 0.86, colors.woodLight); threshold.rotation.y = -0.08;
    for (const z of [-0.37, 0.5]) { cylinder(content, 1.91, 0.55, z, 0.043, 0.61, colors.ink, 0.043, 16); light(content, 1.91, 0.89, z, 0.26); }
    content.userData.room = id; roof.userData.room = id; floor.userData.room = id;
    for (const root of [content, roof, floor]) root.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.userData.room = id; pickables.push(o); } });
    light(content, 0, 1.6, -0.7, 1.2);
    return { content, roof, floor };
  }

  const ai = pavilion('ai', '#c6d2ba', colors.sage, 1.35, 0.4);
  // AI atelier: crescent workbench, big tactile screens, a floating thought bubble.
  const aiDesk = new THREE.Group(); aiDesk.position.set(-0.14, 0, -0.42); ai.content.add(aiDesk);
  box(aiDesk, 0, 0.9, 0, 2.48, 0.14, 0.9, colors.woodLight, 0.07);
  for (const x of [-0.87, 0.87]) box(aiDesk, x, 0.57, 0, 0.11, 0.67, 0.63, colors.milk, 0.025);
  function monitor(parent: THREE.Object3D, x: number, z: number, scale: number, angle: number) {
    const m = new THREE.Group(); m.position.set(x, 0.98, z); m.rotation.y = angle; m.scale.setScalar(scale); parent.add(m);
    cylinder(m, 0, 0.02, 0, 0.2, 0.04, colors.dark); box(m, 0, 0.21, -0.01, 0.065, 0.40, 0.065, colors.dark);
    box(m, 0, 0.49, 0, 0.91, 0.61, 0.085, colors.dark, 0.045);
    const screen = box(m, 0, 0.49, 0.05, 0.82, 0.52, 0.018, '#d4e1d4', 0.018); screen.material = mat('#a9cbbb', 0.55, true);
    box(m, -0.25, 0.49, 0.064, 0.17, 0.39, 0.01, '#80a397', 0.005);
    for (let j = 0; j < 3; j++) box(m, 0.08, 0.63 - j * 0.12, 0.068, 0.35 - j * 0.055, 0.055, 0.012, j === 1 ? colors.milk : colors.sage, 0.008);
    return m;
  }
  monitor(aiDesk, -0.37, -0.12, 1.05, -0.1); monitor(aiDesk, 0.67, -0.10, 0.65, -0.23);
  box(aiDesk, -0.34, 0.985, 0.27, 0.64, 0.035, 0.21, colors.milk, 0.012);
  for (let i = 0; i < 7; i++) box(aiDesk, -0.60 + i * 0.078, 1.008, 0.275, 0.044, 0.01, 0.12, '#c8ccc0', 0.003);
  cylinder(aiDesk, 0.91, 1.06, 0.24, 0.065, 0.18, colors.coral); cylinder(aiDesk, 0.91, 1.154, 0.24, 0.052, 0.01, colors.dark);
  for (const x of [-0.66, 0.56]) {
    cylinder(ai.content, x, 0.64, 0.55, 0.29, 0.14, colors.coral); cylinder(ai.content, x, 0.41, 0.55, 0.08, 0.35, colors.ink);
    cylinder(ai.content, x, 0.24, 0.55, 0.24, 0.055, colors.ink);
    const back = box(ai.content, x, 0.89, 0.75, 0.48, 0.45, 0.11, colors.coral, 0.055); back.rotation.x = -0.11;
  }
  // A ribbon-shaped wall display with dimensional cards, facing the entrance.
  const board = new THREE.Group(); board.position.set(-0.48, 1.14, -1.62); board.rotation.y = -0.18; ai.content.add(board);
  box(board, 0, 0, 0, 1.22, 0.72, 0.065, colors.ivory);
  for (let i = 0; i < 3; i++) { box(board, -0.39 + i * 0.39, 0.035, 0.045, 0.28, 0.38, 0.02, i === 1 ? colors.mustard : colors.milk, 0.014); box(board, -0.39 + i * 0.39, 0.27, 0.065, 0.10, 0.03, 0.012, colors.coral, 0.005); }
  plant(ai.content, -1.29, 0.72, 1.18); plant(ai.content, 1.04, -1.12, 0.70);
  person(ai.content, -0.70, 0.58, '#e7d8bb', Math.PI, true);
  const bubble = orb(ai.content, 0.52, 1.92, -0.32, 0.17, colors.mustard, [1, 0.87, 1]); looseThings.push({ mesh: bubble, y: 1.92, phase: 0 });

  const architecture = pavilion('architecture', '#ead6af', '#d1ab68', 1.48, 1.8);
  // A central model-making table carrying a miniature of the three pavilions.
  cylinder(architecture.content, 0.0, 0.61, 0.05, 0.23, 0.70, colors.wood);
  cylinder(architecture.content, 0.0, 0.98, 0.05, 0.98, 0.13, colors.woodLight);
  cylinder(architecture.content, 0.0, 1.057, 0.05, 0.86, 0.023, colors.paper);
  for (const [x, z, r, h] of [[-0.30, -0.19, 0.23, 0.26], [0.32, -0.08, 0.24, 0.18], [-0.02, 0.35, 0.20, 0.15]]) {
    cylinder(architecture.content, x, 1.09 + h / 2, z + 0.05, r, h, colors.milk);
    ring(architecture.content, r * 0.72, 0.023, 1.10 + h, colors.wood).position.set(x, 1.1 + h, z + 0.05);
  }
  book(architecture.content, 0.62, 1.10, 0.40, 0.21, 0.3, colors.coral, -0.2);
  box(architecture.content, -0.51, 1.092, 0.60, 0.42, 0.025, 0.12, colors.mustard, 0.005);
  // Three pinned drawings and their rails form a small exhibition around the arc.
  for (let i = 0; i < 3; i++) {
    const theta = Math.PI * (1.14 + i * 0.22), display = new THREE.Group();
    display.position.set(Math.cos(theta) * 1.77, 1.16, Math.sin(theta) * 1.77); display.rotation.y = Math.PI * 1.5 - theta;
    architecture.content.add(display);
    box(display, 0, 0, 0, 0.68, 0.87, 0.054, colors.wood, 0.022); box(display, 0, 0, 0.035, 0.61, 0.80, 0.018, colors.paper, 0.01);
    const circle = mesh(display, geo(`diagram-ring`, () => new THREE.TorusGeometry(0.155, 0.009, 6, 36)), mat(colors.sage), 0, 0.10, 0.054);
    circle.rotation.z = 0.2;
    box(display, -0.10, 0.09, 0.056, 0.008, 0.43, 0.008, colors.wood); box(display, 0, -0.16, 0.056, 0.42, 0.007, 0.008, colors.wood);
    for (let j = 0; j < 3; j++) box(display, -0.025, -0.24 - j * 0.045, 0.052, 0.38 - j * 0.06, 0.009, 0.008, '#b4baa6', 0.002);
  }
  // Three nested curved steps: seating, circulation and a useful change of section.
  for (let i = 0; i < 3; i++) sector(architecture.content, 1.12 + i * 0.22, 1.36 + i * 0.22, Math.PI * 0.14, Math.PI * 0.69, 0.09, i % 2 ? colors.woodLight : '#d9c6a4', 0.22 + (2 - i) * 0.13);
  person(architecture.content, 1.11, 0.67, colors.sage, -0.7);
  plant(architecture.content, -1.24, 0.72, 0.83);
  const stool = cylinder(architecture.content, -0.83, 0.49, 0.71, 0.20, 0.48, colors.coral); stool.rotation.y = 0.2;

  const about = pavilion('about', '#deb29a', '#c88365', 1.28, 2.9);
  // The personal room is a reading nook with a curved sofa and a built-in library.
  cylinder(about.content, 0, 0.27, 0.09, 1.40, 0.028, '#d4c5a3');
  const sofa = new THREE.Group(); sofa.position.set(-0.3, 0, -0.45); about.content.add(sofa);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI * (1.05 + i * 0.18), part = new THREE.Group(); part.position.set(Math.cos(a) * 0.92, 0, Math.sin(a) * 0.73); part.rotation.y = -a + Math.PI / 2; sofa.add(part);
    box(part, 0, 0.56, 0, 0.60, 0.22, 0.62, colors.sage, 0.10); box(part, 0, 0.85, -0.25, 0.61, 0.49, 0.20, colors.sage, 0.09);
    for (const x of [-0.20, 0.20]) cylinder(part, x, 0.33, 0.07, 0.035, 0.18, colors.wood);
    if (i === 1 || i === 3) { const cushion = box(part, 0, 0.82, -0.08, 0.30, 0.28, 0.12, i === 1 ? colors.mustard : colors.milk, 0.055); cushion.rotation.z = 0.2; }
  }
  cylinder(about.content, -0.20, 0.49, 0.28, 0.065, 0.41, colors.wood);
  cylinder(about.content, -0.20, 0.71, 0.28, 0.57, 0.09, colors.woodLight);
  book(about.content, -0.29, 0.80, 0.27, 0.34, 0.25, colors.coral, 0.23); book(about.content, -0.25, 0.85, 0.29, 0.27, 0.22, colors.milk, -0.12);
  cylinder(about.content, 0.05, 0.82, 0.46, 0.055, 0.14, colors.milk);
  // Books lie against a curved wall but remain individual, friendly objects.
  for (let shelf = 0; shelf < 3; shelf++) {
    const y = 0.54 + shelf * 0.39;
    sector(about.content, 1.57, 1.85, Math.PI * 1.35, Math.PI * 1.91, 0.07, colors.woodLight, y);
    for (let j = 0; j < 9; j++) {
      const angle = Math.PI * (1.39 + j * 0.057), h = 0.15 + (j % 3) * 0.034;
      const b = box(about.content, Math.cos(angle) * 1.70, y + 0.13 + h / 2, Math.sin(angle) * 1.70, 0.075, h, 0.16, [colors.paper, colors.sage, colors.coral, colors.mustard][(j + shelf) % 4], 0.009); b.rotation.y = -angle;
    }
  }
  // A large arching reading lamp, a miniature sleeping cat and a leafy plant.
  cylinder(about.content, 1.0, 0.27, -0.05, 0.17, 0.07, colors.dark);
  tube(about.content, [new THREE.Vector3(1, 0.29, -0.05), new THREE.Vector3(1, 1.45, -0.05), new THREE.Vector3(0.86, 1.72, -0.05), new THREE.Vector3(0.56, 1.69, -0.05)], 0.026, colors.dark);
  cylinder(about.content, 0.56, 1.61, -0.05, 0.19, 0.18, colors.mustard, 0.11); light(about.content, 0.56, 1.52, -0.05, 0.55);
  orb(about.content, 0.49, 0.42, 1.04, 0.19, colors.coral, [1.35, 0.62, 0.93]);
  orb(about.content, 0.65, 0.47, 1.01, 0.11, colors.coral);
  for (const x of [0.60, 0.70]) { const ear = mesh(about.content, geo('cat-ear', () => new THREE.ConeGeometry(0.043, 0.10, 4)), mat(colors.coral), x, 0.565, 1.0); ear.rotation.z = x < 0.65 ? 0.24 : -0.24; }
  tube(about.content, [new THREE.Vector3(0.32, 0.42, 1.06), new THREE.Vector3(0.26, 0.39, 1.20), new THREE.Vector3(0.42, 0.39, 1.25)], 0.036, colors.coral);
  plant(about.content, -1.36, 0.31, 1.0); plant(about.content, 1.23, -1.0, 0.77);
  // A rounded skylight perched on the rear canopy gives this room its own silhouette.
  const skylight = orb(about.roof, -0.30, 0.24, -1.31, 0.33, '#d6e2d9', [1.25, 0.70, 1]);
  ring(about.roof, 0.33, 0.025, 0.22, colors.milk).position.z = -1.31;

  // Outdoor life remains sparse enough for the architecture to stay legible.
  tree(groundDetails, -5.02, 0.31, 1.05); tree(groundDetails, 4.51, -3.12, 1.22); tree(groundDetails, 1.97, 5.29, 0.83);
  plant(groundDetails, -1.92, 3.87, 0.69);
  person(groundDetails, 0.39, -1.76, colors.coral, -1.1);
  // Two little bicycle wheels and a simple frame parked beside the shared courtyard.
  const bike = new THREE.Group(); bike.position.set(-1.62, 0.04, 1.12); bike.rotation.y = -0.43; groundDetails.add(bike);
  for (const x of [-0.26, 0.26]) { const wheel = mesh(bike, geo('bike-wheel', () => new THREE.TorusGeometry(0.18, 0.022, 8, 24)), mat(colors.dark), x, 0.32, 0); wheel.rotation.y = 0; }
  for (const [a, b] of [[[0.26, 0.32, 0], [0.05, 0.63, 0]], [[0.05, 0.63, 0], [-0.07, 0.33, 0]], [[-0.07, 0.33, 0], [-0.26, 0.32, 0]], [[-0.26, 0.32, 0], [-0.13, 0.59, 0]], [[-0.13, 0.59, 0], [0.05, 0.63, 0]], [[-0.13, 0.59, 0], [-0.07, 0.33, 0]]] as number[][][]) segment(bike, new THREE.Vector3(...a as [number, number, number]), new THREE.Vector3(...b as [number, number, number]), 0.021, colors.coral);
  box(bike, -0.13, 0.66, 0, 0.14, 0.03, 0.07, colors.dark, 0.012);
  segment(bike, new THREE.Vector3(0.05, 0.63, 0), new THREE.Vector3(0.01, 0.75, 0), 0.017, colors.dark);

  // Mark every late-added furnishing too, so clicking a roof, desk or book opens its room.
  for (const [id, p] of Object.entries({ ai, architecture, about })) for (const root of [p.content, p.roof]) root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && !o.userData.room) { o.userData.room = id; pickables.push(o); }
  });
  let lastForm = -1, lastOpen = -1, lastSelected: string | null = null;
  function update({ time, form, open, selected, night }: WorldState) {
    form = THREE.MathUtils.clamp(form, 0, 1); open = THREE.MathUtils.clamp(open, 0, 1);
    if (Math.abs(form - lastForm) > 0.0001 || Math.abs(open - lastOpen) > 0.0001 || selected !== lastSelected) {
      for (const r of ribbons) reshapeRibbon(r, form, selected === 'all' || selected === r.room ? open : 0);
      lastForm = form; lastOpen = open; lastSelected = selected;
    }
    const reveal = smooth(0.52, 0.93, form);
    for (const i of interiors) { i.visible = reveal > 0.001; i.scale.y = Math.max(0.001, reveal); }
    for (const roof of roofs) {
      const lift = selected === 'all' || selected === roof.room ? open : 0;
      roof.group.visible = form > 0.60;
      roof.group.scale.setScalar(Math.max(0.001, smooth(0.62, 1, form)));
      roof.group.position.y = roof.base + (1 - smooth(0.62, 1, form)) * 0.7 + lift * 0.95;
      roof.group.rotation.y = -lift * 0.12;
    }
    for (const material of illuminated) material.emissiveIntensity = 0.1 + night * 1.25;
    for (const l of lights) l.intensity = (0.15 + night * 1.0) * reveal;
    for (const thing of looseThings) { thing.mesh.position.y = thing.y + Math.sin(time * 1.6 + thing.phase) * 0.045; thing.mesh.rotation.y = time * 0.22; }
    for (let i = 0; i < treeCrowns.length; i++) treeCrowns[i].rotation.z = Math.sin(time * 0.72 + i * 1.2) * 0.016;
  }
  update({ time: 0, form: 1, open: 0, selected: null, night: 0 });
  return {
    group, pickables, rooms, update,
    dispose() { for (const g of geometries) g.dispose(); for (const m of materials) m.dispose(); group.clear(); },
  };
}
