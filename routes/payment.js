const express = require('express');
const db = require('../db/index');
const router = express.Router();

router.post('/webhook', (req, res) => {
  const event = req.body;
  console.log('Webhook Received:', event.event_type);
  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const userId = event.resource.custom_id;
    const amount = parseFloat(event.resource.amount.value);
    if (!userId) return res.status(200).send('No User ID');
    const diamondsToAdd = Math.floor(amount * 100);
    db.run(`UPDATE users SET diamonds = diamonds + ? WHERE id = ?`, [diamondsToAdd, userId], function(err) {
      if (err) return res.status(500).send('DB Error');
      console.log(`Added ${diamondsToAdd} diamonds to ${userId}`);
      res.status(200).send('Webhook processed');
    });
  } else {
    res.status(200).send('Event ignored');
  }
});

module.exports = router;
