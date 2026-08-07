// sr-backend/sockets/gameSocket.js
const db = require('../db/index'); // استيراد قاعدة البيانات

module.exports = (io) => {
    let activeSkulls = {};

    io.on('connection', (socket) => {
        console.log('🔗 User Connected to Game Socket:', socket.id);

        // ---- 1. نظام تسجيل المستخدم والتحقق من VIP (جديد من كابلت) ----
        socket.on('register-user', async (data) => {
            socket.userId = data.userId;

            try {
                // نتحقق من قاعدة البيانات
                const vipLevel = await db.getUserVipLevel(socket.userId);

                if (vipLevel >= 2) {
                    io.emit('vip-entered', {
                        userId: socket.userId,
                        level: vipLevel,
                        message: "⚡ VIP ULTRA ENTERED THE REALM ⚡"
                    });
                } else if (vipLevel === 1) {
                    io.emit('vip-entered', {
                        userId: socket.userId,
                        level: vipLevel,
                        message: "✨ VIP MEMBER JOINED THE REALM ✨"
                    });
                }
            } catch (err) {
                console.error("VIP Check Error:", err);
            }
        });

        // ---- 2. نظام الشات + AI Oracle ----
        socket.on('chat-message', (data) => {
            // ننشر الرسالة للكل
            io.emit('new-chat', { user: socket.id.substr(0, 5), msg: data.msg });

            // ORACLE AI الجديد
            const msg = data.msg.toLowerCase();
            let oracleReply = "🧠 ORACLE: العالم يتحدث من خلالك...";

            if (msg.includes("كيف") || msg.includes("how")) {
                oracleReply = "🧠 ORACLE: أنا بخير… أراقب هذا الريلم منذ آلاف السنين.";
            } else if (msg.includes("وين") || msg.includes("where")) {
                oracleReply = "🧠 ORACLE: كل الطرق تؤدي إلى الجمجمة… إن كنت شجاعاً.";
            } else if (msg.includes("سلام") || msg.includes("hello")) {
                oracleReply = "🧠 ORACLE: سلام؟ لا يوجد سلام هنا… فقط موجات قادمة.";
            } else if (msg.includes("جمجمة") || msg.includes("skull")) {
                oracleReply = "🧠 ORACLE: كل جمجمة تلتقطها تقرّبك من العرش...";
            } else if (msg.includes("vip") || msg.includes("دعم")) {
                oracleReply = "🧠 ORACLE: الداعمين هم حماة هذا العالم.";
            } else {
                const randomReplies = [
                    "🧠 ORACLE: يبدو أنك تبحث عن إجابة… لكن الإجابة تبحث عنك أيضاً.",
                    "🧠 ORACLE: العالم مظلم… لكن وجودك هنا يضيف بعض النيون.",
                    "🧠 ORACLE: سؤال جميل… لكن الأجمل أنك ما زلت تقاتل."
                ];
                oracleReply = randomReplies[Math.floor(Math.random() * randomReplies.length)];
            }

            io.emit('ai-oracle', { msg: oracleReply });
        });

        // ---- 3. نظام التقاط الجماجم (Skull Drops) ----
        socket.on('claim-skull', async (skullId) => {
            if (activeSkulls[skullId]) {
                delete activeSkulls[skullId];
                io.emit('remove-skull', skullId);

                if (socket.userId) {
                    try {
                        await db.updateUserPoints(socket.userId, 10);
                        socket.emit('update-points', 10);
                    } catch (err) {
                        console.error('Error updating points:', err);
                    }
                } else {
                    socket.emit('update-points', 10);
                }
            }
        });

        // ---- 4. نظام قطع الاتصال ----
        socket.on('disconnect', () => {
            console.log('🔌 User Disconnected:', socket.id);
        });
    });

    // ---- 5. نظام توليد الجماجم (Spawn Skulls) ----
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
    }, 5000);

    // ---- 6. نظام الموجات (Waves) ----
    setInterval(() => {
        io.emit('start-wave', { 
            title: "⚠️ SKULL REAPER WAVE", 
            intensity: 0.8 
        });
    }, 20000);
};
