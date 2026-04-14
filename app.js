const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

const controls = {
  particleCount: document.getElementById('particleCount'),
  injectionRate: document.getElementById('injectionRate'),
  inletSpeed: document.getElementById('inletSpeed'),
  jitter: document.getElementById('jitter'),
  traceLength: document.getElementById('traceLength'),
  cellSize: document.getElementById('cellSize'),
  scalarMode: document.getElementById('scalarMode'),
  showParticles: document.getElementById('showParticles'),
  showTrails: document.getElementById('showTrails'),
  showVelocity: document.getElementById('showVelocity'),
  collisions: document.getElementById('collisions'),
  showCoarse: document.getElementById('showCoarse'),
  pause: document.getElementById('pause'),
  resetBtn: document.getElementById('resetBtn'),
  clearTrailsBtn: document.getElementById('clearTrailsBtn')
};

const valueLabels = {
  particleCount: document.getElementById('particleCountValue'),
  injectionRate: document.getElementById('injectionRateValue'),
  inletSpeed: document.getElementById('inletSpeedValue'),
  jitter: document.getElementById('jitterValue'),
  traceLength: document.getElementById('traceLengthValue'),
  cellSize: document.getElementById('cellSizeValue')
};

const statsEl = document.getElementById('stats');

const W = canvas.width;
const H = canvas.height;
const inlet = { x: 20, y1: 240, y2: 460 };
const outlet = { x: W - 20, y1: 250, y2: 450 };
const obstacle = { x: 470, y: 220, w: 140, h: 260 };

let particles = [];
let lastTime = performance.now();
let injectAccumulator = 0;
let nextId = 1;

function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

function syncLabels() {
  for (const [key, el] of Object.entries(valueLabels)) el.textContent = controls[key].value;
}

function makeParticle() {
  const speed = Number(controls.inletSpeed.value);
  const jitter = Number(controls.jitter.value);
  const theta = rand(-0.25, 0.25);
  const vy = rand(-jitter, jitter);
  return {
    id: nextId++,
    x: inlet.x + 6,
    y: rand(inlet.y1, inlet.y2),
    vx: speed * Math.cos(theta),
    vy,
    mass: 1,
    age: 0,
    trail: []
  };
}

function resetSimulation() {
  particles = [];
  nextId = 1;
  injectAccumulator = 0;
}

function clearTrails() {
  for (const p of particles) p.trail = [];
}

function reflectParticleOffBounds(p) {
  if (p.y <= 0) { p.y = 0; p.vy *= -1; }
  if (p.y >= H) { p.y = H; p.vy *= -1; }
  if (p.x <= 0) { p.x = 0; p.vx = Math.abs(p.vx); }
}

function reflectParticleOffObstacle(p, prevX, prevY) {
  const inside = p.x > obstacle.x && p.x < obstacle.x + obstacle.w && p.y > obstacle.y && p.y < obstacle.y + obstacle.h;
  if (!inside) return;

  const wasLeft = prevX <= obstacle.x;
  const wasRight = prevX >= obstacle.x + obstacle.w;
  const wasAbove = prevY <= obstacle.y;
  const wasBelow = prevY >= obstacle.y + obstacle.h;

  if (wasLeft) { p.x = obstacle.x - 0.1; p.vx = -Math.abs(p.vx); return; }
  if (wasRight) { p.x = obstacle.x + obstacle.w + 0.1; p.vx = Math.abs(p.vx); return; }
  if (wasAbove) { p.y = obstacle.y - 0.1; p.vy = -Math.abs(p.vy); return; }
  if (wasBelow) { p.y = obstacle.y + obstacle.h + 0.1; p.vy = Math.abs(p.vy); return; }

  p.vx *= -1;
  p.vy *= -1;
}

function handleCollisions() {
  if (!controls.collisions.checked) return;
  const r = 4;
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 === 0 || d2 > (r * 2) * (r * 2)) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d;
      const ny = dy / d;
      const dvx = a.vx - b.vx;
      const dvy = a.vy - b.vy;
      const rel = dvx * nx + dvy * ny;
      if (rel > 0) continue;
      const impulse = -rel;
      a.vx += -impulse * nx;
      a.vy += -impulse * ny;
      b.vx += impulse * nx;
      b.vy += impulse * ny;

      const overlap = (r * 2 - d) * 0.5;
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;
    }
  }
}

function update(dt) {
  if (controls.pause.checked) return;

  const maxParticles = Number(controls.particleCount.value);
  const injectPerSecond = Number(controls.injectionRate.value);
  injectAccumulator += injectPerSecond * dt;
  while (injectAccumulator >= 1 && particles.length < maxParticles) {
    particles.push(makeParticle());
    injectAccumulator -= 1;
  }

  const traceLength = Number(controls.traceLength.value);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    const prevX = p.x;
    const prevY = p.y;
    p.age += dt;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    p.vx *= 0.999;
    p.vy *= 0.999;

    reflectParticleOffBounds(p);
    reflectParticleOffObstacle(p, prevX, prevY);

    if (controls.showTrails.checked && traceLength > 0) {
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > traceLength) p.trail.shift();
    }

    const exited = p.x >= outlet.x && p.y >= outlet.y1 && p.y <= outlet.y2;
    const stale = p.age > 20;
    if (exited || stale) particles.splice(i, 1);
  }

  handleCollisions();
}

function buildField() {
  const cellSize = Number(controls.cellSize.value);
  const cols = Math.ceil(W / cellSize);
  const rows = Math.ceil(H / cellSize);
  const cells = Array.from({ length: cols * rows }, () => ({ n: 0, sumVx: 0, sumVy: 0, sumSpeed: 0, sumMomentum: 0, samples: [] }));

  for (const p of particles) {
    const cx = Math.floor(clamp(p.x, 0, W - 1) / cellSize);
    const cy = Math.floor(clamp(p.y, 0, H - 1) / cellSize);
    const idx = cy * cols + cx;
    const c = cells[idx];
    const speed = Math.hypot(p.vx, p.vy);
    c.n += 1;
    c.sumVx += p.vx;
    c.sumVy += p.vy;
    c.sumSpeed += speed;
    c.sumMomentum += speed * p.mass;
    c.samples.push({ vx: p.vx, vy: p.vy });
  }

  let maxScalar = 1;
  const mode = controls.scalarMode.value;
  for (const c of cells) {
    let value = 0;
    if (c.n) {
      const meanVx = c.sumVx / c.n;
      const meanVy = c.sumVy / c.n;
      if (mode === 'density') value = c.n;
      if (mode === 'speed') value = c.sumSpeed / c.n;
      if (mode === 'momentum') value = c.sumMomentum;
      if (mode === 'temperature') {
        let variance = 0;
        for (const s of c.samples) {
          const dx = s.vx - meanVx;
          const dy = s.vy - meanVy;
          variance += dx * dx + dy * dy;
        }
        value = variance / c.n;
      }
    }
    c.value = value;
    maxScalar = Math.max(maxScalar, value);
  }

  return { cellSize, cols, rows, cells, maxScalar };
}

function colorFor(norm) {
  const n = clamp(norm, 0, 1);
  const r = Math.round(20 + 235 * n);
  const g = Math.round(220 - 170 * n);
  const b = Math.round(255 - 225 * n);
  return `rgba(${r},${g},${b},0.72)`;
}

function drawField(field) {
  const { cellSize, cols, rows, cells, maxScalar } = field;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const c = cells[cy * cols + cx];
      if (!c.value) continue;
      ctx.fillStyle = colorFor(c.value / maxScalar);
      ctx.fillRect(cx * cellSize, cy * cellSize, cellSize, cellSize);
    }
  }

  if (controls.showVelocity.checked) {
    ctx.strokeStyle = 'rgba(15,23,42,0.8)';
    ctx.lineWidth = 1;
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const c = cells[cy * cols + cx];
        if (!c.n) continue;
        const mx = c.sumVx / c.n;
        const my = c.sumVy / c.n;
        const x = cx * cellSize + cellSize / 2;
        const y = cy * cellSize + cellSize / 2;
        const scale = 0.06;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + mx * scale, y + my * scale);
        ctx.stroke();
      }
    }
  }

  if (controls.showCoarse.checked) {
    const coarse = cellSize * 4;
    ctx.strokeStyle = 'rgba(15,23,42,0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += coarse) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += coarse) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }
}

function drawGeometry() {
  ctx.fillStyle = 'rgba(15,23,42,0.08)';
  ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, W, H);
  ctx.strokeRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);

  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(inlet.x, inlet.y1);
  ctx.lineTo(inlet.x, inlet.y2);
  ctx.stroke();

  ctx.strokeStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(outlet.x, outlet.y1);
  ctx.lineTo(outlet.x, outlet.y2);
  ctx.stroke();
}

function drawParticles() {
  if (controls.showTrails.checked) {
    ctx.strokeStyle = 'rgba(37,99,235,0.25)';
    ctx.lineWidth = 1;
    for (const p of particles) {
      if (p.trail.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(p.trail[0].x, p.trail[0].y);
      for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i].x, p.trail[i].y);
      ctx.stroke();
    }
  }

  if (controls.showParticles.checked) {
    ctx.fillStyle = '#1d4ed8';
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function updateStats(field) {
  const avgSpeed = particles.length ? particles.reduce((a, p) => a + Math.hypot(p.vx, p.vy), 0) / particles.length : 0;
  const occupied = field.cells.filter(c => c.n > 0).length;
  statsEl.innerHTML = [
    `Particles active: ${particles.length}`,
    `Average speed: ${avgSpeed.toFixed(2)}`,
    `Occupied cells: ${occupied}`,
    `Scalar mode: ${controls.scalarMode.value}`,
    `Cell size: ${controls.cellSize.value}`
  ].map(s => `<div>${s}</div>`).join('');
}

function render() {
  ctx.clearRect(0, 0, W, H);
  const field = buildField();
  drawField(field);
  drawGeometry();
  drawParticles();
  updateStats(field);
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

for (const [key, input] of Object.entries(controls)) {
  if (valueLabels[key]) input.addEventListener('input', syncLabels);
}
controls.resetBtn.addEventListener('click', resetSimulation);
controls.clearTrailsBtn.addEventListener('click', clearTrails);

syncLabels();
resetSimulation();
requestAnimationFrame(loop);
