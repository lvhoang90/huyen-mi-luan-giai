// Nhân vật VRM 1.0 (chuẩn mở của VRM Consortium) nạp bằng @pixiv/three-vrm:
// biểu cảm, nhép môi theo âm vị, nhìn theo con trỏ, xương tóc/áo vật lý (spring bone).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Dáng đứng: tay buông rồi chắp trước bụng. Đơn vị radian, trên khung xương chuẩn hóa của VRM. */
export const POSE = {
  upperArm: { z: 1.28, x: 0.0, y: 0.12 }, // z: hạ cánh tay xuống; y: đưa nhẹ ra trước
  lowerArm: { z: 0.0, x: 0.0, y: 0.55 },  // y: gập khuỷu vào trước
  hand: { z: 0.0, x: 0.0, y: 0.0 },
  shoulder: { z: 0.05 },
};


const navy = () => new THREE.MeshStandardMaterial({ color: 0x1b2058, roughness: 0.38, metalness: 0.25, emissive: 0x0a0d2a, emissiveIntensity: 0.5, side: THREE.DoubleSide });
const goldM = () => new THREE.MeshStandardMaterial({ color: 0xd9b36a, roughness: 0.3, metalness: 0.8, emissive: 0x4a3410, emissiveIntensity: 0.4 });
const hairM = () => new THREE.MeshStandardMaterial({ color: 0x08070d, roughness: 0.3, metalness: 0.15, side: THREE.DoubleSide });


/** Lát cắt thân (x rộng, z trước/sau) của lớp da, để áo dài ôm khít. */
function measureTorso(vrm, { hips, chest, uc, neck, shX }) {
  let mesh = null; vrm.scene.traverse((o) => { if (o.isSkinnedMesh && [].concat(o.material).some((m) => /Body/.test(m.name))) mesh = o; });
  const N = 60, y0 = 0, y1 = neck.y + 0.15, dy = (y1 - y0) / N;
  const sl = Array.from({ length: N + 1 }, () => ({ xmax: 0, zmin: 9, zmax: -9, n: 0 }));
  const v = new THREE.Vector3();
  if (mesh) {
    const cnt = mesh.geometry.attributes.position.count;
    for (let i = 0; i < cnt; i++) {
      mesh.getVertexPosition(i, v); v.applyMatrix4(mesh.matrixWorld);
      if (v.y < y0 || v.y > y1) continue;
      if (v.y > chest.y && Math.abs(v.x) > shX * 1.1) continue; // bỏ cánh tay ở T-pose
      const k = sl[Math.round((v.y - y0) / dy)];
      k.xmax = Math.max(k.xmax, Math.abs(v.x)); k.zmin = Math.min(k.zmin, v.z); k.zmax = Math.max(k.zmax, v.z); k.n++;
    }
  }
  const fb = (y) => ({ rx: y < hips.y ? 0.2 : 0.2, rz: 0.13, cz: 0.02 });
  const rows = sl.map((k, i) => {
    const y = y0 + i * dy;
    return k.n > 3 ? { y, rx: k.xmax, rz: (k.zmax - k.zmin) / 2, cz: (k.zmax + k.zmin) / 2 } : { y, ...fb(y) };
  });
  // làm mượt nhiều lượt để áo không gợn sóng
  let sm = rows;
  for (let pass = 0; pass < 18; pass++) sm = sm.map((r, i) => { const a = sm[Math.max(0, i - 3)], b = sm[Math.min(N, i + 3)]; return { y: r.y, rx: (a.rx + r.rx * 2 + b.rx) / 4, rz: (a.rz + r.rz * 2 + b.rz) / 4, cz: (a.cz + r.cz * 2 + b.cz) / 4 }; });
  return { rows: sm, at(y) { const i = Math.max(0, Math.min(N, Math.round((y - y0) / dy))); return sm[i]; } };
}

/** Thân áo: ôm thân trên, xòe dần xuống hai tà dài chạm sàn. */
function fittedDress(body, { floor, top, hipY, neckY }) {
  const rings = 90, seg = 56, pos = [], idx = [];
  for (let i = 0; i <= rings; i++) {
    const y = floor + (top - floor) * (i / rings);
    const m = y < hipY * 0.9 ? body.at(hipY * 0.9) : body.at(y); // tà áo: đường cong giải tích, không theo số đo hai chân
    const k = 1.12; // áo rộng hơn da một chút để da không lòi qua
    let rx = m.rx * k + 0.03, rz = m.rz * 1.3 + 0.045; // dày hơn ở trước/sau để không lộ ngực
    if (y < hipY) { const f = 1 - y / hipY; rx += 0.3 * f * f + 0.02 * f; rz += 0.12 * f * f; }   // tà xòe
    if (y > neckY - 0.02) { const f = Math.min(1, (y - (neckY - 0.02)) / 0.14); rx = rx * (1 - f) + 0.074 * f; rz = rz * (1 - f) + 0.07 * f; } // cổ đứng
    for (let j = 0; j < seg; j++) { const a = (j / seg) * Math.PI * 2; pos.push(Math.cos(a) * rx, y, m.cz + Math.sin(a) * rz); }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + ((j + 1) % seg), c = (i + 1) * seg + j, d = (i + 1) * seg + ((j + 1) % seg);
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

/** Áo dài tím than + tay áo + tóc dài, đo theo xương của chính mô hình để vừa khít. */
function buildOutfit(vrm, B) {
  vrm.scene.updateMatrixWorld(true);
  const wp = (n) => B(n).getWorldPosition(new THREE.Vector3());
  const hips = wp('hips'), chest = wp('chest'), uc = wp('upperChest'), neck = wp('neck'), head = wp('head');
  const sh = wp('leftUpperArm'), el = wp('leftLowerArm'), hand = wp('leftHand');
  const upLen = sh.distanceTo(el), loLen = el.distanceTo(hand), shX = Math.abs(sh.x);
  const g = new THREE.Group(); const dressMat = navy(), gold = goldM();

  // Đo thân hình thật của mô hình theo từng lát cắt ngang rồi may áo ôm theo đó.
  const body = measureTorso(vrm, { hips, chest, uc, neck, shX });
  const dressGeo = fittedDress(body, { floor: 0.0, top: neck.y + 0.12, hipY: hips.y, neckY: neck.y });
  const dress = new THREE.Mesh(dressGeo, dressMat); g.add(dress);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.073, 0.009, 8, 40), gold);
  collar.rotation.x = Math.PI / 2; collar.position.set(0, neck.y + 0.125, body.at(neck.y).cz); collar.scale.set(1, 0.9, 1); g.add(collar);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.007, 6, 80), gold);
  hem.rotation.x = Math.PI / 2; hem.position.set(0, 0.015, body.at(0).cz); hem.scale.set(1, 0.72, 1); g.add(hem);
  // đặt trong khung của xương hông để theo chuyển động nhẹ của thân
  B('hips').attach(g);

  // tay áo gắn theo xương cánh tay (trục ±X khi T-pose)
  for (const [side, dir] of [['left', 1], ['right', -1]]) {
    const upper = B(side + 'UpperArm'), lower = B(side + 'LowerArm');
    const mk = (len, r0, r1) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 18, 1, true), dressMat); m.geometry.rotateZ(-dir * Math.PI / 2); m.geometry.translate(dir * len / 2, 0, 0); return m; };
    upper.add(mk(upLen * 1.02, 0.058, 0.05));
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 10), dressMat); ball.position.x = dir * upLen; upper.add(ball);
    lower.add(mk(loLen * 0.9, 0.05, 0.04));
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.041, 0.006, 6, 18), gold); cuff.rotation.y = Math.PI / 2; cuff.position.x = dir * loLen * 0.9; lower.add(cuff);
  }

  // tóc dài gắn vào xương đầu
  const hm = hairM();
  const flow = new THREE.Group(); B('head').add(flow);
  const crown = head.y + (neck.y < head.y ? (head.y - neck.y) * 1.9 : 0.4);
  const hairLen = crown - hips.y * 0.82;
  // tóc dài thon dần ở đuôi, hơi phồng quanh vai
  const hp = [[0.0, 0], [0.13, -0.02], [0.17, -0.18], [0.2, -hairLen * 0.28], [0.2, -hairLen * 0.55], [0.15, -hairLen * 0.82], [0.06, -hairLen]].map(([r, y]) => new THREE.Vector2(r, y));
  const hc = new THREE.SplineCurve(hp).getPoints(40).map((p) => new THREE.Vector2(Math.max(p.x, 0.001), p.y));
  const long = new THREE.Mesh(new THREE.LatheGeometry(hc, 28), hm);
  long.scale.set(1, 1, 0.5); long.position.set(0, crown - head.y - 0.08, -0.15); flow.add(long);
  return { group: g, flow, dims: { hips, neck, head, crown, upLen, loLen, shX } };
}

export async function loadVRMAvatar(url) {
  const loader = new GLTFLoader();
  loader.register((p) => new VRMLoaderPlugin(p));
  const gltf = await loader.loadAsync(url);
  const vrm = gltf.userData.vrm;
  if (!vrm) throw new Error('Không phải tệp VRM');
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.combineSkeletons?.(gltf.scene);
  VRMUtils.rotateVRM0?.(vrm);
  vrm.scene.traverse((o) => { o.frustumCulled = false; });

  // Trang phục mẫu (áo thun/quần soóc) được ẩn đi và thay bằng áo dài dựng riêng; tóc nhuộm đen huyền.
  vrm.scene.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (/Tops|Bottoms|Shoes/.test(m.name)) m.visible = false;
      if (/HAIR/.test(m.name)) { m.color?.set(0x0a0912); m.shadeColorFactor?.set(0x05040a); m.rimLightingMixFactor = 0.3; }
    }
  });

  // Chuẩn hóa chiều cao để khớp khung máy ảnh
  const box = new THREE.Box3().setFromObject(vrm.scene);
  const scale = 3.3 / (box.max.y - box.min.y);
  vrm.scene.scale.setScalar(scale);
  vrm.scene.position.y = -box.min.y * scale;
  vrm.scene.rotation.y = 0;

  const B = (n) => vrm.humanoid.getNormalizedBoneNode(n);
  const outfit = buildOutfit(vrm, B);
  const bones = Object.fromEntries(['hips', 'spine', 'chest', 'upperChest', 'neck', 'head', 'leftShoulder', 'rightShoulder', 'leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm', 'leftHand', 'rightHand'].map((n) => [n, B(n)]));
  const em = vrm.expressionManager;
  const lookTarget = new THREE.Object3D(); vrm.scene.parent?.add(lookTarget);
  if (vrm.lookAt) vrm.lookAt.target = lookTarget;

  const st = { blink: 0, nextBlink: 2.5, vis: { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 }, vTimer: 0, vTarget: 'aa', happy: 0.25, relaxed: 0, look: new THREE.Vector2() };
  const VIS = ['aa', 'ih', 'ou', 'ee', 'oh'];
  const handMid = new THREE.Vector3(), tmp = new THREE.Vector3();

  function armsFromPose() {
    for (const [side, s] of [['left', -1], ['right', 1]]) {
      bones[side + 'UpperArm'].rotation.set(POSE.upperArm.x, s * POSE.upperArm.y, s * POSE.upperArm.z);
      bones[side + 'LowerArm'].rotation.set(POSE.lowerArm.x, s * POSE.lowerArm.y, s * POSE.lowerArm.z);
      bones[side + 'Hand'].rotation.set(POSE.hand.x, s * POSE.hand.y, s * POSE.hand.z);
      bones[side + 'Shoulder'].rotation.z = s * POSE.shoulder.z * -1;
    }
  }
  function pose(t, dt, state, pointer) {
    const k = REDUCED ? 0.3 : 1;
    const think = state.mood === 'think' ? 1 : 0, listen = state.mood === 'listen' ? 1 : 0;
    armsFromPose();
    // thở: ngực nở nhẹ, vai nhấp
    const br = Math.sin(t * 1.5);
    bones.spine.rotation.x = 0.012 * br * k + (state.speaking ? 0.01 * Math.sin(t * 2.1) : 0);
    bones.chest.rotation.x = 0.018 * br * k;
    bones.upperChest.rotation.x = 0.01 * br * k;
    bones.hips.rotation.y = Math.sin(t * 0.35) * 0.03 * k;
    // đầu/cổ: theo con trỏ, gật khi nói, nghiêng khi nghĩ
    st.look.x = damp(st.look.x, pointer.x * 0.35, 3, dt); st.look.y = damp(st.look.y, pointer.y * 0.18, 3, dt);
    const nod = state.speaking ? (Math.sin(t * 2.6) * 0.03 + Math.sin(t * 4.1) * 0.015) : 0;
    bones.neck.rotation.y = st.look.x * 0.5 + Math.sin(t * 0.4) * 0.03 * k;
    bones.head.rotation.y = st.look.x * 0.5;
    bones.neck.rotation.x = -st.look.y * 0.5 + nod * k + listen * 0.03;
    bones.head.rotation.x = -st.look.y * 0.5 + Math.sin(t * 0.6) * 0.012 * k;
    bones.head.rotation.z = damp(bones.head.rotation.z, think * 0.08 + Math.sin(t * 0.5) * 0.015 * k, 3, dt);
  }

  function express(t, dt, state) {
    if (!em) return;
    // chớp mắt
    st.nextBlink -= dt;
    if (st.nextBlink <= 0 && st.blink <= 0) { st.blink = 0.001; st.nextBlink = 2.2 + Math.random() * 3.4; }
    let b = 0;
    if (st.blink > 0) { st.blink += dt; const u = st.blink / 0.2; b = u < 0.5 ? u * 2 : (1 - u) * 2; if (u >= 1) { st.blink = 0; b = 0; } }
    em.setValue('blink', Math.max(0, Math.min(1, b)));
    // nụ cười dịu: sâu hơn khi lắng nghe, giảm khi suy nghĩ
    const happyT = state.mood === 'think' ? 0.1 : state.mood === 'listen' ? 0.4 : 0.28;
    st.happy = damp(st.happy, happyT, 3, dt);
    em.setValue('happy', st.happy);
    st.relaxed = damp(st.relaxed, state.mood === 'think' ? 0.3 : 0, 3, dt);
    em.setValue('relaxed', st.relaxed);
    // nhép môi: luân phiên các âm vị, biên độ dao động tự nhiên
    st.vTimer -= dt;
    if (st.vTimer <= 0) { st.vTimer = 0.09 + Math.random() * 0.1; st.vTarget = VIS[(Math.random() * VIS.length) | 0]; st.amp = 0.25 + Math.random() * 0.5; }
    for (const v of VIS) {
      const target = state.speaking && v === st.vTarget ? st.amp : 0;
      st.vis[v] = damp(st.vis[v], target, 22, dt);
      em.setValue(v, st.vis[v]);
    }
    // mắt liếc xuống khi nghĩ
    em.setValue('lookDown', damp(em.getValue('lookDown') ?? 0, state.mood === 'think' ? 0.5 : 0, 4, dt));
  }

  function update(t, dt, state, pointer, camera) {
    pose(t, dt, state, pointer);
    express(t, dt, state);
    // điểm nhìn: về phía máy ảnh, lệch theo con trỏ
    lookTarget.position.set(camera.position.x + pointer.x * 1.5, camera.position.y + pointer.y * 0.8, camera.position.z);
    outfit.flow.rotation.x = Math.sin(t * 0.9) * 0.025; outfit.flow.rotation.z = Math.sin(t * 0.7 + 1) * 0.03;
    vrm.update(dt);
    // quả cầu sáng nằm giữa hai bàn tay
    bones.chest.getWorldPosition(handMid); handMid.y -= 0.12; handMid.z += 0.38; // trước ngực, giữa hai tay
    return handMid;
  }

  return { vrm, scene: vrm.scene, update, lookTarget, bones, scale, outfit, armsFromPose };
}
