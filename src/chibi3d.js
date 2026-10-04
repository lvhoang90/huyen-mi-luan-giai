// Huyền My dạng chibi 3D, dựng hoàn toàn bằng mã (không cần tệp mô hình):
// đầu to, mắt lấp lánh, tóc đen tuyền mái thẳng, nón lá có viền lông và ngôi sao ngũ hành,
// áo dài tím thêu sen, voan trùm nón rủ xuống với chuyển động thật (tính theo từng điểm).
import * as THREE from 'three';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const INK = 0x2a1a4d;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- vật liệu hoạt hình ----------
const GM = (() => { const t = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (color, o = {}) => new THREE.MeshToonMaterial({ color, gradientMap: GM, ...o });
function outline(mesh, t = 0.03, color = INK) {
  const m = new THREE.Mesh(mesh.geometry, new THREE.ShaderMaterial({
    uniforms: { t: { value: t }, c: { value: new THREE.Color(color) } }, side: THREE.BackSide,
    vertexShader: 'uniform float t; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * t, 1.0); }',
    fragmentShader: 'uniform vec3 c; void main(){ gl_FragColor = vec4(c, 1.0); }',
  }));
  mesh.add(m); return m;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const ell = (g, x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };

// ---------- đầu: elip có cằm thon nhẹ; decal khuôn mặt ôm sát bề mặt ----------
const HR = { x: 0.98, y: 0.9, z: 0.96 };
const taper = (y) => (y < 0 ? 1 - 0.1 * Math.pow(-y / HR.y, 1.6) : 1);
const headZ = (x, y) => { const f = taper(y); const q = 1 - (x / (HR.x * f)) ** 2 - (y / HR.y) ** 2; return HR.z * f * Math.sqrt(Math.max(0, q)); };
function headGeometry() {
  const g = new THREE.SphereGeometry(1, 64, 48); const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const y = P.getY(i) * HR.y, f = taper(y); P.setXYZ(i, P.getX(i) * HR.x * f, y, P.getZ(i) * HR.z * f); }
  g.computeVertexNormals(); return g;
}
/** Tấm decal cong ôm đầu, tâm (cx,cy) trong hệ đầu; trả về mesh đặt tại tâm để co giãn tại chỗ (chớp mắt, mở miệng). */
function decal(w, h, cx, cy, map, { off = 0.012, order = 2, flip = false } = {}) {
  const S = 10, pos = [], uv = [], idx = [];
  for (let j = 0; j <= S; j++) for (let i = 0; i <= S; i++) {
    const u = i / S, v = j / S, x = cx + (u - 0.5) * w, y = cy + (v - 0.5) * h;
    pos.push((u - 0.5) * w, (v - 0.5) * h, headZ(x, y) + off); uv.push(flip ? 1 - u : u, v);
  }
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const a = j * (S + 1) + i, b = a + 1, c = a + S + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  m.position.set(cx, cy, 0); m.renderOrder = order; return m;
}

// ---------- texture khuôn mặt ----------
const eyeTex = () => canvasTex(320, 340, (g) => {
  g.translate(150, 176);
  g.fillStyle = '#fff'; ell(g, 0, 0, 100, 128);
  const gr = g.createRadialGradient(0, -20, 10, 0, 10, 112); gr.addColorStop(0, '#a58aff'); gr.addColorStop(0.45, '#4b2f93'); gr.addColorStop(1, '#1b0f3c');
  g.fillStyle = gr; ell(g, 0, 14, 84, 112);
  g.fillStyle = '#120a2a'; ell(g, 0, 22, 42, 58);
  g.fillStyle = '#fff'; circ(g, -30, -32, 32); circ(g, 34, 56, 16); g.fillStyle = 'rgba(230,220,255,.9)'; circ(g, -46, 44, 8);
  g.strokeStyle = '#2a1a4d'; g.lineCap = 'round'; g.lineWidth = 18; g.beginPath(); g.moveTo(-104, -30); g.bezierCurveTo(-90, -140, 90, -146, 104, -30); g.stroke();
  g.lineWidth = 14; g.beginPath(); g.moveTo(104, -30); g.quadraticCurveTo(128, -42, 140, -78); g.stroke();
  g.strokeStyle = 'rgba(190,140,130,.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-70, 124); g.bezierCurveTo(-30, 144, 30, 144, 70, 124); g.stroke();
});
const browTex = () => canvasTex(256, 96, (g) => { g.strokeStyle = '#1b1426'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(24, 62); g.bezierCurveTo(70, 18, 160, 14, 232, 52); g.stroke(); });
const blushTex = () => canvasTex(128, 96, (g) => { const r = g.createRadialGradient(64, 48, 0, 64, 48, 60); r.addColorStop(0, 'rgba(255,120,150,.75)'); r.addColorStop(1, 'rgba(255,120,150,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 96); g.strokeStyle = 'rgba(255,100,140,.7)'; g.lineWidth = 4; g.lineCap = 'round'; for (const x of [40, 62, 84]) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 8, 56); g.stroke(); } });
const smileTex = () => canvasTex(160, 90, (g) => { g.strokeStyle = '#b04a66'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(30, 34); g.quadraticCurveTo(80, 76, 130, 34); g.stroke(); });
const openTex = () => canvasTex(160, 120, (g) => {
  g.fillStyle = '#c93f68'; g.beginPath(); g.moveTo(24, 24); g.quadraticCurveTo(80, 128, 136, 24); g.quadraticCurveTo(80, 44, 24, 24); g.fill();
  g.fillStyle = '#ff9db8'; g.beginPath(); g.moveTo(52, 62); g.quadraticCurveTo(80, 100, 108, 62); g.quadraticCurveTo(80, 76, 52, 62); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(34, 28); g.quadraticCurveTo(80, 44, 126, 28); g.stroke();
  g.strokeStyle = '#2a1a4d'; g.lineWidth = 7; g.beginPath(); g.moveTo(24, 24); g.quadraticCurveTo(80, 128, 136, 24); g.stroke();
});

// ---------- nón lá: texture nhìn từ trên xuống, sao ngũ hành tỏa từ đỉnh ----------
const ELEM = [['Hỏa', '#ff6a4d'], ['Thổ', '#f0bd4a'], ['Kim', '#f6f1e2'], ['Thủy', '#5aa9ff'], ['Mộc', '#52d68f']]; // chiều kim đồng hồ, tương sinh
const hatTex = () => canvasTex(1024, 1024, (g) => {
  const C = 512, R = 508;
  const gr = g.createRadialGradient(C, C, 0, C, C, R); gr.addColorStop(0, '#fbebbd'); gr.addColorStop(0.6, '#f0d38d'); gr.addColorStop(1, '#d5ac5e');
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 5; i++) { // năm cánh màu quanh đỉnh, mỗi cánh đối diện một đỉnh sao
    const a0 = (-90 + 72 * i - 36) * Math.PI / 180, a1 = (-90 + 72 * i + 36) * Math.PI / 180;
    g.fillStyle = ELEM[i][1] + '47'; g.beginPath(); g.moveTo(C, C); g.arc(C, C, R, a0, a1); g.closePath(); g.fill();
  }
  g.strokeStyle = 'rgba(160,115,45,.45)'; g.lineWidth = 3;
  for (let i = 0; i < 96; i++) { const a = (i / 96) * Math.PI * 2; g.beginPath(); g.moveTo(C, C); g.lineTo(C + Math.cos(a) * R, C + Math.sin(a) * R); g.stroke(); }
  g.lineWidth = 4; for (let r = 60; r < R; r += 52) { g.beginPath(); g.arc(C, C, r, 0, Math.PI * 2); g.stroke(); }
  const rr = 330, P = [...Array(5)].map((_, k) => [C + rr * Math.cos((-90 + 72 * k) * Math.PI / 180), C + rr * Math.sin((-90 + 72 * k) * Math.PI / 180)]);
  g.setLineDash([6, 16]); g.strokeStyle = 'rgba(120,80,25,.7)'; g.lineWidth = 5; g.beginPath(); g.arc(C, C, rr + 40, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
  g.fillStyle = 'rgba(255,247,214,.4)'; g.strokeStyle = '#9b6b1f'; g.lineWidth = 13; g.lineJoin = 'round'; g.beginPath();
  for (let k = 0; k < 5; k++) { const p = P[(2 * k) % 5]; k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(201,151,47,.85)'; g.lineWidth = 6; g.beginPath(); P.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.stroke();
  P.forEach((p, k) => { g.fillStyle = ELEM[k][1]; g.strokeStyle = '#6b4414'; g.lineWidth = 9; g.beginPath(); g.arc(p[0], p[1], 34, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.85)'; circ(g, p[0] - 10, p[1] - 10, 10); });
  g.fillStyle = '#fff3b0'; g.strokeStyle = '#9b6b1f'; g.lineWidth = 7; g.beginPath(); g.arc(C, C, 26, 0, Math.PI * 2); g.fill(); g.stroke();
});

// ---------- áo dài: gradient tím + sen vàng cách điệu ----------
function drawSen(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = '#b9852a'; g.lineWidth = 2; g.lineJoin = 'round'; g.lineCap = 'round';
  const petal = (d, fill) => { g.fillStyle = fill; g.stroke(new Path2D(d)); g.fill(new Path2D(d)); };
  const gold = '#f6d77a';
  petal('M -3 3 C -26 2 -38 -12 -36 -26 C -24 -22 -10 -12 -3 3 Z', gold); petal('M 3 3 C 26 2 38 -12 36 -26 C 24 -22 10 -12 3 3 Z', gold);
  petal('M -2 1 C -18 -6 -24 -22 -18 -36 C -9 -28 -4 -14 -2 1 Z', gold); petal('M 2 1 C 18 -6 24 -22 18 -36 C 9 -28 4 -14 2 1 Z', gold);
  petal('M 0 0 C -10 -12 -9 -32 0 -46 C 9 -32 10 -12 0 0 Z', '#fff0b0');
  g.strokeStyle = '#b9852a'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-22, 6); g.quadraticCurveTo(-11, 13, 0, 7); g.quadraticCurveTo(11, 13, 22, 6); g.stroke();
  g.restore();
}
const dressTex = () => canvasTex(1024, 512, (g, W, H) => {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#a98af0'); gr.addColorStop(0.5, '#7a4cd0'); gr.addColorStop(1, '#4e2a97');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  let n = 0;
  for (const [y, s, cnt] of [[300, 1.7, 7], [400, 1.9, 7], [470, 1.5, 7]]) for (let i = 0; i <= cnt; i++) { const x = ((i + (n % 2) * 0.5) / cnt) * W; drawSen(g, x, y, s); if (x < 120) drawSen(g, x + W, y, s); n++; }
  g.fillStyle = '#f6d77a'; g.fillRect(0, H - 14, W, 8);
});

const limb = (a, b, r0, r1, mat) => {
  const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 20), mat);
  m.position.copy(a).addScaledVector(dir, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); return m;
};

// ---------- voan: lưới tham số, chuyển động tính theo từng điểm ----------
function makeVeil() {
  const NU = 96, NV = 56;
  const prof = [[0, 3.95], [0.5, 3.74], [1.0, 3.44], [1.55, 3.14], [1.98, 3.0], [1.9, 2.7], [1.68, 2.2], [1.66, 1.7], [1.82, 1.2], [2.02, 0.72], [2.2, 0.32], [2.3, 0.14]];
  const curve = new THREE.CatmullRomCurve3(prof.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal');
  const sp = curve.getSpacedPoints(NV);
  const pos = new Float32Array((NU + 1) * (NV + 1) * 3), col = new Float32Array((NU + 1) * (NV + 1) * 4), idx = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const th = (i / NU) * Math.PI * 2, y = sp[j].y, k = j * (NU + 1) + i, v = j / NV;
    const a = Math.atan2(Math.sin(th), Math.cos(th)); // 0 = chính diện
    let alpha = 0.3 + 0.08 * (0.5 + 0.5 * Math.sin(14 * th));
    if (y > 3.06) alpha = 0.34; // phủ nón
    const front = smooth(1.15, 0.5, Math.abs(a)) * smooth(1.4, 1.75, y) * smooth(3.1, 2.8, y); // mỏng ngay trên mặt
    alpha = alpha * (1 - 0.62 * front);
    const mix = v, fld = 0.05 * Math.sin(14 * th); col.set([0.88 + 0.06 * mix + fld, 1.0 - 0.1 * mix + fld, 0.96 + 0.04 * mix + fld, alpha], k * 4);
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 4)); geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  mesh.renderOrder = 6; mesh.frustumCulled = false;
  const pearls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), 48); pearls.renderOrder = 7; pearls.frustumCulled = false;
  const M = new THREE.Matrix4();
  function update(t) {
    const k = REDUCED ? 0.25 : 1;
    for (let j = 0; j <= NV; j++) {
      const v = j / NV, w = smooth(0.42, 1, v), r0 = sp[j].x, y0 = sp[j].y;
      for (let i = 0; i <= NU; i++) {
        const th = (i / NU) * Math.PI * 2;
        const fold = 1 + (0.012 + 0.05 * w) * Math.sin(14 * th + 0.6 * Math.sin(t * 0.8 * k + v * 3));
        const bill = 1 + w * k * (0.05 * Math.sin(2 * th + t * 0.9) + 0.03 * Math.sin(5 * th - t * 1.4));
        const r = r0 * fold * bill, y = y0 + w * w * k * (0.14 * Math.sin(3 * th + t * 1.3) + 0.07 * Math.sin(8 * th - t * 2.0));
        const o = (j * (NU + 1) + i) * 3; pos[o] = r * Math.sin(th); pos[o + 1] = y; pos[o + 2] = r * Math.cos(th);
      }
    }
    geo.attributes.position.needsUpdate = true;
    for (let n = 0; n < 48; n++) { // ngọc trai dọc gấu
      const i = Math.round((n / 48) * NU) % NU, o = (NV * (NU + 1) + i) * 3;
      M.makeTranslation(pos[o], pos[o + 1] + 0.02, pos[o + 2]); pearls.setMatrixAt(n, M);
    }
    pearls.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { mesh, pearls, update };
}

function lotusFlower(s = 1) {
  const g = new THREE.Group();
  for (const [ang, col, h] of [[-60, 0xf48fb6, 0.5], [60, 0xf48fb6, 0.5], [-30, 0xf9b2cf, 0.58], [30, 0xf9b2cf, 0.58], [0, 0xffd0e2, 0.64]]) {
    const p = new THREE.Mesh(new THREE.ConeGeometry(0.13, h, 14), toon(col)); p.position.set(Math.sin(ang * Math.PI / 180) * 0.13, h / 2, 0); p.rotation.z = -ang * Math.PI / 180 * 0.6; g.add(p);
  }
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 24), toon(0x7bc79a)); pad.position.y = 0.01; g.add(pad);
  g.scale.setScalar(s); return g;
}

export function makeChibi() {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const skin = toon(0xffe0cc), hairM = toon(0x050507, { emissive: 0x0b0b10 }), gold = new THREE.MeshStandardMaterial({ color: 0xd9b36a, roughness: 0.3, metalness: 0.8, emissive: 0x4a3410, emissiveIntensity: 0.4 });
  const dressMat = toon(0xffffff, { map: dressTex(), side: THREE.DoubleSide }), sleeveMat = toon(0x8a58de);

  // ----- thân + áo dài -----
  const prof = [[1.12, 0.3], [1.0, 0.55], [0.8, 0.9], [0.6, 1.16], [0.52, 1.3], [0.56, 1.44], [0.36, 1.58], [0.2, 1.66], [0.2, 1.78]].map(([r, y]) => new THREE.Vector2(r, y));
  const lc = new THREE.SplineCurve(prof).getPoints(60).map((p) => new THREE.Vector2(Math.max(p.x, 0.01), p.y));
  const dress = new THREE.Mesh(new THREE.LatheGeometry(lc, 64), dressMat); dress.scale.set(1, 1, 0.78); body.add(dress); outline(dress, 0.028);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.02, 8, 80), gold); hem.rotation.x = Math.PI / 2; hem.position.y = 0.31; hem.scale.set(1, 0.78, 1); body.add(hem);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 10, 32), gold); collar.rotation.x = Math.PI / 2; collar.position.y = 1.7; body.add(collar);
  for (const s of [-1, 1]) { // quần lụa + hài
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.3, 16), toon(0xfff6e6)); leg.position.set(s * 0.27, 0.2, 0.18); body.add(leg);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), toon(0xa357d9)); shoe.scale.set(0.9, 0.55, 1.35); shoe.position.set(s * 0.27, 0.09, 0.32); body.add(shoe); outline(shoe, 0.02);
  }
  // tay áo + bàn tay nâng quả cầu
  for (const s of [-1, 1]) {
    const sh = new THREE.Vector3(s * 0.52, 1.42, 0.05), hd = new THREE.Vector3(s * 0.17, 0.96, 0.62);
    const arm = limb(sh, hd, 0.17, 0.125, sleeveMat); body.add(arm); outline(arm, 0.022);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), sleeveMat); ball.position.copy(sh); body.add(ball);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.018, 8, 20), gold); cuff.position.copy(hd); cuff.lookAt(sh); body.add(cuff);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 14), skin); hand.position.set(s * 0.14, 0.92, 0.68); body.add(hand); outline(hand, 0.016);
  }
  // quả cầu
  const orb = new THREE.Group(); orb.position.set(0, 1.04, 0.74); body.add(orb);
  const orbTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(48, 44, 4, 64, 64, 64); r.addColorStop(0, '#fff'); r.addColorStop(0.35, '#ffe9a8'); r.addColorStop(0.8, '#b48cf5'); r.addColorStop(1, '#6b3fc4'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); g.fillStyle = 'rgba(122,79,208,.6)'; g.beginPath(); g.arc(70, 70, 26, 0, 7); g.fill(); g.fillStyle = '#e9d8ff'; g.beginPath(); g.arc(80, 62, 22, 0, 7); g.fill(); });
  const orbCore = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 18), new THREE.MeshBasicMaterial({ map: orbTex })); orb.add(orbCore);
  const glowTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,235,190,.95)'); r.addColorStop(0.4, 'rgba(255,235,190,.3)'); r.addColorStop(1, 'rgba(255,235,190,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  const orbGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); orbGlow.scale.setScalar(1.1); orb.add(orbGlow);
  const orbLight = new THREE.PointLight(0xffe2a8, 0.6, 5, 2); orb.add(orbLight);

  // ----- đầu -----
  const head = new THREE.Group(); head.position.set(0, 2.35, 0); body.add(head);
  const skull = new THREE.Mesh(headGeometry(), skin); head.add(skull); outline(skull, 0.03);
  const eyeT = eyeTex(); const eyes = [];
  for (const s of [-1, 1]) { const e = decal(0.66, 0.7, s * 0.4, -0.02, eyeT, { flip: s < 0 }); head.add(e); eyes.push(e); }
  const brows = [];
  for (const s of [-1, 1]) { const b = decal(0.5, 0.19, s * 0.4, 0.3, browTex(), { flip: s < 0 }); head.add(b); brows.push(b); }
  for (const s of [-1, 1]) head.add(decal(0.4, 0.3, s * 0.64, -0.3, blushTex(), { off: 0.008, order: 1 }));
  const smile = decal(0.34, 0.19, 0, -0.5, smileTex()); head.add(smile);
  const open = decal(0.34, 0.26, 0, -0.5, openTex()); head.add(open); open.scale.y = 0.001;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), toon(0xf0bfa6)); nose.position.set(0, -0.28, headZ(0, -0.28) + 0.005); head.add(nose);

  // tóc đen tuyền: vỏ sau, mái thẳng (mép lượn mềm), tóc dài, hai lọn bên
  const backShell = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, Math.PI * 0.9, Math.PI * 1.2, 0, Math.PI * 0.86), hairM); backShell.scale.set(HR.x * 1.05, HR.y * 1.04, HR.z * 1.06); head.add(backShell);
  const bg = new THREE.SphereGeometry(1, 72, 24, -Math.PI * 0.2, Math.PI * 1.4, 0, 1.2); const bp = bg.attributes.position;
  for (let i = 0; i < bp.count; i++) { // mép dưới: sóng nhẹ
    const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), edge = smooth(0.42, 0.36, y);
    if (edge > 0) bp.setY(i, y - edge * 0.05 * (0.5 + 0.5 * Math.sin(Math.atan2(x, z) * 9)));
  }
  bg.computeVertexNormals();
  const bangs = new THREE.Mesh(bg, hairM); bangs.scale.set(HR.x * 1.045, HR.y * 1.045, HR.z * 1.06); head.add(bangs);
  const longProf = [[0.0, 0.1], [0.82, 0.0], [1.02, -0.4], [1.0, -0.9], [0.9, -1.3], [0.7, -1.66], [0.25, -1.8]].map(([r, y]) => new THREE.Vector2(r, y));
  const longHair = new THREE.Group(); longHair.position.set(0, 0, -0.4); head.add(longHair);
  const lh = new THREE.Mesh(new THREE.LatheGeometry(new THREE.SplineCurve(longProf).getPoints(40).map((p) => new THREE.Vector2(Math.max(p.x, 0.01), p.y)), 40), hairM); lh.scale.set(1, 1, 0.55); longHair.add(lh);
  const locks = [];
  for (const s of [-1, 1]) { const l = new THREE.Group(); l.position.set(s * 0.93, -0.12, 0.3); const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.9, 6, 16), hairM); m.position.y = -0.52; m.scale.z = 0.8; l.add(m); head.add(l); locks.push(l); }

  // ----- nón lá + viền lông + quai thao -----
  const hat = new THREE.Group(); hat.position.y = 0.66; hat.rotation.x = -0.26; head.add(hat);
  const HRAD = 1.78, HH = 0.9, hp = [];
  for (let i = 0; i <= 28; i++) { const t = i / 28; hp.push(new THREE.Vector2(HRAD * t, HH * Math.pow(1 - t, 1.12))); }
  const hg = new THREE.LatheGeometry(hp, 96); const hu = hg.attributes.uv, hpos = hg.attributes.position;
  for (let i = 0; i < hu.count; i++) hu.setXY(i, hpos.getX(i) / (2 * HRAD) + 0.5, hpos.getZ(i) / (2 * HRAD) + 0.5);
  const hatMesh = new THREE.Mesh(hg, new THREE.MeshToonMaterial({ map: hatTex(), gradientMap: GM, side: THREE.DoubleSide })); hat.add(hatMesh);
  const furGeo = new THREE.SphereGeometry(0.095, 14, 10), furM = toon(0xffffff, { emissive: 0x2a2540 });
  const fur = new THREE.InstancedMesh(furGeo, furM, 60), Mx = new THREE.Matrix4();
  for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; Mx.makeTranslation(Math.sin(a) * (HRAD - 0.02), -0.01, Math.cos(a) * (HRAD - 0.02)); fur.setMatrixAt(i, Mx); }
  hat.add(fur);
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), gold); bead.position.y = HH + 0.02; hat.add(bead);
  const strapM = toon(0xa97bf0);
  for (const sg of [-1, 1]) { // đi theo hệ tọa độ của đầu: từ vành nón xuống hai bên má rồi vòng dưới cằm
    const c = new THREE.CatmullRomCurve3([[1.62, 0.62, 0.3], [1.28, 0.2, 0.34], [1.08, -0.3, 0.4], [0.84, -0.78, 0.52], [0.5, -1.0, 0.62], [0.16, -1.04, 0.66]].map(([x, y, z]) => new THREE.Vector3(sg * x, y, z)));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(c, 48, 0.04, 8), strapM); head.add(tube);
  }
  const bow = new THREE.Group(); bow.position.set(0, -1.05, 0.68); head.add(bow);
  for (const sg of [-1, 1]) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), strapM); w.scale.set(1.1, 0.7, 0.5); w.position.x = sg * 0.16; w.rotation.z = sg * 0.3; bow.add(w); const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.28, 4, 8), strapM); tail.position.set(sg * 0.07, -0.2, 0); tail.rotation.z = sg * 0.25; bow.add(tail); }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), toon(0x8a57de)); bow.add(knot);

  // ----- voan + hoa sen dưới chân -----
  const veil = makeVeil(); root.add(veil.mesh, veil.pearls);
  const lt1 = lotusFlower(0.9); lt1.position.set(-1.55, 0.02, 0.9); const lt2 = lotusFlower(0.8); lt2.position.set(1.6, 0.02, 0.85); root.add(lt1, lt2);

  // ----- trạng thái -----
  const st = { speaking: false, mood: 'idle', cast: 0, castUntil: 0, blink: 0, nextBlink: 2.2, mouth: 0, look: new THREE.Vector2(), orbTint: new THREE.Color(0xfff2d0) };
  function update(t, dt, pointer) {
    const k = REDUCED ? 0.25 : 1, think = st.mood === 'think' ? 1 : 0, listen = st.mood === 'listen' ? 1 : 0;
    body.scale.y = 1 + Math.sin(t * 1.5) * 0.006 * k; body.position.y = Math.sin(t * 1.5) * 0.012 * k;
    st.look.x = damp(st.look.x, pointer.x, 3, dt); st.look.y = damp(st.look.y, pointer.y, 3, dt);
    const nod = st.speaking ? Math.sin(t * 2.6) * 0.04 + Math.sin(t * 4.1) * 0.02 : 0;
    head.rotation.y = st.look.x * 0.3 + Math.sin(t * 0.4) * 0.04 * k;
    head.rotation.x = -st.look.y * 0.14 + nod * k + listen * 0.04 + Math.sin(t * 0.6) * 0.012 * k;
    head.rotation.z = damp(head.rotation.z, think * 0.08 + Math.sin(t * 0.5) * 0.015 * k, 3, dt);
    st.nextBlink -= dt; if (st.nextBlink <= 0 && st.blink <= 0) { st.blink = 0.001; st.nextBlink = 2.4 + Math.random() * 3.2; }
    let lid = 1; if (st.blink > 0) { st.blink += dt; const u = st.blink / 0.2; lid = u < 0.5 ? 1 - u * 2 * 0.92 : 0.08 + (u - 0.5) * 2 * 0.92; if (u >= 1) { st.blink = 0; lid = 1; } }
    for (const e of eyes) e.scale.y = Math.max(0.08, lid);
    for (const b of brows) b.position.y = damp(b.position.y, 0.3 + listen * 0.03, 5, dt);
    const target = st.speaking ? 0.35 + 0.65 * Math.abs(Math.sin(t * 9) * Math.sin(t * 5.3 + 1.1)) : 0;
    st.mouth = damp(st.mouth, target, 18, dt); open.scale.y = Math.max(0.001, st.mouth); smile.visible = st.mouth < 0.12;
    longHair.rotation.x = Math.sin(t * 0.9) * 0.025 * k; longHair.rotation.z = Math.sin(t * 0.7 + 1) * 0.03 * k;
    locks[0].rotation.z = 0.04 + Math.sin(t * 1.1) * 0.03 * k; locks[1].rotation.z = -0.04 + Math.sin(t * 1.0 + 2) * 0.03 * k;
    veil.update(t);
    st.cast = damp(st.cast, st.mood === 'think' || st.castUntil > t ? 1 : 0, 3, dt);
    const s = 0.9 + Math.sin(t * 2.2) * 0.08 + st.cast * (0.9 + Math.sin(t * 7) * 0.25);
    orbGlow.scale.setScalar(1.1 * s); orbLight.intensity = 0.5 + st.cast * 2.2; orb.position.y = 1.04 + Math.sin(t * 1.3) * 0.02 + st.cast * 0.1;
    orbGlow.material.color.lerp(st.orbTint, 0.05); orbLight.color.lerp(st.orbTint, 0.05);
  }
  return { group: root, st, update };
}
