const express = require('express');
const db = require('../db/index');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// 1. قائمة العناصر المتاحة للشراء
const STORE_ITEMS = [
  { id: 'basic_gems', name: '50 جوهرة', cost: 5, gems: 50 },
  { id: 'premium_gems', name: '200 جوهرة', cost: 15, gems: 200 },
  { id: 'mystery_box', name: 'صندوق غامض', cost: 10, gems: 0, isBox: true }
];

// 2. عرض قائمة المتجر
router.get('/items', (req, res) => {
  res.json({ items: STORE_ITEMS });
});

// 3. شراء عنصر
router.post('/buy', authenticateToken, (req, res) => {
  const { itemId } = req.body;
  const userId = req.user.id;

  const item = STORE_ITEMS.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'العنصر غير موجود' });
  }

  res.json({ 
    success: true, 
    message: `تم شراء ${item.name} بنجاح!`, 
    item: item 
  });
});

module.exports = router;
