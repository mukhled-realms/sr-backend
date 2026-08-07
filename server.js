const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// استيراد مسارات الأنظمة القديمة
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/store');
const paymentRoutes = require('./routes/payment');

// استيراد ملف إدارة السوكيت الجديد (سنقوم بإنشائه بعد قليل)
const setupGameSocket = require('./sockets/gameSocket');

const app = express();
const server = http.createServer(app);

// إعدادات CORS وقراءة البيانات
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}));
app.use(express.json());

// ربط مسارات API الخلفية
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/payment', paymentRoutes);

// ربط مجلد الواجهة الأمامية (سنقوم بإنشاء هذا المجلد قريبًا)
// ملاحظة: وضعنا الواجهة داخل مجلد public لتسهيل النشر
app.use(express.static(path.join(__dirname, 'public/frontend')));

// إعدادات Socket.io
const io = new Server(server, { 
    cors: { 
        origin: "*",
        methods: ["GET", "POST"]
    } 
});

// تفعيل أنظمة السوكيت الجديدة للألعاب
setupGameSocket(io);

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Skull Realms Server running on port ${PORT}`);
});
