
```markdown
# خطة نشر Skull Realms على Railway

## 1. متغيرات البيئة (Variables)
- `ADMIN_SECRET` : مفتاح سري للأدمن
- `JWT_SECRET` : مفتاح تشفير
- `PAYPAL_CLIENT_ID` : معرف باي بال
- `PAYPAL_SECRET` : مفتاح باي بال السري
- `PAYPAL_WEBHOOK_ID` : (يوضع بعد تفعيل الويب هوك)
- `DB_PATH` : `/data/skull.db`

## 2. الـ Volume
- المسار (Mount Path): `/data`

## 3. النشر
- ارفع الملفات لـ GitHub، ثم اضغط Deploy في Railway.
```
