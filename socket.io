```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'Running', 
    db: process.env.DB_PATH || './skull.db',
    timestamp: new Date().toISOString()
  });
});

app.post('/payment/webhook', (req, res) => {
  console.log('📩 PayPal Webhook تم استقباله:', req.body);
  res.status(200).send('Webhook received');
});

io.on('connection', (socket) => {
  console.log('🟢 لاعب متصل:', socket.id);
  socket.on('chat_message', (msg) => {
    io.emit('chat_message', msg);
  });
  socket.on('disconnect', () => {
    console.log('🔴 لاعب انقطع:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Skull Realms Backend يعمل على المنفذ: ${PORT}`);
});
```
