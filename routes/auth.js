const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'SKULLREALMSSECRET_KEY';

// تسجيل مستخدم جديد
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ ok: false, error: 'Missing fields' });

    const hashed = await bcrypt.hash(password, 10);
    const userId = await db.createUser(username, hashed);

    return res.status(201).json({ ok: true, userId });
  } catch (err) {
    console.error('Register Error:', err);
    return res.status(500).json({ ok: false });
  }
});

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await db.getUserByUsername(username);
    if (!user) return res.status(401).json({ ok: false, error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ ok: false, error: 'Wrong password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, viplevel: user.vip_level },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({ ok: true, token, userId: user.id, viplevel: user.vip_level });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ ok: false });
  }
});

// ميدل وير تحقق التوكن
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ ok: false, error: 'No token' });

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Invalid token' });
  }
}

module.exports = {
  router,
  authMiddleware
};
