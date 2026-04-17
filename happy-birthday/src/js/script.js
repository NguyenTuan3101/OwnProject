'use strict';

let isPaused = false;
let pausedAnimeInstances = [];
function isExperiencePaused() {
    return isPaused;
}

// ===== SHARED NIGHT SKY + FIREFLIES CANVAS =====
(function () {
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    // Stars (some as sparkle crosses)
    const stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        r: Math.random() * 1.4 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.9 + 0.3,
        blue: Math.random() > 0.6,
        sparkle: Math.random() > 0.82
    }));

    // Fireflies
    const flies = Array.from({ length: 28 }, () => ({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        r: Math.random() * 3.5 + 1.2,
        vx: (Math.random() - 0.5) * 0.55, vy: (Math.random() - 0.5) * 0.55,
        alpha: Math.random(), fade: Math.random() * 0.012 + 0.006,
        hue: Math.random() > 0.45 ? 55 : 185
    }));

    // Shooting stars
    const shoots = [];
    setInterval(() => {
        shoots.push({
            x: Math.random() * innerWidth * 0.75, y: Math.random() * innerHeight * 0.4,
            len: Math.random() * 115 + 55, speed: Math.random() * 8 + 5,
            angle: Math.PI / 5 + (Math.random() - 0.5) * 0.38, opacity: 1
        });
    }, 3800);

    let t = 0;
    function draw() {
        if (isExperiencePaused()) {
            requestAnimationFrame(draw);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        t += 0.016;

        // Stars
        stars.forEach(s => {
            const tw = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
            ctx.globalAlpha = 0.35 + 0.65 * tw;
            const col = s.blue ? '#a8d4ff' : '#ffffff';

            if (s.sparkle && tw > 0.7) {
                // Cross sparkle
                const sz = s.r * 3 * tw;
                ctx.strokeStyle = col; ctx.lineWidth = s.r * 0.7;
                ctx.beginPath(); ctx.moveTo(s.x - sz, s.y); ctx.lineTo(s.x + sz, s.y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(s.x, s.y - sz); ctx.lineTo(s.x, s.y + sz); ctx.stroke();
                // Diagonal arms (smaller)
                const sd = sz * 0.5;
                ctx.globalAlpha = (0.35 + 0.65 * tw) * 0.5;
                ctx.beginPath(); ctx.moveTo(s.x - sd, s.y - sd); ctx.lineTo(s.x + sd, s.y + sd); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(s.x + sd, s.y - sd); ctx.lineTo(s.x - sd, s.y + sd); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (0.75 + 0.35 * tw), 0, Math.PI * 2);
                ctx.fillStyle = col; ctx.fill();
                if (s.r > 0.9) {
                    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
                    g.addColorStop(0, s.blue ? 'rgba(150,210,255,0.18)' : 'rgba(255,255,255,0.18)');
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2); ctx.fill();
                }
            }
        });

        // Fireflies
        flies.forEach(f => {
            f.x += f.vx; f.y += f.vy;
            f.alpha += f.fade;
            if (f.alpha <= 0 || f.alpha >= 1) f.fade = -f.fade;
            if (f.x < 0 || f.x > canvas.width) f.vx *= -1;
            if (f.y < 0 || f.y > canvas.height) f.vy *= -1;

            const a = Math.min(Math.max(f.alpha, 0), 1);
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 3.5);
            g.addColorStop(0, `hsla(${f.hue},95%,75%,${a * 0.85})`);
            g.addColorStop(1, `hsla(${f.hue},95%,75%,0)`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = a;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 0.45, 0, Math.PI * 2); ctx.fill();
        });

        // Shooting stars
        for (let i = shoots.length - 1; i >= 0; i--) {
            const s = shoots[i];
            const g = ctx.createLinearGradient(s.x, s.y, s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len);
            g.addColorStop(0, `rgba(255,255,255,${s.opacity})`);
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len); ctx.stroke();
            s.x += Math.cos(s.angle) * s.speed; s.y += Math.sin(s.angle) * s.speed;
            s.opacity -= 0.022;
            if (s.opacity <= 0 || s.x > innerWidth || s.y > innerHeight) shoots.splice(i, 1);
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }
    draw();
})();

// ===== CHERRY BLOSSOM PETALS =====
const PETAL_SYSTEM = (function () {
    const canvas = document.getElementById('petalCanvas');
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#ffb7c5', '#ff9aad', '#ffccd5', '#ffd6e0', '#ffe4e8', '#ffc0cb', '#ff8fab'];
    let t = 0;
    let wind = 0, windTarget = 0;

    setInterval(() => {
        windTarget = (Math.random() - 0.4) * 0.38;
        setTimeout(() => { windTarget = (Math.random() - 0.5) * 0.18; }, 2400 + Math.random() * 1600);
    }, 5600 + Math.random() * 3800);

    function newPetal(fromTop) {
        const cx = innerWidth * 0.5;
        const xSpan = innerWidth * 0.52;
        return {
            x: fromTop
                ? cx + (Math.random() - 0.5) * xSpan
                : Math.random() * innerWidth,
            y: fromTop ? -40 - Math.random() * 100 : Math.random() * innerHeight,
            vx: (Math.random() - 0.5) * 0.16,
            vy: Math.random() * 0.82 + 0.42,
            rot: Math.random() * Math.PI * 2,
            rspd: (Math.random() - 0.5) * 0.032,
            w: Math.random() * 11 + 6,
            h: Math.random() * 15 + 9,
            alpha: Math.random() * 0.55 + 0.22,
            swayPh: Math.random() * Math.PI * 2,
            swaySpd: Math.random() * 0.014 + 0.006,
            swayAmp: Math.random() * 0.42 + 0.22,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            burst: false
        };
    }

    const petals = Array.from({ length: 62 }, () => newPetal(false));

    function drawPetal(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        const w = p.w, h = p.h;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.5);
        ctx.bezierCurveTo( w * 0.55,  h * 0.22,  w * 0.62, -h * 0.12, 0, -h * 0.5);
        ctx.bezierCurveTo(-w * 0.62, -h * 0.12, -w * 0.55,  h * 0.22, 0,  h * 0.5);
        ctx.closePath();
        ctx.fill();
        // Subtle vein
        ctx.globalAlpha = p.alpha * 0.18;
        ctx.strokeStyle = 'rgba(255,120,150,0.9)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(0, -h * 0.5); ctx.stroke();
        // Shimmer
        ctx.globalAlpha = p.alpha * 0.32;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.ellipse(w * 0.14, -h * 0.06, w * 0.17, h * 0.24, -0.35, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function animate() {
        if (isExperiencePaused()) {
            requestAnimationFrame(animate);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        t += 0.016;
        wind += (windTarget - wind) * 0.028;
        const windUse = Math.max(-0.26, Math.min(0.26, wind));

        for (let i = petals.length - 1; i >= 0; i--) {
            const p = petals[i];
            p.x += p.vx + Math.sin(t * p.swaySpd + p.swayPh) * p.swayAmp + windUse;
            p.y += p.vy;
            p.rot += p.rspd;

            if (p.burst) {
                p.alpha -= 0.012;
                if (p.alpha <= 0) { petals.splice(i, 1); continue; }
            } else if (p.y > innerHeight + 25 || p.x < -40 || p.x > innerWidth + 40) {
                Object.assign(p, newPetal(true));
            }
            drawPetal(p);
        }
        requestAnimationFrame(animate);
    }
    animate();

    return {
        burst(cx, cy, count = 22, spreadV = 5) {
            for (let i = 0; i < count; i++) {
                const p = newPetal(false);
                p.x = cx; p.y = cy;
                const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
                const sp = Math.random() * spreadV * 0.75 + 0.85;
                p.vx = Math.cos(angle) * sp;
                p.vy = Math.sin(angle) * sp - 0.9;
                p.vy = p.vy;
                p.alpha = 0.75 + Math.random() * 0.25;
                p.burst = true;
                petals.push(p);
            }
        },
        show() { canvas.classList.add('active'); },
        setWind(v) { windTarget = Math.max(-0.55, Math.min(0.55, v)); }
    };
})();

// ===== LOADER =====
document.getElementById('play').addEventListener('click', function () {
    const loader = document.getElementById('loader');
    loader.style.transition = 'opacity 1.5s ease';
    loader.style.opacity = '0';
    document.getElementById('music').play().catch(() => { });
    PETAL_SYSTEM.show();
    setTimeout(() => {
        loader.style.display = 'none';
        document.getElementById('experience').classList.remove('hidden');
        goToScene(0);
    }, 1500);
});

// ===== SCENE MANAGER =====
const NUM_SCENES = 7;
let current = -1;
let autoTimerId = null;
let progressRaf = null;
let autoStartAt = 0;
let autoDuration = 0;
let autoRemaining = 0;
let autoNextScene = -1;
//                  s1      s2      s3      s4(seeds) s5(flowers) s6(photos) s7(wishes+ending)
const AUTO_DUR = [9000, 9000, 15000,   43000,    11000,       16000,     0];
const cleanups = {};
const sceneTimers = {};

const dotsEl = document.getElementById('nav-dots');
for (let i = 0; i < NUM_SCENES; i++) {
    const d = document.createElement('span');
    d.className = 'dot';
    d.addEventListener('click', () => goToScene(i));
    dotsEl.appendChild(d);
}

document.getElementById('prev-btn').addEventListener('click', () => { if (current > 0) goToScene(current - 1); });
document.getElementById('next-btn').addEventListener('click', () => { if (current < NUM_SCENES - 1) goToScene(current + 1); });
document.getElementById('pause-btn').addEventListener('click', togglePause);
document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (current < 0) {
            document.getElementById('play')?.click();
        } else {
            togglePause();
        }
        return;
    }
    if (e.key.toLowerCase() === 'p') {
        togglePause();
        return;
    }
    if (isPaused) return;
    if (e.key === 'ArrowRight') document.getElementById('next-btn').click();
    if (e.key === 'ArrowLeft') document.getElementById('prev-btn').click();
});

function goToScene(idx) {
    if (idx < 0 || idx >= NUM_SCENES || isPaused) return;
    stopAutoAdvance(false);
    document.getElementById('progress-fill').style.width = '0%';

    const prev = current;
    current = idx;
    updateDots();
    const scenes = document.querySelectorAll('.scene');

    if (prev >= 0) {
        clearSceneTimers(prev);
        if (cleanups[prev]) { cleanups[prev](); delete cleanups[prev]; }
        // Petal burst at scene transition
        PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.45, 10, 2.8);
        scenes[prev]?.classList.remove('is-active');
        anime({ targets: `#scene-${prev + 1}`, opacity: 0, duration: 500, easing: 'easeInSine' });
    }

    const enterDelay = prev >= 0 ? 420 : 0;
    setSceneTimeout(idx, () => {
        resetScene(idx);
        scenes.forEach(s => s.classList.remove('is-active'));
        scenes[idx]?.classList.add('is-active');
        anime({
            targets: `#scene-${idx + 1}`,
            opacity: [0, 1],
            duration: 700,
            easing: 'easeOutSine',
            complete: () => {
                enterScene(idx);
                const dur = AUTO_DUR[idx];
                if (dur) {
                    startAutoAdvance(idx, dur);
                }
            }
        });
    }, enterDelay);
}

function updateDots() {
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
    document.getElementById('prev-btn').style.opacity = current > 0 ? '1' : '0.18';
    document.getElementById('next-btn').style.opacity = current < NUM_SCENES - 1 ? '1' : '0.18';
}

function startProgress(duration) {
    autoDuration = duration;
    autoStartAt = Date.now();
    const fill = document.getElementById('progress-fill');
    function tick() {
        if (isPaused) return;
        const pct = Math.min((Date.now() - autoStartAt) / autoDuration * 100, 100);
        fill.style.width = pct + '%';
        if (pct < 100) progressRaf = requestAnimationFrame(tick);
    }
    tick();
}

function startAutoAdvance(idx, duration) {
    autoNextScene = idx + 1;
    autoRemaining = duration;
    startProgress(duration);
    autoTimerId = setTimeout(() => goToScene(autoNextScene), duration);
}

function stopAutoAdvance(keepRemaining) {
    if (autoTimerId) {
        clearTimeout(autoTimerId);
        autoTimerId = null;
    }
    if (progressRaf) {
        cancelAnimationFrame(progressRaf);
        progressRaf = null;
    }
    if (keepRemaining && autoDuration > 0 && autoStartAt > 0) {
        const elapsed = Date.now() - autoStartAt;
        autoRemaining = Math.max(autoDuration - elapsed, 0);
    } else if (!keepRemaining) {
        autoRemaining = 0;
        autoDuration = 0;
        autoStartAt = 0;
        autoNextScene = -1;
    }
}

function resumeAutoAdvance() {
    if (autoRemaining <= 0 || autoNextScene < 0) return;
    startProgress(autoRemaining);
    autoTimerId = setTimeout(() => goToScene(autoNextScene), autoRemaining);
}

function ensureSceneTimerBag(sceneIdx) {
    if (!sceneTimers[sceneIdx]) {
        sceneTimers[sceneIdx] = { timeouts: new Set(), intervals: new Set() };
    }
    return sceneTimers[sceneIdx];
}

function setSceneTimeout(sceneIdx, fn, delay) {
    const bag = ensureSceneTimerBag(sceneIdx);
    const id = setTimeout(() => {
        bag.timeouts.delete(id);
        if (sceneIdx !== current) return;
        fn();
    }, delay);
    bag.timeouts.add(id);
    return id;
}

function setSceneInterval(sceneIdx, fn, delay) {
    const bag = ensureSceneTimerBag(sceneIdx);
    const id = setInterval(() => {
        if (sceneIdx !== current || isPaused) return;
        fn();
    }, delay);
    bag.intervals.add(id);
    return id;
}

function clearSceneTimers(sceneIdx) {
    const bag = sceneTimers[sceneIdx];
    if (!bag) return;
    bag.timeouts.forEach(clearTimeout);
    bag.intervals.forEach(clearInterval);
    bag.timeouts.clear();
    bag.intervals.clear();
}

function togglePause() {
    if (current < 0) return;
    const pauseBtn = document.getElementById('pause-btn');
    const music = document.getElementById('music');
    isPaused = !isPaused;
    document.body.classList.toggle('experience-paused', isPaused);
    pauseBtn.classList.toggle('is-paused', isPaused);
    pauseBtn.textContent = isPaused ? '▶' : 'II';
    pauseBtn.setAttribute('aria-label', isPaused ? 'Resume experience' : 'Pause experience');
    if (isPaused) {
        stopAutoAdvance(true);
        if (!music.paused) music.pause();
        pausedAnimeInstances = anime.running.slice();
        pausedAnimeInstances.forEach(instance => instance.pause());
        return;
    }
    music.play().catch(() => { });
    pausedAnimeInstances.forEach(instance => {
        if (instance && typeof instance.play === 'function') instance.play();
    });
    pausedAnimeInstances = [];
    resumeAutoAdvance();
}

function resetScene(idx) {
    const scene = document.getElementById(`scene-${idx + 1}`);
    scene.querySelectorAll(
        '.opening-lines p, .s2-banner, .s2-name, .s2-sub, .s2-date, ' +
        '#msg-main, #msg-sub, .seed-line, .seed-sub, ' +
        '.fl-poem, .fl-poem-sub, ' +
        '.s4-title, .photo-card, .s4-hint, ' +
        '.s5-cake, .s5-hb, .s5-wishes p, .s6-date, .s6-msg, #egg'
    ).forEach(el => { el.style.opacity = '0'; el.style.transform = ''; });
    const egg = document.getElementById('egg');
    if (egg) egg.classList.remove('show');
}

function enterScene(idx) {
    [enter1, enter2, enter3, enter4, enter5, enter6, enter7][idx]();
}

// ===== SCENE 1: Má»ž Äáº¦U =====
function enter1() {
    // Gentle wind for scene 1
    PETAL_SYSTEM.setWind(0.22);
    setSceneTimeout(0, () => PETAL_SYSTEM.setWind(0), 2800);

    const lines = document.querySelectorAll('#scene-1 .opening-lines p');
    lines.forEach(el => {
        if (el.dataset.rawText) el.textContent = el.dataset.rawText;
    });
    anime({
        targets: lines,
        opacity: [0, 1],
        translateY: [28, 0],
        filter: ['blur(6px)', 'blur(0px)'],
        delay: el => parseInt(el.dataset.delay, 10) || 0,
        duration: 1000,
        easing: 'easeOutExpo'
    });
}

// ===== SCENE 2: TÃŠN =====
function enter2() {
    // Aurora canvas
    const aCanvas = document.getElementById('aurora-canvas');
    const ctx = aCanvas.getContext('2d');
    aCanvas.width = innerWidth; aCanvas.height = innerHeight;
    let running = true, at = 0;

    const bands = [
        { xf: t => 0.28 + Math.sin(t * 1.1) * 0.14,  c: [150, 0,   255, 0.14] },
        { xf: t => 0.50 + Math.sin(t * 0.75) * 0.20, c: [0,   180, 255, 0.11] },
        { xf: t => 0.72 + Math.sin(t * 1.3) * 0.11,  c: [255, 40,  200, 0.11] },
        { xf: t => 0.50 + Math.cos(t * 0.65) * 0.22, c: [100, 255, 180, 0.09] },
        { xf: t => 0.38 + Math.sin(t * 0.9) * 0.16,  c: [255, 180, 80,  0.07] }
    ];

    function drawAurora() {
        if (!running) return;
        if (isExperiencePaused()) {
            requestAnimationFrame(drawAurora);
            return;
        }
        ctx.clearRect(0, 0, aCanvas.width, aCanvas.height);
        at += 0.005;
        bands.forEach(b => {
            const gx = b.xf(at) * aCanvas.width;
            const [r, g, bl, a] = b.c;
            const grad = ctx.createRadialGradient(gx, aCanvas.height * 0.42, 0, gx, aCanvas.height * 0.42, aCanvas.width * 0.54);
            grad.addColorStop(0, `rgba(${r},${g},${bl},${a * 1.5})`);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, aCanvas.width, aCanvas.height);
        });
        requestAnimationFrame(drawAurora);
    }
    drawAurora();
    cleanups[1] = () => { running = false; ctx.clearRect(0, 0, aCanvas.width, aCanvas.height); };

    // Petal burst when name appears (1 sec delay)
    setSceneTimeout(1, () => {
        PETAL_SYSTEM.burst(innerWidth / 2, innerHeight * 0.52, 22, 4);
        setSceneTimeout(1, () => PETAL_SYSTEM.burst(innerWidth * 0.35, innerHeight * 0.5, 8, 3), 400);
        setSceneTimeout(1, () => PETAL_SYSTEM.burst(innerWidth * 0.65, innerHeight * 0.5, 8, 3), 700);
    }, 900);

    anime.timeline({ easing: 'easeOutExpo' })
        .add({ targets: '.s2-banner', opacity: [0, 1], translateY: [-38, 0], filter: ['blur(8px)', 'blur(0px)'], duration: 1000 })
        .add({ targets: '.s2-name',   opacity: [0, 1], scale: [0.4, 1], easing: 'easeOutBack', duration: 1200 }, '-=200')
        .add({ targets: '.s2-sub',    opacity: [0, 1], translateY: [20, 0], duration: 700 }, '-=500')
        .add({ targets: '.s2-date',   opacity: [0, 1], letterSpacing: ['2px', '10px'], duration: 900 }, '-=300');

    // Floating sparkle divs around name
    const scene = document.getElementById('scene-2');
    function spawnSparkle() {
        if (!running) return;
        const el = document.createElement('div');
        const size = Math.random() * 5 + 3;
        el.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;
            background:hsl(${Math.random() * 60 + 300},100%,80%);
            left:${Math.random() * 80 + 10}%;top:${Math.random() * 60 + 20}%;
            pointer-events:none;z-index:3;box-shadow:0 0 ${size * 2}px hsl(${Math.random() * 60 + 300},100%,80%);`;
        scene.appendChild(el);
        anime({
            targets: el,
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            duration: 1500 + Math.random() * 1000,
            easing: 'easeInOutSine',
            complete: () => el.remove()
        });
        setSceneTimeout(1, spawnSparkle, 300 + Math.random() * 400);
    }
    setSceneTimeout(1, spawnSparkle, 1200);
}

// ===== SCENE 3: gentle messages =====
const messages3 = (() => {
    const nodes = document.querySelectorAll('#scene-3-messages [data-main][data-sub]');
    const fromHtml = Array.from(nodes).map(node => ({
        main: node.getAttribute('data-main') || '',
        sub: node.getAttribute('data-sub') || ''
    })).filter(item => item.main || item.sub);

    if (fromHtml.length) return fromHtml;

    return [
        { main: '"Có những ngày bình thường…', sub: 'mà lại dễ chịu một cách lạ"' },
        { main: '"Không cần gì nhiều,', sub: 'chỉ cần đủ thoải mái là được"' }
    ];
})();


function enter3() {
    // Bokeh canvas â€” add cherry pink tones
    const bCanvas = document.getElementById('bokeh-canvas');
    const ctx = bCanvas.getContext('2d');
    bCanvas.width = innerWidth; bCanvas.height = innerHeight;

    const palettes = [
        [200, 245], [275, 320], [330, 360], [170, 210]
    ];
    const orbs = Array.from({ length: 32 }, () => {
        const [lo, hi] = palettes[Math.floor(Math.random() * palettes.length)];
        return {
            x: Math.random() * bCanvas.width, y: Math.random() * bCanvas.height,
            r: Math.random() * 80 + 20,
            vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
            hue: lo + Math.random() * (hi - lo),
            a: Math.random() * 0.065 + 0.025
        };
    });

    // Rising sparkle particles (light wisps)
    const wisps = Array.from({ length: 18 }, () => ({
        x: Math.random() * bCanvas.width,
        y: bCanvas.height + Math.random() * 100,
        vy: Math.random() * 0.9 + 0.4,
        r: Math.random() * 2.5 + 0.8,
        alpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.5 ? 330 : 55
    }));

    let running = true;
    let bt = 0;
    function drawBokeh() {
        if (!running) return;
        if (isExperiencePaused()) {
            requestAnimationFrame(drawBokeh);
            return;
        }
        ctx.clearRect(0, 0, bCanvas.width, bCanvas.height);
        bt += 0.016;

        orbs.forEach(o => {
            o.x += o.vx; o.y += o.vy;
            if (o.x < -o.r) o.x = bCanvas.width + o.r;
            if (o.x > bCanvas.width + o.r) o.x = -o.r;
            if (o.y < -o.r) o.y = bCanvas.height + o.r;
            if (o.y > bCanvas.height + o.r) o.y = -o.r;
            const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
            g.addColorStop(0, `hsla(${o.hue},78%,70%,${o.a})`);
            g.addColorStop(1, `hsla(${o.hue},78%,70%,0)`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
        });

        wisps.forEach(w => {
            w.y -= w.vy;
            w.x += Math.sin(bt * 0.7 + w.phase) * 0.6;
            const a = w.alpha * (1 - (bCanvas.height - w.y) / bCanvas.height);
            if (w.y < -10) { w.y = bCanvas.height + 10; w.x = Math.random() * bCanvas.width; }
            ctx.globalAlpha = Math.max(0, a);
            ctx.fillStyle = `hsl(${w.hue},90%,80%)`;
            ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.fill();
            // glow
            const g2 = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r * 4);
            g2.addColorStop(0, `hsla(${w.hue},90%,80%,${a * 0.5})`);
            g2.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g2;
            ctx.beginPath(); ctx.arc(w.x, w.y, w.r * 4, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(drawBokeh);
    }
    drawBokeh();

    // Message carousel
    let msgIdx = 0;
    const mainEl = document.getElementById('msg-main');
    const subEl  = document.getElementById('msg-sub');

    function showMsg(i) {
        const m = messages3[i % messages3.length];
        anime({ targets: [mainEl, subEl], opacity: 0, translateY: -12, filter: ['blur(0px)', 'blur(4px)'], duration: 440, easing: 'easeInSine',
            complete: () => {
                mainEl.textContent = m.main;
                subEl.textContent = m.sub;
                anime({ targets: mainEl, opacity: [0, 1], translateY: [24, 0], filter: ['blur(5px)', 'blur(0px)'], duration: 800, easing: 'easeOutExpo' });
                anime({ targets: subEl,  opacity: [0, 1], translateY: [18, 0], filter: ['blur(4px)', 'blur(0px)'], duration: 800, delay: 200, easing: 'easeOutExpo' });
            }
        });
    }
    showMsg(0);
    const iv = setSceneInterval(2, () => { msgIdx++; showMsg(msgIdx); }, 2500);
    cleanups[2] = () => {
        running = false;
        clearInterval(iv);
        ctx.clearRect(0, 0, bCanvas.width, bCanvas.height);
    };
}

// ===== SCENE 4: Háº T GIá»NG =====
function enter4() {
    const canvas = document.getElementById('seed-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = innerWidth; canvas.height = innerHeight;
    let running = true;
    const W = canvas.width, H = canvas.height;
    const GROUND = H * 0.82;
    const CX = W * 0.5;
    let elapsed = 0, lastTs = performance.now();

    function ease(t) { return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }
    function lerp(a,b,t) { return a+(b-a)*Math.max(0,Math.min(1,t)); }
    function qbez(x0,y0,cx,cy,x1,y1,t){ const u=1-t; return {x:u*u*x0+2*u*t*cx+t*t*x1, y:u*u*y0+2*u*t*cy+t*t*y1}; }
    function smoothstep(e0, e1, x) {
        if (x <= e0) return 0;
        if (x >= e1) return 1;
        const t = (x - e0) / (e1 - e0);
        return t * t * (3 - 2 * t);
    }

    let ambAlpha=0;
    const clouds = [];
    for(let i=0;i<9;i++){
        const far = i < 4;
        clouds.push({
            x: Math.random() * W * 1.6 - W * 0.3,
            y: H * (far ? 0.04 : 0.1) + Math.random() * H * (far ? 0.12 : 0.18),
            w: (far ? 100 : 70) + Math.random() * (far ? 140 : 90),
            h: (far ? 22 : 18) + Math.random() * 28,
            speed: (far ? 0.06 : 0.12) + Math.random() * 0.12,
            alpha: (far ? 0.06 : 0.1) + Math.random() * 0.06,
            layer: far ? 0 : 1
        });
    }
    const skyStars = Array.from({ length: 88 }, () => ({
        x: Math.random() * W,
        y: Math.random() * GROUND * 0.75,
        r: Math.random() * 1.15 + 0.25,
        ph: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.9 + 0.35,
        blue: Math.random() > 0.62
    }));
    let starTw = 0;
    function drawNightStars(){
        const a = ambAlpha;
        skyStars.forEach(s => {
            const tw = 0.35 + 0.65 * Math.sin(starTw * s.sp + s.ph);
            ctx.globalAlpha = a * tw * 0.9;
            ctx.fillStyle = s.blue ? '#a8d4ff' : '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * (0.75 + 0.35 * tw), 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
    
    function drawMountains(){
        const a = ambAlpha;
        ctx.globalAlpha = a * 0.5;
        const g0 = ctx.createLinearGradient(0, GROUND - H * 0.42, 0, GROUND);
        g0.addColorStop(0, 'rgba(35,32,58,0.9)');
        g0.addColorStop(1, 'rgba(22,18,38,0.95)');
        ctx.fillStyle = g0;
        ctx.beginPath();
        ctx.moveTo(0, GROUND);
        ctx.lineTo(0, GROUND - H * 0.22);
        ctx.bezierCurveTo(W * 0.12, GROUND - H * 0.32, W * 0.22, GROUND - H * 0.26, W * 0.32, GROUND - H * 0.36);
        ctx.bezierCurveTo(W * 0.42, GROUND - H * 0.3, W * 0.52, GROUND - H * 0.4, W * 0.62, GROUND - H * 0.33);
        ctx.bezierCurveTo(W * 0.72, GROUND - H * 0.38, W * 0.82, GROUND - H * 0.28, W, GROUND - H * 0.24);
        ctx.lineTo(W, GROUND);
        ctx.closePath();
        ctx.fill();
        
        ctx.globalAlpha = a * 0.82;
        const g1 = ctx.createLinearGradient(0, GROUND - H * 0.35, 0, GROUND);
        g1.addColorStop(0, '#252038');
        g1.addColorStop(0.6, '#1a1628');
        g1.addColorStop(1, '#14101c');
        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.moveTo(0, GROUND);
        ctx.lineTo(0, GROUND - H * 0.18);
        ctx.bezierCurveTo(W * 0.08, GROUND - H * 0.26, W * 0.18, GROUND - H * 0.2, W * 0.28, GROUND - H * 0.3);
        ctx.bezierCurveTo(W * 0.38, GROUND - H * 0.22, W * 0.48, GROUND - H * 0.32, W * 0.58, GROUND - H * 0.24);
        ctx.bezierCurveTo(W * 0.68, GROUND - H * 0.3, W * 0.78, GROUND - H * 0.2, W * 0.88, GROUND - H * 0.26);
        ctx.bezierCurveTo(W * 0.94, GROUND - H * 0.2, W, GROUND - H * 0.16, W, GROUND - H * 0.14);
        ctx.lineTo(W, GROUND);
        ctx.closePath();
        ctx.fill();
        
        ctx.globalAlpha = a * 0.95;
        ctx.fillStyle = '#0e0c14';
        ctx.beginPath();
        ctx.moveTo(0, GROUND);
        ctx.lineTo(0, GROUND - H * 0.1);
        ctx.quadraticCurveTo(W * 0.2, GROUND - H * 0.16, W * 0.4, GROUND - H * 0.11);
        ctx.quadraticCurveTo(W * 0.6, GROUND - H * 0.15, W * 0.8, GROUND - H * 0.09);
        ctx.quadraticCurveTo(W * 0.92, GROUND - H * 0.12, W, GROUND - H * 0.08);
        ctx.lineTo(W, GROUND);
        ctx.closePath();
        ctx.fill();
        
        ctx.globalAlpha = a * 0.25;
        const mist = ctx.createLinearGradient(0, GROUND - H * 0.12, 0, GROUND);
        mist.addColorStop(0, 'rgba(26,10,46,0)');
        mist.addColorStop(0.5, 'rgba(40,25,70,0.25)');
        mist.addColorStop(1, 'rgba(10,8,20,0.2)');
        ctx.fillStyle = mist;
        ctx.fillRect(0, GROUND - H * 0.14, W, H * 0.14);
        ctx.globalAlpha = 1;
    }
    
    function drawCloudPuff(cx, cy, rw, rh, rot, r, g, b, op){
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.scale(1, 0.68);
        const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rw);
        gr.addColorStop(0, `rgba(${r},${g},${b},${op})`);
        gr.addColorStop(0.65, `rgba(${r},${g},${b},${op * 0.75})`);
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    function drawClouds(dtMove){
        const sorted = [...clouds].sort((a, b) => a.layer - b.layer);
        sorted.forEach(c => {
            if (dtMove > 0) {
                c.x += c.speed * 60 * dtMove;
                if(c.x > W + c.w * 1.2) c.x = -c.w * 1.5;
            }
            ctx.globalAlpha = ambAlpha * c.alpha;
            if(c.layer === 0){
                drawCloudPuff(c.x, c.y, c.w * 0.48, c.h * 0.52, 0, 55, 52, 82, 0.22);
                drawCloudPuff(c.x - c.w * 0.28, c.y + c.h * 0.06, c.w * 0.34, c.h * 0.42, -0.07, 48, 50, 78, 0.18);
                drawCloudPuff(c.x + c.w * 0.3, c.y + c.h * 0.03, c.w * 0.38, c.h * 0.48, 0.05, 52, 48, 85, 0.2);
            } else {
                drawCloudPuff(c.x, c.y, c.w * 0.42, c.h * 0.48, 0, 72, 68, 108, 0.28);
                drawCloudPuff(c.x - c.w * 0.26, c.y + c.h * 0.1, c.w * 0.3, c.h * 0.4, -0.06, 65, 62, 100, 0.24);
                drawCloudPuff(c.x + c.w * 0.28, c.y + c.h * 0.05, c.w * 0.34, c.h * 0.45, 0.06, 70, 65, 105, 0.26);
                drawCloudPuff(c.x + c.w * 0.04, c.y - c.h * 0.1, c.w * 0.24, c.h * 0.32, 0, 58, 55, 90, 0.2);
            }
        });
        ctx.globalAlpha = 1;
    }
    
    // Bokeh / wisps: same palettes & motion as enter3 (scene 3), scaled by 60*dt for frame-rate independence
    const bokehPalettes = [[200, 245], [275, 320], [330, 360], [170, 210]];
    const FBOKEH = 60;
    const seedBokehOrbs = Array.from({ length: 32 }, () => {
        const [lo, hi] = bokehPalettes[Math.floor(Math.random() * bokehPalettes.length)];
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 80 + 20,
            vx: (Math.random() - 0.5) * 0.28,
            vy: (Math.random() - 0.5) * 0.28,
            hue: lo + Math.random() * (hi - lo),
            a: Math.random() * 0.065 + 0.025
        };
    });
    const seedBokehWisps = Array.from({ length: 18 }, () => ({
        x: Math.random() * W,
        y: H + Math.random() * 100,
        vy: Math.random() * 0.9 + 0.4,
        r: Math.random() * 2.5 + 0.8,
        alpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.5 ? 330 : 55
    }));
    let bokehPhase = 0;
    function updateSeedBokeh(dtMove) {
        if (dtMove <= 0) return;
        bokehPhase += dtMove;
        const k = FBOKEH * dtMove;
        seedBokehOrbs.forEach(o => {
            o.x += o.vx * k;
            o.y += o.vy * k;
            if (o.x < -o.r) o.x = W + o.r;
            if (o.x > W + o.r) o.x = -o.r;
            if (o.y < -o.r) o.y = H + o.r;
            if (o.y > H + o.r) o.y = -o.r;
        });
        seedBokehWisps.forEach(w => {
            w.y -= w.vy * k;
            w.x += Math.sin(bokehPhase * 0.7 + w.phase) * 0.6 * k;
            if (w.y < -10) { w.y = H + 10; w.x = Math.random() * W; }
        });
    }
    function drawSeedBokeh() {
        const fa = ambAlpha * 0.94;
        seedBokehOrbs.forEach(o => {
            ctx.globalAlpha = fa;
            const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
            g.addColorStop(0, `hsla(${o.hue},78%,70%,${o.a})`);
            g.addColorStop(1, `hsla(${o.hue},78%,70%,0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();
        });
        seedBokehWisps.forEach(w => {
            if (w.y > H + 5) return;
            const a = fa * w.alpha * Math.max(0, 1 - (H - w.y) / H);
            ctx.globalAlpha = Math.max(0, a);
            ctx.fillStyle = `hsl(${w.hue},90%,80%)`;
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
            ctx.fill();
            const g2 = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r * 4);
            g2.addColorStop(0, `hsla(${w.hue},90%,80%,${a * 0.45})`);
            g2.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.r * 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function drawAtmo(dtFx, dtAmb){
        ambAlpha = Math.min(ambAlpha + 0.24 * dtAmb, 1);
        const a = ambAlpha;
        // Bầu trời đêm cùng tông body / scene 2 aurora (#06061a → #1a0a2e)
        const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
        sky.addColorStop(0, `rgba(6,6,26,${a})`);
        sky.addColorStop(0.38, `rgba(12,10,35,${a})`);
        sky.addColorStop(0.68, `rgba(22,14,45,${a})`);
        sky.addColorStop(0.88, `rgba(30,18,52,${a * 0.98})`);
        sky.addColorStop(1, `rgba(26,10,46,${a * 0.96})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, GROUND);
        // Vầng sáng nhẹ giống aurora (scene 2) — tím / cyan / hồng rất mờ
        const bands = [
            { x: 0.32, c: [120, 0, 200, 0.1 * a] },
            { x: 0.52, c: [0, 140, 220, 0.08 * a] },
            { x: 0.68, c: [200, 60, 180, 0.07 * a] }
        ];
        bands.forEach(b => {
            const gx = b.x * W;
            const [r, g, bl, al] = b.c;
            const rg = ctx.createRadialGradient(gx, H * 0.38, 0, gx, H * 0.38, W * 0.5);
            rg.addColorStop(0, `rgba(${r},${g},${bl},${al})`);
            rg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rg;
            ctx.fillRect(0, 0, W, GROUND);
        });
        drawNightStars();
        drawClouds(dtFx);
        drawSeedBokeh();
        drawMountains();
        const grass = ctx.createLinearGradient(0, GROUND - 4, 0, H);
        grass.addColorStop(0, `rgba(18,22,28,${a})`);
        grass.addColorStop(0.2, `rgba(10,12,18,${a})`);
        grass.addColorStop(1, `rgba(4,4,8,${a})`);
        ctx.fillStyle = grass;
        ctx.fillRect(0, GROUND - 4, W, H - GROUND + 4);
        ctx.strokeStyle = `rgba(60,70,95,${a * 0.25})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, GROUND - 0.5);
        ctx.quadraticCurveTo(W * 0.5, GROUND - 2, W, GROUND - 0.5);
        ctx.stroke();
    }

    const flLights=[];
    function spawnLight(x,y){flLights.push({x,y,vy:-(Math.random()*.7+.3),vx:(Math.random()-.5)*.4,r:Math.random()*2.5+1,life:1,decay:.005+Math.random()*.008,col:Math.random()>.5?'#fffb00':'#23f0ff',ph:Math.random()*Math.PI*2});}
    function updateLights(dt){for(let i=flLights.length-1;i>=0;i--){const l=flLights[i];l.y+=l.vy;l.x+=l.vx+Math.sin(elapsed*2+l.ph)*.28;l.life-=l.decay;if(l.life<=0)flLights.splice(i,1);}}
    function drawLights(){flLights.forEach(l=>{ctx.globalAlpha=Math.max(l.life,0)*.8;ctx.fillStyle=l.col;ctx.shadowColor=l.col;ctx.shadowBlur=4;ctx.beginPath();ctx.arc(l.x,l.y,l.r,0,Math.PI*2);ctx.fill();});ctx.shadowBlur=0;ctx.globalAlpha=1;}

    // ============ THE SEED ============
    const SR=24;
    const seed={x:CX+(Math.random()-.5)*30,y:-85,vx:(Math.random()-.5)*0.8,vy:0,rot:.2,rspd:.038,sx:1,sy:1,alpha:0,state:'fall',bounces:0};
    let impacts=[];

    function drawOneSeed(){const s=seed;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);ctx.scale(s.sx,s.sy);ctx.globalAlpha=s.alpha;const halo=ctx.createRadialGradient(0,0,SR*.4,0,0,SR*5);halo.addColorStop(0,'rgba(255,150,40,0.55)');halo.addColorStop(.5,'rgba(210,95,18,0.18)');halo.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,SR*5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3b1804';ctx.beginPath();ctx.moveTo(0,SR*.88);ctx.bezierCurveTo(SR*.63,SR*.42,SR*.7,-SR*.44,0,-SR*1.38);ctx.bezierCurveTo(-SR*.7,-SR*.44,-SR*.63,SR*.42,0,SR*.88);ctx.fill();const ig=ctx.createLinearGradient(-SR*.28,-SR,SR*.28,SR);ig.addColorStop(0,'#b24e14');ig.addColorStop(.45,'#7a3010');ig.addColorStop(1,'#280c02');ctx.fillStyle=ig;ctx.beginPath();ctx.moveTo(0,SR*.65);ctx.bezierCurveTo(SR*.44,SR*.26,SR*.52,-SR*.28,0,-SR*1.1);ctx.bezierCurveTo(-SR*.52,-SR*.28,-SR*.44,SR*.26,0,SR*.65);ctx.fill();ctx.fillStyle='rgba(255,185,95,0.32)';ctx.beginPath();ctx.ellipse(-SR*.17,-SR*.22,SR*.12,SR*.48,-.25,0,Math.PI*2);ctx.fill();ctx.restore();}

    function addImpact(x,y){impacts.push({type:'ring',x,y,r:0,maxR:SR*3.8,life:1,decay:.034});for(let i=0;i<12;i++){const a=Math.random()*Math.PI*2,spd=Math.random()*3.5+1;impacts.push({type:'p',x,y,vx:Math.cos(a)*spd,vy:-(Math.random()*3.5+.5),r:Math.random()*3+1.5,color:`hsl(${15+Math.random()*20},58%,${22+Math.random()*20}%)`,life:1,decay:.044+Math.random()*.03});}}
    function drawImpacts(dt){for(let i=impacts.length-1;i>=0;i--){const p=impacts[i];p.life-=p.decay;if(p.life<=0){impacts.splice(i,1);continue;}if(p.type==='ring'){p.r=Math.min(p.r+p.maxR*.09,p.maxR);ctx.globalAlpha=p.life*.25;ctx.strokeStyle='rgba(125,62,16,0.5)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.stroke();}else{p.x+=p.vx;p.y+=p.vy;p.vy+=20*dt;ctx.globalAlpha=p.life*.85;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}}

    // ============ L-SYSTEM TREE (Lindenmayer) ============
    let growAge=0, growPhase='wait';
    const maxTrunkH=Math.min(H*.72,480);
    const lSegs=[];
    let lSegsDrawOrder = null;
    let treeMaxDepth = 0;
    const sPetals=[];
    const fallingLeaves=[];
    let forestList=[], forestGoing=false, bloomGlow=0, textShown=false, lightTick=0, sPetalTick=0;
    let sinceAllBranchesComplete = 0;
    let sinceBloomUnlocked = 0;

    // L-System rules for cherry blossom (stochastic)
    // F=draw, +=turn right, -=turn left, [=push, ]=pop, L=leaf, B=blossom
    // Procedural cherry tree — NOT L-system string rewriting (too unpredictable)
    // Instead: explicit recursive branching with controlled geometry
    function buildTree(ox, oy) {
        lSegs.length = 0;
        lSegsDrawOrder = null;
        const tH = maxTrunkH * (0.36 + Math.random() * 0.05);
        const trunkTop = { x: ox, y: oy - tH };

        // Trunk segments (thicker, more prominent)
        const nTrunk = 4;
        let px = ox, py = oy;
        for (let i = 0; i < nTrunk; i++) {
            const t = (i + 1) / nTrunk;
            const nx = lerp(ox, trunkTop.x, t) + (Math.random() - 0.5) * 3;
            const ny = lerp(oy, trunkTop.y, t);
            const curv = (Math.random() - 0.5) * 6;
            lSegs.push({
                x1: px, y1: py, x2: nx, y2: ny,
                cx: (px + nx) / 2 + curv, cy: (py + ny) / 2,
                w: lerp(38, 22, t), depth: 0, order: lSegs.length,
                prog: 0, bprog: 0, isLeaf: false, leaves: [], cluster: null
            });
            px = nx; py = ny;
        }

        // Main branches from trunk top — spread WIDE
        const mainCount = 3 + Math.floor(Math.random() * 3); // 4–6 main branches
        const mainAngles = [];
        const span = mainCount > 1 ? 120 / (mainCount - 1) : 0;
        for (let i = 0; i < mainCount; i++) {
            mainAngles.push(-60 + span * i + (Math.random() - 0.5) * 14);
        }

        function addBranch(sx, sy, angleDeg, len, w, depth, maxDepth) {
            if (depth > maxDepth || len < 5 || w < 0.5) return;

            const a = angleDeg * Math.PI / 180;
            const nx = sx + Math.sin(a) * len;
            const ny = sy - Math.cos(a) * len;
            const clamped = ny;
            const curv = (Math.random() - 0.5) * len * (0.26 + Math.random() * 0.22);
            const pa = a + Math.PI / 2;
            const cx = (sx + nx) / 2 + Math.cos(pa) * curv;
            const cy = (sy + clamped) / 2 + Math.sin(pa) * curv;

            const isTerminal = depth >= maxDepth - 1;
            const seg = {
                x1: sx, y1: sy, x2: nx, y2: clamped, cx, cy,
                w: Math.max(0.7, w), depth, order: lSegs.length,
                prog: 0, bprog: 0,
                isLeaf: isTerminal, leaves: [], cluster: null
            };

            if (!isTerminal && depth >= 1) {
                const nLeaves = Math.random() < 0.4 ? 0
                    : Math.random() < 0.72 ? 1 : 2;
                for (let j = 0; j < nLeaves; j++) {
                    const side = j % 2 === 0 ? 1 : -1;
                    seg.leaves.push({
                        t: 0.22 + j * 0.26 + Math.random() * 0.12,
                        side: side,
                        angleOffset: (Math.random() * 0.2 + 0.1) * side,
                        w: 5 + Math.random() * 3, h: 9 + Math.random() * 5,
                        prog: 0, life: 1, fallen: false,
                        fadeWhenChildGrows: true
                    });
                }
            }
            if (isTerminal) {
                const nLeaves = 1 + Math.floor(Math.pow(Math.random(), 1.35) * 3);
                for (let j = 0; j < nLeaves; j++) {
                    const side = j % 2 === 0 ? 1 : -1;
                    seg.leaves.push({
                        t: 0.18 + j * 0.24 + Math.random() * 0.1,
                        side: side,
                        angleOffset: (Math.random() * 0.15 + 0.1) * side,
                        w: 4 + Math.random() * 3, h: 8 + Math.random() * 4,
                        prog: 0, life: 1, fallen: false,
                        fadeWhenChildGrows: false
                    });
                }
            }

            const blossomCols = ['#ffb7c5', '#ff9aad', '#ffe4e8', '#ffd6e0', '#ffccd5'];
            function scatterBlossoms(n, tMin, tMax, spread, sizeMin, sizeMax) {
                const span = (tMax - tMin) / Math.max(n, 1);
                return Array.from({ length: n }, (_, i) => {
                    const along = Math.min(tMax, tMin + span * i + Math.random() * span * 0.72);
                    const fi = i / Math.max(n - 1, 1);
                    return {
                        along,
                        dx: (Math.random() - 0.5) * (spread + fi * 4),
                        dy: (Math.random() - 0.5) * (spread + fi * 4) - fi * 1.1,
                        sz: sizeMin + Math.random() * (sizeMax - sizeMin),
                        rot: Math.random() * Math.PI * 2,
                        col: blossomCols[Math.floor(Math.random() * blossomCols.length)]
                    };
                });
            }
            if (isTerminal) {
                const n = 2 + Math.floor(Math.pow(Math.random(), 1.2) * 4);
                seg.cluster = scatterBlossoms(n, 0.34, 0.98, 12 + Math.random() * 6, 4.3, 11.5);
            } else if (depth >= 2 && len >= 5 && Math.random() < 0.3) {
                const n = 1 + Math.floor(Math.pow(Math.random(), 1.15) * 3);
                seg.cluster = scatterBlossoms(n, 0.2, 0.93, 7 + Math.random() * 6, 2.9, 7.5);
            }

            const segIndex = lSegs.length;
            lSegs.push(seg);

            if (!isTerminal) {
                seg.childIndices = [];
                const outer = depth >= 2;
                let nChildren = 2 + Math.floor(Math.random() * 4);
                const cap = 6;
                const maxByLen = Math.max(
                    1,
                    Math.min(cap, Math.floor((len - (outer ? 2 : 3)) / (outer ? 4.9 : 5.8)))
                );
                nChildren = Math.min(nChildren, maxByLen);
                const spreadBase = 24 + depth * 5 + Math.random() * 12;
                const spread = Math.max(12, spreadBase * (1.06 - nChildren * 0.06));
                for (let k = 0; k < nChildren; k++) {
                    let childAngle = angleDeg + (k - (nChildren - 1) / 2) * spread + (Math.random() - 0.5) * 14;
                    if (nChildren === 1) childAngle += (Math.random() - 0.5) * 18;
                    const lenScale = outer
                        ? 0.30 + Math.pow(Math.random(), 0.88) * 0.62
                        : 0.34 + Math.pow(Math.random(), 0.85) * 0.58;
                    let childLen = len * lenScale;
                    if (Math.random() < 0.14) childLen *= 1.1 + Math.random() * 0.28;
                    childLen = Math.max(7, childLen);
                    const childW = Math.max(0.55, w * (0.36 + lenScale * 0.26 + (Math.random() - 0.5) * 0.08));
                    seg.childIndices.push(lSegs.length);
                    addBranch(nx, clamped, childAngle, childLen, childW, depth + 1, maxDepth);
                }
            }
        }

        mainAngles.forEach(ang => {
            const armLen = maxTrunkH * (0.19 + Math.pow(Math.random(), 0.78) * 0.16);
            addBranch(trunkTop.x, trunkTop.y, ang, armLen, 9 + Math.random() * 4, 1, 6);
        });

        const maxD = Math.max(...lSegs.map(s => s.depth));
        treeMaxDepth = maxD;
        lSegs.forEach(seg => {
            seg.delay = seg.depth * 2.5 + Math.random() * 0.8;
            seg.speed = 0.35 + Math.random() * 0.2;
        });
        lSegsDrawOrder = [...lSegs].sort((a, b) => b.w - a.w);
    }

    function startLTree() {
        buildTree(seed.x, GROUND);
        growPhase = 'branch';
    }

    function drawLeaf(x,y,w,h,angle,prog,alpha,life=1){
        if(prog<=0||alpha<=0)return;
        ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(prog,prog);
        ctx.globalAlpha=alpha*prog;
        
        const stemLen = h * 0.4;
        const leafH = h * 0.75;
        const leafW = w;
        
        // Colors based on life
        let stemCol, leafLight, leafMid, leafDark, veinCol;
        if(life > 0.7){
            stemCol = '#5a7a45';
            leafDark = '#2e7d32'; leafMid = '#4caf50'; leafLight = '#81c784';
            veinCol = 'rgba(30,70,30,.5)';
        } else if(life > 0.4){
            const t = (0.7 - life) / 0.3;
            stemCol = lerpColor('#5a7a45', '#8b7355', t);
            leafDark = lerpColor('#2e7d32', '#c9a227', t);
            leafMid = lerpColor('#4caf50', '#dbc247', t);
            leafLight = lerpColor('#81c784', '#f0dc82', t);
            veinCol = `rgba(${Math.round(lerp(30,140,t))},${Math.round(lerp(70,110,t))},${Math.round(lerp(30,30,t))},.5)`;
        } else {
            const t = (0.4 - life) / 0.4;
            stemCol = lerpColor('#8b7355', '#6b4423', t);
            leafDark = lerpColor('#c9a227', '#c0392b', t);
            leafMid = lerpColor('#dbc247', '#e74c3c', t);
            leafLight = lerpColor('#f0dc82', '#f1948a', t);
            veinCol = `rgba(${Math.round(lerp(140,100,t))},${Math.round(lerp(110,50,t))},30,.5)`;
        }
        
        // Stem (cuống lá)
        ctx.strokeStyle = stemCol;
        ctx.lineWidth = Math.max(1, w * 0.12);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, stemLen);
        ctx.quadraticCurveTo(w * 0.05, stemLen * 0.4, 0, -leafH * 0.1);
        ctx.stroke();
        
        // Leaf blade (phiến lá)
        const g = ctx.createRadialGradient(0, -leafH * 0.3, 0, 0, -leafH * 0.3, leafH * 0.8);
        g.addColorStop(0, leafLight);
        g.addColorStop(0.5, leafMid);
        g.addColorStop(1, leafDark);
        ctx.fillStyle = g;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        // Right side
        ctx.bezierCurveTo(leafW * 0.5, -leafH * 0.1, leafW * 0.55, -leafH * 0.4, leafW * 0.35, -leafH * 0.65);
        ctx.bezierCurveTo(leafW * 0.2, -leafH * 0.85, leafW * 0.05, -leafH * 0.95, 0, -leafH);
        // Left side
        ctx.bezierCurveTo(-leafW * 0.05, -leafH * 0.95, -leafW * 0.2, -leafH * 0.85, -leafW * 0.35, -leafH * 0.65);
        ctx.bezierCurveTo(-leafW * 0.55, -leafH * 0.4, -leafW * 0.5, -leafH * 0.1, 0, 0);
        ctx.closePath();
        ctx.fill();
        
        // Main vein (gân chính)
        ctx.strokeStyle = veinCol;
        ctx.lineWidth = Math.max(0.6, w * 0.08);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(0, -leafH * 0.5, 0, -leafH * 0.92);
        ctx.stroke();
        
        // Side veins (gân phụ)
        ctx.lineWidth = Math.max(0.4, w * 0.04);
        ctx.globalAlpha = alpha * prog * 0.6;
        for(let i = 0; i < 2; i++){
            const vy = -leafH * (0.2 + i * 0.28);
            const vw = leafW * (0.35 - i * 0.06);
            ctx.beginPath();
            ctx.moveTo(0, vy);
            ctx.quadraticCurveTo(vw * 0.6, vy - leafH * 0.08, vw, vy - leafH * 0.03);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, vy);
            ctx.quadraticCurveTo(-vw * 0.6, vy - leafH * 0.08, -vw, vy - leafH * 0.03);
            ctx.stroke();
        }
        
        // Highlight
        ctx.globalAlpha = alpha * prog * 0.25;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-leafW * 0.15, -leafH * 0.45, leafW * 0.12, leafH * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    function lerpColor(c1,c2,t){
        const h2d=s=>parseInt(s,16);
        const r1=h2d(c1.slice(1,3)),g1=h2d(c1.slice(3,5)),b1=h2d(c1.slice(5,7));
        const r2=h2d(c2.slice(1,3)),g2=h2d(c2.slice(3,5)),b2=h2d(c2.slice(5,7));
        const r=Math.round(lerp(r1,r2,t)),g=Math.round(lerp(g1,g2,t)),b=Math.round(lerp(b1,b2,t));
        return `rgb(${r},${g},${b})`;
    }
    
    // Falling leaves system - realistic tumbling motion
    const MAX_FALLING_LEAVES = 32;
    function spawnFallingLeaf(x, y, w, h, life) {
        if (fallingLeaves.length >= MAX_FALLING_LEAVES) return;
        if (Math.random() > 0.48) return;
        fallingLeaves.push({
            x, y, w: w * (0.9 + Math.random() * 0.3), h: h * (0.9 + Math.random() * 0.3),
            life: life + Math.random() * 0.2,
            vx: (Math.random() - 0.3) * 0.5,
            vy: Math.random() * 0.3 + 0.2,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.04,
            tumblePhase: Math.random() * Math.PI * 2,
            tumbleSpeed: Math.random() * 2 + 1.5,
            swayAmp: Math.random() * 1.5 + 1,
            swayFreq: Math.random() * 0.8 + 0.6,
            scaleX: 1,
            flutter: Math.random() * 0.5 + 0.3
        });
    }
    function updateFallingLeaves(dt) {
        if (dt <= 0) return;
        for (let i = fallingLeaves.length - 1; i >= 0; i--) {
            const l = fallingLeaves[i];
            l.tumblePhase += l.tumbleSpeed * dt;
            const sway = Math.sin(elapsed * l.swayFreq + l.tumblePhase) * l.swayAmp;
            l.vx *= 0.98;
            l.x += l.vx + sway * dt * 2;
            l.vy = Math.min(l.vy + dt * 10, 2.2);
            l.y += l.vy + Math.abs(Math.sin(l.tumblePhase)) * l.flutter;
            l.rot += l.rotSpeed + Math.cos(l.tumblePhase) * 0.03;
            // Scale X for 3D tumbling effect
            l.scaleX = 0.3 + Math.abs(Math.cos(l.tumblePhase * 0.7)) * 0.7;
            // Fade out
            l.life -= dt * 0.11;
            if (l.y > H + 30 || l.life <= 0 || l.x < -50 || l.x > W + 50) fallingLeaves.splice(i, 1);
        }
    }
    function drawFallingLeaves() {
        fallingLeaves.forEach(l => {
            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.rotate(l.rot);
            ctx.scale(l.scaleX, 1);
            ctx.translate(-l.x, -l.y);
            const alpha = Math.max(0, l.life) * 0.85;
            drawLeaf(l.x, l.y, l.w, l.h, 0, 1, alpha, Math.min(l.life + 0.1, 0.35));
            ctx.restore();
        });
    }

    function blossom(x,y,sz,prog,col,rot){
        if(prog<=0)return;
        ctx.save();ctx.translate(x,y);ctx.rotate(rot);
        
        const inner=col==='#ff9aad'?'#ff6b8f':'#ffaec0';
        const outer=col==='#ff9aad'?'#ffd6e0':'#fff5f8';

        const wDot = (1 - smoothstep(0.1, 0.26, prog)) * Math.min(1, prog / 0.07);
        const wBud = smoothstep(0.06, 0.22, prog) * (1 - smoothstep(0.28, 0.5, prog));
        const wBloom = smoothstep(0.3, 0.48, prog);

        if (wDot > 0.008) {
            ctx.globalAlpha = wDot * 0.9;
            ctx.fillStyle = '#4a7c30';
            ctx.beginPath();
            ctx.arc(0, 0, sz * 0.15 * Math.min(1, prog / 0.12 + 0.02), 0, Math.PI * 2);
            ctx.fill();
        }

        if (wBud > 0.008) {
            const budProg = Math.max(0, Math.min(1, (prog - 0.1) / 0.32));
            ctx.globalAlpha = wBud * 0.9;
            ctx.fillStyle = `rgb(${Math.round(74 + (200-74)*budProg)},${Math.round(124 + (140-124)*budProg)},${Math.round(48 + (180-48)*budProg)})`;
            const budH = sz * (0.3 + budProg * 0.4);
            const budW = sz * (0.15 + budProg * 0.2);
            ctx.beginPath();
            ctx.moveTo(0, budH * 0.3);
            ctx.bezierCurveTo(budW, budH * 0.2, budW * 1.1, -budH * 0.3, 0, -budH * 0.7);
            ctx.bezierCurveTo(-budW * 1.1, -budH * 0.3, -budW, budH * 0.2, 0, budH * 0.3);
            ctx.fill();
            if (budProg > 0.45) {
                ctx.globalAlpha = wBud * (budProg - 0.45) * 1.35;
                ctx.fillStyle = col;
                ctx.beginPath();
                ctx.arc(0, -budH * 0.4, budW * 0.55 * Math.min(1, (budProg - 0.45) * 2.2), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (wBloom > 0.008) {
            const bloomProg = Math.max(0, Math.min(1, (prog - 0.34) / 0.66));
            const petalOpen = Math.min(bloomProg * 1.45, 1);
            const nPetals = sz < 4.2 ? 4 : 5;
            const petalStep = (Math.PI * 2) / nPetals;
            for(let i=0;i<nPetals;i++){
                ctx.save();
                ctx.rotate(i * petalStep);
                const petalScale = 0.28 + petalOpen * 0.72;
                ctx.scale(petalScale, petalScale);
                ctx.globalAlpha = wBloom * (0.5 + petalOpen * 0.5) * 0.9;
                const pg=ctx.createLinearGradient(0,0,0,sz*1.05);
                pg.addColorStop(0,inner);pg.addColorStop(.45,col);pg.addColorStop(1,outer);
                ctx.fillStyle=pg;
                ctx.beginPath();ctx.moveTo(0,0);
                ctx.bezierCurveTo(sz*.52,sz*.1,sz*.62,sz*.62,sz*.32,sz*.86);
                ctx.bezierCurveTo(sz*.18,sz*.96,sz*.06,sz*1.04,0,sz*.96);
                ctx.bezierCurveTo(-sz*.06,sz*1.04,-sz*.18,sz*.96,-sz*.32,sz*.86);
                ctx.bezierCurveTo(-sz*.62,sz*.62,-sz*.52,sz*.1,0,0);
                ctx.closePath();ctx.fill();
                ctx.restore();
            }
            if (bloomProg > 0.22) {
                ctx.globalAlpha = wBloom * Math.min(1, (bloomProg - 0.22) / 0.78);
                ctx.fillStyle='rgba(255,235,80,.9)';
                ctx.beginPath();
                ctx.arc(0, 0, sz * 0.2 * Math.min(1, bloomProg), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.shadowBlur=0;
        ctx.restore();
    }

    // Draw L-system segments (all in one function — trunk + branches unified)
    function drawLTree() {
        if (lSegs.length === 0 || !lSegsDrawOrder) return;
        const sorted = lSegsDrawOrder;
        const maxD = treeMaxDepth;

        sorted.forEach(seg => {
            if (seg.prog <= 0) return;
            const t = seg.prog;

            // Không lay theo gió — đường cong cố định
            const q0x = seg.x1 + (seg.cx - seg.x1) * t;
            const q0y = seg.y1 + (seg.cy - seg.y1) * t;
            const q1x = seg.cx + (seg.x2 - seg.cx) * t;
            const q1y = seg.cy + (seg.y2 - seg.cy) * t;
            const ex = q0x + (q1x - q0x) * t;
            const ey = q0y + (q1y - q0y) * t;

            // Maturity: young green sapling → mature brown tree
            const maturity = Math.min(growAge / 10, 1);
            const depthRatio = seg.depth / Math.max(maxD, 1);
            // Trunk (depth 0) matures faster, branches stay greener longer
            const segMaturity = Math.min(1, maturity * (1.5 - depthRatio * 0.8));
            
            // Young: bright green | Mature: rich brown
            const youngR = 45, youngG = 140, youngB = 80;   // fresh green
            const matureR = 75, matureG = 45, matureB = 25;  // brown
            const r = Math.round(lerp(youngR, matureR, segMaturity));
            const g = Math.round(lerp(youngG, matureG, segMaturity));
            const b = Math.round(lerp(youngB, matureB, segMaturity));

            // Taper width from base to tip
            const tipW = Math.max(0.6, seg.w * 0.65);
            const lineW = seg.w + (tipW - seg.w) * t;
            ctx.lineWidth = lineW;
            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.quadraticCurveTo(q0x, q0y, ex, ey);
            ctx.stroke();

            if (seg.depth <= 1 && lineW > 10 && segMaturity > 0.52) {
                const barkAlpha = (segMaturity - 0.52) * 0.55;
                ctx.strokeStyle = `rgba(30,18,10,${barkAlpha})`;
                ctx.lineWidth = 1;
                const nLines = Math.min(2, Math.floor(lineW / 8));
                for (let i = 0; i < nLines; i++) {
                    const offset = (i - (nLines - 1) / 2) * (lineW * 0.35 / nLines);
                    const angle = Math.atan2(ey - seg.y1, ex - seg.x1);
                    const perpX = Math.sin(angle) * offset;
                    const perpY = -Math.cos(angle) * offset;
                    ctx.beginPath();
                    ctx.moveTo(seg.x1 + perpX, seg.y1 + perpY);
                    ctx.quadraticCurveTo(q0x + perpX, q0y + perpY, ex + perpX * 0.6, ey + perpY * 0.6);
                    ctx.stroke();
                }
            }

            if (seg.cluster && seg.bprog > 0) {
                seg.cluster.forEach(bl => {
                    const u = bl.along != null ? bl.along : 1;
                    if (seg.prog < u) return;
                    const bp = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, u);
                    blossom(bp.x + bl.dx, bp.y + bl.dy, bl.sz, seg.bprog, bl.col, bl.rot);
                });
            }

            seg.leaves.forEach(l => {
                if (l.fallen) return;
                if (seg.prog < 0.88) return;
                l.prog = Math.min(l.prog + 0.045, 1);
                let childGrowing = false;
                if (l.fadeWhenChildGrows && seg.childIndices) {
                    for (const ci of seg.childIndices) {
                        if (lSegs[ci] && lSegs[ci].prog > 0.72) {
                            childGrowing = true;
                            break;
                        }
                    }
                }
                if (childGrowing && l.prog > 0.35) {
                    l.life -= 0.009;
                    if (l.life <= 0) {
                        l.fallen = true;
                        const lp0 = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, l.t);
                        spawnFallingLeaf(lp0.x, lp0.y, l.w, l.h, l.life + 0.3);
                        return;
                    }
                }
                const lp = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, l.t);
                const dt = 0.01;
                const lp1 = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, Math.max(0, l.t - dt));
                const lp2 = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, Math.min(1, l.t + dt));
                const branchAngle = Math.atan2(lp2.y - lp1.y, lp2.x - lp1.x);
                const leafAngle = branchAngle + (Math.PI / 2) * l.side + l.angleOffset;
                const alpha = l.life * 0.92;
                const lw = l.w *1.25, lh = l.h * 1.25;
                drawLeaf(lp.x, lp.y, lw, lh, leafAngle, l.prog, alpha, l.life);
            });
        });

        let bloomAcc = 0, bloomN = 0;
        for (let i = 0, n = lSegs.length; i < n; i++) {
            const s = lSegs[i];
            if (s.cluster) { bloomAcc += s.bprog; bloomN++; }
        }
        bloomGlow = bloomN ? bloomAcc / bloomN : 0;
    }

    function drawBloomGlow(){if(bloomGlow<=0)return;const gy=GROUND-maxTrunkH*.5;
        const g1=ctx.createRadialGradient(CX,gy,0,CX,gy,maxTrunkH);
        g1.addColorStop(0,`rgba(255,155,185,${bloomGlow*.14})`);g1.addColorStop(.5,`rgba(255,95,145,${bloomGlow*.06})`);g1.addColorStop(1,'rgba(255,95,145,0)');
        ctx.fillStyle=g1;ctx.fillRect(0,0,W,H);}

    // Forest (background cherry trees - smaller, faded based on distance)
    function startForest(){
        // sc = scale (smaller = farther), alpha controls fade
        [{x:CX-W*.38,sc:.35,fade:.48},{x:CX+W*.36,sc:.35,fade:.48},
         {x:CX-W*.28,sc:.45,fade:.58},{x:CX+W*.26,sc:.45,fade:.58},
         {x:CX-W*.18,sc:.55,fade:.68},{x:CX+W*.17,sc:.55,fade:.68}].forEach((sp,si)=>{
            const ft={del:si*.4,branches:[],maxAlpha:sp.fade,alpha:0,scale:sp.sc};
            const h2=H*.5*sp.sc;
            (function af(x1,y1,ang,len,w,dep){if(dep<0||len<4)return;
                const x2=x1+Math.sin(ang)*len,y2=y1-Math.cos(ang)*len,cr2=(len*.1)*(Math.random()>.5?1:-1),pa2=ang+Math.PI*.5;
                ft.branches.push({x1,y1,x2,y2,cx:(x1+x2)*.5+Math.cos(pa2)*cr2,cy:(y1+y2)*.5+Math.sin(pa2)*cr2,w,dep,prog:0,speed:1.5,bprog:0,isLeaf:dep===0,
                    cluster:dep===0?Array.from({length:1+Math.floor(Math.pow(Math.random(),1.2)*2)},()=>({
                        dx:(Math.random()-.5)*8*sp.sc,
                        dy:(Math.random()-.5)*8*sp.sc,
                        sz:(2.5+Math.random()*2.5)*sp.sc,
                        rot:Math.random()*Math.PI*2,
                        col:Math.random()>.35?'#ffb7c5':'#ffe4e8'
                    })):null});
                if(dep>0){const s2=.5+Math.random()*.2,cl2=len*(.6+Math.random()*.1);af(x2,y2,ang-s2,cl2,w*.6,dep-1);af(x2,y2,ang+s2,cl2,w*.6,dep-1);}
            })(sp.x,GROUND,0,h2*.35,6*sp.sc,2);forestList.push(ft);});
        forestList.sort((a,b) => a.scale - b.scale);
        forestGoing=true;
    }
    function drawForest(){
        forestList.forEach(ft=>{
            if(ft.alpha<=0)return;
            ctx.save();
            ctx.globalAlpha=ft.alpha;
            ft.branches.forEach(b=>{if(b.prog<=0)return;const t=b.prog;
                const q0=b.x1+(b.cx-b.x1)*t,q1=b.y1+(b.cy-b.y1)*t,q2=b.cx+(b.x2-b.cx)*t,q3=b.cy+(b.y2-b.cy)*t;
                const ex=q0+(q2-q0)*t,ey=q1+(q3-q1)*t;
                const sat = 22 + ft.scale * 14;
                const light = 46 + (3-b.dep)*9 + (1-ft.scale)*14;
                ctx.strokeStyle=`hsl(285,${sat}%,${Math.min(light,62)}%)`;
                ctx.lineWidth=Math.max(0.8,b.w);ctx.lineCap='round';
                ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.quadraticCurveTo(q0,q1,ex,ey);ctx.stroke();
                if(b.isLeaf&&b.bprog>0&&b.cluster){
                    b.cluster.forEach(bl=>{
                        ctx.save();
                        ctx.globalAlpha=ft.alpha*b.bprog*(0.75+ft.scale*0.35);
                        blossom(ex+bl.dx,ey+bl.dy,bl.sz,b.bprog,bl.col,bl.rot);
                        ctx.restore();
                    });
                }
            });
            ctx.restore();
        });
    }

    // Falling petals
    function updateFP(dt){
        if (bloomGlow > 0.18) {
            sPetalTick += dt;
            if (sPetalTick > 0.12) {
                const nAdd = lSegs.length > 130 ? 2 : 3;
                const canopyY = GROUND - maxTrunkH * 0.4;
                for (let i = 0; i < nAdd; i++) {
                    const nearTree = CX + (Math.random() - 0.5) * W * 0.32;
                    sPetals.push({
                        x: nearTree + (Math.random() - 0.5) * 24,
                        y: canopyY + Math.random() * 55,
                        vx: (Math.random() - 0.5) * 0.42,
                        vy: Math.random() * 0.52 + 0.38,
                        rot: Math.random() * Math.PI * 2,
                        rs: (Math.random() - 0.5) * 0.035,
                        sz: Math.random() * 5 + 3.2,
                        alpha: Math.random() * 0.38 + 0.32,
                        col: Math.random() > 0.45 ? '#ffb7c5' : '#ffe4e8'
                    });
                }
                sPetalTick = 0;
            }
        }
        for (let i = sPetals.length - 1; i >= 0; i--) {
            const p = sPetals[i];
            p.x += p.vx + Math.sin(elapsed * 0.55 + p.rot) * 0.18;
            p.y += p.vy;
            p.rot += p.rs;
            if (p.y > H + 20) sPetals.splice(i, 1);
        }
        if (sPetals.length > 155) sPetals.splice(0, sPetals.length - 155);
    }
    function drawFP(){sPetals.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=p.alpha;ctx.fillStyle=p.col;ctx.beginPath();ctx.moveTo(0,p.sz*.5);ctx.bezierCurveTo(p.sz*.5,p.sz*.2,p.sz*.55,-p.sz*.15,0,-p.sz*.5);ctx.bezierCurveTo(-p.sz*.55,-p.sz*.15,-p.sz*.5,p.sz*.2,0,p.sz*.5);ctx.fill();ctx.restore();});ctx.globalAlpha=1;}

    // ============ MAIN LOOP ============
    function loop(ts){
        if(!running)return;
        if (isExperiencePaused()) {
            lastTs = ts;
            requestAnimationFrame(loop);
            return;
        }
        const dtRaw = Math.min((ts - lastTs) / 1000, 0.05);
        lastTs = ts;
        const allBranchesComplete = lSegs.length > 0 && lSegs.every(s => s.prog >= 1);
        if (allBranchesComplete) sinceAllBranchesComplete += dtRaw;
        else sinceAllBranchesComplete = 0;
        const LEAF_SETTLE_SEC = 0.85;
        const bloomUnlocked = allBranchesComplete && sinceAllBranchesComplete >= LEAF_SETTLE_SEC;
        if (bloomUnlocked) sinceBloomUnlocked += dtRaw;
        else sinceBloomUnlocked = 0;
        const dt = dtRaw;
        elapsed += dtRaw;
        starTw += dt * 0.92;
        updateSeedBokeh(dt);
        ctx.clearRect(0,0,W,H);drawAtmo(dt, dtRaw);

        // Seed physics
        if(seed.state==='fall'||seed.state==='bounce'){
            seed.alpha=Math.min(seed.alpha+dt*2.6,1);seed.vy+=960*dt;seed.y+=seed.vy*dt;seed.x+=seed.vx;seed.rot+=seed.rspd;
            if(seed.y>=GROUND){seed.y=GROUND;addImpact(seed.x,GROUND);seed.vy*=-.43;seed.bounces++;
                seed.rspd*=.52;seed.sy=.52+.1*seed.bounces;seed.sx=1.65-.15*seed.bounces;seed.state='bounce';
                if(Math.abs(seed.vy)<22||seed.bounces>=5){seed.state='settled';seed.vy=0;seed.vx=0;seed.rspd=0;growPhase='grow';}
            }
        }else if(seed.state==='settled'){seed.sy+=(1-seed.sy)*.11;seed.sx+=(1-seed.sx)*.11;}
        if(seed.state==='bounce'&&seed.y<GROUND){seed.sy+=(1-seed.sy)*.22;seed.sx+=(1-seed.sx)*.22;}

        // Continuous growth using L-system
        if (growPhase === 'grow') {
            growAge += dt;
            seed.alpha = Math.max(seed.alpha - dt * 0.12, 0);
            if (growAge > 1.2) startLTree();
        }
        if (growPhase === 'branch') {
            growAge += dt;
            seed.alpha = Math.max(seed.alpha - dt * 0.06, 0);

            // Animate segments progressively; hoa chỉ sau khi mọi cành xong + chờ lá (sinceAllBranchesComplete)
            lSegs.forEach(seg => {
                if (seg.delay > 0) { seg.delay -= dt; return; }
                if (seg.prog < 1) {
                    seg.prog = Math.min(seg.prog + seg.speed * dt, 1);
                    if (seg.prog > 0.998) seg.prog = 1;
                }
                if (seg.cluster && bloomUnlocked) seg.bprog = Math.min(seg.bprog + 0.14 * dt, 1);
            });

            if (lSegs.some(s => s.cluster && s.bprog > 0) && !forestGoing) startForest();
            const showSeedPoem = !textShown && elapsed > 26;
            if (showSeedPoem) {
                textShown = true;
                document.querySelectorAll('#scene-4 .seed-line, #scene-4 .seed-sub').forEach(el => {
                    el.style.opacity = '';
                    el.style.transform = '';
                    el.style.filter = '';
                });
                anime.timeline({ easing: 'easeOutExpo' })
                    .add({
                        targets: '#scene-4 .seed-line',
                        opacity: [0, 1],
                        translateY: [20, 0],
                        filter: ['blur(10px)', 'blur(0px)'],
                        duration: 1300
                    })
                    .add({
                        targets: '#scene-4 .seed-sub',
                        opacity: [0, 1],
                        translateY: [14, 0],
                        duration: 900
                    }, '-=400');
            }
            lightTick += dt;
            const lightIv = lSegs.length > 130 ? 0.22 : 0.14;
            if (lightTick > lightIv) {
                lightTick = 0;
                const ri = Math.floor(Math.random() * lSegs.length);
                if (lSegs[ri] && lSegs[ri].prog > 0.3) spawnLight(lSegs[ri].x2, lSegs[ri].y2);
            }
        }
        const forestDt = dt;
        if(forestGoing)forestList.forEach(ft=>{if(ft.del>0){ft.del-=forestDt;return;}ft.alpha=Math.min(ft.alpha+forestDt*.4,ft.maxAlpha||.6);
            ft.branches.forEach(b=>{b.prog=Math.min(b.prog+b.speed*forestDt,1);if(b.isLeaf&&b.prog>=1)b.bprog=Math.min(b.bprog+.22*forestDt,1);});});

        updateLights(dt);
        updateFP(dt);
        updateFallingLeaves(dt);

        // Draw order
        if(forestGoing)drawForest();
        if(seed.alpha>0)drawOneSeed();
        drawImpacts(dt);drawBloomGlow();drawLTree();drawFallingLeaves();drawLights();drawFP();

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    PETAL_SYSTEM.setWind(0.06);
    cleanups[3] = () => { running = false; ctx.clearRect(0, 0, W, H); PETAL_SYSTEM.setWind(0.1); };
}


// ===== SCENE 5: HOA (flowers) =====
function enter5() {
    const scene = document.getElementById('scene-5');
    scene.classList.remove('fl-active');
    const flowers = scene.querySelector('.fl-scene .flowers');
    if (flowers) flowers.replaceWith(flowers.cloneNode(true));

    anime.timeline({ easing: 'easeOutExpo' })
        .add({ targets: '#scene-5 .fl-poem',     opacity: [0, 1], translateY: [-25, 0], filter: ['blur(8px)', 'blur(0px)'], duration: 1100, delay: 1300 })
        .add({ targets: '#scene-5 .fl-poem-sub', opacity: [0, 1], translateY: [15, 0],  duration: 800 }, '-=400');

    // Like flowers.html: after ~1s remove not-loaded; until then CSS animations stay paused
    setSceneTimeout(4, () => { scene.classList.add('fl-active'); }, 1000);

    // Snowflake + firefly canvas for this scene
    const canvas = document.getElementById('fl-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = innerWidth; canvas.height = innerHeight;

    const flakes = Array.from({ length: 160 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 0.9 + 0.4,
        vy: Math.random() * 0.45 + 0.2,
        vx: Math.random() * 0.35 - 0.18
    }));
    const flFlies = Array.from({ length: 35 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 3.5 + 1.5,
        vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
        alpha: Math.random(), fade: Math.random() * 0.014 + 0.007,
        hue: Math.random() > 0.5 ? 55 : 175
    }));

    let running = true;
    function drawFl() {
        if (!running) return;
        if (isExperiencePaused()) {
            requestAnimationFrame(drawFl);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        flakes.forEach(f => {
            f.y += f.vy; f.x += f.vx;
            if (f.y > canvas.height) { f.y = 0; f.x = Math.random() * canvas.width; }
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
        });
        flFlies.forEach(f => {
            f.x += f.vx; f.y += f.vy;
            f.alpha += f.fade;
            if (f.alpha <= 0 || f.alpha >= 1) f.fade = -f.fade;
            if (f.x < 0 || f.x > canvas.width) f.vx *= -1;
            if (f.y < 0 || f.y > canvas.height) f.vy *= -1;
            const a = Math.min(Math.max(f.alpha, 0), 1);
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 3);
            g.addColorStop(0, `hsla(${f.hue},95%,75%,${a * 0.8})`);
            g.addColorStop(1, `hsla(${f.hue},95%,75%,0)`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = a;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 0.4, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(drawFl);
    }
    drawFl();

    // Gentle petal wind through the flowers
    PETAL_SYSTEM.setWind(0.22);
    setSceneTimeout(4, () => PETAL_SYSTEM.setWind(0.08), 3000);

    cleanups[4] = () => {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const s5 = document.getElementById('scene-5');
        if (s5) s5.classList.remove('fl-active');
    };
}

// ===== SCENE 6: PHOTOS (was 5) =====
function enter6() {
    // Wind gusts occasionally move petals past photos
    PETAL_SYSTEM.setWind(0.28);
    setSceneTimeout(5, () => PETAL_SYSTEM.setWind(0.1), 2500);

    anime({ targets: '.s4-title', opacity: [0, 1], translateY: [-22, 0], filter: ['blur(5px)', 'blur(0px)'], duration: 800, easing: 'easeOutExpo' });
    const cardTilts = [-2.1, 1.7, -1.55, 2.05];
    anime({
        targets: '#scene-6 .photo-card',
        opacity: [0, 1],
        scale: [0.72, 1],
        rotate: (el, i) => {
            const t = cardTilts[i] ?? 0;
            return [t * 0.38, t];
        },
        delay: anime.stagger(55, { start: 200 }),
        duration: 880,
        easing: 'easeOutBack'
    });
    anime({ targets: '.s4-hint', opacity: [0, 0.6], duration: 600, delay: 1900, easing: 'easeOutSine' });

    function advanceFlip(flip) {
        const imgs = [...flip.querySelectorAll('img')];
        if (imgs.length < 2) return;
        let i = imgs.findIndex(img => img.classList.contains('is-active'));
        if (i < 0) i = 0;
        const next = (i + 1) % imgs.length;
        const upcoming = imgs[next];
        const apply = () => {
            imgs.forEach((img, j) => img.classList.toggle('is-active', j === next));
        };
        if (upcoming && typeof upcoming.decode === 'function') {
            upcoming.decode().then(apply).catch(apply);
        } else {
            apply();
        }
    }

    const cards = document.querySelectorAll('#scene-6 .photo-card');
    const clickFns = [];
    const autoTimeouts = [];
    let photosRunning = true;
    const sceneDuration = AUTO_DUR[5] || 16000;
    const introBuffer = 2000;
    const usableDuration = Math.max(sceneDuration - introBuffer, 8000);
    const maxImgsPerCard = Math.max(
        2,
        ...Array.from(cards, card => card.querySelectorAll('.photo-flip img').length)
    );
    // Distribute flips evenly across this scene's active window.
    const flipInterval = Math.max(1400, Math.floor(usableDuration / (maxImgsPerCard - 1)));

    function scheduleNextFlip(flip) {
        const delay = flipInterval;
        const id = setSceneTimeout(5, () => {
            const ix = autoTimeouts.indexOf(id);
            if (ix >= 0) autoTimeouts.splice(ix, 1);
            if (!photosRunning) return;
            advanceFlip(flip);
            scheduleNextFlip(flip);
        }, delay);
        autoTimeouts.push(id);
    }

    cards.forEach((card, idx) => {
        const flip = card.querySelector('.photo-flip');
        const fn = () => advanceFlip(flip);
        card.addEventListener('click', fn);
        clickFns.push([card, fn]);
        const kickoff = setSceneTimeout(5, () => {
            const kix = autoTimeouts.indexOf(kickoff);
            if (kix >= 0) autoTimeouts.splice(kix, 1);
            if (photosRunning) scheduleNextFlip(flip);
        }, 900 + idx * 120);
        autoTimeouts.push(kickoff);
    });

    cleanups[5] = () => {
        photosRunning = false;
        autoTimeouts.forEach(id => clearTimeout(id));
        autoTimeouts.length = 0;
        clickFns.forEach(([c, fn]) => c.removeEventListener('click', fn));
        document.querySelectorAll('#scene-6 .photo-flip').forEach(flip => {
            flip.querySelectorAll('img').forEach((img, j) => {
                img.classList.toggle('is-active', j === 0);
            });
        });
    };
}

// ===== SCENE 7: Lá»œI CHÃšC (was 6) =====
function enter7() {
    const cCanvas = document.getElementById('confetti-canvas');
    const ctx = cCanvas.getContext('2d');
    cCanvas.width = innerWidth; cCanvas.height = innerHeight;

    const pieces = Array.from({ length: 90 }, () => ({
        x: Math.random() * cCanvas.width, y: -20 - Math.random() * 220,
        w: Math.random() * 9 + 4, h: Math.random() * 14 + 6,
        vy: Math.random() * 2.8 + 1.2, vx: (Math.random() - 0.5) * 1.5,
        rot: Math.random() * 360, rspd: (Math.random() - 0.5) * 6,
        color: `hsl(${Math.random() * 360},85%,65%)`
    }));

    // Cherry petals mixed in confetti
    const cpetals = Array.from({ length: 25 }, () => ({
        x: Math.random() * cCanvas.width, y: -10 - Math.random() * 120,
        vy: Math.random() * 1.6 + 0.8, vx: (Math.random() - 0.5) * 1.2,
        rot: Math.random() * Math.PI * 2, rspd: (Math.random() - 0.5) * 0.04,
        w: Math.random() * 12 + 7, h: Math.random() * 16 + 10,
        color: ['#ffb7c5','#ff9aad','#ffccd5','#ffe0eb'][Math.floor(Math.random() * 4)],
        alpha: 0.7
    }));

    let running = true;
    function drawC() {
        if (!running) return;
        if (isExperiencePaused()) {
            requestAnimationFrame(drawC);
            return;
        }
        ctx.clearRect(0, 0, cCanvas.width, cCanvas.height);
        pieces.forEach(p => {
            p.y += p.vy; p.x += p.vx; p.rot += p.rspd;
            if (p.y > cCanvas.height + 10) { p.y = -15; p.x = Math.random() * cCanvas.width; }
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
        });
        cpetals.forEach(p => {
            p.y += p.vy; p.x += p.vx; p.rot += p.rspd;
            if (p.y > cCanvas.height + 20) { p.y = -20; p.x = Math.random() * cCanvas.width; }
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(0, p.h * 0.5);
            ctx.bezierCurveTo( p.w * 0.55,  p.h * 0.22,  p.w * 0.62, -p.h * 0.12, 0, -p.h * 0.5);
            ctx.bezierCurveTo(-p.w * 0.62, -p.h * 0.12, -p.w * 0.55,  p.h * 0.22, 0,  p.h * 0.5);
            ctx.closePath(); ctx.fill(); ctx.restore();
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(drawC);
    }
    drawC();
    cleanups[6] = () => {
        running = false;
        ctx.clearRect(0, 0, cCanvas.width, cCanvas.height);
    };

    // Burst of petals when HB text appears
    setSceneTimeout(6, () => {
        PETAL_SYSTEM.burst(innerWidth / 2, innerHeight * 0.4, 18, 4);
        PETAL_SYSTEM.setWind(-0.32);
        setSceneTimeout(6, () => PETAL_SYSTEM.setWind(0.15), 2000);
    }, 700);

    PETAL_SYSTEM.setWind(0.12);

    anime.timeline({ easing: 'easeOutExpo' })
        .add({ targets: '.s5-cake', opacity: [0, 1], scale: [0.2, 1], easing: 'easeOutBack', duration: 1100, delay: 200 })
        .add({ targets: '.s5-hb',   opacity: [0, 1], scale: [0.5, 1], easing: 'easeOutBack', duration: 700 }, '-=300')
        .add({ targets: '.s5-wishes p', opacity: [0, 1], translateX: [-32, 0], filter: ['blur(4px)','blur(0px)'], delay: anime.stagger(300), duration: 750 }, '-=200')
        .add({ targets: '#scene-7 .s6-date', opacity: [0, 1], scale: [0.38, 1], filter: ['blur(12px)','blur(0px)'], easing: 'easeOutBack', duration: 1500 }, '-=100')
        .add({ targets: '#scene-7 .s6-msg', opacity: [0, 1], translateY: [26, 0], filter: ['blur(5px)','blur(0px)'], delay: anime.stagger(420), duration: 850 }, '-=500');

    setSceneTimeout(6, () => {
        const egg = document.getElementById('egg');
        if (!egg) return;
        egg.classList.add('show');
        anime({ targets: egg, opacity: [0, 1], translateY: [10, 0], duration: 1200, easing: 'easeOutExpo' });
    }, 5200);

    const pyLo = innerHeight * 0.06;
    setSceneTimeout(6, () => PETAL_SYSTEM.burst(innerWidth * 0.3, pyLo + Math.random() * 40, 6, 2.2), 1000);
    setSceneTimeout(6, () => PETAL_SYSTEM.burst(innerWidth * 0.7, pyLo + Math.random() * 40, 6, 2.2), 2200);
    setSceneTimeout(6, () => PETAL_SYSTEM.burst(innerWidth * 0.5, pyLo + Math.random() * 35, 5, 2), 3500);
}
