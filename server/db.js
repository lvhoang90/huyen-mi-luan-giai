// Lưu trữ bằng SQLite có sẵn trong Node (node:sqlite), không cần thư viện ngoài.
// Dữ liệu ở DATA_DIR (mặc định ./data). Khi đưa lên host, gắn ổ đĩa bền vững vào thư mục này.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL; -- với WAL vẫn an toàn khi mất điện, nhưng ít ép ghi đĩa hơn: quan trọng khi máy chủ dùng ổ HDD
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL, last_login INTEGER,
      role TEXT NOT NULL DEFAULT 'user', consent_memory INTEGER NOT NULL DEFAULT 0, consent_at INTEGER,
      ref TEXT, state TEXT, state_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS codes (email TEXT PRIMARY KEY, hash TEXT NOT NULL, expires INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, sent_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS anon (id TEXT PRIMARY KEY, first_seen INTEGER NOT NULL, first_chat INTEGER, ref TEXT);
    CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, actor TEXT NOT NULL, user_id INTEGER, sid TEXT, name TEXT NOT NULL, props TEXT);
    CREATE INDEX IF NOT EXISTS ev_ts ON events(ts); CREATE INDEX IF NOT EXISTS ev_name ON events(name, ts); CREATE INDEX IF NOT EXISTS ev_actor ON events(actor, ts);
    CREATE TABLE IF NOT EXISTS turns (
      id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, actor TEXT NOT NULL, sid TEXT, phase TEXT, minute INTEGER,
      ms INTEGER, ttft INTEGER, words INTEGER, q INTEGER, tags INTEGER, rep REAL, echo INTEGER, score INTEGER, flags TEXT, ok INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS tr_ts ON turns(ts);
    CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, actor TEXT NOT NULL, user_id INTEGER, kind TEXT NOT NULL, rating INTEGER, text TEXT NOT NULL, quote_ok INTEGER NOT NULL DEFAULT 0, display TEXT);
    CREATE INDEX IF NOT EXISTS fb_ts ON feedback(ts);
    CREATE TABLE IF NOT EXISTS users_gone (id INTEGER PRIMARY KEY, created_at INTEGER NOT NULL, consent_memory INTEGER NOT NULL DEFAULT 0, deleted_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS anon_links (anon_id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, linked_at INTEGER NOT NULL);
  `);
  // di chuyển dữ liệu cũ: thời gian trò chuyện thực (không tính lúc người dùng vắng mặt)
  const cols = db.prepare('PRAGMA table_info(anon)').all().map((c) => c.name);
  if (!cols.includes('active_ms')) db.exec('ALTER TABLE anon ADD COLUMN active_ms INTEGER NOT NULL DEFAULT 0');
  if (!cols.includes('last_chat')) db.exec('ALTER TABLE anon ADD COLUMN last_chat INTEGER');
  const ucols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  for (const [name, ddl] of [['remind_optin', 'INTEGER NOT NULL DEFAULT 0'], ['remind_token', 'TEXT'], ['remind_last', 'INTEGER'], ['remind_count', 'INTEGER NOT NULL DEFAULT 0']])
    if (!ucols.includes(name)) db.exec(`ALTER TABLE users ADD COLUMN ${name} ${ddl}`);
  // Hành trình cảm xúc: chỉ lưu con số ước lượng từ từng lượt, không lưu nội dung (xem server/affect.js).
  const tcols = db.prepare('PRAGMA table_info(turns)').all().map((c) => c.name);
  for (const [name, ddl] of [['u_val', 'REAL'], ['u_aro', 'REAL'], ['u_emo', 'TEXT'], ['u_disc', 'INTEGER'], ['u_words', 'INTEGER'], ['my_emo', 'TEXT'], ['ut', 'INTEGER']])
    if (!tcols.includes(name)) db.exec(`ALTER TABLE turns ADD COLUMN ${name} ${ddl}`);
  // Thiết bị (chỉ nhóm thô: loại máy, hệ điều hành, trình duyệt) để biết người thử dùng gì, và liên kết người ẩn danh với tài khoản sau khi đăng ký.
  const acols = db.prepare('PRAGMA table_info(anon)').all().map((c) => c.name);
  for (const name of ['device', 'os', 'browser']) if (!acols.includes(name)) db.exec(`ALTER TABLE anon ADD COLUMN ${name} TEXT`);
  const ucols2 = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  for (const name of ['device', 'os', 'browser', 'anon_id']) if (!ucols2.includes(name)) db.exec(`ALTER TABLE users ADD COLUMN ${name} TEXT`);
  return db;
}
