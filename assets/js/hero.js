// hero.js — the plan as a small live model: the district plate, buildings rising out of it, traffic on its roads.
// Everything is derived from the one poster frame the repository publishes (assets/data/city.json, assets/media/plate.webp).
// It is an illustration: the traffic is drawn along the plan's roads, it is not simulation output.
import * as THREE from '../vendor/three.module.min.js';

const ACCENT = 0xb7a4f4, STREAM = [0xf0deb0, 0x86d6c7, 0xf5a5ba], SPEED = [0.46, 0.6, 0.38];   // world units per second
const S = 0.01;                                                                              // one plate pixel = 0.01 world units
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const back = (t, s = 1.4) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };

export async function initHero(canvas, { reduced = false, labels = [] } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch { return false; }
  if (!renderer.getContext()) return false;
  const [city, tex] = await Promise.all([fetch('assets/data/city.json').then(r => r.json()), new THREE.TextureLoader().loadAsync('assets/media/plate.webp')]);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const W = city.w, H = city.h, wx = x => (x - W / 2) * S, wz = y => (y - H / 2) * S;

  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.1, 200), root = new THREE.Group();
  scene.add(root);
  scene.add(new THREE.HemisphereLight(0xd6dcff, 0x0a0b10, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 1.7); sun.position.set(-7, 12, 5); scene.add(sun);

  // ── the plate: full colour as a print, dimmed once it goes live ──
  const plateMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(W * S, H * S).rotateX(-Math.PI / 2), plateMat);
  root.add(plate);

  // ── the district outline as a lit ribbon (WebGL lines are one pixel wide) ──
  const ribbon = (pts, width, y, opacity) => {
    const n = pts.length, pos = new Float32Array(n * 2 * 3), idx = [];
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
      let nx = -(c[1] - a[1]), ny = c[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      pos.set([wx(b[0]) + nx * width / 2, y, wz(b[1]) + ny * width / 2, wx(b[0]) - nx * width / 2, y, wz(b[1]) - ny * width / 2], i * 6);
      const j = (i + 1) % n; idx.push(i * 2, i * 2 + 1, j * 2, j * 2, i * 2 + 1, j * 2 + 1);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  };
  const edge = ribbon(city.outline, 0.035, 0.012, 0), halo = ribbon(city.outline, 0.3, 0.008, 0);
  root.add(halo, edge);

  // ── roads: thin lit lines ──
  const rp = [];
  for (const r of city.roads) for (let i = 0; i + 3 < r.p.length; i += 2) rp.push(wx(r.p[i]), 0.016, wz(r.p[i + 1]), wx(r.p[i + 2]), 0.016, wz(r.p[i + 3]));
  const roadGeo = new THREE.BufferGeometry(); roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
  const roadMat = new THREE.LineBasicMaterial({ color: 0xdfe4f4, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  root.add(new THREE.LineSegments(roadGeo, roadMat));

  // ── buildings: one box per footprint blob, tinted with the colour of the zone underneath ──
  const px = document.createElement('canvas'); px.width = W; px.height = H;
  const pg = px.getContext('2d', { willReadFrequently: true }); pg.drawImage(tex.image, 0, 0, W, H);
  const pix = pg.getImageData(0, 0, W, H).data;
  const B = city.buildings.filter((b, i) => b[2] !== 60 || hash(i * 2.9) < 0.42), bN = B.length;   // the sampled block interiors are thinned: villages, not carpets
  const boxGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const bMesh = new THREE.InstancedMesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), bN);
  const bInfo = new Float32Array(bN * 6), col = new THREE.Color(), base = new THREE.Color(0xd3d7ea);
  for (let i = 0; i < bN; i++) {
    const [x, y, sz] = B[i], side = clamp(Math.sqrt(sz) * S * (0.9 + 0.5 * hash(i * 1.7)), 0.045, 0.14);
    const h = (0.03 + 0.12 * Math.pow(hash(i * 3.3), 2.0) + sz / 220 * 0.05) * (hash(i * 7.7) > 0.965 ? 3.2 : 1);   // low-rise, with the odd tower
    const dx = wx(x), dz = wz(y);
    bInfo.set([dx, dz, side, side * (0.7 + 0.6 * hash(i * 9.1)), h, hash(i * 5.9) * Math.PI / 2], i * 6);
    const o = (Math.min(H - 1, Math.max(0, Math.round(y + 7))) * W + Math.min(W - 1, Math.max(0, Math.round(x + 7)))) * 4;
    col.setRGB(pix[o] / 255, pix[o + 1] / 255, pix[o + 2] / 255, THREE.SRGBColorSpace).lerp(base, 0.5).multiplyScalar(1.12);
    bMesh.setColorAt(i, col);
  }
  bMesh.instanceColor.needsUpdate = true; root.add(bMesh);
  const dummy = new THREE.Object3D();
  const growAt = i => { const dx = bInfo[i * 6], dz = bInfo[i * 6 + 1]; return (Math.hypot(dx - 2.2, dz + 5.6) / 13) * 1.5; };   // the wave starts at the Loop, the northern tip
  function setBuildings(t) {                                   // t = seconds since the plan went live
    for (let i = 0; i < bN; i++) {
      const g = t >= 99 ? 1 : back((t - growAt(i)) / 0.7);
      dummy.position.set(bInfo[i * 6], 0, bInfo[i * 6 + 1]); dummy.rotation.set(0, bInfo[i * 6 + 5], 0);
      dummy.scale.set(bInfo[i * 6 + 2], Math.max(0.0001, bInfo[i * 6 + 4] * g), bInfo[i * 6 + 3]); dummy.updateMatrix(); bMesh.setMatrixAt(i, dummy.matrix);
    }
    bMesh.instanceMatrix.needsUpdate = true;
  }
  setBuildings(-1);

  // ── traffic: one point per trip, moving at a steady speed along its path ──
  const A = city.agents, aN = A.length;
  const aPos = new Float32Array(aN * 3), aCol = new Float32Array(aN * 3), aAlpha = new Float32Array(aN);
  A.forEach((a, i) => { col.setHex(STREAM[a.k]); aCol.set([col.r, col.g, col.b], i * 3); });
  const aGeo = new THREE.BufferGeometry();
  aGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3)); aGeo.setAttribute('color', new THREE.BufferAttribute(aCol, 3)); aGeo.setAttribute('aAlpha', new THREE.BufferAttribute(aAlpha, 1));
  const aMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uSize: { value: 1 }, uOn: { value: 0 } },
    vertexShader: 'attribute float aAlpha; attribute vec3 color; varying float vA; varying vec3 vC; uniform float uSize; void main(){ vA = aAlpha; vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vA; varying vec3 vC; uniform float uOn; void main(){ float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, r); gl_FragColor = vec4(vC * (0.7 + 1.1 * a), a * vA * uOn); }',
  });
  root.add(new THREE.Points(aGeo, aMat));
  function setAgents(t) {
    for (let i = 0; i < aN; i++) {
      const a = A[i], L = a.l * S, span = L + 2.4, d = (hash(i * 1.31) * span + SPEED[a.k] * t) % span;
      if (d >= L) { aAlpha[i] = 0; continue; }
      const f = clamp(d / S / 12, 0, a.p.length / 2 - 1.001), k = Math.floor(f), u = f - k, p = a.p;
      const lane = (hash(i * 5.3) - 0.5) * 0.07, tx = p[k * 2 + 2] - p[k * 2], ty = p[k * 2 + 3] - p[k * 2 + 1], tl = Math.hypot(tx, ty) || 1;
      aPos[i * 3] = wx(lerp(p[k * 2], p[k * 2 + 2], u)) - ty / tl * lane; aPos[i * 3 + 1] = 0.05; aPos[i * 3 + 2] = wz(lerp(p[k * 2 + 1], p[k * 2 + 3], u)) + tx / tl * lane;
      aAlpha[i] = Math.min(1, d / 0.3, (L - d) / 0.3);
    }
    aGeo.attributes.position.needsUpdate = true; aGeo.attributes.aAlpha.needsUpdate = true;
  }

  // ── place names, projected to screen (HTML, so they stay sharp and selectable) ──
  const tags = labels.map(l => ({ el: l.el, v: new THREE.Vector3(wx(l.x), 0.3, wz(l.y)) }));
  const v3 = new THREE.Vector3();

  // ── camera: starts flat above the print, then tilts into the model; follows the pointer a little; pulls away on scroll ──
  let w = 0, h = 0, wide = true, live0 = null, t0 = performance.now(), mx = 0, my = 0, smx = 0, smy = 0, scroll = 0, running = false, visible = true, raf = 0;
  function resize() {
    const r = canvas.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height); wide = w >= 960;
    const dpr = Math.min(window.devicePixelRatio || 1, wide ? 1.75 : 1.5);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); aMat.uniforms.uSize.value = (wide ? 250 : 200) * dpr * (h / 900);
    cam.aspect = w / h;
    if (wide) cam.setViewOffset(w, h, -w * 0.215, h * 0.02, w, h); else cam.setViewOffset(w, h, 0, -h * 0.05, w, h);    // model to the right of the headline; on a phone its canvas is the top of the screen
    cam.updateProjectionMatrix();
  }
  function frame(now) {
    const t = (now - t0) / 1000, intro = reduced ? 1 : eio((t - 0.5) / 2.6);
    if (live0 === null && intro > 0.42) live0 = t;
    const lt = reduced ? 100 : live0 === null ? -1 : t - live0, live = clamp(lt / 1.4);
    smx += (mx - smx) * 0.05; smy += (my - smy) * 0.05;
    // print → live
    plateMat.color.setScalar(lerp(1, 0.2, live));
    edge.material.opacity = 0.95 * live; halo.material.opacity = 0.12 * live; roadMat.opacity = 0.42 * live;
    if (lt < 4.5) setBuildings(lt); else if (lt < 99 && !frame.done) { setBuildings(100); frame.done = true; }
    aMat.uniforms.uOn.value = clamp((lt - 1.6) / 1.8); setAgents(reduced ? 20 : t);
    // orbit
    const polar = lerp(0.02, wide ? 0.94 : 0.86, intro) + smy * 0.05 + scroll * 0.16, az = lerp(-0.1, -0.5, intro) + Math.sin(t * 0.1) * 0.09 * intro + smx * 0.11;
    const rad = lerp(wide ? 33 : 40, wide ? 27.5 : Math.max(25, 21 / Math.min(1.25, w / h)), intro) + scroll * 7;
    cam.position.set(Math.sin(polar) * Math.sin(az) * rad, Math.cos(polar) * rad, Math.sin(polar) * Math.cos(az) * rad + 0.5);
    cam.lookAt(0, 0, 0.5);
    root.position.y = -scroll * 1.2;
    renderer.render(scene, cam);
    // labels
    const la = clamp((lt - 2.4) / 1.0) * clamp(1 - scroll * 2.2);
    for (const g of tags) {
      v3.copy(g.v).applyMatrix4(root.matrixWorld).project(cam);
      g.el.style.transform = `translate3d(${((v3.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-v3.y * 0.5 + 0.5) * h).toFixed(1)}px, 0)`; g.el.style.opacity = la.toFixed(3);
    }
  }
  const loop = now => { raf = 0; if (!running) return; frame(now); raf = requestAnimationFrame(loop); };
  const sync = () => { const want = visible && !document.hidden && !reduced; if (want && !running) { running = true; raf = requestAnimationFrame(loop); } else if (!want) running = false; };
  resize(); new ResizeObserver(() => { resize(); if (!running) frame(performance.now()); }).observe(canvas);
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  const hero = canvas.parentElement;
  addEventListener('scroll', () => { scroll = clamp(scrollY / Math.max(1, hero.offsetHeight)); canvas.style.opacity = String(clamp(1 - scroll * 1.15)); if (reduced) frame(performance.now()); }, { passive: true });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; sync(); }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); running = false; document.body.classList.add('no-gl'); });
  frame(performance.now()); sync();
  return true;
}
