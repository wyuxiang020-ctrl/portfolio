import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';

export async function mountITBViewer(root: HTMLElement, pageSignal: AbortSignal) {
  const stage = root.querySelector<HTMLElement>('.model-canvas')!;
  const intro = root.querySelector<HTMLElement>('.model-intro')!;
  const tools = root.querySelector<HTMLElement>('.model-tools')!;
  const status = root.querySelector<HTMLElement>('.model-status')!;
  const layers = root.querySelector<HTMLElement>('[data-layers]')!;
  const controller = new AbortController();
  const { signal } = controller;
  let renderer: THREE.WebGLRenderer | undefined;
  let controls: OrbitControls | undefined;
  let resize: ResizeObserver | undefined;
  let intersection: IntersectionObserver | undefined;
  let model: THREE.Group | undefined;
  let frame = 0, disposed = false, onscreen = true;
  const started = performance.now();
  function disposeModel(object: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    object.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        materials.add(material);
        Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
      }
    });
    geometries.forEach(g => g.dispose());materials.forEach(m => m.dispose());
    textures.forEach(t => { t.dispose(); t.source?.data?.close?.(); });
  }
  function dispose() {
    if (disposed) return;
    disposed = true;controller.abort();cancelAnimationFrame(frame);
    pageSignal.removeEventListener('abort', dispose);
    controls?.dispose();resize?.disconnect();intersection?.disconnect();
    if (model) disposeModel(model);
    renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();
    layers.replaceChildren();tools.hidden = true;intro.hidden = false;
    root.dataset.modelState = 'closed';status.textContent = '';
  }
  pageSignal.addEventListener('abort', dispose, { once: true });
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    root.dataset.modelState = 'loading';
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0xf4f2ed);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;canvas.setAttribute('aria-label', `${root.dataset.modelName || 'ITB'} 建筑三维模型，可旋转、缩放和平移`);
    stage.append(canvas);
    const response = await fetch(root.dataset.modelUrl!, { signal });
    if (!response.ok) throw new Error(`Model HTTP ${response.status}`);
    const length = Number(response.headers.get('content-length'));
    const chunks: Uint8Array[] = [];let received = 0;
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream');
    while (true) {
      const { done, value } = await reader.read();if (done) break;
      chunks.push(value);received += value.length;
      status.textContent = length ? `正在加载模型 ${Math.min(100, Math.round(received / length * 100))}%` : `已加载 ${(received / 1048576).toFixed(1)} MB`;
    }
    const data = new Uint8Array(received);let offset = 0;
    for (const chunk of chunks) { data.set(chunk, offset);offset += chunk.length; }
    const downloaded = performance.now();
    status.textContent = '正在准备建筑几何…';
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(data.buffer, '/models/');
    model = gltf.scene;
    if (disposed || signal.aborted) { disposeModel(model);throw new Error('Model loading cancelled'); }
    scene.add(model);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x777c66, 2.2));
    const sun = new THREE.DirectionalLight(0xfff7e7, 3.2);sun.position.set(-30, 60, 40);scene.add(sun);
    const fill = new THREE.DirectionalLight(0xe5eeff, 1.2);fill.position.set(30, 15, -35);scene.add(fill);
    const box = new THREE.Box3().setFromObject(model);
    const siteCenter = box.getCenter(new THREE.Vector3());
    const siteRadius = box.getSize(new THREE.Vector3()).length() / 2;
    const bounds = root.dataset.focusBounds ? JSON.parse(root.dataset.focusBounds) as number[] : undefined;
    const focusBox = bounds?.length === 6 && bounds.every(Number.isFinite)
      ? new THREE.Box3(new THREE.Vector3(...bounds.slice(0, 3)), new THREE.Vector3(...bounds.slice(3, 6))) : box;
    const center = focusBox.getCenter(new THREE.Vector3());
    const size = focusBox.getSize(new THREE.Vector3());
    const radius = size.length() / 2;
    camera.far = Math.max(500, siteRadius * 30);
    camera.updateProjectionMatrix();
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = false;controls.screenSpacePanning = true;
    controls.minDistance = .5;controls.maxDistance = siteRadius * 8;
    controls.target.copy(center);
    function render() {
      frame = 0;if (disposed || !onscreen || document.hidden) return;
      renderer!.render(scene, camera);
      root.dataset.camera = JSON.stringify({ position:camera.position.toArray(), target:controls!.target.toArray() });
      root.dataset.drawCalls = String(renderer!.info.render.calls);
      root.dataset.triangles = String(renderer!.info.render.triangles);
    }
    function invalidate() { if (!frame && !disposed) frame = requestAnimationFrame(render); }
    function view(name: string) {
      const directions: Record<string, number[]> = { overview: [-1, .85, 1.1], top: [0, 1, .001], front: [0, .15, 1], side: [1, .15, 0] };
      const direction = new THREE.Vector3(...(directions[name] || directions.overview)).normalize();
      const limitingFov = Math.min(camera.fov * Math.PI / 180, 2 * Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect));
      const targetCenter = name === 'site' ? siteCenter : center;
      const distance = (name === 'site' ? siteRadius : radius) / Math.sin(limitingFov / 2) * 1.08;
      camera.position.copy(targetCenter).addScaledVector(direction, distance);
      controls!.target.copy(targetCenter);controls!.update();invalidate();
    }
    function fit() {
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;
      renderer!.setSize(width, height, false);camera.aspect = width / height;camera.updateProjectionMatrix();invalidate();
    }
    resize = new ResizeObserver(fit);resize.observe(stage);fit();view('overview');
    controls.addEventListener('change', invalidate);
    intersection = new IntersectionObserver(entries => { onscreen = entries[0].isIntersecting;if (onscreen) invalidate(); });intersection.observe(stage);
    document.addEventListener('visibilitychange', invalidate, { signal });
    canvas.addEventListener('keydown', event => {
      if (event.key === '+' || event.key === '=' || event.key === '-') {
        event.preventDefault();camera.position.sub(controls!.target).multiplyScalar(event.key === '-' ? 1.1 : .9).clampLength(controls!.minDistance, controls!.maxDistance).add(controls!.target);controls!.update();invalidate();
      }
    }, { signal });
    controls.listenToKeyEvents(canvas);
    root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => button.addEventListener('click', () => view(button.dataset.view!), { signal }));
    root.querySelector('[data-reset]')!.addEventListener('click', () => {
      model!.children.forEach(layer => { layer.visible = true; });
      layers.querySelectorAll<HTMLInputElement>('input').forEach(input => { input.checked = true; });view('overview');
    }, { signal });
    for (const layer of model.children) {
      const label = document.createElement('label');const input = document.createElement('input');
      input.type = 'checkbox';input.checked = true;
      label.append(input, document.createTextNode(layer.userData.rhinoLayer || layer.name));layers.append(label);
      input.addEventListener('change', () => { layer.visible = input.checked;invalidate(); }, { signal });
    }
    root.querySelector('[data-unload]')!.addEventListener('click', () => { dispose();root.querySelector<HTMLButtonElement>('[data-load]')!.focus({ preventScroll: true }); }, { signal });
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();dispose();status.textContent = '图形显示已中断，可重新加载模型或继续浏览图纸。';
    }, { signal });
    intro.hidden = true;tools.hidden = false;status.textContent = '';root.dataset.modelState = 'ready';
    render();
    root.dataset.loadMetrics = JSON.stringify({ downloadMs: Math.round(downloaded - started), firstRenderSubmittedMs: Math.round(performance.now() - started), bytes: received });
    return dispose;
  } catch (error) { dispose();throw error; }
  finally { clearTimeout(timeout); }
}
