// public/frontend/app.js

// 1. الاتصال بالسيرفر
const socket = io('http://localhost:3000'); 

// 2. إعداد PixiJS
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x0a0a0c,
    antialias: true,
});

document.getElementById('game-container').appendChild(app.view);

// 3. حاوية الجماجم
const skullsContainer = new PIXI.Container();
app.stage.addChild(skullsContainer);
const skulls = {};

// 4. الخلفيات المتغيرة
const backgrounds = [
    0x0a0a0c, // عادي
    0x001f3f, // نيون مدينة
    0x0f0a1a, // غابة مظلمة
    0x2b1f0f, // صحراء
    0x1a001f  // VIP
];
let currentBg = 0;
function changeBackground() {
    currentBg = (currentBg + 1) % backgrounds.length;
    app.renderer.backgroundColor = backgrounds[currentBg];
}
setInterval(changeBackground, 15000);

// 5. دالة رسم الجمجمة
function createSkull(id, x, y) {
    const graphic = new PIXI.Graphics();
    graphic.beginFill(0x00f3ff, 0.2);
    graphic.lineStyle(3, 0x00f3ff, 1);
    graphic.drawCircle(0, 0, 30);
    graphic.endFill();
    graphic.beginFill(0x00f3ff, 0.5);
    graphic.drawCircle(-10, -5, 8);
    graphic.drawCircle(10, -5, 8);
    graphic.endFill();

    graphic.x = x;
    graphic.y = y;
    graphic.interactive = true;
    graphic.buttonMode = true;
    graphic.scale.set(0);
    
    graphic.on('pointerdown', () => {
        socket.emit('claim-skull', id);
    });

    skullsContainer.addChild(graphic);
    skulls[id] = graphic;
}

// 6. استقبال الأحداث
socket.on('spawn-skull', (data) => {
    createSkull(data.id, data.x, data.y);
});

socket.on('remove-skull', (id) => {
    if (skulls[id]) {
        skullsContainer.removeChild(skulls[id]);
        delete skulls[id];
    }
});

socket.on('start-wave', (data) => {
    changeBackground();
    const banner = new PIXI.Text(data.title, {
        fontFamily: 'Arial', fontSize: 50, fill: 0xff0055, align: 'center',
        dropShadow: true, dropShadowColor: '#ff0055', dropShadowBlur: 15
    });
    banner.anchor.set(0.5);
    banner.x = app.screen.width / 2;
    banner.y = app.screen.height / 2;
    app.stage.addChild(banner);
    setTimeout(() => { app.stage.removeChild(banner); }, 3000);
});

socket.on('new-chat', (data) => {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.innerHTML = `<span style="color: #ff0055; font-weight: bold;">${data.user}:</span> ${data.msg}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('update-points', (amount) => {
    console.log(`لقد حصلت على ${amount} نقطة!`);
});

// 7. استقبال VIP
socket.on('vip-entered', (data) => {
    if (data.level >= 2) {
        app.renderer.backgroundColor = 0xffd700;
    } else {
        app.renderer.backgroundColor = 0x5500aa;
    }

    const banner = new PIXI.Text(data.message, {
        fontFamily: 'Courier New', fontSize: 42,
        fill: 0xff0055, dropShadow: true, dropShadowColor: '#ff0055', dropShadowBlur: 12
    });
    banner.anchor.set(0.5);
    banner.x = app.screen.width / 2;
    banner.y = 120;
    app.stage.addChild(banner);
    setTimeout(() => {
        app.stage.removeChild(banner);
        app.renderer.backgroundColor = 0x0a0a0c;
    }, 6000);
});

// 8. استقبال AI Oracle
socket.on('ai-oracle', (data) => {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('neon-text');
    msgDiv.innerHTML = data.msg;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// 9. حركة الأنيميشن
app.ticker.add((delta) => {
    for (let id in skulls) {
        if (skulls[id].scale.x < 1) {
            skulls[id].scale.x += 0.05 * delta;
            skulls[id].scale.y += 0.05 * delta;
        }
    }
});

window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});
