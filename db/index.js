const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../skull.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    diamonds INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS auction_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT,
    winner_id TEXT,
    final_bid INTEGER,
    ended_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('✅ DB Connected');
});

module.exports = db;
