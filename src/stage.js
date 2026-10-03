import * as THREE from 'three';
import { loadVRMAvatar, POSE } from './vrmAvatar.js';

const ELEMENT_COLORS = { Kim: 0xf1ead2, Mộc: 0x7fe3a0, Thủy: 0x6fb7ff, Hỏa: 0xff8a5c, Thổ: 0xe0b86a };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

// ---------- texture helpers ----------
function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner); gr.addColorStop(0.35, inner.replace(/[\d.]+\)$/, '0.35)')); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function glyphTexture(ch, color) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.shadowColor = color; g.shadowBlur = 18; g.fillStyle = color;
  g.font = '700 70px "Noto Serif CJK SC","Noto Serif SC","Songti SC","SimSun",serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 70);
  return new THREE.CanvasTexture(c);
}
function wheelTexture() {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); g.translate(S / 2, S / 2);
  g.strokeStyle = 'rgba(214,190,255,0.9)'; g.lineWidth = 3;
  for (const r of [490, 440, 300]) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
  g.lineWidth = 1.5;
  for (let i = 0; i < 72; i++) { g.save(); g.rotate((i / 72) * Math.PI * 2); g.beginPath(); g.moveTo(0, -490); g.lineTo(0, -(i % 3 ? 474 : 462)); g.stroke(); g.restore(); }
  // Bát quái: 8 hào ba vạch (liền / đứt)
  const tri = [[1,1,1],[0,1,1],[1,0,1],[0,0,1],[1,1,0],[0,1,0],[1,0,0],[0,0,0]];
  g.lineWidth = 7; g.lineCap = 'round';
  tri.forEach((t, i) => {
    g.save(); g.rotate((i / 8) * Math.PI * 2);
    t.forEach((solid, j) => {
      const y = -405 + j * 22;
      g.beginPath();
      if (solid) { g.moveTo(-42, y); g.lineTo(42, y); } else { g.moveTo(-42, y); g.lineTo(-8, y); g.moveTo(8, y); g.lineTo(42, y); }
      g.stroke();
    });
    g.restore();
  });
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}

// ---------- background shader: bầu trời huyền ảo ----------
function makeBackdrop() {
  const mat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uTint: { value: new THREE.Color(0x8a6bff) }, uCenter: { value: new THREE.Vector2(0.5, 0.6) }, uPulse: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
    fragmentShader: `
      precision highp float; varying vec2 vUv; uniform float uTime, uPulse; uniform vec2 uRes, uCenter; uniform vec3 uTint;
      float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+7.1; a*=.5; } return s; }
      void main(){
        vec2 uv = vUv; float asp = uRes.x/uRes.y; vec2 p = (uv-uCenter); p.x *= asp;
        vec3 top = vec3(0.02,0.03,0.10), mid = vec3(0.10,0.07,0.26), low = vec3(0.07,0.20,0.27), floorC = vec3(0.02,0.02,0.06);
        vec3 col = mix(low, mid, smoothstep(0.05,0.55,uv.y)); col = mix(col, top, smoothstep(0.55,1.0,uv.y));
        col = mix(floorC, col, smoothstep(0.0,0.22,uv.y));
        // cực quang mềm
        float t = uTime*0.05;
        float band = fbm(vec2(uv.x*2.2 + t, uv.y*3.0 - t*0.7));
        float ribbon = smoothstep(0.45,0.8,band) * smoothstep(0.35,0.7,uv.y) * (1.0-smoothstep(0.85,1.0,uv.y));
        col += ribbon * mix(uTint, vec3(0.35,0.9,0.85), 0.35) * 0.32;
        // sương mờ
        float mist = fbm(vec2(uv.x*3.0 - uTime*0.02, uv.y*6.0 + uTime*0.01));
        col += mist * smoothstep(0.45,0.0,uv.y) * 0.12 * vec3(0.6,0.7,1.0);
        // vầng trăng sau lưng nhân vật
        float d = length(p - vec2(0.0, 0.05));
        float moon = smoothstep(0.30,0.285,d);
        float halo = exp(-d*3.6) * (0.55 + 0.25*uPulse);
        col += uTint * halo * 0.55;
        col = mix(col, vec3(0.95,0.93,1.0)*(0.82 + 0.1*fbm(p*9.0)), moon*0.22);
        col += vec3(0.8,0.75,1.0) * smoothstep(0.31,0.30,d) * smoothstep(0.285,0.30,d) * 0.35;
        // sao
        vec2 sg = uv*vec2(asp,1.0)*vec2(95.0,60.0); vec2 id = floor(sg); float r = h21(id);
        float star = step(0.986, r) * smoothstep(0.5,0.0,length(fract(sg)-0.5)) * (0.5+0.5*sin(uTime*(1.0+r*3.0)+r*40.0));
        col += star * smoothstep(0.35,0.9,uv.y) * vec3(0.9,0.9,1.0);
        // vignette
        col *= 1.0 - 0.55*pow(length((uv-0.5)*vec2(1.0,0.9)), 2.2);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  m.frustumCulled = false; m.renderOrder = -1000;
  return m;
}

// ---------- hạt: đom đóm / cánh sen ----------
function makeParticles({ count, color, size, speed, spread, sway, height = 7 }) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) { pos[i * 3] = (Math.random() - 0.5) * spread; pos[i * 3 + 1] = Math.random() * height; pos[i * 3 + 2] = (Math.random() - 0.3) * spread * 0.5 - 0.5; seed[i] = Math.random(); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uSize: { value: size }, uSpeed: { value: speed }, uSway: { value: sway }, uH: { value: height }, uPR: { value: 1 } },
    vertexShader: `
      attribute float aSeed; uniform float uTime, uSize, uSpeed, uSway, uH, uPR; varying float vA;
      void main(){
        vec3 p = position; float t = uTime*uSpeed*(0.4+aSeed);
        p.y = mod(p.y + t, uH) - 0.3;
        p.x += sin(uTime*0.5*(0.5+aSeed) + aSeed*20.0) * uSway;
        p.z += cos(uTime*0.4 + aSeed*11.0) * uSway*0.5;
        vA = smoothstep(0.0,1.2,p.y+0.3) * smoothstep(uH,uH-1.5,p.y+0.3) * (0.55+0.45*sin(uTime*(1.5+aSeed*2.0)+aSeed*30.0));
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_PointSize = uSize * uPR * (0.5+aSeed) * (8.0/ -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying float vA;
      void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d); gl_FragColor = vec4(uColor, a*a*vA); }`,
  });
  return new THREE.Points(geo, mat);
}

// ---------- nhân vật Huyền My ----------
function makeHuyenMy() {
  const root = new THREE.Group();
  const g = new THREE.Group(); root.add(g); // g = thân hình procedural (ẩn khi có VRM)
  const skin = new THREE.MeshStandardMaterial({ color: 0xf2d2bc, roughness: 0.62, emissive: 0x3a1a14, emissiveIntensity: 0.12 });
  const dress = new THREE.MeshStandardMaterial({ color: 0x1b2058, roughness: 0.38, metalness: 0.25, emissive: 0x0a0d2a, emissiveIntensity: 0.5 });
  const hairM = new THREE.MeshStandardMaterial({ color: 0x08070d, roughness: 0.3, metalness: 0.15, side: THREE.DoubleSide });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9b36a, roughness: 0.3, metalness: 0.8, emissive: 0x4a3410, emissiveIntensity: 0.4 });
  const ink = new THREE.MeshBasicMaterial({ color: 0x120a10 });

  // Áo dài: thân lathe, bóp theo z cho dáng mảnh
  const prof = [[0.78,0],[0.62,0.45],[0.5,0.95],[0.4,1.4],[0.3,1.72],[0.27,1.92],[0.33,2.14],[0.31,2.3],[0.2,2.42],[0.115,2.5],[0.115,2.62]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const curve = new THREE.SplineCurve(prof).getPoints(70).map((p) => new THREE.Vector2(Math.max(p.x, 0.01), p.y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(curve, 64), dress);
  body.scale.set(1.28, 1, 0.6); g.add(body);
  // viền vàng cổ áo & nẹp cài
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.012, 8, 40), gold);
  collar.rotation.x = Math.PI / 2; collar.position.y = 2.61; collar.scale.set(1, 1.1, 1); g.add(collar);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.01, 6, 80), gold);
  hem.rotation.x = Math.PI / 2; hem.position.y = 0.02; hem.scale.set(1.28, 0.6, 1); g.add(hem);

  // Cổ
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.082, 0.34, 20), skin);
  neck.position.y = 2.68; g.add(neck);

  // Đầu (mặt trái xoan)
  const head = new THREE.Group(); head.position.set(0, 3.02, 0.02); g.add(head);
  const R = 0.34, SX = 0.9, SY = 1.1, SZ = 0.95;
  const taper = (ny) => (ny < 0 ? Math.pow(-ny, 1.5) : 0);
  const hg = new THREE.SphereGeometry(R, 56, 44);
  const P = hg.attributes.position;
  for (let i = 0; i < P.count; i++) {
    let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    const t = taper(y / R);
    x *= SX * (1 - 0.34 * t); z *= SZ * (1 - 0.2 * t); y *= SY;
    P.setXYZ(i, x, y, z);
  }
  hg.computeVertexNormals();
  head.add(new THREE.Mesh(hg, skin));
  // z trên bề mặt mặt tại (x,y)
  const faceZ = (x, y) => {
    const ny = y / (R * SY); const t = taper(ny);
    const x0 = x / (R * SX * (1 - 0.34 * t));
    const z0 = Math.sqrt(Math.max(0, 1 - x0 * x0 - ny * ny));
    return z0 * R * SZ * (1 - 0.2 * t);
  };
  const face = new THREE.Group(); head.add(face);
  const place = (obj, x, y, dz = 0.004) => { obj.position.set(x, y, faceZ(x, y) + dz); face.add(obj); return obj; };

  // Mắt
  const eyes = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 16), new THREE.MeshStandardMaterial({ color: 0x140b10, roughness: 0.15, metalness: 0.2 }));
    ball.scale.set(0.95, 1.05, 0.35); eye.add(ball);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    spark.position.set(0.016 * s, 0.02, 0.02); eye.add(spark);
    const spark2 = spark.clone(); spark2.scale.setScalar(0.45); spark2.position.set(-0.014 * s, -0.016, 0.02); eye.add(spark2);
    const lash = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.0055, 6, 20, Math.PI * 0.95), ink);
    lash.rotation.z = Math.PI * 0.025; lash.position.y = 0.006; lash.scale.set(1.08, 0.75, 1); eye.add(lash);
    eye.rotation.z = -s * 0.1;
    place(eye, 0.118 * s, 0.045, 0.002); eye.userData.s = s; eyes.push(eye);
  }
  // Lông mày
  const brows = [];
  for (const s of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.0055, 6, 20, Math.PI * 0.42), ink);
    b.rotation.z = Math.PI * 0.29 + (s < 0 ? 0 : Math.PI * 0.0); if (s > 0) b.rotation.z = Math.PI * 0.29;
    b.scale.set(1, 0.55, 1);
    const holder = new THREE.Group(); holder.add(b); b.position.set(0, -0.06, 0);
    place(holder, 0.122 * s, 0.14, 0.0); holder.userData.s = s; brows.push(holder);
    if (s < 0) { b.rotation.z = Math.PI * 0.29; b.scale.x = -1; }
  }
  // Mũi, má, miệng
  const nose = place(new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), new THREE.MeshStandardMaterial({ color: 0xe9bfa8, roughness: 0.7 })), 0, -0.035, 0.006);
  nose.scale.set(1, 0.9, 0.9);
  const blushTex = glowTexture('rgba(255,120,140,0.55)', 'rgba(255,120,140,0)');
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.1), new THREE.MeshBasicMaterial({ map: blushTex, transparent: true, depthWrite: false, opacity: 0.55 }));
    place(m, 0.165 * s, -0.045, 0.012);
    m.lookAt(m.position.clone().multiplyScalar(3).add(new THREE.Vector3(0, 0, 1)));
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.0065, 8, 28, Math.PI * 0.62), new THREE.MeshBasicMaterial({ color: 0xa8444c }));
  const mouthG = new THREE.Group(); place(mouthG, 0, -0.145, 0.006);
  smile.rotation.z = -Math.PI / 2 - Math.PI * 0.31; smile.position.y = 0.045; mouthG.add(smile);
  const open = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshBasicMaterial({ color: 0x4a1218 }));
  open.scale.set(1.2, 0.01, 0.4); open.position.set(0, -0.004, 0.0); mouthG.add(open);

  // Tóc: chỏm đầu + sau + hai lọn trước + tóc dài
  const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.045, 48, 36, 0, Math.PI * 2, 0, Math.PI * 0.4), hairM);
  cap.scale.set(SX * 1.02, SY * 1.03, SZ * 1.04); cap.position.y = 0.012; head.add(cap);
  const back = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 48, 36, Math.PI * 0.93, Math.PI * 1.14, 0, Math.PI * 0.82), hairM);
  back.scale.set(SX * 1.04, SY * 1.03, SZ * 1.06); head.add(back);
  const flow = new THREE.Group(); flow.position.set(0, 0.0, -0.1); head.add(flow);
  const long = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.2, 2.05, 28, 10, true), hairM);
  long.scale.z = 0.5; long.position.set(0, -1.02, -0.06); flow.add(long);
  const lockL = new THREE.Group(), lockR = new THREE.Group();
  for (const [lk, s] of [[lockL, -1], [lockR, 1]]) {
    const lm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.03, 1.15, 14, 6), hairM);
    lm.position.y = -0.58; lm.scale.z = 0.7; lk.add(lm);
    lk.position.set(0.31 * s, -0.02, 0.1); lk.rotation.z = s * 0.06; head.add(lk);
  }
  // trâm cài
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), gold); pin.position.set(0.23, 0.2, -0.17); head.add(pin);
  const pinGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,220,140,0.9)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  pinGlow.scale.setScalar(0.18); pinGlow.position.copy(pin.position); head.add(pinGlow);

  // Tay áo + bàn tay chắp trước bụng
  const limb = (a, b, r0, r1, mat) => {
    const dir = new THREE.Vector3().subVectors(b, a); const len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 16), mat);
    m.position.copy(a).addScaledVector(dir, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  };
  for (const s of [-1, 1]) {
    const sh = new THREE.Vector3(0.4 * s, 2.28, 0.0), el = new THREE.Vector3(0.45 * s, 1.88, 0.14), wr = new THREE.Vector3(0.1 * s, 1.62, 0.37);
    g.add(limb(sh, el, 0.085, 0.075, dress)); g.add(limb(el, wr, 0.075, 0.07, dress));
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.078, 16, 12), dress); ball.position.copy(el); g.add(ball);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 6, 20), gold); cuff.position.copy(wr); cuff.lookAt(el); g.add(cuff);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), skin); hand.scale.set(0.8, 1, 0.9); hand.position.set(0.055 * s, 1.6, 0.4); g.add(hand);
  }
  // Quả cầu ánh sáng giữa hai lòng bàn tay
  const orb = new THREE.Group(); orb.position.set(0, 1.78, 0.46); root.add(orb);
  const orbCore = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff2d0 })); orb.add(orbCore);
  const orbGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,235,190,0.95)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  orbGlow.scale.setScalar(0.45); orb.add(orbGlow);
  const orbLight = new THREE.PointLight(0xffe2a8, 0.6, 3, 2); orb.add(orbLight);

  // ---- trạng thái hoạt họa ----
  const st = { speaking: false, mood: 'idle', cast: 0, blink: 0, nextBlink: 2.5, mouth: 0, look: new THREE.Vector2(), orbTint: new THREE.Color(0xfff2d0) };
  function update(t, dt, pointer, handsAt) {
    const k = REDUCED ? 0.25 : 1;
    // thở
    g.scale.y = 1 + Math.sin(t * 1.5) * 0.0035 * k;
    // đầu: nhìn theo con trỏ + nhịp gật khi nói / nghiêng khi nghĩ
    const think = st.mood === 'think' ? 1 : 0, listen = st.mood === 'listen' ? 1 : 0;
    const speakNod = st.speaking ? Math.sin(t * 2.6) * 0.025 + Math.sin(t * 4.1) * 0.012 : 0;
    st.look.x = damp(st.look.x, pointer.x * 0.28, 3, dt); st.look.y = damp(st.look.y, pointer.y * 0.14, 3, dt);
    head.rotation.y = st.look.x + Math.sin(t * 0.4) * 0.04 * k;
    head.rotation.x = -st.look.y + speakNod * k + listen * 0.03 + Math.sin(t * 0.6) * 0.012 * k;
    head.rotation.z = damp(head.rotation.z, think * 0.07 + Math.sin(t * 0.5) * 0.015 * k, 3, dt);
    // chớp mắt
    st.nextBlink -= dt; if (st.nextBlink <= 0 && st.blink <= 0) { st.blink = 0.001; st.nextBlink = 2.2 + Math.random() * 3.2; }
    let lid = 1;
    if (st.blink > 0) { st.blink += dt; const u = st.blink / 0.18; lid = u < 0.5 ? 1 - u * 2 * 0.92 : 0.08 + (u - 0.5) * 2 * 0.92; if (u >= 1) { st.blink = 0; lid = 1; } }
    const lookDown = think * 0.25;
    for (const e of eyes) { e.scale.set(1, Math.max(0.08, lid), 1); e.position.y = 0.045 - lookDown * 0.01; }
    // lông mày: nâng khi lắng nghe, chụm nhẹ khi suy nghĩ
    for (const b of brows) { b.position.y = damp(b.position.y, 0.14 + listen * 0.012 + think * 0.004, 5, dt); b.rotation.z = damp(b.rotation.z, b.userData.s * think * 0.06, 5, dt); }
    // miệng
    const target = st.speaking ? 0.35 + 0.65 * Math.abs(Math.sin(t * 9.0) * Math.sin(t * 5.3 + 1.1)) : 0;
    st.mouth = damp(st.mouth, target, 18, dt);
    open.scale.y = 0.01 + st.mouth * 1.0; open.position.y = -0.006 - st.mouth * 0.016;
    smile.scale.y = 1 - st.mouth * 0.35;
    // tóc đung đưa
    flow.rotation.x = Math.sin(t * 0.9) * 0.02 * k; flow.rotation.z = Math.sin(t * 0.7 + 1) * 0.025 * k;
    lockL.rotation.z = -0.06 + Math.sin(t * 1.1) * 0.02 * k; lockR.rotation.z = 0.06 + Math.sin(t * 1.0 + 2) * 0.02 * k;
    pinGlow.material.opacity = 0.6 + 0.4 * Math.sin(t * 2);
    // quả cầu: thở nhẹ, bừng sáng khi "gieo quẻ"/suy nghĩ
    st.cast = damp(st.cast, st.mood === 'think' || st.castUntil > t ? 1 : 0, 3, dt);
    const s = 0.9 + Math.sin(t * 2.2) * 0.08 + st.cast * (0.9 + Math.sin(t * 7) * 0.25);
    orbGlow.scale.setScalar(0.45 * s); orbLight.intensity = 0.5 + st.cast * 2.2;
    const baseY = handsAt ? handsAt.y + 0.1 : 1.78;
    orb.position.set(handsAt ? handsAt.x : 0, baseY + Math.sin(t * 1.3) * 0.015 + st.cast * 0.12, handsAt ? handsAt.z + 0.06 : 0.46);
    orbGlow.material.color.lerp(st.orbTint, 0.05); orbCore.material.color.lerp(st.orbTint, 0.05); orbLight.color.lerp(st.orbTint, 0.05);
  }
  return { group: root, shell: g, st, update, headWorldY: 3.0 };
}

// ---------- sân khấu ----------
export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  const target = new THREE.Vector3(0, 2.15, 0);

  const backdrop = makeBackdrop(); scene.add(backdrop);

  scene.add(new THREE.HemisphereLight(0xb9a8ff, 0x1a1030, 0.9));
  const key = new THREE.DirectionalLight(0xffe6cf, 2.1); key.position.set(1.6, 3.8, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8ea2ff, 2.6); rim.position.set(-3, 3.5, -3); scene.add(rim);
  const fill = new THREE.PointLight(0xffc7e0, 8, 8, 2); fill.position.set(-1.2, 2.6, 2.2); scene.add(fill);

  const hm = makeHuyenMy(); scene.add(hm.group);
  let avatar = null;
  // Nạp nhân vật VRM (chuẩn quốc tế); nếu lỗi/không có tệp thì giữ nhân vật procedural.
  loadVRMAvatar('/models/huyenmy.vrm').then((a) => {
    avatar = a; scene.add(a.scene); scene.add(a.lookTarget); hm.shell.visible = false;
    if (import.meta.env?.DEV) window.__hm = { avatar: a, POSE };
  }).catch((e) => console.warn('[huyenmy] dùng nhân vật dự phòng:', e.message));

  // Vòng bát quái + ngũ hành sau lưng
  const wheelGroup = new THREE.Group(); wheelGroup.position.set(0, 2.55, -1.6); scene.add(wheelGroup);
  const wheel = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.6), new THREE.MeshBasicMaterial({ map: wheelTexture(), transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
  wheelGroup.add(wheel);
  const glyphs = [];
  const GL = [['金', 'Kim', '#f1ead2'], ['木', 'Mộc', '#7fe3a0'], ['水', 'Thủy', '#6fb7ff'], ['火', 'Hỏa', '#ff8a5c'], ['土', 'Thổ', '#e0b86a']];
  const ring = new THREE.Group(); ring.position.set(0, 2.55, -1.55); scene.add(ring);
  GL.forEach(([ch, name, col], i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTexture(ch, col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
    sp.scale.setScalar(0.5); sp.userData = { name, a: (i / 5) * Math.PI * 2 }; ring.add(sp); glyphs.push(sp);
  });

  const fireflies = makeParticles({ count: 110, color: 0xffdf9a, size: 26, speed: 0.18, spread: 9, sway: 0.5 });
  const petals = makeParticles({ count: 45, color: 0xffb3d6, size: 34, speed: 0.1, spread: 10, sway: 1.1 });
  const motes = makeParticles({ count: 60, color: 0x9fd8ff, size: 16, speed: 0.07, spread: 11, sway: 0.7 });
  scene.add(fireflies, petals, motes);

  const pointer = new THREE.Vector2(); let tPointer = new THREE.Vector2();
  addEventListener('pointermove', (e) => { tPointer.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)); });

  // bố cục: chừa chỗ cho khung hội thoại
  let layout = { shiftX: 0, shiftY: 0 };
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const desktop = w >= 900;
    const panelW = desktop ? Math.min(460, w * 0.4) : 0;
    const stageW = w - panelW;
    const stageH = desktop ? h : h * 0.5;
    const fov = camera.fov * Math.PI / 180;
    const needH = desktop ? 3.9 : 3.5, needW = desktop ? 3.6 : 3.2; // vùng thế giới cần thấy
    const dH = needH / 2 / Math.tan(fov / 2) * (h / stageH);
    const dW = needW / 2 / Math.tan(fov / 2) / (stageW / h);
    const dist = Math.max(dH, dW);
    camera.userData.dist = dist;
    layout.shiftX = desktop ? panelW / 2 : 0;
    layout.shiftY = desktop ? 0 : h * 0.17;
    camera.setViewOffset(w, h, layout.shiftX, layout.shiftY, w, h);
    camera.updateProjectionMatrix();
    backdrop.material.uniforms.uRes.value.set(w, h);
    const center = new THREE.Vector2(0.5 - layout.shiftX / w, 0.58 + layout.shiftY / h * 0.9);
    backdrop.material.uniforms.uCenter.value.copy(center);
    const pr = renderer.getPixelRatio();
    for (const p of [fireflies, petals, motes]) p.material.uniforms.uPR.value = pr;
  }
  addEventListener('resize', resize); resize();

  const clock = new THREE.Clock(); let activeEl = null;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    pointer.lerp(tPointer, 1 - Math.exp(-4 * dt));
    camera.position.set(pointer.x * 0.35, target.y + 0.35 + pointer.y * 0.12, camera.userData.dist);
    camera.lookAt(target);
    let hands = null;
    if (avatar) hands = avatar.update(t, dt, { mood: hm.st.mood, speaking: hm.st.speaking }, pointer, camera);
    hm.update(t, dt, pointer, hands);
    backdrop.material.uniforms.uTime.value = t;
    backdrop.material.uniforms.uPulse.value = hm.st.cast;
    for (const p of [fireflies, petals, motes]) p.material.uniforms.uTime.value = t;
    wheel.rotation.z = t * 0.03 * (REDUCED ? 0.2 : 1);
    ring.rotation.z = -t * 0.05 * (REDUCED ? 0.2 : 1);
    for (const sp of glyphs) {
      const a = sp.userData.a; sp.position.set(Math.cos(a) * 2.45, Math.sin(a) * 2.45, 0);
      const on = sp.userData.name === activeEl;
      const s = 0.5 + (on ? 0.18 + Math.sin(t * 2) * 0.04 : 0);
      sp.scale.setScalar(s); sp.material.opacity = damp(sp.material.opacity, on ? 1 : 0.4 + hm.st.cast * 0.3, 4, dt);
    }
    renderer.render(scene, camera);
  });

  return {
    setSpeaking(v) { hm.st.speaking = !!v; },
    setMood(m) { hm.st.mood = m; },
    /** Gieo quẻ: quả cầu và vầng sáng bừng lên trong `seconds` giây. */
    cast(seconds = 3) { hm.st.castUntil = clock.elapsedTime + seconds; },
    /** Nhuộm không gian theo hành chủ của người dùng. */
    setElement(name) {
      activeEl = name;
      const c = new THREE.Color(ELEMENT_COLORS[name] ?? 0x8a6bff);
      backdrop.material.uniforms.uTint.value.lerp(c, 1);
      hm.st.orbTint.copy(c).lerp(new THREE.Color(0xfff2d0), 0.4);
      fireflies.material.uniforms.uColor.value.copy(c).lerp(new THREE.Color(0xffdf9a), 0.5);
    },
  };
}
