const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// استيراد مسارات الأنظمة القديمة
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/store');

// استيراد مسار الدفع الجديد (الذي سننشئه بعد قليل)
const paymentRoutes = require('./payment');
const { initGameSocket } = require('./sockets/gameSocket');

const app = express();
const server = http.createServer(app);

// إعدادات CORS وقراءة البيانات
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

// ربط المسارات
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/payment', paymentRoutes);

// ربط الواجهة الأمامية
app.use(express.static(path.join(__dirname, 'public/frontend')));

// إعدادات Socket.io
const io = new Server(server, { cors: { origin: "*" } });

// تصدير io لاستخدامه في ملفات أخرى (مهم جداً عشان الدفع يشتغل)
module.exports.io = io;

// تفعيل أنظمة السوكيت
initGameSocket(io);

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`💰 Skull Realms Ready for Money on port ${PORT}`);
});
