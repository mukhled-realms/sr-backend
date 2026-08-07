// sr-backend/payment.js
const express = require('express');
const router = express.Router();
const db = require('./db'); // ربط قاعدة البيانات
const { io } = require('./server'); // استيراد الـ io الذي صدرناه من السيرفر

// مسار استقبال إشعار الدفع الناجح (Webhook أو Return)
router.post('/paypal/success', async (req, res) => {
    try {
        const { userId, amount } = req.body;

        // نتأكد أن المبلغ هو 2000 ريال (أو ما يعادلها بالدولار)
        if (amount >= 2000) {
            // تحديث المستخدم في قاعدة البيانات إلى VIP Ultra (مستوى 2)
            await db.setUserVipLevel(userId, 2); 

            // إرسال حدث عبر Socket.io لكل اللاعبين المتصلين
            io.emit('vip-ultra-entered', {
                userId,
                level: 2,
                amount,
                message: '👑 ULTRA SUPPORTER HAS ENTERED THE REALM'
            });

            return res.status(200).json({ ok: true, message: "VIP Ultra Activated!" });
        } else {
            return res.status(400).json({ ok: false, error: 'Amount too low for VIP Ultra' });
        }
    } catch (err) {
        console.error('PayPal Success Error:', err);
        return res.status(500).json({ ok: false, error: 'Server Error' });
    }
});

module.exports = router;
