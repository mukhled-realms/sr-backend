const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// تحديد مجلد الملفات الثابتة (حيث توجد index.html و landing.html)
app.use(express.static(path.join(__dirname, 'public')));

// الصفحة الرئيسية ← تخدم landing.html (صفحة الهبوط)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 Skull Realms Server يعمل على المنفذ: ${PORT}`);
});
