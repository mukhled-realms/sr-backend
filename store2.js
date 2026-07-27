const express = require('express');
const db = require('../db/index');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.post('/buy', authenticateToken, (req, res) => {
  const { itemId, cost } = req.body;
  const userId = req.user.id;
  if (!itemId || !cost) return res.status(400).json({ error: 'Invalid data' });

  db.get(`SELECT diamonds FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB Error' });
    if (!row) return res.status(404).json({ error: 'User not found' });
    if (row.diamonds < cost) return res.status(400).json({ error: 'Insufficient diamonds' });

    db.run(`UPDATE users SET diamonds = diamonds - ? WHERE id = ?`, [cost, userId], function(err) {
      if (err) return res.status(500).json({ error: 'Purchase failed' });
      res.json({ success: true, message: 'تم الشراء بنجاح', itemId });
    });
  });
});

module.exports = router;
