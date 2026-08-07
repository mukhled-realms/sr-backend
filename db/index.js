// sr-backend/db/index.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// تحديد مسار قاعدة البيانات
const dbPath = path.join(__dirname, 'skull.db');
const db = new sqlite3.Database(dbPath);

// إنشاء الجداول إذا لم تكن موجودة
db.serialize(() => {
    // جدول المستخدمين
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            points INTEGER DEFAULT 0,
            vip_level INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
});

// دالة تحديث نقاط المستخدم
function updateUserPoints(userId, deltaPoints) {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE users SET points = points + ? WHERE id = ?;`,
            [deltaPoints, userId],
            function (err) {
                if (err) return reject(err);
                resolve(true);
            }
        );
    });
}

// دالة تعيين مستوى VIP
function setUserVipLevel(userId, level) {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE users SET vip_level = ? WHERE id = ?;`,
            [level, userId],
            function (err) {
                if (err) return reject(err);
                resolve(true);
            }
        );
    });
}

// تصدير الدوال
module.exports = {
    updateUserPoints,
    setUserVipLevel
};
