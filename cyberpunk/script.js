// Enhanced Neon Dodger - responsive canvas, high-DPI support, and touch controls
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreEl = document.getElementById('score');

let width = canvas.width;
let height = canvas.height;

let player, obstacles, keys, running, score, spawnTimer, last;
let pointerActive = false;

function resizeCanvas(){
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  // set backing store size
  canvas.width = Math.max(300, Math.floor(rect.width * dpr));
  canvas.height = Math.max(180, Math.floor(rect.height * dpr));
  // map drawing operations to CSS pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  width = rect.width;
  height = rect.height;
  // keep player inside bounds
  if(player){
    player.y = height - 60;
    player.x = Math.max(0, Math.min(width - player.w, player.x));
  }
}

function reset(){
  resizeCanvas();
  player = { x: width/2 - 20, y: height - 60, w:40, h:12, speed:6 };
  obstacles = [];
  keys = { left: false, right: false };
  score = 0;
  spawnTimer = 0;
  running = false;
  last = 0;
  scoreEl.textContent = 'Score: 0';
}

function start(){
  if(running) return;
  reset();
  running = true;
  spawnTimer = 0;
  last = performance.now();
  requestAnimationFrame(loop);
}

function gameOver(){
  running = false;
  // dim and show message
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0,0,width,height);
  ctx.fillStyle = '#fff';
  ctx.font = '18px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over — Press Start to try again', width/2, height/2);
}

function spawnObstacle(){
  const w = 20 + Math.random() * 60;
  const x = Math.random() * (width - w);
  const speed = 1.5 + Math.random() * 3;
  const color = `hsl(${180 + Math.random()*150}, 90%, 60%)`;
  obstacles.push({ x, y: -40, w, h: 12 + Math.random()*36, speed, color });
}

function update(dt){
  // dt in ms
  // player movement
  if(keys.left) player.x -= player.speed;
  if(keys.right) player.x += player.speed;
  player.x = Math.max(0, Math.min(width - player.w, player.x));

  // spawn obstacles every 600ms-ish
  spawnTimer += dt;
  while(spawnTimer > 600){ spawnObstacle(); spawnTimer -= 600; }

  // update obstacles
  for(let i = obstacles.length -1; i>=0; i--){
    const o = obstacles[i];
    o.y += o.speed * (dt/16); // scale by frame time (approx 60fps baseline)
    if(o.y > height + 50) {
      obstacles.splice(i,1);
      score += 10;
      scoreEl.textContent = `Score: ${score}`;
    } else if(o.x < player.x + player.w && o.x + o.w > player.x &&
       o.y < player.y + player.h && o.y + o.h > player.y){
      gameOver();
    }
  }
}

function draw(){
  // clear and background
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#030015';
  ctx.fillRect(0,0,width,height);

  // scanlines
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for(let y=0;y<height;y+=4) ctx.fillRect(0,y,width,1);

  // draw obstacles
  obstacles.forEach(o=>{
    const g = ctx.createLinearGradient(o.x, o.y, o.x+o.w, o.y+o.h);
    g.addColorStop(0, o.color);
    g.addColorStop(1, '#001');
    ctx.fillStyle = g;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.shadowColor = o.color;
    ctx.shadowBlur = 18;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.shadowBlur = 0;
  });

  // player
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 20;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowBlur = 0;
}

function loop(ts){
  if(!running) return;
  const dt = ts - last;
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// keyboard input
window.addEventListener('keydown', e=>{
  if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
});
window.addEventListener('keyup', e=>{
  if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

// pointer/touch controls: press left/right side to move
canvas.addEventListener('pointerdown', (e)=>{
  pointerActive = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  keys.left = x < rect.width/2;
  keys.right = x > rect.width/2;
});
canvas.addEventListener('pointermove', (e)=>{
  if(!pointerActive) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  keys.left = x < rect.width/2;
  keys.right = x > rect.width/2;
});
window.addEventListener('pointerup', ()=>{
  pointerActive = false;
  keys.left = false; keys.right = false;
});

// keep canvas responsive
window.addEventListener('resize', resizeCanvas);

startBtn.addEventListener('click', ()=>{
  if(!running) start();
});

// initialize
resizeCanvas();
reset();
draw();
