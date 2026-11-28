// Avatares do jogador (Ela / Ele): modelos glTF com esqueleto (CC0, Quaternius) e animações via AnimationMixer.
// Carregamento preguiçoso: o jogo abre com o boneco procedural e troca pelo modelo quando o arquivo chega.
import * as THREE from 'three';
import { Hero } from './people.js';
import { lerp } from './util.js';
import { HEROES, heroMaterials, nanoSuit } from './heroes.js';
import { applyLook } from './wardrobe.js';

export const AVATARS = {
  ela: {
    id: 'ela', label: 'Ela', name: 'Luna', file: 'assets/avatars/ela.glb', height: 1.68,
    colors: { Shirt: 0xff4f8b, Pants: 0x2f4f86, Shoes: 0xf2f2f2, Hair: 0x24150c, HairBase: 0x24150c, Skin: 0x8a5a3c },
    fallback: { skin: 0x8a5a3c, shirt: 0xff4f8b, pants: 0x2f4f86, hair: 0x24150c, stripe: 0xffd23f },
  },
  ele: {
    id: 'ele', label: 'Ele', name: 'Davi', file: 'assets/avatars/ele.glb', height: 1.78,
    colors: { Shirt: 0x19c3c9, Pants: 0xe8dcc0, Socks: 0xffffff, Hair: 0x1b120c, Eyes: 0x1a1a1a, Skin: 0xc58c5c },
    fallback: { skin: 0xc58c5c, shirt: 0x19c3c9, pants: 0xe8dcc0, hair: 0x1b120c, stripe: 0xffffff },
  },
};
// Marisol (t408): personagem original nova — pele morena quente, cabelo cacheado escuro, elegante (nome e visual inventados)
AVATARS.marisol = {
  id: 'marisol', label: 'Marisol', name: 'Marisol', base: 'ela', file: 'assets/avatars/ela.glb', height: 1.72, curls: true, hoops: true,
  colors: { Shirt: 0x0f8a6a, Pants: 0x8a5232, Shoes: 0xd9b45a, Hair: 0x1a0f0a, HairBase: 0x1a0f0a, Skin: 0x8a5232 },
  fallback: { skin: 0x8a5232, shirt: 0x0f8a6a, pants: 0x8a5232, hair: 0x1a0f0a, stripe: 0xd9b45a },
};
// heróis originais: usam o esqueleto/arquivo de uma base (ela/ele) com materiais e acessórios próprios
for (const H of Object.values(HEROES)) AVATARS[H.id] = Object.assign({ hero: true, file: AVATARS[H.base].file }, H);
export const AVATAR_IDS = Object.keys(AVATARS);
export const BASE_IDS = ['ela', 'ele'];
// de onde vem o visual (roupa/traje) de cada personagem do jogador — o guarda-roupa registra aqui
let lookOf = null; export function setLookSource(fn) { lookOf = fn; }

// ---- carregamento (uma vez por arquivo) e preparo da malha: normais suaves para um visual menos "quadrado"
const cache = new Map(); let libs = null;
async function getLibs() {
  if (!libs) libs = Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/utils/SkeletonUtils.js'), import('three/addons/utils/BufferGeometryUtils.js')])
    .then(([a, b, c]) => ({ GLTFLoader: a.GLTFLoader, SkeletonUtils: b, mergeVertices: c.mergeVertices }));
  return libs;
}
function smoothGeo(geo, mergeVertices) {
  // atributos quantizados/intercalados viram arrays simples, depois soldamos os vértices e recalculamos as normais
  const g = new THREE.BufferGeometry();
  for (const k of Object.keys(geo.attributes)) {
    if (k === 'normal' || k === 'uv') continue;
    const a = geo.attributes[k]; const n = a.count * a.itemSize;
    const arr = k === 'skinIndex' ? new Uint16Array(n) : new Float32Array(n);
    for (let i = 0; i < a.count; i++) for (let c = 0; c < a.itemSize; c++) arr[i * a.itemSize + c] = a.getComponent(i, c);
    g.setAttribute(k, new THREE.BufferAttribute(arr, a.itemSize));
  }
  if (geo.index) g.setIndex(geo.index.clone());
  const m = mergeVertices(g, 1e-3); m.computeVertexNormals(); m.computeBoundingSphere(); return m;
}
export function loadAvatar(id) {
  const A = AVATARS[id] || AVATARS.ela;
  const key = A.file;
  if (!cache.has(key)) cache.set(key, (async () => {
    const L = await getLibs();
    const gltf = await new L.GLTFLoader().loadAsync(new URL('../' + A.file, import.meta.url).href);
    gltf.scene.traverse(o => {
      if (o.isSkinnedMesh) {
        try { o.geometry = smoothGeo(o.geometry, L.mergeVertices); } catch (e) { /* mantém a malha original */ }
        for (const mt of [].concat(o.material)) { mt.flatShading = false; mt.roughness = mt.name === 'Hair' ? 0.55 : 0.78; mt.metalness = 0; mt.needsUpdate = true; }
      }
    });
    if (key === AVATARS.ele.file) { try { mascBuild(gltf); } catch (e) { console.info('porte masculino parcial:', e && e.message); } }
    const box = new THREE.Box3().setFromObject(gltf.scene); gltf.rawHeight = box.max.y - box.min.y;
    return { gltf, L };
  })());
  return cache.get(key);
}
// t467: porte masculino (uma vez por arquivo, compartilhado por todos os clones; custo zero por quadro)
// ombros mais largos (os ombros andam para fora na pose de repouso e nas animações), peito mais largo/profundo,
// braços, pescoço e pernas mais grossos. Cada vértice mistura as transformações dos ossos pelos pesos da pele (sem emendas).
export const MASC = { sh: 0.25, chest: 0.23, depth: 0.12, arm: 1.22, fore: 1.15, thigh: 1.1, shorts: 0.84, shin: 1.06, neck: 1.2 };
function mascBuild(gltf) {
  const meshes = []; gltf.scene.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); }); if (!meshes.length) return; // uma malha por material (Shirt, Skin, Pants...)
  const sk = meshes[0].skeleton; const P = {}; const idx = {};
  sk.bones.forEach((b, i) => { idx[b.name] = i; P[b.name] = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().copy(sk.boneInverses[i]).invert()); });
  const need = ['Hips', 'Abdomen', 'Torso', 'Neck', 'Head', 'ShoulderL', 'ShoulderR', 'UpperArmL', 'UpperArmR', 'LowerArmL', 'LowerArmR', 'PalmL', 'PalmR', 'UpperLegL', 'UpperLegR', 'LowerLegL', 'LowerLegR', 'FootL', 'FootR'];
  for (const n of need) if (!P[n]) throw new Error('osso ' + n);
  const lat = P.UpperArmL.clone().sub(P.UpperArmR).normalize(), up = P.Neck.clone().sub(P.Hips).normalize(); const fwd = new THREE.Vector3().crossVectors(lat, up).normalize();
  const o0 = P.Hips; const L = (v) => { const d = v.clone().sub(o0); return [d.dot(lat), d.dot(up), d.dot(fwd)]; };
  const uAb = L(P.Abdomen)[1], uSh = L(P.UpperArmL)[1], uHead = L(P.Head)[1];
  // transformação por osso (em coordenadas do corpo) aplicada a um ponto
  const seg = (a, b, k) => { const A = P[a], B = P[b]; const ax = B.clone().sub(A); const l2 = ax.lengthSq(); return (v) => { const t = Math.max(0, Math.min(1, v.clone().sub(A).dot(ax) / l2)); const c = A.clone().addScaledVector(ax, t); return c.add(v.clone().sub(c).multiplyScalar(k)); }; };
  const chest = (v, kAb) => { const [x, y, z] = L(v); const t = Math.max(0, Math.min(1, (y - uAb) / (uSh - uAb))); const fx = 1 + (kAb ?? 0.04) + (MASC.chest - (kAb ?? 0.04)) * Math.pow(t, 1.3), fz = 1 + MASC.depth * (0.4 + 0.6 * t);
    const top = y > uSh ? Math.max(0, 1 - (y - uSh) / Math.max(1e-6, (uHead - uSh))) : 1; const kx = 1 + (fx - 1) * top, kz = 1 + (fz - 1) * top;
    return o0.clone().addScaledVector(lat, x * kx).addScaledVector(up, y).addScaledVector(fwd, z * kz); };
  const T = {}; let isPants = false; // short largo da base vira short reto (cabe dentro das calças)
  const pants = { has: () => isPants };
  T[idx.Torso] = (v) => chest(v); T[idx.Abdomen] = (v) => chest(v, 0.05);
  T[idx.Neck] = seg('Neck', 'Head', MASC.neck);
  for (const s of ['L', 'R']) { T[idx['UpperArm' + s]] = seg('UpperArm' + s, 'LowerArm' + s, MASC.arm); T[idx['LowerArm' + s]] = seg('LowerArm' + s, 'Palm' + s, MASC.fore);
    { const th = seg('UpperLeg' + s, 'LowerLeg' + s, MASC.thigh), sl = seg('UpperLeg' + s, 'LowerLeg' + s, MASC.shorts); T[idx['UpperLeg' + s]] = (v, i) => (pants.has(i) ? sl : th)(v); } T[idx['LowerLeg' + s]] = seg('LowerLeg' + s, 'Foot' + s, MASC.shin);
  } // osso do ombro: sem transformação (ele mesmo anda para fora logo abaixo)
  { const sL = seg('UpperLegL', 'LowerLegL', MASC.shorts), sR = seg('UpperLegR', 'LowerLegR', MASC.shorts), uLeg = L(P.UpperLegL)[1], uKnee = L(P.LowerLegL)[1];
    T[idx.Hips] = (v) => { if (!isPants) return v; const [x, y] = L(v); const t = Math.max(0, Math.min(1, (uLeg - y) / ((uLeg - uKnee) * 0.25))); if (!t) return v; const w = (x > 0 ? sL : sR)(v); return v.clone().lerp(w, t); }; }
  const v = new THREE.Vector3(), acc = new THREE.Vector3();
  for (const mesh of meshes) {
    if (mesh.skeleton !== sk && mesh.skeleton.bones[0] !== sk.bones[0]) continue;
    isPants = [].concat(mesh.material).some(m => m.name === 'Pants');
    const g = mesh.geometry, pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i); acc.set(0, 0, 0); let wsum = 0;
      for (let c = 0; c < 4; c++) { const w = sw.getComponent(i, c); if (!w) continue; const f = T[si.getComponent(i, c)]; acc.addScaledVector(f ? f(v, i) : v, w); wsum += w; }
      if (wsum > 0) pos.setXYZ(i, acc.x / wsum, acc.y / wsum, acc.z / wsum);
    }
    pos.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
  }
  // ombros para fora: pose de repouso + trilhas de translação das animações (espaço do Torso ≈ eixos do modelo)
  for (const s of ['L', 'R']) { const b = sk.bones[idx['Shoulder' + s]]; b.userData.mascDx = b.position.x * MASC.sh; b.position.x += b.userData.mascDx; }
  for (const clip of gltf.animations) for (const tr of clip.tracks) { const m = /^Shoulder([LR])\.position$/.exec(tr.name); if (!m) continue; const dx = sk.bones[idx['Shoulder' + m[1]]].userData.mascDx; for (let i = 0; i < tr.values.length; i += 3) tr.values[i] += dx; }
  gltf.masc = true;
}
// t467: junta as peças fixas presas em cada osso (placas, roupas, acessórios) numa malha por material → bem menos chamadas de desenho
function mergeAttached(model) {
  const keep = new Set(); for (const v of Object.values(model.userData)) { if (v && v.isObject3D) keep.add(v); if (Array.isArray(v)) for (const x of v) if (x && x.isObject3D) keep.add(x); }
  model.updateMatrixWorld(true); const inv = new THREE.Matrix4(), rel = new THREE.Matrix4();
  const bones = []; model.traverse(o => { if (o.isBone) bones.push(o); });
  for (const b of bones) {
    const groups = new Map(), done = [];
    for (const c of [...b.children]) {
      if (c.isBone || c.isSkinnedMesh) continue; let ok = true; const ms = [];
      c.traverse(o => { if (keep.has(o) || o.isBone || o.isSkinnedMesh || o.isLight || (o.isMesh && (!o.visible || Array.isArray(o.material) || o.material.transparent))) ok = false; if (o.isMesh) ms.push(o); });
      if (!ok || !ms.length) continue; done.push(c);
      inv.copy(b.matrixWorld).invert();
      for (const m of ms) { rel.multiplyMatrices(inv, m.matrixWorld); let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); if (!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(rel);
        const key = m.material.uuid; if (!groups.has(key)) groups.set(key, { mat: m.material, list: [] }); groups.get(key).list.push(g); }
    }
    if (!done.length) continue;
    for (const c of done) b.remove(c);
    for (const { mat, list } of groups.values()) {
      const n = list.reduce((a, g) => a + g.attributes.position.count, 0); const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
      for (const g of list) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; g.dispose(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.computeBoundingSphere();
      const mm = new THREE.Mesh(g, mat); mm.castShadow = true; mm.frustumCulled = false; mm.userData.merged = list.length; b.add(mm);
    }
  }
}
export function preloadAvatars() { for (const id of BASE_IDS) loadAvatar(id).catch(() => { }); }

// Cria uma cópia animável do modelo (com cores próprias). Usado pelo jogador e pelos moradores que conversam.
export async function makeModel(id, colors, height, suit, look) {
  const A = AVATARS[id] || AVATARS.ela; const { gltf, L } = await loadAvatar(A.id);
  const model = L.SkeletonUtils.clone(gltf.scene);
  model.userData.masc = !!gltf.masc; // t467: porte masculino (roupas/armaduras engrossam junto)
  const cols = Object.assign({}, A.colors, colors || {}); const mats = new Map();
  model.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
    o.material = [].concat(o.material).map(m => { if (!mats.has(m)) { const c = m.clone(); if (cols[m.name] != null) c.color.setHex(cols[m.name]); mats.set(m, c); } return mats.get(m); });
    if (o.material.length === 1) o.material = o.material[0];
  });
  model.scale.multiplyScalar((height || A.height) / gltf.rawHeight);
  if (A.bulk) { model.scale.x *= A.bulk; model.scale.z *= A.bulk; }
  const kk = (height || A.height) / AVATARS[A.base || A.id].height;
  if (look) applyLook(A, model, [...mats.values()], kk, look); // roupa estilo Miami ou traje (t408/t410)
  else {
    if (A.hero) { heroMaterials(A, [...mats.values()]); try { A.gear(model, kk); } catch (e) { console.info('acessório do herói falhou:', e && e.message); } }
    if (suit) nanoSuit(A, model, [...mats.values()], kk);
  }
  try { mergeAttached(model); } catch (e) { console.info('junção de peças falhou:', e && e.message); }
  const mixer = new THREE.AnimationMixer(model); const acts = {};
  for (const c of gltf.animations) acts[c.name] = mixer.clipAction(c);
  for (const k of ['Jump', 'Standing']) if (acts[k]) { acts[k].setLoop(THREE.LoopOnce, 1); acts[k].clampWhenFinished = true; }
  return { model, mixer, acts, mats: [...mats.values()] };
}

const CLIP = { idle: 'Idle', walk: 'Walk', run: 'Run', jump: 'Jump', drive: 'Sitting', sit: 'Sitting', wave: 'Clapping', clap: 'Clapping', talk: 'Idle' };
// Pose sentada (o clipe "Sitting" senta e fica parado): congelamos num quadro já sentado
const SIT_T = 4;

// Avatar animado com fallback procedural. Mantém a mesma interface do antigo Hero (g, ph, pose, walking, anim).
export class Avatar {
  constructor(scene, Q, id) {
    this.Q = Q; this.g = new THREE.Group(); scene.add(this.g); this.ph = 0; this.walking = false;
    this.cur = null; this.mode = 'idle'; this.loaded = false; this.failed = false; this.token = 0;
    this.setAvatar(id || 'ela');
  }
  get id() { return this._id; }
  setAvatar(id) {
    const A = AVATARS[id] || AVATARS.ela; this._id = A.id; const tok = ++this.token;
    // fallback procedural (aparece na hora; também fica se o arquivo não carregar)
    if (this.fb) this.g.remove(this.fb.g);
    const tmp = new THREE.Group(); this.fb = new Hero(tmp, this.Q, A.fallback); this.fb.inner.scale.setScalar(A.height / 1.8);
    this.def = A; this.heightK = A.height / 1.75;
    if (A.bulk) { this.fb.inner.scale.x *= A.bulk; this.fb.inner.scale.z *= A.bulk; }
    if (A.id === 'ela' || A.curls) { const hairM = this.fb.hair.material; const pony = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.28, 2, 6).translate(0, 1.5, -0.14), hairM); this.fb.inner.add(pony); }
    tmp.remove(this.fb.g); this.g.add(this.fb.g); this.fb.g.visible = !this.rig;
    const id0 = A.id; const lk = lookOf ? lookOf(id0) : null; return makeModel(id0, null, null, !lk, lk).then((r) => {
      if (tok !== this.token) return;
      if (this.rig) { this.g.remove(this.rig.model); this.rig.mixer.stopAllAction(); }
      this.rig = r; this.g.add(r.model); this.fb.g.visible = false; this.loaded = true; this.failed = false; this.cur = null; this.play(this.mode, 1, 0);
    }).catch((e) => { if (tok !== this.token) return; this.failed = true; this.rig = null; this.fb.g.visible = true; console.info('Avatar 3D indisponível, usando boneco simples:', e && e.message); });
  }
  play(mode, speed, fade) {
    const R = this.rig; if (!R) return; const name = CLIP[mode] || 'Idle'; const a = R.acts[name] || R.acts.Idle; if (!a) return;
    if (this.cur !== a) {
      a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.play();
      if (name === 'Sitting') { a.time = SIT_T; a.timeScale = 0; }
      if (this.cur) this.cur.crossFadeTo(a, fade ?? 0.22, false); this.cur = a;
    }
    if (name !== 'Sitting' && name !== 'Jump') a.timeScale = speed;
  }
  // mode: idle|walk|jump|drive|sit|wave|clap ; amt: 0..1 (0.95 = correndo)
  pose(mode, amt, dt) {
    this.mode = mode;
    if (this.rig) {
      let m = mode, sp = 1;
      if (mode === 'walk') { if (amt > 0.8) { m = 'run'; sp = 0.9 + (amt - 0.8) * 1.2; } else sp = lerp(0.55, 1.15, Math.min(1, amt / 0.6)); }
      this.play(m, sp); this.rig.mixer.update(dt);
    } else { this.fb.ph = this.ph; this.fb.pose(mode, amt, dt); }
  }
  anim(dt) { this.ph += dt * 6.5; this.pose(this.walking ? 'walk' : 'idle', this.walking ? 0.55 : 0, dt); this.walking = false; }
}
