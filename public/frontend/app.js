const sounds = {
    pickup: new Howl({ src: ['/assets/sounds/pickup.mp3'], volume: 0.5 }),
    vipEntry: new Howl({ src: ['/assets/sounds/vip-fanfare.mp3'], volume: 0.8 }),
    oracle: new Howl({ src: ['/assets/sounds/whisper.mp3'], volume: 0.4, rate: 0.8 })
};

class ParticleSystem {
    constructor(container) {
        this.container = container;
        this.particles = [];
    }
    createBurst(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const p = new PIXI.Graphics();
            p.beginFill(color);
            p.drawCircle(0, 0, Math.random() * 6 + 2);
            p.endFill();
            p.x = x;
            p.y = y;
            p.vx = (Math.random() - 0.5) * 12;
            p.vy = (Math.random() - 0.5) * 12;
            p.alpha = 1;
            this.container.addChild(p);
            this.particles.push(p);
        }
    }
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.03;
            if (p.alpha <= 0) {
                this.container.removeChild(p);
                this.particles.splice(i, 1);
            }
        }
    }
}

const socket = io(window.location.origin);

const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x0a0a0c,
    antialias: true
});
document.getElementById('game-container').appendChild(app.view);

// هذا السطر هو حل المشكلة (إجبار الخلفية على الظهور)
app.renderer.backgroundColor = 0x0a0a0c;

const skullsContainer = new PIXI.Container();
app.stage.addChild(skullsContainer);
const skulls = {};

const particles = new ParticleSystem(app.stage);
app.ticker.add(() => particles.update());

function createSkull(id, x, y) {
    const container = new PIXI.Container();

    const glow = new PIXI.Graphics();
    glow.beginFill(0x00f3ff, 0.3);
    glow.drawCircle(0, 0, 40);
    glow.endFill();
    glow.filters = [new PIXI.filters.BlurFilter(12)];

    const graphic = new PIXI.Graphics();
    graphic.beginFill(0x00f3ff, 0.8);
    graphic.lineStyle(3, 0x00f3ff);
    graphic.drawCircle(0, 0, 25);
    graphic.drawCircle(-10, -5, 8);
    graphic.drawCircle(10, -5, 8);
    graphic.endFill();

    container.addChild(glow);
    container.addChild(graphic);
    container.x = x;
    container.y = y;
    container.scale.set(0);
    container.interactive = true;
    container.buttonMode = true;

    container.on('pointerdown', () => {
        sounds.pickup.play();
        particles.createBurst(container.x, container.y, 0x00FFCC);
        socket.emit('claim-skull', id);
    });

    skullsContainer.addChild(container);
    skulls[id] = container;
}

function typeWriterEffect(text, element) {
    element.innerHTML = '';
    let i = 0;
    const speed = 40;
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

socket.on('spawn-skull', (data) => createSkull(data.id, data.x, data.y));

socket.on('remove-skull', (id) => {
    if (skulls[id]) {
        skullsContainer.removeChild(skulls[id]);
        delete skulls[id];
    }
});

socket.on('start-wave', (data) => {
    const banner = new PIXI.Text(data.title, {
        fontFamily: 'Cinzel, serif',
        fontSize: 60,
        fill: 0xff0055,
        dropShadow: true,
        dropShadowColor: '#ff0055',
        dropShadowBlur: 15
    });
    banner.anchor.set(0.5);
    banner.x = app.screen.width / 2;
    banner.y = app.screen.height / 2;
    app.stage.addChild(banner);
    setTimeout(() => app.stage.removeChild(banner), 3000);
});

socket.on('new-chat', (data) => {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.innerHTML = `<span style="color: #ff0055; font-weight: bold;">${data.user}:</span> ${data.msg}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('vip-entered', (data) => {
    sounds.vipEntry.play();
    app.renderer.backgroundColor = 0xffd700;

    const banner = new PIXI.Text(data.message, {
        fontFamily: 'Cinzel, serif',
        fontSize: 48,
        fill: 0xff0055,
        dropShadow: true,
        dropShadowColor: '#ff0055',
        dropShadowBlur: 12
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

socket.on('ai-oracle', (data) => {
    sounds.oracle.play();
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('neon-text');
    typeWriterEffect(data.msg, msgDiv);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('update-points', (amount) => {
    console.log(`حصلت على ${amount} نقطة!`);
});

window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});
