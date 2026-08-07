// sr-backend/sockets/gameSocket.js
const db = require('../db/index'); // استيراد قاعدة البيانات الخاصة بك

module.exports = (io) => {
    // تخزين حالة الجماجم الحية
    let activeSkulls = {};

    io.on('connection', (socket) => {
        console.log('🔗 User Connected to Game Socket:', socket.id);

        // ---- 1. نظام الشات الحي ----
        socket.on('chat-message', (data) => {
            // ننشر الرسالة لكل اللاعبين
            io.emit('new-chat', { 
                user: socket.id.substr(0, 5), 
                msg: data.msg 
            });
        });

        // ---- 2. نظام التقاط الجماجم (Skull Drops) ----
        socket.on('claim-skull', (skullId) => {
            if (activeSkulls[skullId]) {
                // حذف الجمجمة من الخادم
                delete activeSkulls[skullId];
                // إخبار كل اللاعبين بحذفها من الشاشة
                io.emit('remove-skull', skullId);
                // إعطاء النقاط للاعب الذي التقطها (يفترض أن يكون لديك نظام نقاط)
                socket.emit('update-points', 10); 
            }
        });

        // ---- 3. نظام قطع الاتصال ----
        socket.on('disconnect', () => {
            console.log('🔌 User Disconnected:', socket.id);
        });
    });

    // ---- 4. نظام توليد الجماجم (Spawn Skulls) ----
    setInterval(() => {
        const skullId = Math.random().toString(36).substring(7);
        const drop = {
            id: skullId,
            x: Math.random() * 800,
            y: Math.random() * 600,
            type: 'neon-gold'
        };
        activeSkulls[skullId] = drop;
        io.emit('spawn-skull', drop);
    }, 5000); // تظهر جمجمة كل 5 ثوانٍ

    // ---- 5. نظام الموجات (Waves) ----
    setInterval(() => {
        io.emit('start-wave', { 
            title: "⚠️ SKULL REAPER WAVE", 
            intensity: 0.8 
        });
    }, 20000); // تظهر موجة كل 20 ثانية
};
