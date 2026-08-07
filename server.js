const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// خدمة المجلدات الثابتة
app.use(express.static(path.join(__dirname, 'public')));

// تحديد المسار الصريح لصفحة اللعبة
app.get('/play', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'frontend', 'index.html'));
});

// الصفحة الرئيسية أيضاً
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'frontend', 'index.html'));
});

// ربط المسارات الأخرى
const { router: authRoutes } = require('./routes/auth');
app.use('/api/auth', authRoutes);

const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

const { initGameSocket } = require('./sockets/gameSocket');
initGameSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Skull Realms running on port ${PORT}`));

module.exports.io = io;
