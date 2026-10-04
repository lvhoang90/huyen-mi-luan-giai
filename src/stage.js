import * as THREE from 'three';
import { makeChibi } from './chibi3d.js';

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

// ---------- sân khấu ----------
export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  const target = new THREE.Vector3(0, 2.0, 0);

  const backdrop = makeBackdrop(); scene.add(backdrop);

  scene.add(new THREE.HemisphereLight(0xb9a8ff, 0x1a1030, 0.9));
  const key = new THREE.DirectionalLight(0xffe6cf, 2.1); key.position.set(1.6, 3.8, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8ea2ff, 2.6); rim.position.set(-3, 3.5, -3); scene.add(rim);
  const fill = new THREE.PointLight(0xffc7e0, 8, 8, 2); fill.position.set(-1.2, 2.6, 2.2); scene.add(fill);

  const hm = makeChibi(); scene.add(hm.group);
  if (import.meta.env?.DEV) window.__hm = hm;

  // Vòng bát quái + ngũ hành sau lưng
  const wheelGroup = new THREE.Group(); wheelGroup.position.set(0, 2.1, -2.4); scene.add(wheelGroup);
  const wheel = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 7.4), new THREE.MeshBasicMaterial({ map: wheelTexture(), transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
  wheelGroup.add(wheel);
  const glyphs = [];
  const GL = [['金', 'Kim', '#f1ead2'], ['木', 'Mộc', '#7fe3a0'], ['水', 'Thủy', '#6fb7ff'], ['火', 'Hỏa', '#ff8a5c'], ['土', 'Thổ', '#e0b86a']];
  const ring = new THREE.Group(); ring.position.set(0, 2.1, -2.35); scene.add(ring);
  GL.forEach(([ch, name, col], i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTexture(ch, col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
    sp.scale.setScalar(0.62); sp.userData = { name, a: (i / 5) * Math.PI * 2 }; ring.add(sp); glyphs.push(sp);
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
    const needH = desktop ? 4.7 : 5.4, needW = desktop ? 5.0 : 5.6; // vùng thế giới cần thấy
    const dH = needH / 2 / Math.tan(fov / 2) * (h / stageH);
    const dW = needW / 2 / Math.tan(fov / 2) / (stageW / h);
    const dist = Math.max(dH, dW);
    camera.userData.dist = dist;
    layout.shiftX = desktop ? panelW / 2 : 0;
    layout.shiftY = desktop ? 0 : h * 0.12;
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
  const animate = () => {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    pointer.lerp(tPointer, 1 - Math.exp(-4 * dt));
    camera.position.set(pointer.x * 0.4, target.y + 0.5 + pointer.y * 0.15, camera.userData.dist);
    camera.lookAt(target);
    hm.update(t, dt, pointer);
    backdrop.material.uniforms.uTime.value = t;
    backdrop.material.uniforms.uPulse.value = hm.st.cast;
    for (const p of [fireflies, petals, motes]) p.material.uniforms.uTime.value = t;
    wheel.rotation.z = t * 0.03 * (REDUCED ? 0.2 : 1);
    ring.rotation.z = -t * 0.05 * (REDUCED ? 0.2 : 1);
    for (const sp of glyphs) {
      const a = sp.userData.a; sp.position.set(Math.cos(a) * 3.3, Math.sin(a) * 3.3, 0);
      const on = sp.userData.name === activeEl;
      const s = 0.62 + (on ? 0.2 + Math.sin(t * 2) * 0.04 : 0);
      sp.scale.setScalar(s); sp.material.opacity = damp(sp.material.opacity, on ? 1 : 0.4 + hm.st.cast * 0.3, 4, dt);
    }
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(animate);

  return {
    /** Bật/tắt dựng hình 3D (tắt khi người dùng chọn chế độ 2D để tiết kiệm pin). */
    setActive(on) { canvas.style.display = on ? '' : 'none'; if (on) { clock.getDelta(); renderer.setAnimationLoop(animate); } else renderer.setAnimationLoop(null); },
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
