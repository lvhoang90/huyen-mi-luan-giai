// Chạy bộ kịch bản kiểm thử cho một phần (shard) trong 50 cấu hình. Cách dùng:
//   node tools/qa/run.mjs --base http://localhost:8830 --out /đường/dẫn/ket-qua --shard 0 --of 4
// Mỗi cấu hình ghi một tệp JSON (các kiểm tra đạt hoặc không, số đo, lỗi trong console) và vài ảnh chụp.
import fs from 'node:fs';
import path from 'node:path';
import { PROFILES, NET } from './profiles.mjs';

const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright/index.mjs';
const { chromium, devices } = await import(PW);
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:8830'), OUT = path.resolve(arg('out', 'qa-out')), SHARD = +arg('shard', 0), OF = +arg('of', 1), ONLY = arg('only', '');
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHAT_STATE = JSON.stringify({ profile: { fullName: 'Nguyễn Minh Anh', nickname: 'Minh Anh', gender: 'nu', birth: { y: 1998, m: 3, d: 14, hour: 9, minute: 30 } }, phase: 'companion', sessionStart: 1, activeMs: 0,
  messages: [{ role: 'assistant', content: 'Chào Minh Anh. My nghe nè. Dạo này điều gì đang làm bạn nghĩ nhiều nhất?' }] });

function contextOptions(P, idx) {
  const base = P.custom ? { ...P.custom } : { ...(devices[P.device] ?? (() => { throw new Error(`Không có thiết bị ${P.device}`); })()) };
  if (P.ua) base.userAgent = typeof P.ua === 'function' ? P.ua(base.userAgent ?? '') : P.ua;
  if (!base.userAgent) delete base.userAgent;
  return { ...base, locale: P.locale ?? 'vi-VN', timezoneId: P.tz ?? 'Asia/Ho_Chi_Minh', reducedMotion: P.reducedMotion ?? 'no-preference', acceptDownloads: true, extraHTTPHeaders: { 'X-Forwarded-For': `10.20.${Math.floor(idx / 200)}.${(idx % 200) + 1}` }, permissions: ['clipboard-read', 'clipboard-write'] };
}

const AUDIT = () => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const name = (e) => (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || '').trim() || (e.querySelector('img[alt]')?.alt ?? '') || (e.getAttribute('aria-labelledby') ? 'ok' : '');
  const btnNoName = [...document.querySelectorAll('button, a[href], [role=button]')].filter(vis).filter((e) => !name(e)).map((e) => e.outerHTML.slice(0, 90));
  const imgNoAlt = [...document.querySelectorAll('img')].filter(vis).filter((e) => !e.hasAttribute('alt') && e.getAttribute('role') !== 'presentation' && e.getAttribute('aria-hidden') !== 'true').map((e) => e.src.slice(-50));
  const labeled = (e) => e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label') || e.type === 'hidden' || ['submit', 'button', 'radio', 'checkbox'].includes(e.type) && (e.closest('label') || e.value);
  const inNoLabel = [...document.querySelectorAll('input, textarea, select')].filter(vis).filter((e) => !labeled(e)).map((e) => `${e.tagName.toLowerCase()}[${e.name || e.placeholder || e.type}]`);
  const small = [...document.querySelectorAll('button, a[href], input, [role=button]')].filter(vis).map((e) => ({ e, r: e.getBoundingClientRect() })).filter(({ r }) => Math.min(r.width, r.height) < 32 && r.width * r.height > 0).map(({ e, r }) => `${(e.getAttribute('aria-label') || e.textContent || e.name || e.tagName).trim().slice(0, 28)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  return { lang: document.documentElement.lang, viewport: !!document.querySelector('meta[name=viewport]'), btnNoName, imgNoAlt, inNoLabel, small };
};

async function runProfile(P, idx, browser) {
  const R = { id: P.id, label: P.label, group: P.group, checks: [], metrics: {}, console: [], failedRequests: [], badStatus: [], audit: {}, notes: [] };
  const check = (name, ok, detail = '') => { R.checks.push({ name, ok: !!ok, detail: String(detail).slice(0, 300) }); return ok; };
  const tmul = P.net === 'slow3g' ? 4 : P.net === '3g' || (P.cpu ?? 1) >= 4 ? 2.5 : 1;
  const T = (ms) => Math.round(ms * tmul);
  const ctx = await browser.newContext(contextOptions(P, idx));
  await ctx.addInitScript(({ noShare }) => {
    window.__lcp = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
    window.__shares = [];
    if (noShare) { try { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }); } catch {} }
    else { navigator.canShare = () => true; navigator.share = async (d) => { window.__shares.push({ text: d.text, url: d.url, files: (d.files || []).map((f) => f.name), t: performance.now() }); }; }
  }, { noShare: !!P.noShare });
  const seen = new Set();
  const wire = (pg, tag) => {
    pg.on('console', (m) => { if (m.type() === 'error') { const t = `[${tag}] ${m.text()}`.slice(0, 200); if (!seen.has(t)) { seen.add(t); R.console.push(t); } } });
    pg.on('pageerror', (e) => { const t = `[${tag}] PAGEERROR ${e.message}`.slice(0, 200); if (!seen.has(t)) { seen.add(t); R.console.push(t); } });
    pg.on('requestfailed', (r) => { if (!/clarity|analytics/.test(r.url())) R.failedRequests.push(`[${tag}] ${r.failure()?.errorText} ${r.url().slice(-80)}`); });
    pg.on('response', (r) => { if (r.status() >= 400 && !/\/api\/(me|panel)/.test(r.url())) R.badStatus.push(`[${tag}] ${r.status()} ${r.url().slice(-80)}`); });
  };
  const newPage = async (tag) => {
    const pg = await ctx.newPage(); wire(pg, tag); pg.setDefaultTimeout(T(15000));
    const cdp = await ctx.newCDPSession(pg).catch(() => null);
    if (cdp) { if (P.net) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: NET[P.net].latency, downloadThroughput: NET[P.net].down, uploadThroughput: NET[P.net].up }).catch(() => {}); if (P.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: P.cpu }).catch(() => {}); }
    return pg;
  };
  const vp = (pg) => pg.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  const overflow = async (pg, what) => { const o = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, iw: innerWidth })); const bad = Math.max(o.sw, o.bw) > o.iw + 1; check(`Không tràn ngang: ${what}`, !bad, bad ? `rộng ${Math.max(o.sw, o.bw)} > khung ${o.iw}` : ''); };
  const shot = (pg, n) => pg.screenshot({ path: path.join(OUT, 'shots', `${P.id}-${n}.jpg`), type: 'jpeg', quality: 55 }).catch(() => {});
  const diagClick = async (loc, what) => { try { await loc.click({ timeout: 6000 }); } catch (e) { const who = await loc.evaluate((el) => { const r = el.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return `${t?.tagName}.${String(t?.className).slice(0, 30)} tại (${Math.round(r.left)},${Math.round(r.top)}) ${Math.round(r.width)}x${Math.round(r.height)} / khung ${innerWidth}x${innerHeight}`; }).catch(() => 'không đo được'); check(`${what}: bấm được`, false, `bị che bởi hoặc ngoài khung: ${who}`); throw e; } };
  const step = async (name, fn) => { const t0 = Date.now(); try { await fn(); } catch (e) { check(`${name}: chạy được đến cùng`, false, e.message.split('\n')[0]); } R.metrics[`ms_${name}`] = Date.now() - t0; };

  // 1. Màn chào
  await step('man-chao', async () => {
    const pg = await newPage('chao'); const t0 = Date.now();
    await pg.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: T(60000) });
    R.metrics.dcl = Date.now() - t0; await pg.waitForLoadState('load', { timeout: T(60000) }).catch(() => {}); R.metrics.load = Date.now() - t0;
    await sleep(1200); const v = await vp(pg); await pg.mouse.click(v.w / 2, v.h / 2); // bỏ qua mở đầu
    await pg.waitForSelector('#enter, #veil-actions button', { state: 'visible', timeout: T(25000) });
    R.metrics.lcp = Math.round(await pg.evaluate(() => window.__lcp)); R.metrics.ready = Date.now() - t0;
    const res = await pg.evaluate(() => { const r = performance.getEntriesByType('resource'); return { n: r.length, kb: Math.round(r.reduce((a, e) => a + (e.transferSize || 0), 0) / 1024) }; });
    R.metrics.requests = res.n; R.metrics.transferKB = res.kb;
    const fonts = await pg.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')); });
    check('Phông tự lưu (Be Vietnam Pro) đã nạp', fonts.includes('Be Vietnam Pro'), `đã nạp: ${[...new Set(fonts)].join(', ') || 'không có'}`);
    const btn = pg.locator('#enter, #veil-actions button').first(); await btn.scrollIntoViewIfNeeded(); const b = await btn.boundingBox(); const v2 = await vp(pg);
    check('Nút "Bước vào" nhìn thấy đủ trong khung', b && b.x >= 0 && b.y >= 0 && b.x + b.width <= v2.w + 1 && b.y + b.height <= v2.h + 1, b ? `${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)} / khung ${v2.w}x${v2.h}` : 'không có');
    if (P.custom?.isMobile || P.group === 'Android' || P.group === 'iPhone') check('Nút chính đủ lớn để chạm (cao từ 36px)', b && b.height >= 36, b ? `${Math.round(b.height)}px` : '');
    check('Có nút Rút bài Tarot ở màn chào', (await pg.locator('.tarot-cta').count()) > 0);
    check('Có manifest và biểu tượng cài lên màn hình chính', (await pg.locator('link[rel=manifest]').count()) > 0 && (await pg.locator('link[rel=apple-touch-icon]').count()) > 0);
    await overflow(pg, 'màn chào'); R.audit.landing = await pg.evaluate(AUDIT); await shot(pg, '1-chao');
    // PWA và ngoại tuyến
    const sw = await pg.evaluate(async () => { if (!('serviceWorker' in navigator)) return 'khong-ho-tro'; try { const r = await Promise.race([navigator.serviceWorker.ready, new Promise((x) => setTimeout(() => x(null), 12000))]); return r ? 'ok' : 'qua-han'; } catch { return 'loi'; } });
    R.metrics.sw = sw; check('Service worker đã đăng ký', sw === 'ok', sw);
    // Playwright không giả lập mất mạng cho chính service worker, nên chỉ kiểm tra trang ngoại tuyến đã được lưu sẵn trong bộ nhớ của service worker.
    const cached = await pg.evaluate(async () => { try { const ks = await caches.keys(); const c = await caches.open(ks[0]); return (await c.keys()).map((r) => new URL(r.url).pathname); } catch { return []; } });
    check('Trang ngoại tuyến đã được lưu sẵn để dùng khi mất mạng', cached.includes('/offline.html'), cached.join(',').slice(0, 80));
    await pg.close();
  });

  // 2. Tarot
  await step('tarot', async () => {
    const pg = await newPage('tarot'); await pg.goto(`${BASE}/tarot.html`, { waitUntil: 'load', timeout: T(60000) });
    await pg.waitForSelector('#tr-go', { state: 'visible' }); check('Trang Tarot mở được', true); await overflow(pg, 'trang Tarot');
    await pg.click('#tr-go'); await pg.waitForSelector('.rit-topics button', { state: 'visible' });
    await pg.locator('.rit-topics button').first().click(); await pg.click('#rit-next');
    const fan = pg.locator('.fan button, .fan .fc, .fan .tr-pick'); await fan.first().waitFor({ state: 'visible' });
    const n = await fan.count(); check('Quạt bài có đủ lá để chọn', n >= 6, `${n} lá`);
    const idx = Math.min(4, n - 1); const fb = await fan.nth(idx).boundingBox(); check('Lá bài đủ lớn để chạm (từ 44px)', fb && Math.min(fb.width, fb.height) >= 44, fb ? `${Math.round(fb.width)}x${Math.round(fb.height)}` : '');
    await fan.nth(idx).click({ force: true });
    await pg.waitForSelector('#tr-share', { state: 'visible', timeout: T(30000) });
    check('Lời đọc lá bài hiện ra', (await pg.locator('#tr-read').innerText()).length > 60);
    await overflow(pg, 'kết quả Tarot'); await pg.locator('#tr-read').scrollIntoViewIfNeeded(); await shot(pg, '2-tarot');
    R.audit.tarot = await pg.evaluate(AUDIT);
    // cảm xúc và lời mời đăng ký
    const feel = pg.locator('.tf-chips button[data-v="3"]'); if (await feel.count()) { await feel.click(); await sleep(200); check('Chọn cảm xúc sau lá bài được', /Cảm ơn/.test(await pg.locator('.tr-feel').innerText())); } else check('Có hàng chọn cảm xúc sau lá bài', false);
    const cta = await pg.locator('#tr-cta').evaluate((e) => ({ hidden: e.hidden, text: e.innerText.slice(0, 40) })).catch(() => null); R.metrics.ctaShown = cta ? !cta.hidden : false;
    const day = await pg.evaluate(() => { try { return JSON.parse(localStorage.getItem('huyenmy.tarotdaily'))?.day ?? null; } catch { return null; } }), expectDay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    check('Lá của ngày tính theo giờ Việt Nam, kể cả khi máy ở múi giờ khác', day === expectDay, `lưu ${day}, đúng ${expectDay}`);
    // chia sẻ
    const t0 = await pg.evaluate(() => performance.now()); await pg.click('#tr-share');
    if (P.noShare) await sleep(900); else await pg.waitForFunction(() => window.__shares.length > 0, null, { timeout: 7000 }).catch(() => {});
    let sh = await pg.evaluate(() => window.__shares);
    if (P.noShare) {
      const note = await pg.locator('#tr-note').innerText(); check('Máy không có hộp thoại chia sẻ: báo rõ và vẫn có ảnh', /tải ảnh về/.test(note), note.slice(0, 80));
    } else {
      let first = sh[0];
      if (!first) { // ảnh chưa kịp xong: ứng dụng phải báo bấm lại, và lần bấm lại phải mở ngay
        const note = await pg.locator('#tr-note').innerText(); R.metrics.sharePending = true;
        check('Ảnh chưa kịp xong thì báo bấm lại thay vì lỗi', /bấm Chia sẻ/.test(note), note.slice(0, 80));
        const t1 = await pg.evaluate(() => performance.now()); await pg.click('#tr-share'); await pg.waitForFunction(() => window.__shares.length > 0, null, { timeout: 6000 }).catch(() => {});
        sh = await pg.evaluate(() => window.__shares); first = sh[0]; if (first) { check('Bấm lại thì hộp thoại chia sẻ mở ngay (dưới 1,5 giây)', first.t - t1 < 1500, `${Math.round(first.t - t1)}ms`); }
      } else R.metrics.shareDelayMs = Math.round(first.t - t0);
      check('Hộp thoại chia sẻ mở được', !!first, `${sh.length} lần`);
      if (first) { check('Nội dung chia sẻ có liên kết kèm mã ref', /\/tarot\?ref=[\w-]+/.test(first.text ?? ''), (first.text ?? '').slice(-70));
        check('Tên tệp ảnh có mã ngẫu nhiên 3 ký tự', /-[a-hj-km-np-z2-9]{3}\.png$/.test(first.files[0] ?? ''), first.files[0]); }
    }
    const clip = await pg.evaluate(() => navigator.clipboard.readText().catch(() => null)); check('Nội dung kèm liên kết đã được chép sẵn', clip && /tarot\?ref=/.test(clip), clip ? clip.slice(-40) : 'không đọc được');
    const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: T(20000) }), pg.click('#tr-dl')]);
    check('Tải ảnh được, tên tệp có mã ngẫu nhiên', /^tarot-huyen-my-[a-hj-km-np-z2-9]{3}\.png$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    await pg.close();
  });

  // 3. Khám phá lá số
  await step('kham-pha', async () => {
    const pg = await newPage('khampha'); await pg.goto(`${BASE}/kham-pha.html`, { waitUntil: 'load', timeout: T(60000) });
    await pg.waitForSelector('#ex-form', { state: 'visible' }); await overflow(pg, 'trang Khám phá');
    await pg.fill('#ex-form [name=name]', 'Nguyễn Minh Anh'); await pg.check('#ex-form [name=gender][value=nu]');
    await pg.fill('#ex-form [name=d]', '14'); await pg.fill('#ex-form [name=m]', '3'); await pg.fill('#ex-form [name=y]', '1998'); await pg.fill('#ex-form [name=hh]', '9'); await pg.fill('#ex-form [name=mm]', '30'); await pg.fill('#ex-form [name=place]', 'Cần Thơ');
    await pg.locator('#ex-form button[type=submit], #ex-form [type=submit]').first().click();
    await pg.waitForSelector('#ex-result:not([hidden]) #ex-chart *', { timeout: T(20000) });
    check('Lập được lá số từ form', (await pg.locator('#ex-chart').innerText()).length > 100);
    await overflow(pg, 'lá số Khám phá'); await pg.locator('#ex-chart').scrollIntoViewIfNeeded(); await shot(pg, '3-lo-so');
    const tab = pg.locator('#ex-chart button', { hasText: /Thời vận/ }).first(); if (await tab.count()) { await tab.click(); await sleep(400); check('Mở tab Thời vận được', (await pg.locator('#ex-chart').innerText()).length > 100); }
    const cs = await pg.locator('#ex-signup').evaluate((e) => !e.hidden).catch(() => false); R.metrics.chartCta = cs;
    R.audit.chart = await pg.evaluate(AUDIT);
    const share = pg.locator('[data-share=share]').first(); if (await share.count()) { await share.scrollIntoViewIfNeeded(); await share.click(); await sleep(1200); const note = await pg.locator('[data-share-note]').innerText().catch(() => ''); check('Chia sẻ lá số có lời báo kết quả', note.length > 5, note.slice(0, 70)); }
    await pg.close();
  });

  // 4. Trò chuyện với My
  await step('tro-chuyen', async () => {
    const pg = await newPage('chat');
    await pg.addInitScript((s) => { try { const st = JSON.parse(s); st.sessionStart = Date.now(); localStorage.setItem('huyenmy.v1', JSON.stringify(st)); localStorage.setItem('huyenmy.tarotnudge', JSON.stringify({ last: Math.floor((Date.now() + 7 * 3600e3) / 864e5), skips: 0 })); } catch {} }, CHAT_STATE);
    await pg.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: T(60000) }); await sleep(1200); const v = await vp(pg); await pg.mouse.click(v.w / 2, v.h / 2);
    const resume = pg.locator('#veil-actions button').first(); await resume.waitFor({ state: 'visible', timeout: T(25000) }); await resume.click();
    await pg.getByText('Để sau, vào trò chuyện với My').click({ timeout: 4000 }).catch(() => {});
    const box = pg.locator('#composer textarea'); await box.waitFor({ state: 'visible', timeout: T(30000) });
    const before = await pg.locator('.msg.my').count(); const t0 = Date.now();
    await box.fill('Mình có nên nghỉ việc không?'); await box.press('Enter');
    await pg.waitForFunction((n) => document.querySelectorAll('.msg.my').length > n, before, { timeout: T(30000) }); R.metrics.firstTokenMs = Date.now() - t0;
    await pg.locator('.msg.my .rep').last().waitFor({ state: 'visible', timeout: T(40000) }); R.metrics.replyMs = Date.now() - t0;
    check('My trả lời xong', true, `${R.metrics.replyMs}ms`);
    await overflow(pg, 'trò chuyện'); await shot(pg, '4-chat');
    const rep = pg.locator('.msg.my .rep').last();
    try { await rep.click({ timeout: 6000 }); } catch (e) { const who = await rep.evaluate((el) => { const r = el.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return `${t?.tagName}.${String(t?.className).slice(0, 30)}${t?.textContent ? ' "' + t.textContent.trim().slice(0, 20) + '"' : ''} tại y=${Math.round(r.top)}/${innerHeight}`; }).catch(() => '?'); check('Bấm được nút Báo cáo', false, `bị che bởi ${who}`); throw e; }
    await diagClick(pg.locator('.rep-box .chip').first(), 'Chọn lý do báo cáo'); await sleep(200);
    check('Báo cáo câu trả lời được', /Cảm ơn bạn/.test(await pg.locator('.rep-box').last().innerText()));
    R.audit.chat = await pg.evaluate(AUDIT);
    const chartBtn = pg.locator('#btn-chart'); if (await chartBtn.isVisible().catch(() => false)) { await diagClick(chartBtn, 'Mở bảng lá số'); await pg.waitForSelector('#sheet:not([hidden])', { timeout: 5000 }); const ov = await pg.evaluate(() => { const s = document.querySelector('#sheet-body'), r0 = s.getBoundingClientRect(), edge = r0.left + s.clientWidth; return { d: s.scrollWidth - s.clientWidth, ox: getComputedStyle(s).overflowX, bad: [...s.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > edge + 0.5).slice(0, 4).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 24)} +${Math.round(e.getBoundingClientRect().right - edge)}px`) }; });
      const card = await pg.evaluate(() => { const c = document.querySelector('.sheet-card'); return { d: c.scrollWidth - c.clientWidth, ox: getComputedStyle(c).overflowX }; });
      check('Bảng lá số mở được, người dùng không trượt ngang được', card.d <= 1 || ['hidden', 'clip'].includes(card.ox), `khung bảng: lệch ${card.d}px, overflow-x ${card.ox}; nội dung thanh tab lệch ${ov.d}px ${ov.bad.join(', ')}`); await pg.locator('#sheet-close').click().catch(() => {}); }
    await pg.close();
  });

  // 5. Trang pháp lý
  await step('phap-ly', async () => {
    const pg = await newPage('phaply');
    for (const p of ['privacy', 'terms', 'about', 'xoa-du-lieu', 'license']) { const r = await pg.goto(`${BASE}/${p}.html`, { waitUntil: 'load', timeout: T(60000) }); check(`Trang ${p} mở được`, r?.ok()); await overflow(pg, `trang ${p}`); }
    check('Trang pháp lý dùng phông tự lưu', await pg.evaluate(() => document.fonts.check('16px "Be Vietnam Pro"')));
    await pg.close();
  });
  await ctx.close();
  R.passed = R.checks.filter((c) => c.ok).length; R.failed = R.checks.length - R.passed;
  return R;
}

const mine = PROFILES.map((p, i) => ({ p, i })).filter(({ p, i }) => i % OF === SHARD && (!ONLY || ONLY.split(',').includes(p.id)));
const browser = await chromium.launch();
for (const { p, i } of mine) {
  const t0 = Date.now(); let R;
  try { R = await runProfile(p, i, browser); } catch (e) { R = { id: p.id, label: p.label, group: p.group, checks: [{ name: 'Cấu hình chạy được', ok: false, detail: e.message }], metrics: {}, console: [], failedRequests: [], badStatus: [], audit: {}, passed: 0, failed: 1 }; }
  R.seconds = Math.round((Date.now() - t0) / 1000);
  fs.writeFileSync(path.join(OUT, `${p.id}.json`), JSON.stringify(R, null, 1));
  console.log(`${p.id} ${p.label}: ${R.passed} đạt, ${R.failed} chưa đạt, ${R.seconds}s`);
}
await browser.close();
