const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const db = require('../db/index');
const router = express.Router();

// إعداد بيئة PayPal (استخدم Sandbox للاختبار)
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

// 1. إنشاء طلب دفع
router.post('/create-paypal-order', async (req, res) => {
  const { amount } = req.body;

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: amount
      }
    }]
  });

  try {
    const order = await client.execute(request);
    res.json({ id: order.result.id });
  } catch (err) {
    res.status(500).json({ error: 'فشل إنشاء طلب الدفع' });
  }
});

// 2. تأكيد الدفع (Capture)
router.post('/capture-paypal-order', async (req, res) => {
  const { orderID } = req.body;

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    res.json({ status: 'success', details: capture.result });
  } catch (err) {
    res.status(500).json({ error: 'فشل تأكيد الدفع' });
  }
});

// 3. Webhook لاستقبال تأكيد الدفع من PayPal
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
