// public/frontend/app.js

// 1. الاتصال بالسيرفر
const socket = io('http://localhost:3000'); // في حال شغلت المشروع على سيرفر حقيقي، حط الرابط الحقيقي هنا

// 2. إعداد PixiJS
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x0a0a0c,
    antialias: true,
});

// إضافة اللوحة للصفحة
document.getElementById('game-container').appendChild(app.view);

// 3. حاوية الجماجم
const skullsContainer = new PIXI.Container();
app.stage.addChild(skullsContainer);

// تخزين الجماجم الحالية
const skulls = {};

// 4. دالة لرسم الجمجمة
function createSkull(id, x, y) {
    const graphic = new PIXI.Graphics();
    
    // رسم دائرة نيون
    graphic.beginFill(0x00f3ff, 0.2);
    graphic.lineStyle(3, 0x00f3ff, 1);
    graphic.drawCircle(0, 0, 30);
    graphic.endFill();
    
    // رسم شكل الجمجمة (بسيط)
    graphic.beginFill(0x00f3ff, 0.5);
    graphic.drawCircle(-10, -5, 8); // عين يسار
    graphic.drawCircle(10, -5, 8);  // عين يمين
    graphic.endFill();

    graphic.x = x;
    graphic.y = y;
    graphic.interactive = true;
    graphic.buttonMode = true;
    
    // تبدأ صغيرة ثم تكبر
    graphic.scale.set(0);
    
    // عند الضغط على الجمجمة
    graphic.on('pointerdown', () => {
        socket.emit('claim-skull', id); // نرسل للسيرفر أننا أخذناها
    });

    skullsContainer.addChild(graphic);
    skulls[id] = graphic;
}

// ------------------------------------------------
// 5. استقبال الأحداث من السيرفر (Socket Events)
// ------------------------------------------------

// ظهور جمجمة جديدة
socket.on('spawn-skull', (data) => {
    createSkull(data.id, data.x, data.y);
});

// إزالة الجمجمة بعد أخذها
socket.on('remove-skull', (id) => {
    if (skulls[id]) {
        skullsContainer.removeChild(skulls[id]);
        delete skulls[id];
    }
});

// بدء موجة جديدة (Waves)
socket.on('start-wave', (data) => {
    // رسم بانر النيون في وسط الشاشة
    const banner = new PIXI.Text(data.title, {
        fontFamily: 'Arial', 
        fontSize: 50, 
        fill: 0xff0055, 
        align: 'center',
        dropShadow: true, 
        dropShadowColor: '#ff0055', 
        dropShadowBlur: 15
    });
    banner.anchor.set(0.5);
    banner.x = app.screen.width / 2;
    banner.y = app.screen.height / 2;
    app.stage.addChild(banner);
    
    // حذف البانر بعد 3 ثواني
    setTimeout(() => { 
        app.stage.removeChild(banner); 
    }, 3000);
});

// استقبال رسالة شات جديدة
socket.on('new-chat', (data) => {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    // هنا يظهر اسم المستخدم ورسالته
    msgDiv.innerHTML = `<span style="color: #ff0055; font-weight: bold;">${data.user}:</span> ${data.msg}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // ينزل الشات لآخر رسالة
});

// استقبال تحديث النقاط
socket.on('update-points', (amount) => {
    console.log(`لقد حصلت على ${amount} نقطة!`);
    // هنا تقدر تضيف كود يظهر النقاط على الشاشة
});

// ------------------------------------------------
// 6. حركة الأنيميشن (Ticker)
// ------------------------------------------------
app.ticker.add((delta) => {
    // حركة تكبير الجماجم عند ظهورها (تأثير النيون)
    for (let id in skulls) {
        if (skulls[id].scale.x < 1) {
            skulls[id].scale.x += 0.05 * delta;
            skulls[id].scale.y += 0.05 * delta;
        }
    }
});

// 7. عند تغيير حجم النافذة
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});
