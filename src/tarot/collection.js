// Bộ sưu tập Tarot: các lá đã bốc. Lưu trên máy; người đã đăng nhập còn được lưu trên tài khoản (chỉ số thứ tự lá) để đổi máy vẫn còn.
const KEY = 'huyenmy.tarotcol', HIST = 'huyenmy.tarothist';
const clean = (a) => [...new Set((Array.isArray(a) ? a : []).filter((n) => Number.isInteger(n) && n >= 0 && n < 78))].sort((x, y) => x - y);
const rd = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
export function localCol() { return clean([...(rd(KEY) ?? []), ...(rd(HIST) ?? []).flatMap((h) => h.ids ?? [])]); }
export function saveLocal(ids) { try { localStorage.setItem(KEY, JSON.stringify(clean(ids))); } catch {} }
let on = false;
/** Gọi khi biết người dùng đã đăng nhập. */
export const setLoggedIn = (v) => { on = !!v; };
/** Gộp bộ trên máy với bộ trên tài khoản (nếu đã đăng nhập), ghi lại hai nơi, trả về danh sách đầy đủ. */
export async function syncCol(extra = []) {
  const mine = clean([...localCol(), ...extra]); saveLocal(mine);
  if (!on) return mine;
  try {
    const r = await fetch('/api/cards', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: mine }) });
    if (!r.ok) return mine;
    const all = clean((await r.json()).ids.concat(mine)); saveLocal(all); return all;
  } catch { return mine; }
}
