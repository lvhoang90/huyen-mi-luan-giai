// Trang Khám phá: xem lá số tĩnh không cần đăng nhập, không gọi máy chủ, không gửi gì đi. Chỉ ghi nhận tên bước (không nội dung) qua track().
import './pwa.js';
import './style.css';
import './explore.css';
import { mountLogo } from './logo.js';
import { mountCta } from './cta.js';
import { track } from './track.js';
import { renderChart, esc } from './chart-view.js';
import { shareChart, shareMessage } from './share.js';
import { hourFrom } from './engine/birthtime.js';
import { normalizeProfile, buildChart, PLACES, findPlaces, pickFamous } from './engine/index.js';
import { allEntries } from './engine/famous.js';
import { computeBazi } from './engine/bazi.js';
import { natalAstro } from './engine/astro.js';
import { reduce, NUMBER_KEYWORDS } from './engine/numerology.js';

const meOnce = fetch('/api/me').then((r) => r.json()).catch(() => null);
const $ = (s) => document.querySelector(s);
mountLogo($('#brand'), 'compact');
track('sample_view');

// ---- gợi ý nơi sinh ----
$('#ex-places').replaceChildren(...Object.values(PLACES).map((p) => Object.assign(document.createElement('option'), { value: p.name })));

// ---- trạng thái người đang xem ----
let current = null; // { profile, sample, key } để nút "Trò chuyện với My" chuyển hồ sơ sang ứng dụng
const state = {};
const cta = (sample) => sample
  ? 'Đây là hồ sơ mẫu hư cấu. <a href="#ex-form-card" data-form>Điền ngày sinh của bạn</a> để xem lá số thật.'
  : 'Muốn hỏi My về điều này? <a href="/" data-chat>Trò chuyện với My</a>, My sẽ nhận thông tin bạn vừa điền, không phải nhập lại.';

function show(profile, { sample = false, key = null, keep = false } = {}) {
  current = { profile, sample, key };
  if (!keep) for (const k of Object.keys(state)) delete state[k];
  const chart = buildChart(profile), host = $('#ex-chart');
  // Chia sẻ: chỉ khi xem lá số của chính mình (không phải hồ sơ mẫu). Mã giới thiệu chỉ được lấy từ máy chủ khi người dùng bấm chia sẻ.
  const onShare = sample ? null : async (mode) => {
    const ref = (await meOnce)?.refCode ?? ''; // đã lấy sẵn khi mở trang, để hộp thoại chia sẻ được gọi ngay sau khi bấm
    const r = await shareChart({ nickname: profile.nickname, chart, url: ref ? `${location.origin}/?ref=${ref}` : location.origin }, mode);
    track('share_card', { action: r, via: 'explore', mode });
    return shareMessage(r);
  };
  renderChart(host, { profile, chart, state, cta: cta(sample), track, onShare, onLeapRule: (rule) => show(normalizeProfile({ ...profile, leapRule: rule }), { sample, key, keep: true }) });
  const fam = $('#ex-famous');
  if (!sample) {
    const f = pickFamous(profile, 3), list = [...f.sameDay, ...f.nearDay];
    fam.hidden = !list.length;
    fam.innerHTML = list.length ? `<h2>Cùng ngày sinh với ${esc(profile.nickname)}</h2><ul class="ex-list">${list.map((e) => `<li><b>${esc(e.name)}</b> <span>(${e.d}/${e.m}/${e.y}) ${esc(e.desc)}</span></li>`).join('')}</ul><p class="sub">Chỉ là điểm chung về ngày sinh, không phải số phận.</p>` : '';
  } else fam.hidden = true;
  $('#ex-result').hidden = false; $('#ex-cta').hidden = false;
  const sg = $('#ex-signup');
  if (sg) { if (sample) sg.hidden = true; else if (!keep) meOnce.then((me) => { if (me && !me.user && me.accounts !== false) mountCta(sg, { src: 'chart', onChat: () => startChat(), onLogin: () => startChat('/?login=1') }); }); }
  $('#ex-cta-t').textContent = sample ? 'Đây là hồ sơ mẫu. Muốn xem lá số của bạn?' : 'Muốn nói chuyện với My về lá số này?';
  $('#ex-cta-b').textContent = sample ? 'Điền ngày sinh của bạn' : 'Trò chuyện với My';
  if (!keep) track('static_view', { via: sample ? 'sample' : 'form', hasTime: profile.birth.hour != null });
  if (!keep) host.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

// ---- chuyển sang ứng dụng: ghi hồ sơ nháp, ứng dụng nối tiếp từ đó (vẫn hỏi tuổi và lĩnh vực) ----
function startChat(to = '/') {
  if (!current || current.sample) { $('#ex-form-card').scrollIntoView({ behavior: 'smooth' }); $('#ex-form [name=name]').focus({ preventScroll: true }); track('sample_cta', { via: 'form' }); return; }
  const { profile } = current, b = profile.birth, p2 = (n) => String(n).padStart(2, '0');
  const draft = { fullName: profile.fullName, gender: profile.gender, date: `${b.y}-${p2(b.m)}-${p2(b.d)}`, time: b.hour == null ? '' : `${p2(b.hour)}:${p2(b.minute ?? 0)}`, place: profile.place ?? null, fromExplore: true };
  try { localStorage.setItem('huyenmy.v1', JSON.stringify({ profile: null, messages: [], phase: 'collect', draft })); } catch {}
  track('sample_cta', { via: 'chat' });
  location.href = to;
}
$('#ex-cta-b').onclick = () => startChat();
document.addEventListener('click', (e) => {
  const chat = e.target.closest?.('[data-chat]'); if (chat) { e.preventDefault(); startChat(); return; }
  const form = e.target.closest?.('[data-form]'); if (form) { e.preventDefault(); startChat(); }
});

// ---- biểu mẫu ----
$('#ex-form').addEventListener('input', (e) => { if (e.target.classList?.contains('num')) e.target.value = e.target.value.replace(/\D/g, ''); });
$('#ex-form [name=nohour]').addEventListener('change', (e) => { for (const n of ['hh', 'mm', 'period']) { const f = $(`#ex-form [name=${n}]`); f.disabled = e.target.checked; if (e.target.checked) f.value = ''; } });
$('#ex-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.currentTarget), err = $('#ex-err'), fail = (m) => { err.textContent = m; err.hidden = false; };
  err.hidden = true;
  const noHour = f.get('nohour') === 'on' || (f.get('hh') === '' && f.get('mm') === '');
  let place = null; const q = String(f.get('place') ?? '').trim();
  if (q && !noHour) { place = findPlaces(q, 1)[0] ?? null; if (!place) return fail('My chưa có nơi này trong dữ liệu. Bạn thử gõ tên tỉnh hoặc thành phố gần nơi sinh nhất, hoặc để trống.'); }
  try {
    const profile = normalizeProfile({ fullName: f.get('name'), gender: f.get('gender'), birth: { y: f.get('y'), m: f.get('m'), d: f.get('d'), hour: noHour ? null : hourFrom(f.get('hh') || 0, f.get('period')), minute: noHour ? null : (f.get('mm') || 0) }, place });
    show(profile);
  } catch (x) { fail(x.userMessage ?? (x.message === 'Thiếu họ tên' ? 'Bạn nhập giúp My họ và tên nhé.' : `${x.message}. Bạn kiểm tra lại giúp My nhé.`)); }
});

// ---- ba hồ sơ mẫu hư cấu ----
const SAMPLES = [
  { id: 'minh-anh', label: 'Minh Anh', note: 'nữ, sinh 14/3/1998, 9:30, TP. Hồ Chí Minh. Đủ giờ và nơi sinh nên có đủ Tử Vi, 12 cung và chiêm tinh.', p: { fullName: 'Nguyễn Minh Anh', gender: 'nu', birth: { y: 1998, m: 3, d: 14, hour: 9, minute: 30 }, place: 'tp-hcm' } },
  { id: 'quoc-bao', label: 'Quốc Bảo', note: 'nam, sinh 2/11/1975, không rõ giờ. Xem My nói rõ phần nào kém chắc chắn khi thiếu giờ sinh.', p: { fullName: 'Trần Quốc Bảo', gender: 'nam', birth: { y: 1975, m: 11, d: 2, hour: null }, place: null } },
  { id: 'thu-ha', label: 'Thu Hà', note: 'nữ, sinh 21/8/1986, 22:15, Hà Nội. Giờ sinh cuối ngày, để xem lá số khi sinh vào giờ Hợi.', p: { fullName: 'Lê Thu Hà', gender: 'nu', birth: { y: 1986, m: 8, d: 21, hour: 22, minute: 15 }, place: 'ha-noi' } },
];
$('#ex-samples').replaceChildren(...SAMPLES.map((s) => {
  const b = Object.assign(document.createElement('button'), { type: 'button', className: 'ex-sample' });
  b.innerHTML = `<b>${esc(s.label)}</b><span>${esc(s.note)}</span><em>Hồ sơ hư cấu</em>`;
  b.onclick = () => { track('sample_pick', { id: s.id }); show(normalizeProfile(s.p), { sample: true, key: s.id }); };
  return b;
}));

// ---- người nổi tiếng: chỉ phép tính từ ngày sinh công khai, không diễn giải ----
const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
const MIN_YEAR = 1800; // trước đó lịch và giờ địa phương quá khác nên không tính
const ENTRIES = allEntries().filter((e) => e.y >= MIN_YEAR);
function famCard(e) {
  const birth = { y: e.y, m: e.m, d: e.d, hour: null, minute: null }, b = computeBazi(birth), a = natalAstro(birth, null), lp = reduce(reduce(e.d) + reduce(e.m) + reduce(e.y)), P = b.pillars;
  return `<article class="ex-fam"><h3>${esc(e.name)} <small>sinh ${e.d}/${e.m}/${e.y}</small></h3><p class="sub">${esc(e.desc)}</p>
    <ul class="tags"><li>Tứ Trụ (chưa rõ giờ sinh nên chỉ có ba trụ): năm ${P.year.name}, tháng ${P.month.name}, ngày ${P.day.name}. Nhật chủ ${b.dayMaster.can} (${b.dayMaster.hanh}).</li>
    <li>Mặt Trời ở cung ${a.sun.name}${a.sunUncertain ? ' (sát ranh, chưa chắc)' : ''}.</li><li>Số chủ đạo ${lp}: ${esc(NUMBER_KEYWORDS[lp])}.</li></ul>
    <p class="sub">Chỉ là phép tính từ ngày sinh được ghi nhận rộng rãi, không phải nhận định về con người này. Không rõ giờ sinh nên không lập Tử Vi và 12 cung. Bộ ngày sinh do dự án tự soạn, chưa đối chiếu hết với nguồn mở.</p></article>`;
}
const out = $('#ex-fam-out'), SUGG = ['Albert Einstein', 'Marie Curie', 'Barack Obama', 'Sơn Tùng M-TP', 'Phạm Nhật Vượng', 'Taylor Swift'].filter((n) => ENTRIES.some((e) => e.name === n));
$('#ex-sugg').replaceChildren(...SUGG.map((n) => Object.assign(document.createElement('button'), { type: 'button', className: 'chip', textContent: n, onclick: () => { $('#ex-q').value = n; find(n); } })));
function find(q) {
  const k = fold(q); if (k.length < 2) { out.replaceChildren(); return; }
  const hits = ENTRIES.filter((e) => fold(e.name).includes(k)).slice(0, 4);
  out.innerHTML = hits.length ? hits.map(famCard).join('') : '<p class="sub">Chưa có tên này trong dữ liệu (hoặc người đó sinh trước năm 1800).</p>';
  if (hits.length) track('sample_pick', { id: 'famous' });
}
$('#ex-q').addEventListener('input', (e) => find(e.target.value));

// ---- nhóm Zalo (nếu máy chủ có cấu hình) ----
fetch('/api/status').then((r) => r.json()).then((st) => {
  if (!st.zalo) return;
  const a = Object.assign(document.createElement('a'), { href: st.zalo, target: '_blank', rel: 'noopener', textContent: 'Nhóm Zalo của My' });
  a.onclick = () => track('zalo_click', { via: 'explore' });
  const foot = document.querySelector('.ex-foot'); foot.append(' · ', a);
}).catch(() => {});
