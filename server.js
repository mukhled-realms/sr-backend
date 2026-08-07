const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// الصفحة الرئيسية → الواجهة الأمامية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'frontend', 'index.html'));
});

// auth
const { router: authRoutes } = require('./routes/auth');
app.use('/api/auth', authRoutes);

// الدفع
const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

// السوكيت (التصحيح النهائي للأسماء)
const setupGameSocket = require('./sockets/gameSocket');
setupGameSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Skull Realms running on port ${PORT}`));

module.exports.io = io;
