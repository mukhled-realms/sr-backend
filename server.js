const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const db = require('./db/index');
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/store');
const paymentRoutes = require('./routes/payment');
const chatSocket = require('./sockets/chat');
const auctionSocket = require('./sockets/auction');
const { authenticateToken } = require('./middleware/auth');

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 1. حماية السيرفر وتقوية الأداء
// ==========================================
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'لقد تجاوزت الحد المسموح من الطلبات، حاول لاحقاً.'
});
app.use('/api/', limiter);
app.use(compression());

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
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const db = require('./db/index');
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/store');
const paymentRoutes = require('./routes/payment');
const chatSocket = require('./sockets/chat');
const auctionSocket = require('./sockets/auction');
const { authenticateToken } = require('./middleware/auth');

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 1. حماية السيرفر وتقوية الأداء
// ==========================================
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'لقد تجاوزت الحد المسموح من الطلبات، حاول لاحقاً.'
});
app.use('/api/', limiter);
app.use(compression());

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
                                      
