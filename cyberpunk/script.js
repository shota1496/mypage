// Enhanced Neon Dodger - responsive canvas, high-DPI support, and touch controls
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreEl = document.getElementById('score');
const moveButtons = document.querySelectorAll('.move-btn');

let width = canvas.width;
let height = canvas.height;

let player, obstacles, keys, running, score, spawnTimer, last;
let pointerActive = false;

function setDirection(direction, pressed) {
  if (direction === 'left') {
    keys.left = pressed;
  } else if (direction === 'right') {
    keys.right = pressed;
  }

  const button = document.querySelector(`.move-btn[data-direction="${direction}"]`);
  if (button) {
    button.classList.toggle('is-active', pressed);
  }
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.max(280, rect.width || 640);
  const cssHeight = Math.max(180, rect.height || 360);

  canvas.width = Math.floor(cssWidth * dpr);
  canvas.height = Math.floor(cssHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  width = cssWidth;
  height = cssHeight;

  if (player) {
    player.y = height - 60;
    player.x = Math.max(0, Math.min(width - player.w, player.x));
  }
}

function reset() {
  resizeCanvas();
  player = { x: width / 2 - 20, y: height - 60, w: 40, h: 12, speed: 6 };
  obstacles = [];
  keys = { left: false, right: false };
  score = 0;
  spawnTimer = 0;
  running = false;
  last = 0;
  scoreEl.textContent = 'Score: 0';
}

function start() {
  if (running) return;
  reset();
  running = true;
  spawnTimer = 0;
  last = performance.now();
  requestAnimationFrame(loop);
}

function gameOver() {
  running = false;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.font = '18px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over — Press Start to try again', width / 2, height / 2);
}

function spawnObstacle() {
  const w = 20 + Math.random() * 60;
  const x = Math.random() * (width - w);
  const speed = 1.5 + Math.random() * 3;
  const color = `hsl(${180 + Math.random() * 150}, 90%, 60%)`;
  obstacles.push({ x, y: -40, w, h: 12 + Math.random() * 36, speed, color });
}

function update(dt) {
  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;
  player.x = Math.max(0, Math.min(width - player.w, player.x));

  spawnTimer += dt;
  while (spawnTimer > 600) {
    spawnObstacle();
    spawnTimer -= 600;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += o.speed * (dt / 16);

    if (o.y > height + 50) {
      obstacles.splice(i, 1);
      score += 10;
      scoreEl.textContent = `Score: ${score}`;
    } else if (
      o.x < player.x + player.w &&
      o.x + o.w > player.x &&
      o.y < player.y + player.h &&
      o.y + o.h > player.y
    ) {
      gameOver();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#030015';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);

  obstacles.forEach(o => {
    const g = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
    g.addColorStop(0, o.color);
    g.addColorStop(1, '#001');
    ctx.fillStyle = g;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.shadowColor = o.color;
    ctx.shadowBlur = 18;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.shadowBlur = 0;
  });

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 20;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowBlur = 0;
}

function loop(ts) {
  if (!running) return;
  const dt = ts - last;
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setDirection('left', true);
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setDirection('right', true);
});

window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setDirection('left', false);
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setDirection('right', false);
});

canvas.addEventListener('pointerdown', e => {
  pointerActive = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  keys.left = x < rect.width / 2;
  keys.right = x > rect.width / 2;
});

canvas.addEventListener('pointermove', e => {
  if (!pointerActive) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  keys.left = x < rect.width / 2;
  keys.right = x > rect.width / 2;
});

window.addEventListener('pointerup', () => {
  pointerActive = false;
  keys.left = false;
  keys.right = false;
});

moveButtons.forEach(button => {
  const direction = button.dataset.direction;

  const press = (e) => {
    e.preventDefault();
    setDirection(direction, true);
  };

  const release = (e) => {
    e.preventDefault();
    setDirection(direction, false);
  };

  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointerleave', release);
  button.addEventListener('pointercancel', release);
});

window.addEventListener('resize', resizeCanvas);

startBtn.addEventListener('click', () => {
  if (!running) start();
});

resizeCanvas();
reset();
draw();
