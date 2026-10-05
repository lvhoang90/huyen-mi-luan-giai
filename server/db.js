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
  `);
  return db;
}
