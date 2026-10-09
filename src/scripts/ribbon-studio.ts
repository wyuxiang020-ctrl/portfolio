import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createRibbonWorld } from './ribbon-world';

type RoomId = 'ai' | 'architecture' | 'about';
const root = document.querySelector<HTMLElement>('#ribbon-studio');
if (root) initStudio(root);

function initStudio(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('#studio-canvas')!;
  const grow = root.querySelector<HTMLButtonElement>('#grow-world')!;
  const replay = root.querySelector<HTMLButtonElement>('#replay-world')!;
  const roofs = root.querySelector<HTMLButtonElement>('#open-roofs')!;
  const nightButton = root.querySelector<HTMLButtonElement>('#night-world')!;
  const range = root.querySelector<HTMLInputElement>('#ribbon-form')!;
  const value = root.querySelector<HTMLOutputElement>('#form-value')!;
  const labelLayer = root.querySelector<HTMLElement>('#room-labels')!;
  const labels = [...root.querySelectorAll<HTMLButtonElement>('.room-label')];
  const panel = root.querySelector<HTMLElement>('#room-panel')!;
  const intro = root.querySelector<HTMLElement>('#studio-intro')!;
  const status = root.querySelector<HTMLElement>('#scene-status')!;
  const fallback = root.querySelector<HTMLElement>('#scene-fallback')!;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  let disposed = false, ready = false, visible = true, frame = 0;
  let renderer: THREE.WebGLRenderer, controls: OrbitControls, world: ReturnType<typeof createRibbonWorld>;
  let camera: THREE.PerspectiveCamera;
  const scene = new THREE.Scene();
  const target = { form: motion.matches ? 1 : 0, open: 0, night: 0 };
  const state = { form: target.form, open: 0, night: 0 };
  let selected: RoomId | null = null, allRoofs = false, growing = false;
  let width = 1, height = 1, last = performance.now(), elapsed = 0;
  let cameraMove: { fromPos: THREE.Vector3; toPos: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3; start: number; duration: number } | null = null;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(-5, -5), projected = new THREE.Vector3();
  let key: THREE.DirectionalLight, hemisphere: THREE.HemisphereLight, floor: THREE.Mesh<THREE.PlaneGeometry, THREE.ShadowMaterial>;
  let down: {x:number;y:number;time:number} | null = null;
  let hovered: RoomId | null = null;
  let returnFocus: HTMLElement = grow;

  function fail(message: string) {
    ready = false; cancelAnimationFrame(frame);
    root.dataset.status = 'error'; fallback.hidden = false; labelLayer.hidden = true;
    grow.disabled = true; grow.querySelector('span')!.textContent = '先看看下面的作品';
    [replay, roofs, nightButton, range].forEach(control => control.disabled = true);
    status.textContent = message;
  }
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobileQuery.matches ? 1.5 : 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.32;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);
    camera = new THREE.PerspectiveCamera(36, 1, .1, 130);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = .08;
    controls.enablePan = false; controls.minDistance = 12; controls.maxDistance = 37;
    controls.minPolarAngle = .35; controls.maxPolarAngle = 1.25;
    controls.rotateSpeed = .55; controls.zoomSpeed = .6;
    controls.enableZoom = false;
    renderer.domElement.style.touchAction = 'pan-y';
    controls.target.set(0, .5, 0);
    camera.position.set(16, 15.5, 20);
    key = new THREE.DirectionalLight(0xfff0d8, 3.2);
    key.position.set(-9, 18, 10); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -16; key.shadow.camera.right = 16;
    key.shadow.camera.top = 16; key.shadow.camera.bottom = -16;
    key.shadow.camera.near = .5; key.shadow.camera.far = 55;
    key.shadow.bias = -.0004; key.shadow.normalBias = .045; key.shadow.radius = 4;
    hemisphere = new THREE.HemisphereLight(0xf9f4e5, 0xa7bda5, 2.3);
    const fill = new THREE.DirectionalLight(0xf2fbff, .65); fill.position.set(6, 10, -12);
    scene.add(key, hemisphere, fill);
    floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({color:0x485044,opacity:.19}));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.14; floor.receiveShadow = true; scene.add(floor);
    world = createRibbonWorld(); scene.add(world.group);
    world.update({time:0,form:state.form,open:0,selected:null,night:0});
    root.dataset.status = 'ready'; ready = true;
    [grow, replay, roofs, nightButton, range].forEach(control => control.disabled = false);
    grow.querySelector('span')!.textContent = state.form > .98 ? '探索三个圆馆' : '让空间生长';
    fallback.hidden = true;
    root.querySelector<HTMLElement>('#scene-loading')!.hidden = true;
  } catch (error) {
    console.error('Studio could not initialize', error);
    try { renderer?.dispose(); } catch {}
    fail('互动场景暂时无法显示，可通过导航或下方作品直接浏览。');
    root.querySelector('#retry-world')?.addEventListener('click', () => window.location.reload());
    return;
  }

  const overview = () => mobileQuery.matches ? new THREE.Vector3(12.8, 15.2, 16.8).multiplyScalar(Math.max(1,380/width)) : new THREE.Vector3(10.5, 12, 14.5);
  function resize() {
    if (disposed) return;
    const rect = host.getBoundingClientRect(); width = Math.max(rect.width, 1); height = Math.max(rect.height, 1);
    renderer.setSize(width, height); camera.aspect = width / height;
    camera.setViewOffset(width, height, mobileQuery.matches ? 0 : -width * .125, 0, width, height);
    camera.updateProjectionMatrix();
    root.querySelector<HTMLElement>('#scene-instruction')!.textContent = mobileQuery.matches ? '横向拖动旋转 · 点击圆馆' : '拖动旋转 · 点击圆馆';
    if (!selected && !cameraMove) { camera.position.copy(overview()); controls.target.set(0,.5,0); controls.update(); }
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const intersection = new IntersectionObserver(entries => {visible = entries[0]?.isIntersecting ?? true; if (visible) wake();}, {rootMargin:'100px'}); intersection.observe(root);
  resize();

  function moveCamera(toPos: THREE.Vector3, toTarget: THREE.Vector3) {
    if (motion.matches) { camera.position.copy(toPos); controls.target.copy(toTarget); controls.update(); cameraMove=null; return; }
    cameraMove={fromPos:camera.position.clone(),toPos,fromTarget:controls.target.clone(),toTarget,start:performance.now(),duration:1250};
  }
  function selectRoom(room: RoomId) {
    if (!ready || !world.rooms[room]) return;
    if(!selected && document.activeElement instanceof HTMLElement && root.contains(document.activeElement))returnFocus=document.activeElement;
    selected=room; target.form=1; target.open=1; allRoofs=false; growing=false;
    root.dataset.selected=room; panel.hidden=false; intro.inert=true;
    root.querySelectorAll<HTMLElement>('.room-content').forEach(content => content.hidden=content.dataset.content!==room);
    labels.forEach(label=>label.setAttribute('aria-pressed',String(label.dataset.room===room)));
    roofs.setAttribute('aria-pressed','true'); roofs.lastElementChild!.textContent='合上屋顶';
    grow.querySelector('span')!.textContent='探索三个圆馆';
    const at=world.rooms[room].target.clone(); at.y=.6;
    const offset=mobileQuery.matches?new THREE.Vector3(10,12.5,14):new THREE.Vector3(7.4,8.1,10);
    moveCamera(at.clone().add(offset),at);
    status.textContent=`已进入${labels.find(l=>l.dataset.room===room)?.getAttribute('aria-label')?.replace('探索','') ?? room}，可打开对应作品。`;
    resize(); wake();
    root.querySelector<HTMLButtonElement>('#back-overview')!.focus({preventScroll:true});
    if(mobileQuery.matches)root.scrollIntoView({behavior:motion.matches?'auto':'smooth',block:'start'});
  }
  function backToOverview(restoreFocus=true) {
    const hadSelection=!!selected;
    selected=null; target.open=0; allRoofs=false; root.dataset.selected=''; panel.hidden=true; intro.inert=false;
    labels.forEach(label=>label.setAttribute('aria-pressed','false'));
    roofs.setAttribute('aria-pressed','false'); roofs.lastElementChild!.textContent='打开屋顶';
    moveCamera(overview(),new THREE.Vector3(0,.5,0));
    status.textContent='已回到三个圆馆的总览。'; resize(); wake();
    if(restoreFocus && hadSelection){returnFocus.focus({preventScroll:true});if(mobileQuery.matches)root.scrollIntoView({behavior:motion.matches?'auto':'smooth',block:'start'});}
  }
  function startGrowing(restart=false) {
    if (!ready) return;
    if (restart) backToOverview(false);
    if (state.form>.97 && !restart) { selectRoom('ai'); return; }
    target.form=1; growing=true;
    if (restart) state.form=target.form=0;
    if (restart) target.form=1;
    if (motion.matches) {state.form=1;growing=false;}
    grow.querySelector('span')!.textContent='空间正在生长';
    status.textContent='连续墙体正在围合成三个圆馆。'; wake();
  }
  grow.addEventListener('click',()=>startGrowing()); replay.addEventListener('click',()=>startGrowing(true));
  root.querySelector('#back-overview')!.addEventListener('click',()=>backToOverview());
  labels.forEach(label=>label.addEventListener('click',()=>selectRoom(label.dataset.room as RoomId)));
  range.addEventListener('input',()=>{target.form=Number(range.value)/100;growing=false;if(selected && target.form<.9)backToOverview(false);wake();});
  roofs.addEventListener('click',()=>{target.open=target.open>.5?0:1;target.form=1;allRoofs=!selected && target.open===1;roofs.setAttribute('aria-pressed',String(target.open===1));roofs.lastElementChild!.textContent=target.open===1?'合上屋顶':'打开屋顶';status.textContent=target.open===1?'屋顶打开，露出室内空间。':'屋顶已合上。';wake();});
  nightButton.addEventListener('click',()=>{target.night=target.night>.5?0:1;document.body.classList.toggle('is-night',target.night===1);nightButton.setAttribute('aria-pressed',String(target.night===1));nightButton.lastElementChild!.textContent=target.night===1?'白天':'夜晚';status.textContent=target.night===1?'夜幕降临，工作室亮起灯光。':'回到白天。';wake();});
  root.querySelector('#retry-world')?.addEventListener('click',()=>window.location.reload());
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && selected){backToOverview();grow.focus();}});
  controls.addEventListener('start',()=>{cameraMove=null;});
  function hitRoom(event: PointerEvent) {
    const rect=renderer.domElement.getBoundingClientRect();pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(world.pickables,false);
    for (const hit of hits) {
      let object:THREE.Object3D|null=hit.object, room:RoomId|null=null, shown=true;
      while(object){if(!object.visible){shown=false;break;}if(object.userData.room)room=object.userData.room;object=object.parent;}
      if(shown && room && world.rooms[room])return room;
    }
    return null;
  }
  renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,time:performance.now()};});
  renderer.domElement.addEventListener('pointerup',e=>{if(down && Math.hypot(e.clientX-down.x,e.clientY-down.y)<7 && performance.now()-down.time<650 && state.form>.65){const room=hitRoom(e);if(room)selectRoom(room);}down=null;});
  renderer.domElement.addEventListener('pointercancel',()=>{down=null;});
  renderer.domElement.addEventListener('pointermove',e=>{if(!down&&state.form>.85&&e.pointerType!=='touch'){hovered=hitRoom(e);host.classList.toggle('is-hovering',!!hovered);}});
  renderer.domElement.addEventListener('pointerleave',()=>{hovered=null;host.classList.remove('is-hovering');});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('图形场景已暂停，可以重试或直接浏览作品。');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>window.location.reload());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});

  function positionLabels() {
    labelLayer.hidden=state.form<.7;
    labels.forEach(label=>{
      const room=label.dataset.room as RoomId;
      projected.copy(world.rooms[room].labelAnchor).project(camera);
      const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height;
      const half=label.offsetWidth/2+6;
      const labelX=THREE.MathUtils.clamp(x,half,width-half),labelY=THREE.MathUtils.clamp(y,26,height-30);
      label.style.transform=`translate(${labelX}px,${labelY}px) translate(-50%,-50%)`;
      const front=projected.z<1 && projected.z>-1;
      label.style.opacity=front?String(selected && selected!==room ? .55 : 1):'0';
      label.style.visibility=front?'visible':'hidden';
    });
  }
  function tick(now:number) {
    if (disposed||!ready||document.hidden||!visible) {frame=0;return;}
    const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
    const formRate=growing?1.5:9;
    state.form=motion.matches?target.form:THREE.MathUtils.damp(state.form,target.form,formRate,dt);
    state.open=motion.matches?target.open:THREE.MathUtils.damp(state.open,target.open,4.5,dt);
    state.night=motion.matches?target.night:THREE.MathUtils.damp(state.night,target.night,3.5,dt);
    if(Math.abs(state.form-target.form)<.001)state.form=target.form;
    if(growing&&state.form>.988){state.form=1;growing=false;grow.querySelector('span')!.textContent='探索三个圆馆';status.textContent='三个圆馆已经围合完成，可以点击探索。';}
    if(!growing)grow.querySelector('span')!.textContent=state.form>.97?'探索三个圆馆':'让空间生长';
    const sliderForm = growing ? state.form : target.form;
    range.value=String(Math.round(sliderForm*100));range.style.setProperty('--form-progress',`${sliderForm*100}%`);
    value.textContent=state.form<.2?'舒展':state.form>.92?'围合':'正在成形';
    range.setAttribute('aria-valuetext',`${Math.round(sliderForm*100)}% 围合`);
    if(cameraMove){const t=Math.min(1,(now-cameraMove.start)/cameraMove.duration),e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;camera.position.lerpVectors(cameraMove.fromPos,cameraMove.toPos,e);controls.target.lerpVectors(cameraMove.fromTarget,cameraMove.toTarget,e);if(t===1)cameraMove=null;}
    controls.update();
    floor.material.opacity=THREE.MathUtils.lerp(.19,.30,state.night);
    key.intensity=THREE.MathUtils.lerp(3.2,.35,state.night);hemisphere.intensity=THREE.MathUtils.lerp(2.3,.6,state.night);
    renderer.toneMappingExposure=THREE.MathUtils.lerp(1.32,1.18,state.night);
    world.update({time:motion.matches?0:elapsed,form:state.form,open:state.open,selected:allRoofs?'all':selected,night:state.night});
    positionLabels(); renderer.render(scene,camera);
    frame=requestAnimationFrame(tick);
  }
  function wake(){if(!frame&&!disposed&&ready&&!document.hidden&&visible){last=performance.now();frame=requestAnimationFrame(tick);}}
  wake();
  const entryAnimation=window.setTimeout(()=>{if(!motion.matches && target.form===0 && !selected)startGrowing();},650);
  function dispose(){if(disposed)return;disposed=true;clearTimeout(entryAnimation);cancelAnimationFrame(frame);resizeObserver.disconnect();intersection.disconnect();controls.dispose();world.dispose();floor.geometry.dispose();floor.material.dispose();renderer.dispose();}
  window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();});
}
