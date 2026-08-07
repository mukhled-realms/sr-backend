const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const { io } = require('../server');

// بيانات باي بال من المتغيرات البيئية
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

// رابط API الرسمي
const PAYPAL_API = "https://api-m.paypal.com"; // استخدم sandbox إذا كنت تختبر

// 1) إنشاء توكن للوصول
async function getAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");

    const response = await axios.post(
        `${PAYPAL_API}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

    return response.data.access_token;
}

// 2) إنشاء عملية دفع جديدة
router.post('/create-order', async (req, res) => {
    try {
        const { amount, description, userId } = req.body;

        const accessToken = await getAccessToken();

        const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders`,
            {
                intent: "CAPTURE",
                purchase_units: [
                    {
                        amount: {
                            currency_code: "USD",
                            value: amount
                        },
                        description,
                        custom_id: userId
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json({ ok: true, orderId: response.data.id });
    } catch (err) {
        console.error("PayPal Create Order Error:", err.response?.data || err);
        res.status(500).json({ ok: false });
    }
});

// 3) تنفيذ عملية الدفع (Capture)
router.post('/capture-order', async (req, res) => {
    try {
        const { orderId } = req.body;

        const accessToken = await getAccessToken();

        const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
            {},
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const capture = response.data.purchase_units[0].payments.captures[0];
        const amount = capture.amount.value;
        const userId = response.data.purchase_units[0].custom_id;

        // VIP Ultra إذا دفع 2000+
        if (Number(amount) >= 2000) {
            await db.setUserVipLevel(userId, 2);

            io.emit('vip-entered', {
                userId,
                level: 2,
                message: "⚡ ULTRA SUPPORTER ENTERED ⚡"
            });
        }

        res.json({ ok: true, capture });
    } catch (err) {
        console.error("PayPal Capture Error:", err.response?.data || err);
        res.status(500).json({ ok: false });
    }
});

// 4) Webhook لمعالجة الدفع من باي بال
router.post('/webhook', async (req, res) => {
    try {
        const event = req.body;

        if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
            const userId = event.resource.custom_id;
            const amount = event.resource.amount.value;

            if (Number(amount) >= 2000) {
                await db.setUserVipLevel(userId, 2);

                io.emit('vip-entered', {
                    userId,
                    level: 2,
                    message: "⚡ ULTRA SUPPORTER ENTERED ⚡"
                });
            }
        }

        res.sendStatus(200);
    } catch (err) {
        console.error("Webhook Error:", err);
        res.sendStatus(500);
    }
});

module.exports = router;
