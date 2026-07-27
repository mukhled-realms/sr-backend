const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const express = require('express');
// ... باقي الأسطر ...
const compression = require('compression'); // ينتهي عند السطر 14

app.use(cors());
// ... باقي السيرفر ...

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/payment', paymentRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'Running', 
    db: process.env.DB_PATH || './skull.db',
    timestamp: new Date().toISOString()
  });
});

io.on('connection', (socket) => {
  console.log('🟢 لاعب متصل:', socket.id);
  chatSocket(io, socket);
  auctionSocket(io, socket);

  socket.on('disconnect', () => {
    console.log('🔴 لاعب انقطع:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Skull Realms Backend يعمل على المنفذ: ${PORT}`);
});
