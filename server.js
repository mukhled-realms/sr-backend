const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات الجلسات (لحفظ بيانات اللاعبين)
app.use(session({
    secret: 'skull_realms_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // تأكد من استخدام true إذا كان HTTPS
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ملف تخزين المستخدمين (JSON بسيط بدلاً من قاعدة بيانات معقدة)
const USERS_FILE = path.join(__dirname, 'users.json');

// دالة لقراءة المستخدمين
function getUsers() {
    if (!fs.existsSync(USERS_FILE)) return {};
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

// دالة لحفظ المستخدمين
function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// الصفحة الرئيسية: تخدم صفحة الهبوط
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// صفحة اللعبة: محمية (لا يدخل إلا من سجل الدخول)
app.get('/game.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تسجيل الدخول
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();

    if (users[username] && users[username] === password) {
        req.session.user = username;
        return res.redirect('/game.html');
    }
    res.redirect('/login.html?error=true');
});

// إنشاء حساب جديد
app.post('/register', (req, res) => {
    const { username, password, confirm_password } = req.body;

    if (password !== confirm_password) {
        return res.redirect('/register.html?error=password_mismatch');
    }

    const users = getUsers();
    if (users[username]) {
        return res.redirect('/register.html?error=user_exists');
    }

    users[username] = password;
    saveUsers(users);

    req.session.user = username;
    res.redirect('/game.html');
});

// تسجيل الخروج
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 Skull Realms Server يعمل على المنفذ: ${PORT}`);
});
