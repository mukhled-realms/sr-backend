```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/index');
const router = express.Router();
require('dotenv').config();

router.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB Error' });
    let userId, userData;
    if (row) { userData = row; userId = row.id; } 
    else {
      userId = `user_${Date.now()}`;
      db.run(`INSERT INTO users (id, username, diamonds, score) VALUES (?, ?, ?, ?)`, [userId, username, 0, 0]);
      userData = { id: userId, username, diamonds: 0, score: 0 };
    }
    const token = jwt.sign({ id: userData.id, username: userData.username }, process.env.JWT_SECRET || 'skull_secret_key', { expiresIn: '7d' });
    res.json({ token, user: userData });
  });
});

router.get('/me', require('../middleware/auth').authenticateToken, (req, res) => {
  db.get(`SELECT id, username, diamonds, score FROM users WHERE id = ?`, [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB Error' });
    res.json(row);
  });
});

module.exports = router;
```
