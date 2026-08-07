const db = require('../db');

let activeSkulls = {};

// يجب أن يكون اسم الدالة هنا هو initGameSocket بالضبط
function initGameSocket(io) {
    io.on('connection', (socket) => {

        socket.on('register-user', async (data) => {
            socket.userId = data.userId;

            try {
                const vipLevel = await db.getUserVipLevel(socket.userId);

                if (vipLevel >= 2) {
                    io.emit('vip-entered', {
                        userId: socket.userId,
                        level: vipLevel,
                        message: "⚡ VIP ULTRA ENTERED ⚡"
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

        socket.on('chat-message', (data) => {
            io.emit('new-chat', { user: socket.id.substr(0, 5), msg: data.msg });

            const msg = data.msg.toLowerCase();
            let reply = "🧠 ORACLE: رسالة مثيرة… لكنني أراقب أكثر مما أتحدث.";

            if (msg.includes("سلام")) reply = "🧠 ORACLE: سلام؟ لا يوجد سلام هنا… فقط موجات.";
            if (msg.includes("كيف")) reply = "🧠 ORACLE: بخير… أراقب هذا الريلم منذ آلاف السنين.";
            if (msg.includes("وين")) reply = "🧠 ORACLE: كل الطرق تؤدي إلى الجمجمة.";

            io.emit('ai-oracle', { msg: reply });
        });

        socket.on('claim-skull', async (skullId) => {
            if (activeSkulls[skullId]) {
                delete activeSkulls[skullId];
                io.emit('remove-skull', skullId);

                if (socket.userId) {
                    try {
                        await db.updateUserPoints(socket.userId, 10);
                    } catch (err) {
                        console.error("Error updating points:", err);
                    }
                }

                socket.emit('update-points', 10);
            }
        });
    });

    setInterval(() => {
        const skullId = Math.random().toString(36).substring(7);
        const drop = {
            id: skullId,
            x: Math.random() * 800,
            y: Math.random() * 600
        };
        activeSkulls[skullId] = drop;
        io.emit('spawn-skull', drop);
    }, 5000);

    setInterval(() => {
        io.emit('start-wave', { title: "SKULL REAPER WAVE" });
    }, 20000);
}

// المهم جداً: تصدير الدالة بنفس الاسم الذي تستخدمه في server.js
module.exports = { initGameSocket };
