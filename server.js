// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Socket.io with CORS
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Environment
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'db.sqlite');
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || '';
const PAYPAL_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Ensure data folder exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Initialize SQLite
const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    diamonds INTEGER DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    userId TEXT,
    itemId TEXT,
    amount INTEGER,
    createdAt INTEGER
  )`);
});

// Simple in-memory store items (you can move to DB)
const STORE_ITEMS = [
  { id: 'basic_gems', name: 'باقة جواهر صغيرة', cost: 1, diamonds: 50 },
  { id: 'premium_gems', name: 'باقة جواهر كبيرة', cost: 5, diamonds: 300 }
];

// API: store items
app.get('/api/store/items', (req, res) => {
  res.json({ ok: true, items: STORE_ITEMS });
});

// API: buy (creates a server-side order token or records a purchase placeholder)
app.post('/api/store/buy', async (req, res) => {
  try {
    const { itemId, userId } = req.body;
    const item = STORE_ITEMS.find(i => i.id === itemId);
    if (!item) return res.status(400).json({ ok: false, message: 'Item not found' });

    // Create a purchase record (pending)
    const purchaseId = uuidv4();
    const now = Date.now();
    db.run(
      `INSERT INTO purchases (id, userId, itemId, amount, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [purchaseId, userId || 'guest', itemId, item.cost, now]
    );

    // If PayPal credentials present, create order via PayPal API
    if (PAYPAL_CLIENT_ID && PAYPAL_SECRET) {
      // Get access token
      const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });
      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error('PayPal token error', tokenJson);
        return res.status(500).json({ ok: false, message: 'PayPal token error' });
      }
      const accessToken = tokenJson.access_token;

      // Create order
      const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: { currency_code: 'USD', value: item.cost.toFixed(2) },
            description: item.name
          }],
          application_context: {
            brand_name: 'Skull Realms',
            user_action: 'PAY_NOW',
            return_url: `${req.protocol}://${req.get('host')}/paypal/success?purchaseId=${purchaseId}`,
            cancel_url: `${req.protocol}://${req.get('host')}/paypal/cancel?purchaseId=${purchaseId}`
          }
        })
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok) {
        console.error('PayPal order error', orderJson);
        return res.status(500).json({ ok: false, message: 'PayPal order creation failed' });
      }
      return res.json({ ok: true, purchaseId, order: orderJson });
    }

    // If no PayPal configured, return success placeholder
    return res.json({ ok: true, purchaseId, message: 'purchase recorded (no PayPal configured)' });
  } catch (err) {
    console.error('buy error', err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// Simple endpoint to capture PayPal order (optional server-side capture)
app.post('/api/paypal/capture', async (req, res) => {
  try {
    const { orderId, purchaseId } = req.body;
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) return res.status(400).json({ ok: false, message: 'PayPal not configured' });

    const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    const capRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    const capJson = await capRes.json();
    if (!capRes.ok) {
      console.error('capture error', capJson);
      return res.status(500).json({ ok: false, message: 'Capture failed', detail: capJson });
    }

    // On success, you can update DB: add diamonds to user etc.
    // Example: find purchase by purchaseId and credit user
    // (left as exercise to map purchaseId -> item and user)

    res.json({ ok: true, capture: capJson });
  } catch (err) {
    console.error('capture exception', err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// Simple health
app.get('/api/health', (req, res) => res.json({ ok: true, time: Date.now() }));

// Serve index.html by default (static folder already set)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io logic
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join', (data) => {
    console.log('join', data);
    socket.join('global');
  });

  socket.on('chat:message', (msg) => {
    // broadcast to room
    io.to('global').emit('chat:message', msg);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
