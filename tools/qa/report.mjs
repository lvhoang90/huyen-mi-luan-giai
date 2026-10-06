// Gom kết quả của run.mjs thành một báo cáo Markdown. Cách dùng: node tools/qa/report.mjs <thư-mục-kết-quả> > bao-cao.md
import fs from 'node:fs';
import path from 'node:path';
const dir = path.resolve(process.argv[2] ?? 'qa-out');
const R = fs.readdirSync(dir).filter((f) => /^p\d+\.json$/.test(f)).sort().map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const nums = (k, f = () => true) => R.filter(f).map((r) => r.metrics[k]).filter((v) => Number.isFinite(v));
const fmt = (v, u = 'ms') => (v == null ? '–' : u === 'ms' ? `${Math.round(v).toLocaleString('vi-VN')} ms` : `${v}${u}`);
const out = [];
const total = R.reduce((a, r) => a + r.checks.length, 0), pass = R.reduce((a, r) => a + r.passed, 0);
out.push(`# Báo cáo kiểm thử 50 cấu hình thiết bị`, '', `Số cấu hình: ${R.length}. Số phép kiểm tra: ${total}. Đạt: ${pass} (${((100 * pass) / total).toFixed(1)}%). Chưa đạt: ${total - pass}.`, '');
out.push('## Theo nhóm thiết bị', '', '| Nhóm | Số cấu hình | Phép kiểm tra đạt | Cấu hình có lỗi |', '|---|---|---|---|');
for (const g of [...new Set(R.map((r) => r.group))]) { const rs = R.filter((r) => r.group === g); const c = rs.reduce((a, r) => a + r.checks.length, 0), p = rs.reduce((a, r) => a + r.passed, 0); out.push(`| ${g} | ${rs.length} | ${p}/${c} (${((100 * p) / c).toFixed(1)}%) | ${rs.filter((r) => r.failed).length} |`); }
out.push('', '## Phép kiểm tra chưa đạt, gom theo nội dung', '');
const by = new Map(); for (const r of R) for (const c of r.checks) if (!c.ok) { const a = by.get(c.name) ?? []; a.push(`${r.id} ${r.label}${c.detail ? ` (${c.detail})` : ''}`); by.set(c.name, a); }
if (!by.size) out.push('Không có phép kiểm tra nào chưa đạt.');
for (const [n, a] of [...by].sort((x, y) => y[1].length - x[1].length)) out.push(`- **${n}**: ${a.length}/${R.length} cấu hình`, ...a.slice(0, 12).map((x) => `  - ${x}`), a.length > 12 ? `  - … và ${a.length - 12} cấu hình khác` : '');
out.push('', '## Tốc độ', '', '| Chỉ số | Trung vị | Phân vị 90 | Chậm nhất |', '|---|---|---|---|');
for (const [k, l] of [['dcl', 'Tải xong HTML (DOMContentLoaded)'], ['lcp', 'Nội dung lớn nhất hiện ra (LCP)'], ['ready', 'Từ lúc mở tới khi bấm được "Bước vào"'], ['shareDelayMs', 'Từ bấm Chia sẻ tới khi hộp thoại mở'], ['firstTokenMs', 'Từ gửi tin tới khi My bắt đầu trả lời'], ['replyMs', 'My trả lời xong']]) { const a = nums(k); out.push(`| ${l} | ${fmt(q(a, 0.5))} | ${fmt(q(a, 0.9))} | ${fmt(a.length ? Math.max(...a) : null)} |`); }
const slow = R.filter((r) => r.metrics.ready).sort((a, b) => b.metrics.ready - a.metrics.ready).slice(0, 5);
out.push('', 'Năm cấu hình chậm nhất tới lúc bấm được "Bước vào": ' + slow.map((r) => `${r.id} ${r.label} (${(r.metrics.ready / 1000).toFixed(1)}s)`).join('; '), '');
out.push(`Dung lượng tải ở màn chào: trung vị ${fmt(q(nums('transferKB'), 0.5), ' KB')}, lớn nhất ${fmt(Math.max(...nums('transferKB')), ' KB')}.`, '');
out.push('## Lỗi trong console và yêu cầu mạng thất bại', '');
const cons = new Map(); for (const r of R) for (const c of r.console) { const k = c.replace(/^\[[^\]]+\]\s*/, ''); cons.set(k, [...(cons.get(k) ?? []), r.id]); }
if (!cons.size) out.push('Không có lỗi console.'); for (const [k, ids] of cons) out.push(`- ${k} (${ids.length} cấu hình: ${ids.slice(0, 6).join(', ')}${ids.length > 6 ? '…' : ''})`);
const bad = new Map(); for (const r of R) for (const c of [...r.badStatus, ...r.failedRequests]) { const k = c.replace(/^\[[^\]]+\]\s*/, ''); bad.set(k, (bad.get(k) ?? 0) + 1); }
out.push('', ...[...bad].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => `- ${k} (${n} lần)`));
out.push('', '## Trợ năng (kiểm tra tự động cơ bản)', '');
const aud = (key, name) => { const m = new Map(); for (const r of R) for (const part of Object.values(r.audit)) for (const v of part[key] ?? []) m.set(v, (m.get(v) ?? 0) + 1); return [...m].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([v, n]) => `  - ${v} (${n} lượt)`).join('\n') || '  - Không có'; };
out.push('Nút hoặc liên kết không có tên:', aud('btnNoName'), 'Ảnh không có mô tả:', aud('imgNoAlt'), 'Ô nhập không có nhãn:', aud('inNoLabel'), 'Điểm chạm nhỏ hơn 32px (trên màn hình cảm ứng; trên máy tính không áp dụng):', aud('small'));
out.push('', '## Chi tiết từng cấu hình', '', '| Mã | Cấu hình | Đạt | Chưa đạt | Thời gian | Ghi chú |', '|---|---|---|---|---|---|');
for (const r of R) out.push(`| ${r.id} | ${r.label} | ${r.passed} | ${r.failed} | ${r.seconds}s | ${r.checks.filter((c) => !c.ok).map((c) => c.name).slice(0, 3).join('; ')} |`);
console.log(out.join('\n'));
