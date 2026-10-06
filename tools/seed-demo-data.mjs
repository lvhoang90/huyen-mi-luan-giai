// Sinh DỮ LIỆU GIẢ LẬP để xem thử trang quản trị (không phải số liệu thật). Dùng:
//   DATABASE_FILE=./data/demo.db node tools/seed-demo-data.mjs 600
// rồi chạy máy chủ với cùng DATABASE_FILE. Đừng chạy trên cơ sở dữ liệu thật.
import { openDb } from '../server/db.js';
import path from 'node:path';
const file = process.env.DATABASE_FILE || path.resolve('data/demo.db');
const N = +process.argv[2] || 500, DAY = 86_400_000, now = Date.now();
const db = openDb(file);
let seed = 42; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const ev = db.prepare('INSERT INTO events(ts, actor, sid, name, props) VALUES (?,?,?,?,?)');
const tr = db.prepare('INSERT INTO turns(ts, actor, sid, phase, minute, ms, ttft, words, q, tags, rep, echo, score, flags, ok, tok_in, tok_out, tok_cr, tok_cw) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
const ages = ['<=17', '18-26', '27-40', '41-55', '56+'], fields = ['biz', 'tech', 'edu', 'health', 'art', 'gov', 'student', 'none'];
const chips = ['Nghe nét hiếm trong lá số của tôi', 'Chuyện sự nghiệp, tiền bạc', 'Chuyện tình cảm', 'Một chuyện đang làm mình rối'];
db.exec('BEGIN');
for (let i = 0; i < N; i++) {
  const a = `demo${i}`, t0 = now - Math.floor(rnd() * 14 * DAY), sid = `ds${i}`, age = pick(ages), field = pick(fields);
  let t = t0; const e = (name, props = {}) => { t += 20_000 + Math.floor(rnd() * 60_000); ev.run(t, a, sid, name, JSON.stringify(props)); };
  e('landing_view', rnd() < 0.15 ? { ref: pick(['ban01', 'ban02', 'zalo']) } : {});
  if (rnd() > 0.82) continue; e('enter_click');
  for (const s of ['name', 'gender', 'date', 'time', 'place', 'field']) { if (rnd() > (s === 'place' ? 0.88 : 0.96)) { e('intake_step', { step: s }); t = 0; break; } e('intake_step', { step: s }); }
  if (!t) continue;
  e('intake_done', { ageBand: age, field, hasTime: rnd() > 0.2, hasPlace: rnd() > 0.3 });
  e('hook_shown', { same: 2, near: 1, field: field !== 'none', year: age === '18-26' });
  const engaged = rnd() < (age === '18-26' ? 0.62 : age === '56+' ? 0.8 : 0.7); if (!engaged) continue;
  const viaChip = rnd() < 0.7; e('first_message', { viaChip }); if (viaChip) e('start_choice', { chip: pick(chips) });
  const msgs = 2 + Math.floor(rnd() * 8); for (let k = 1; k <= msgs; k++) { e('message_sent', { n: k }); const phase = k === 1 ? 'listen' : k === 3 ? 'reading' : 'companion', flags = []; if (rnd() < 0.07) flags.push('lap_lai'); if (rnd() < 0.09) flags.push('qua_nhieu_cau_hoi'); if (rnd() < 0.12) flags.push('khong_bam_loi_nguoi_dung'); if (rnd() < 0.004) flags.push('khung_hoang_co_ho_tro'); const ok = rnd() > 0.015; tr.run(t, a, sid, phase, k * 3, Math.floor(6000 + rnd() * 22000), Math.floor(1500 + rnd() * 5000), 60 + Math.floor(rnd() * 140), rnd() < 0.9 ? 1 : 2, 2, +(rnd() * 0.4).toFixed(2), Math.floor(rnd() * 4), ok ? 100 - flags.length * 12 : 0, flags.join(','), ok ? 1 : 0, ok ? 600 + Math.floor(rnd() * 900) : null, ok ? 80 + Math.floor(rnd() * 220) : null, ok ? 3000 + Math.floor(rnd() * 5000) : null, ok ? (k === 1 ? 2800 : 0) : null); }
  if (rnd() > 0.7) continue; e('reading_requested'); e('reading_received');
  if (rnd() < 0.78) e('resonance', { value: rnd() < 0.5 ? 3 : rnd() < 0.7 ? 2 : 1 });
  if (rnd() < 0.2) e('share_card', { action: 'saved' });
  if (rnd() > 0.4) continue; e('warn_shown'); e('session_close', { min: 30 }); if (rnd() < 0.6) e('nps', { value: Math.floor(rnd() * 11) });
  e('signup_view', { why: 'close' }); if (rnd() > 0.45) continue; e('signup_submit'); if (rnd() > 0.82) continue; e('signup_verified', {});
  if (rnd() < 0.3) ev.run(t0 + DAY + 3_600_000, a, `${sid}r`, 'return_visit', '{}');
  if (rnd() < 0.18) ev.run(t0 + 7 * DAY, a, `${sid}w`, 'return_visit', '{}');
}
db.exec('COMMIT');
console.log(`Đã sinh dữ liệu giả lập cho ${N} người vào ${file}`);
