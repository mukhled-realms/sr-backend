const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./skull.db');

// إنشاء جدول المستخدمين (مرة واحدة)
db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  vip_level INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0
)
`);

function createUser(username, hashedPassword) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, hashedPassword],
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE username = ?`,
      [username],
      (err, row) => {
        if (err) return reject(err);
        resolve(row);
      }
    );
  });
}

function getUserVipLevel(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT vip_level FROM users WHERE id = ?`,
      [userId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.vip_level : 0);
      }
    );
  });
}

function updateUserPoints(userId, deltaPoints) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET points = points + ? WHERE id = ?`,
      [deltaPoints, userId],
      function (err) {
        if (err) return reject(err);
        resolve(true);
      }
    );
  });
}

function setUserVipLevel(userId, level) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET vip_level = ? WHERE id = ?`,
      [level, userId],
      function (err) {
        if (err) return reject(err);
        resolve(true);
      }
    );
  });
}

module.exports = {
  createUser,
  getUserByUsername,
  getUserVipLevel,
  updateUserPoints,
  setUserVipLevel
};
