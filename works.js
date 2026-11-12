// ============================================================
// 1. works.csv の読み込みとホームページ生成
// ============================================================
const FALLBACK_WORKS = [
  {
    id: "gravity",
    title: "Gravity Tiles",
    subtitle: "重力バウンド・タイル",
    description: "タップ＆ドラッグで図形をドロップ！図形どうしがぶつかると色が変わって軽快に弾みます。",
    tag: "物理トイ / バウンド",
    accent: "#3b82f6"
  },
  {
    id: "fusion",
    title: "Geo Fusion",
    subtitle: "幾何学進化・フュージョン",
    description: "同じ図形どうしを触れ合わせると次の幾何学図形へ全10段階で進化！図形をつかんで動かすこともできます。",
    tag: "連鎖 / 幾何学進化",
    accent: "#8b5cf6"
  },
  {
    id: "pulse",
    title: "Pulse & Stitch",
    subtitle: "鼓動する幾何学サッカーボール",
    description: "3,600個の動くする粒子で構成された、赤い五角形と白い六角形からなる、サッカーボール。その結びつき解き、縫い合わせてみよう。",
    tag: "Interactive Bio-Art",
    accent: "#e11d48"
  }
];

// ダブルクォーテーション内のカンマに対応したCSV行分割
function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return FALLBACK_WORKS;
  const headers = splitCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || "";
    });
    return obj;
  });
}

function renderHomeCards(works) {
  const grid = document.getElementById("worksGrid");
  grid.innerHTML = "";

  works.forEach((work) => {
    const card = document.createElement("article");
    card.className = "work-card";
    card.innerHTML = `
      <div>
        <span class="work-tag" style="background:${work.accent || "#3b82f6"}">${work.tag}</span>
        <h2>${work.title}</h2>
        <div class="work-subtitle">${work.subtitle}</div>
        <p class="work-desc">${work.description}</p>
      </div>
      <button class="launch-btn" style="background:${work.accent || "#0f172a"}">このアプリを開く →</button>
    `;
    card.addEventListener("click", () => openApp(work));
    grid.appendChild(card);
  });
}

async function initPortfolio() {
  try {
    const res = await fetch("works.csv");
    if (!res.ok) throw new Error("CSV fetch failed");
    const csvText = await res.text();
    const works = parseCSV(csvText);
    renderHomeCards(works);
  } catch (e) {
    renderHomeCards(FALLBACK_WORKS);
  }
}

initPortfolio();

// ============================================================
// 2. 共通キャンバス・オーディオ・画面切替管理
// ============================================================
const homeView = document.getElementById("homeView");
const appView = document.getElementById("appView");
const canvas = document.getElementById("artCanvas");
const ctx = canvas.getContext("2d");

let activeAppId = null; // "gravity" | "fusion" | "pulse"
let animationFrameId = null;
let isSoundOn = true;
let audioCtx = null;

const THEMES = {
  pop: {
    bg: "#f8fafc",
    colors: ["#ff595e", "#ff924c", "#ffca3a", "#8ac926", "#52b788", "#1982c4", "#4267ac", "#6a4c93", "#f15bb5", "#00bbf9"]
  },
  pastel: {
    bg: "#fdf6f0",
    colors: ["#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff", "#f4a261", "#e76f51"]
  },
  neon: {
    bg: "#0f172a",
    colors: ["#00f5d4", "#00bbf9", "#fee440", "#f15bb5", "#9b5de5", "#ff6b6b", "#4ecdc4", "#ffe66d", "#ff9f1c", "#2ec4b6"]
  }
};

let currentTheme = THEMES.pop;
let isZeroGravity = false;

function ensureAudio() {
  if (!isSoundOn) return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", () => {
  if (activeAppId) resizeCanvas();
});

function openApp(work) {
  activeAppId = work.id;
  homeView.classList.add("hidden");
  appView.classList.remove("hidden");

  const tileControls = document.getElementById("tileControls");
  const statsBadge = document.getElementById("statsBadge");
  const pulseControls = document.getElementById("pulseControls");
  const backBtn = document.getElementById("backHomeBtn");

  document.getElementById("appTitle").textContent = work.title;

  if (activeAppId === "gravity") {
    tileControls.classList.remove("hidden");
    statsBadge.classList.add("hidden");
    pulseControls.classList.add("hidden");
    backBtn.textContent = "← ホーム";
    document.getElementById("appDesc").textContent = "タップ＆ドラッグで図形をドロップ！ぶつかると色が変わります";
    document.getElementById("tileSoundBtn").textContent = isSoundOn ? "音: ON" : "音: OFF";

    resizeCanvas();
    initGravityTiles();
  } else if (activeAppId === "fusion") {
    tileControls.classList.remove("hidden");
    statsBadge.classList.remove("hidden");
    pulseControls.classList.add("hidden");
    backBtn.textContent = "← ホーム";
    document.getElementById("appDesc").textContent = "空白タップで生成 / 図形をつかんで同種に当てると進化！";
    document.getElementById("tileSoundBtn").textContent = isSoundOn ? "音: ON" : "音: OFF";

    resizeCanvas();
    initFusion();
  } else if (activeAppId === "pulse") {
    tileControls.classList.add("hidden");
    pulseControls.classList.remove("hidden");
    backBtn.textContent = "← Home";
    document.getElementById("appDesc").textContent = "Move cursor to sever, drag to stitch. A living heart.";
    document.getElementById("pulseSoundBtn").textContent = isSoundOn ? "Sound: ON" : "Sound: OFF";

    resizeCanvas();
    initPulseHeart();
  }

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  mainLoop();
}

document.getElementById("backHomeBtn").addEventListener("click", () => {
  activeAppId = null;
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  appView.classList.add("hidden");
  homeView.classList.remove("hidden");
});

// ============================================================
// 3. アプリ①：Gravity Tiles（重力バウンド・タイル）
// ============================================================
const GRAVITY_SHAPES = ["circle", "square", "triangle", "diamond"];
let gravityTiles = [];
let gravityRipples = [];
let isGravityPointerDown = false;
let lastGravitySpawnTime = 0;
let lastGravitySoundTime = 0;
const MAX_TILES_GRAVITY = 75;

function playGravityPopSound(pitchFactor = 1) {
  const ac = ensureAudio();
  if (!ac) return;
  const now = performance.now();
  if (now - lastGravitySoundTime < 45) return;
  lastGravitySoundTime = now;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const baseFreq = 280 + pitchFactor * 260;

  osc.type = "sine";
  osc.frequency.setValueAtTime(baseFreq, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, ac.currentTime + 0.09);

  gain.gain.setValueAtTime(0.12, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.11);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.11);
}

function getRandomGravityColor(excludeColor = null) {
  const list = currentTheme.colors.filter((c) => c !== excludeColor);
  const pool = list.length > 0 ? list : currentTheme.colors;
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnGravityTile(x, y) {
  const active = gravityTiles.filter((t) => !t.removing);
  if (active.length >= MAX_TILES_GRAVITY) {
    active[0].removing = true;
  }

  const r = 20 + Math.random() * 16;
  const shape = GRAVITY_SHAPES[Math.floor(Math.random() * GRAVITY_SHAPES.length)];
  const color = getRandomGravityColor();

  gravityTiles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 6,
    vy: (Math.random() - 0.5) * 3 - 1,
    r,
    angle: Math.random() * Math.PI * 2,
    vAngle: (Math.random() - 0.5) * 0.08,
    shape,
    color,
    pulse: 1.25,
    scale: 1,
    removing: false
  });

  gravityRipples.push({ x, y, r: r * 0.5, alpha: 0.6, color });
  playGravityPopSound(1 - r / 40);
}

function initGravityTiles() {
  gravityTiles = [];
  gravityRipples = [];
  const w = window.innerWidth;
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      if (activeAppId === "gravity") {
        spawnGravityTile(w * (0.25 + Math.random() * 0.5), 110 + i * 20);
      }
    }, i * 110);
  }
}

function updateAndDrawGravityTiles() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const bounce = 0.82;

  ctx.fillStyle = currentTheme.bg;
  ctx.fillRect(0, 0, width, height);

  for (let i = gravityTiles.length - 1; i >= 0; i--) {
    const t = gravityTiles[i];
    if (t.removing) {
      t.scale -= 0.08;
      if (t.scale <= 0) gravityTiles.splice(i, 1);
      continue;
    }

    t.pulse += (1 - t.pulse) * 0.18;

    if (!isZeroGravity) {
      t.vy += 0.42;
    } else {
      t.vx *= 0.995;
      t.vy *= 0.995;
    }

    t.x += t.vx;
    t.y += t.vy;
    t.angle += t.vAngle;

    if (t.x - t.r < 0) {
      t.x = t.r;
      t.vx *= -bounce;
      t.vAngle = t.vy * 0.01;
    } else if (t.x + t.r > width) {
      t.x = width - t.r;
      t.vx *= -bounce;
      t.vAngle = -t.vy * 0.01;
    }

    if (t.y + t.r > height) {
      t.y = height - t.r;
      t.vy *= -bounce;
      t.vx *= 0.96;
      t.vAngle = t.vx * 0.02;
    } else if (t.y - t.r < 0) {
      t.y = t.r;
      t.vy *= -bounce;
    }
  }

  for (let i = 0; i < gravityTiles.length; i++) {
    for (let j = i + 1; j < gravityTiles.length; j++) {
      const a = gravityTiles[i];
      const b = gravityTiles[j];
      if (a.removing || b.removing) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;

      if (dist < minDist && dist > 0) {
        const overlap = (minDist - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal < 0) {
          const impulse = -(1 + 0.85) * velAlongNormal * 0.5;
          a.vx -= impulse * nx;
          a.vy -= impulse * ny;
          b.vx += impulse * nx;
          b.vy += impulse * ny;

          if (Math.abs(velAlongNormal) > 2.2) {
            a.color = getRandomGravityColor(a.color);
            b.color = getRandomGravityColor(b.color);
            a.pulse = 1.22;
            b.pulse = 1.22;
            playGravityPopSound(Math.min(1, Math.abs(velAlongNormal) / 12));
          }
        }
      }
    }
  }

  // 波紋エフェクト
  for (let i = gravityRipples.length - 1; i >= 0; i--) {
    const rp = gravityRipples[i];
    rp.r += 3;
    rp.alpha -= 0.03;
    if (rp.alpha <= 0) {
      gravityRipples.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
    ctx.strokeStyle = rp.color;
    ctx.globalAlpha = rp.alpha;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // タイル描画
  for (const t of gravityTiles) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    const s = t.scale * t.pulse;
    ctx.scale(s, s);

    ctx.fillStyle = t.color;
    ctx.beginPath();

    if (t.shape === "circle") {
      ctx.arc(0, 0, t.r, 0, Math.PI * 2);
    } else if (t.shape === "square") {
      const size = t.r * 1.65;
      ctx.roundRect(-size / 2, -size / 2, size, size, 8);
    } else if (t.shape === "triangle") {
      const r = t.r * 1.15;
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 * i) / 3 - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (t.shape === "diamond") {
      const r = t.r * 1.15;
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.85, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.85, 0);
      ctx.closePath();
    }

    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

// ============================================================
// 4. アプリ②：Geo Fusion（幾何学進化・フュージョン）
// ============================================================
const FUSION_STAGES = [
  { type: "poly", sides: 3, label: "3" },
  { type: "poly", sides: 4, label: "4" },
  { type: "poly", sides: 5, label: "5" },
  { type: "poly", sides: 6, label: "6" },
  { type: "poly", sides: 7, label: "7" },
  { type: "poly", sides: 8, label: "8" },
  { type: "star", points: 4, label: "★4" },
  { type: "star", points: 5, label: "★5" },
  { type: "star", points: 6, label: "★6" },
  { type: "sun", points: 12, label: "MAX" }
];

let fusionTiles = [];
let fusionEffects = [];
let draggedTile = null;
let isFusionPointerDown = false;
let lastFusionSpawnTime = 0;
let lastFusionSoundTime = 0;
let mergeCount = 0;
let maxReachedLevel = 1;
const MAX_TILES_FUSION = 48;

function playFusionTone(step = 0, isEvolution = false) {
  const ac = ensureAudio();
  if (!ac) return;
  const now = performance.now();
  if (!isEvolution && now - lastFusionSoundTime < 45) return;
  lastFusionSoundTime = now;

  const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 783.99];
  const freq = notes[Math.min(notes.length - 1, Math.max(0, step))];

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = isEvolution ? "triangle" : "sine";
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (isEvolution) {
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, ac.currentTime + 0.16);
  }
  gain.gain.setValueAtTime(isEvolution ? 0.18 : 0.11, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + (isEvolution ? 0.25 : 0.12));

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + (isEvolution ? 0.25 : 0.12));
}

function initFusion() {
  fusionTiles = [];
  fusionEffects = [];
  draggedTile = null;
  mergeCount = 0;
  maxReachedLevel = 1;
  updateFusionStats();

  const w = window.innerWidth;
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      if (activeAppId === "fusion") {
        spawnFusionTile(w * (0.3 + Math.random() * 0.4), 110 + i * 18, i % 2);
      }
    }, i * 100);
  }
}

function updateFusionStats() {
  document.getElementById("mergeCount").textContent = mergeCount;
  document.getElementById("maxLevel").textContent = maxReachedLevel;
}

function getFusionRadius(level) {
  return 20 + level * 3.5;
}

function spawnFusionTile(x, y, level = null) {
  const active = fusionTiles.filter((t) => !t.removing);
  if (active.length >= MAX_TILES_FUSION) {
    const target = active.find((t) => t.level <= 1) || active[0];
    target.removing = true;
  }

  const lv = level !== null ? level : Math.random() < 0.75 ? 0 : 1;
  const r = getFusionRadius(lv);
  const color = currentTheme.colors[lv % currentTheme.colors.length];

  fusionTiles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 3,
    vy: 0,
    r,
    level: lv,
    angle: 0,
    vAngle: (Math.random() - 0.5) * 0.04,
    color,
    pulse: 1.25,
    scale: 1,
    cooldown: 10,
    removing: false
  });

  fusionEffects.push({ x, y, r: r * 0.5, alpha: 0.6, color });
  playFusionTone(lv, false);
}

function updateAndDrawFusion() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  ctx.fillStyle = currentTheme.bg;
  ctx.fillRect(0, 0, width, height);

  for (let i = fusionTiles.length - 1; i >= 0; i--) {
    const t = fusionTiles[i];
    if (t.removing) {
      t.scale -= 0.09;
      if (t.scale <= 0) fusionTiles.splice(i, 1);
      continue;
    }
    if (t.cooldown > 0) t.cooldown--;
    t.pulse += (1 - t.pulse) * 0.18;

    if (t === draggedTile) continue;

    if (!isZeroGravity) {
      t.vy += 0.4;
    } else {
      t.vx *= 0.994;
      t.vy *= 0.994;
    }

    t.x += t.vx;
    t.y += t.vy;
    t.angle += t.vAngle;

    if (t.x - t.r < 0) {
      t.x = t.r;
      t.vx *= -0.65;
    } else if (t.x + t.r > width) {
      t.x = width - t.r;
      t.vx *= -0.65;
    }

    if (t.y + t.r > height) {
      t.y = height - t.r;
      t.vy *= -0.65;
      t.vx *= 0.94;
      t.vAngle = t.vx * 0.015;
    } else if (t.y - t.r < 0) {
      t.y = t.r;
      t.vy *= -0.65;
    }
  }

  for (let i = 0; i < fusionTiles.length; i++) {
    for (let j = i + 1; j < fusionTiles.length; j++) {
      const a = fusionTiles[i];
      const b = fusionTiles[j];
      if (a.removing || b.removing) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;

      if (dist < minDist && dist > 0) {
        if (a.level === b.level && a.cooldown === 0 && b.cooldown === 0) {
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const nextLevel = a.level + 1;

          b.removing = true;
          b.scale = 0;
          if (draggedTile === b) draggedTile = a;

          mergeCount++;

          if (nextLevel >= FUSION_STAGES.length) {
            a.removing = true;
            if (draggedTile === a) draggedTile = null;
            for (let k = 0; k < 3; k++) {
              fusionEffects.push({
                x: midX,
                y: midY,
                r: a.r * (0.6 + k * 0.4),
                alpha: 0.95,
                color: currentTheme.colors[k * 3]
              });
            }
            playFusionTone(10, true);
          } else {
            a.x = midX;
            a.y = midY;
            a.level = nextLevel;
            a.r = getFusionRadius(nextLevel);
            a.color = currentTheme.colors[nextLevel % currentTheme.colors.length];
            a.pulse = 1.42;
            a.cooldown = 12;
            a.vy = -3.2;

            if (nextLevel + 1 > maxReachedLevel) {
              maxReachedLevel = nextLevel + 1;
            }
            fusionEffects.push({ x: midX, y: midY, r: a.r * 0.7, alpha: 0.85, color: a.color });
            playFusionTone(nextLevel, true);
          }
          updateFusionStats();
          continue;
        }

        const overlap = (minDist - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        if (a !== draggedTile) {
          a.x -= nx * overlap;
          a.y -= ny * overlap;
        }
        if (b !== draggedTile) {
          b.x += nx * overlap;
          b.y += ny * overlap;
        }

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const velAlongNormal = rvx * nx + rvy * ny;
        if (velAlongNormal < 0) {
          const impulse = -(1 + 0.55) * velAlongNormal * 0.5;
          if (a !== draggedTile) {
            a.vx -= impulse * nx;
            a.vy -= impulse * ny;
          }
          if (b !== draggedTile) {
            b.vx += impulse * nx;
            b.vy += impulse * ny;
          }
        }
      }
    }
  }

  for (let i = fusionEffects.length - 1; i >= 0; i--) {
    const ef = fusionEffects[i];
    ef.r += 3.2;
    ef.alpha -= 0.032;
    if (ef.alpha <= 0) {
      fusionEffects.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(ef.x, ef.y, ef.r, 0, Math.PI * 2);
    ctx.strokeStyle = ef.color;
    ctx.globalAlpha = ef.alpha;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (const t of fusionTiles) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    const s = t.scale * t.pulse;
    ctx.scale(s, s);

    ctx.fillStyle = t.color;
    ctx.beginPath();
    const stage = FUSION_STAGES[t.level] || FUSION_STAGES[0];
    if (stage.type === "poly") {
      for (let i = 0; i < stage.sides; i++) {
        const a = (Math.PI * 2 * i) / stage.sides - Math.PI / 2;
        const px = Math.cos(a) * t.r * 1.08;
        const py = Math.sin(a) * t.r * 1.08;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else {
      const pts = stage.points;
      const outerR = stage.type === "star" ? t.r * 1.15 : t.r * 1.12;
      const innerR = stage.type === "star" ? t.r * 0.55 : t.r * 0.82;
      for (let i = 0; i < pts * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (Math.PI * i) / pts - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.rotate(-t.angle);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.max(11, Math.floor(t.r * 0.48))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 4;
    ctx.fillText(stage.label, 0, 1);
    ctx.restore();
  }
}

// ============================================================
// 5. アプリ③：Pulse & Stitch（2D Living Geometric Heart / 英語UI）
// ============================================================
let heartParticles = [];
let heartSprings = [];
let heartTime = 0;
let stitchTotalCount = 0;
let stitchBatchIndex = 0;
let heartToolMode = "sever"; // "sever" | "stitch"
let heartBgMode = "cream";   // "cream" | "mist" | "slate"
let isHeartDragging = false;
let lastPointerPos = null;
let lastHeartBeatPhase = 0;
let lastStitchSoundTime = 0;
let lastSeverSoundTime = 0;

const STITCHED_PALETTE = [
  { particle: "#d97706", thread: "#f59e0b" }, // Warm Gold
  { particle: "#059669", thread: "#10b981" }, // Vital Emerald
  { particle: "#2563eb", thread: "#3b82f6" }, // Cobalt Blue
  { particle: "#7c3aed", thread: "#8b5cf6" }, // Deep Violet
  { particle: "#0d9488", thread: "#14b8a6" }  // Teal
];

function getTelstarCenters() {
  const rawCenters = [{ x: 0, y: 0, z: 1 }];
  const latSin = 2 / Math.sqrt(5);
  const latCos = 1 / Math.sqrt(5);
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2 + 0.18;
    rawCenters.push({
      x: Math.cos(angle) * latSin,
      y: Math.sin(angle) * latSin,
      z: latCos
    });
  }

  const tiltY = 0.14;
  const tiltX = 0.15;
  const cosY = Math.cos(tiltY);
  const sinY = Math.sin(tiltY);
  const cosX = Math.cos(tiltX);
  const sinX = Math.sin(tiltX);

  return rawCenters.map(({ x, y, z }) => {
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    return { x: x1, y: y2, z: z2 };
  });
}

function initPulseHeart() {
  heartParticles = [];
  heartSprings = [];
  heartTime = 0;
  stitchTotalCount = 0;
  stitchBatchIndex = 0;
  lastPointerPos = null;
  updateStitchStats();

  const telstarCenters = getTelstarCenters();
  const count = 3600;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const r = Math.sqrt((i + 0.5) / count);
    const theta = i * goldenAngle;
    const hx = Math.cos(theta) * r;
    const hy = Math.sin(theta) * r;
    const hz = Math.sqrt(Math.max(0, 1 - hx * hx - hy * hy));

    let maxDot = -1;
    for (const c of telstarCenters) {
      const dot = hx * c.x + hy * c.y + hz * c.z;
      if (dot > maxDot) maxDot = dot;
    }
    const isPentagon = maxDot > 0.92;

    const lightDot = hx * -0.35 + hy * -0.35 + hz * 0.86;
    const shade = Math.max(0, Math.min(1, (lightDot + 0.2) / 1.15));

    let baseColor;
    if (isPentagon) {
      const red = Math.round(205 + shade * 47);
      const green = Math.round(22 + shade * 22);
      const blue = Math.round(38 + shade * 24);
      baseColor = `rgb(${red}, ${green}, ${blue})`;
    } else {
      const v = Math.round(230 + shade * 25);
      baseColor = `rgb(${v}, ${v + 1}, ${Math.min(255, v + 3)})`;
    }

    heartParticles.push({
      id: i,
      hx,
      hy,
      ox: 0,
      oy: 0,
      vx: 0,
      vy: 0,
      isPentagon,
      baseColor,
      state: "intact",
      stitchColor: null,
      phase: Math.random() * Math.PI * 2,
      sx: 0,
      sy: 0
    });
  }

  const linkDist = 0.046;
  const cellSize = linkDist;
  const grid = new Map();

  for (let i = 0; i < count; i++) {
    const p = heartParticles[i];
    const gx = Math.floor((p.hx + 1.1) / cellSize);
    const gy = Math.floor((p.hy + 1.1) / cellSize);
    const key = `${gx},${gy}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(i);
  }

  for (let i = 0; i < count; i++) {
    const a = heartParticles[i];
    const gx = Math.floor((a.hx + 1.1) / cellSize);
    const gy = Math.floor((a.hy + 1.1) / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = grid.get(`${gx + dx},${gy + dy}`);
        if (!bucket) continue;
        for (const j of bucket) {
          if (j <= i) continue;
          const b = heartParticles[j];
          const d = Math.hypot(a.hx - b.hx, a.hy - b.hy);
          if (d < linkDist) {
            heartSprings.push({
              a: i,
              b: j,
              restLen: d,
              active: true,
              stitched: false,
              threadColor: null
            });
          }
        }
      }
    }
  }
}

function updateStitchStats() {
  document.getElementById("stitchCount").textContent = stitchTotalCount;
}

function playHeartbeatSound(isSecondBeat = false) {
  const ac = ensureAudio();
  if (!ac) return;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  const startFreq = isSecondBeat ? 64 : 52;
  osc.frequency.setValueAtTime(startFreq, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(26, ac.currentTime + 0.16);

  gain.gain.setValueAtTime(isSecondBeat ? 0.11 : 0.16, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.18);
}

function playSeverSound() {
  const ac = ensureAudio();
  if (!ac) return;
  const now = performance.now();
  if (now - lastSeverSoundTime < 75) return;
  lastSeverSoundTime = now;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(210 + Math.random() * 50, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(105, ac.currentTime + 0.14);

  gain.gain.setValueAtTime(0.04, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.15);
}

function playStitchSound() {
  const ac = ensureAudio();
  if (!ac) return;
  const now = performance.now();
  if (now - lastStitchSoundTime < 55) return;
  lastStitchSoundTime = now;

  const notes = [523.25, 587.33, 659.25, 783.99, 880.0];
  const freq = notes[stitchTotalCount % notes.length];

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.14, ac.currentTime + 0.12);

  gain.gain.setValueAtTime(0.085, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.13);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.13);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const ccw = (p1x, p1y, p2x, p2y, p3x, p3y) =>
    (p3y - p1y) * (p2x - p1x) > (p2y - p1y) * (p3x - p1x);
  return (
    ccw(ax, ay, cx, cy, dx, dy) !== ccw(bx, by, cx, cy, dx, dy) &&
    ccw(ax, ay, bx, by, cx, cy) !== ccw(ax, ay, bx, by, dx, dy)
  );
}

function applySeverSegment(x1, y1, x2, y2) {
  const cutRadius = 10;
  let didSever = false;

  const moveDx = x2 - x1;
  const moveDy = y2 - y1;
  const moveLen = Math.hypot(moveDx, moveDy) || 1;
  const nx = -moveDy / moveLen;
  const ny = moveDx / moveLen;

  for (const sp of heartSprings) {
    if (!sp.active) continue;
    const pa = heartParticles[sp.a];
    const pb = heartParticles[sp.b];

    const minX = Math.min(x1, x2) - cutRadius;
    const maxX = Math.max(x1, x2) + cutRadius;
    const minY = Math.min(y1, y2) - cutRadius;
    const maxY = Math.max(y1, y2) + cutRadius;
    if (
      (pa.sx < minX && pb.sx < minX) ||
      (pa.sx > maxX && pb.sx > maxX) ||
      (pa.sy < minY && pb.sy < minY) ||
      (pa.sy > maxY && pb.sy > maxY)
    ) {
      continue;
    }

    const midX = (pa.sx + pb.sx) * 0.5;
    const midY = (pa.sy + pb.sy) * 0.5;
    const closeToCut = distToSegment(midX, midY, x1, y1, x2, y2) < cutRadius;
    const crossedCut = segmentsIntersect(x1, y1, x2, y2, pa.sx, pa.sy, pb.sx, pb.sy);

    if (closeToCut || crossedCut) {
      sp.active = false;
      sp.stitched = false;
      didSever = true;

      pa.state = "severed";
      pb.state = "severed";

      const sideA = (pa.sx - x2) * nx + (pa.sy - y2) * ny >= 0 ? 1 : -1;
      const sideB = (pb.sx - x2) * nx + (pb.sy - y2) * ny >= 0 ? 1 : -1;

      pa.vx += nx * sideA * 0.0013;
      pa.vy += ny * sideA * 0.0013;
      pb.vx += nx * sideB * 0.0013;
      pb.vy += ny * sideB * 0.0013;
    }
  }

  if (didSever) {
    playSeverSound();
  }
}

function applyStitchSegment(x1, y1, x2, y2) {
  const stitchRadius = 20;
  const palette = STITCHED_PALETTE[stitchBatchIndex % STITCHED_PALETTE.length];
  let stitchedNow = false;

  const minX = Math.min(x1, x2) - stitchRadius;
  const maxX = Math.max(x1, x2) + stitchRadius;
  const minY = Math.min(y1, y2) - stitchRadius;
  const maxY = Math.max(y1, y2) + stitchRadius;

  for (const sp of heartSprings) {
    if (sp.active) continue;
    const pa = heartParticles[sp.a];
    const pb = heartParticles[sp.b];

    if (
      pa.sx < minX || pa.sx > maxX || pa.sy < minY || pa.sy > maxY ||
      pb.sx < minX || pb.sx > maxX || pb.sy < minY || pb.sy > maxY
    ) {
      continue;
    }

    const midX = (pa.sx + pb.sx) * 0.5;
    const midY = (pa.sy + pb.sy) * 0.5;
    if (distToSegment(midX, midY, x1, y1, x2, y2) < stitchRadius) {
      sp.active = true;
      sp.stitched = true;
      sp.threadColor = palette.thread;

      pa.state = "stitched";
      pb.state = "stitched";
      pa.stitchColor = palette.particle;
      pb.stitchColor = palette.particle;

      stitchTotalCount++;
      stitchedNow = true;
    }
  }

  const severedNear = [];
  for (const p of heartParticles) {
    if (p.sx >= minX && p.sx <= maxX && p.sy >= minY && p.sy <= maxY) {
      if (distToSegment(p.sx, p.sy, x1, y1, x2, y2) < stitchRadius) {
        severedNear.push(p);
      }
    }
  }

  for (let i = 0; i < severedNear.length; i++) {
    for (let j = i + 1; j < severedNear.length; j++) {
      const a = severedNear[i];
      const b = severedNear[j];
      if (a.state !== "severed" && b.state !== "severed") continue;

      const restD = Math.hypot(a.hx - b.hx, a.hy - b.hy);
      if (restD < 0.072) {
        const exists = heartSprings.some(
          (s) => s.active && ((s.a === a.id && s.b === b.id) || (s.a === b.id && s.b === a.id))
        );
        if (!exists) {
          heartSprings.push({
            a: a.id,
            b: b.id,
            restLen: restD * 0.96,
            active: true,
            stitched: true,
            threadColor: palette.thread
          });
          a.state = "stitched";
          b.state = "stitched";
          a.stitchColor = palette.particle;
          b.stitchColor = palette.particle;
          stitchTotalCount++;
          stitchedNow = true;
        }
      }
    }
  }

  if (stitchedNow) {
    updateStitchStats();
    playStitchSound();
  }
}

function updateAndDrawPulseHeart() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const cx = width / 2;
  const cy = height / 2;
  const baseRadius = Math.min(width, height) * 0.34;

  heartTime += 0.032;
  const beatCycle = heartTime % (Math.PI * 2);
  const lub = Math.pow(Math.max(0, Math.sin(beatCycle)), 16);
  const dub = Math.pow(Math.max(0, Math.sin(beatCycle - 0.55)), 20) * 0.6;
  const beatIntensity = lub + dub;
  const pulseFactor = 1 + beatIntensity * 0.018;

  if (lastHeartBeatPhase < 0.3 && beatCycle >= 0.3) {
    playHeartbeatSound(false);
  } else if (lastHeartBeatPhase < 0.85 && beatCycle >= 0.85) {
    playHeartbeatSound(true);
  }
  lastHeartBeatPhase = beatCycle;

  // 1. 背景描画（CREAM / MIST / SLATE）
  if (heartBgMode === "cream") {
    const bgGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, Math.max(width, height) * 0.85);
    bgGrad.addColorStop(0, "#fcf9f2");
    bgGrad.addColorStop(1, "#f0e7d5");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  } else if (heartBgMode === "mist") {
    const bgGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, Math.max(width, height) * 0.85);
    bgGrad.addColorStop(0, "#e2e9f0");
    bgGrad.addColorStop(1, "#c4d0de");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  } else {
    const bgGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, Math.max(width, height) * 0.85);
    bgGrad.addColorStop(0, "#232b3e");
    bgGrad.addColorStop(1, "#121722");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // ボールの接地影
  const shadowGrad = ctx.createRadialGradient(
    cx,
    cy + baseRadius * 0.96,
    baseRadius * 0.1,
    cx,
    cy + baseRadius * 0.96,
    baseRadius * 0.88
  );
  const shadowColor =
    heartBgMode === "slate"
      ? "rgba(5, 8, 15, 0.45)"
      : heartBgMode === "mist"
      ? "rgba(30, 41, 59, 0.18)"
      : "rgba(60, 52, 38, 0.15)";
  shadowGrad.addColorStop(0, shadowColor);
  shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.save();
  ctx.translate(0, baseRadius * 0.96);
  ctx.scale(1, 0.24);
  ctx.translate(0, -baseRadius * 0.96);
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy + baseRadius * 0.96, baseRadius * 0.88, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. バネによる組織の張力計算
  for (const sp of heartSprings) {
    if (!sp.active) continue;
    const a = heartParticles[sp.a];
    const b = heartParticles[sp.b];

    const ax = a.hx + a.ox;
    const ay = a.hy + a.oy;
    const bx = b.hx + b.ox;
    const by = b.hy + b.oy;

    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const diff = (dist - sp.restLen) / dist;
    const stiffness = sp.stitched ? 0.065 : 0.035;

    const fx = dx * diff * stiffness;
    const fy = dy * diff * stiffness;

    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  // 3. 各粒子の微小な生命ゆらぎとスクリーン座標の更新
  for (const p of heartParticles) {
    const jitterAmp = p.state === "severed" ? 0.00035 : 0.00018;
    p.vx += Math.sin(heartTime * 2.2 + p.phase) * jitterAmp;
    p.vy += Math.cos(heartTime * 1.9 + p.phase * 1.3) * jitterAmp;

    const restore = p.state === "severed" ? 0.0055 : 0.034;
    p.vx -= p.ox * restore;
    p.vy -= p.oy * restore;

    p.vx *= 0.86;
    p.vy *= 0.86;

    p.ox += p.vx;
    p.oy += p.vy;

    p.sx = cx + (p.hx + p.ox) * baseRadius * pulseFactor;
    p.sy = cy + (p.hy + p.oy) * baseRadius * pulseFactor;
  }

  // 4. 縫合糸（Stitches）の描画
  ctx.lineCap = "round";
  for (const sp of heartSprings) {
    if (!sp.active || !sp.stitched) continue;
    const a = heartParticles[sp.a];
    const b = heartParticles[sp.b];

    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.strokeStyle = sp.threadColor || "#f59e0b";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  // 5. 約3,600個の粒子の描画（五角形＝赤、六角形＝白）
  const baseParticleR = Math.max(1.5, baseRadius * 0.0112);

  for (const p of heartParticles) {
    let r = baseParticleR;
    let color = p.baseColor;

    if (p.state === "severed") {
      const throb = 0.5 + 0.5 * Math.sin(heartTime * 5.5 + p.phase);
      color = throb > 0.5 ? "#fda4af" : "#fb7185";
      r *= 1.08;
    } else if (p.state === "stitched" && p.stitchColor) {
      color = p.stitchColor;
      r *= 1.05;
    }

    ctx.beginPath();
    ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if (!p.isPentagon && p.state === "intact" && heartBgMode !== "slate") {
      ctx.strokeStyle = "rgba(15, 23, 42, 0.14)";
      ctx.lineWidth = 0.45;
      ctx.stroke();
    }
  }
}

// ============================================================
// 6. ポインター統合イベント（全アプリ共通）
// ============================================================
canvas.addEventListener("pointerdown", (e) => {
  if (!activeAppId) return;
  const x = e.clientX;
  const y = e.clientY;

  if (activeAppId === "gravity") {
    isGravityPointerDown = true;
    spawnGravityTile(x, y);
    lastGravitySpawnTime = performance.now();
  } else if (activeAppId === "fusion") {
    isFusionPointerDown = true;
    for (let i = fusionTiles.length - 1; i >= 0; i--) {
      const t = fusionTiles[i];
      if (!t.removing && Math.hypot(x - t.x, y - t.y) <= t.r * 1.15) {
        draggedTile = t;
        t.vx = 0;
        t.vy = 0;
        t.pulse = 1.15;
        return;
      }
    }
    spawnFusionTile(x, y);
    lastFusionSpawnTime = performance.now();
  } else if (activeAppId === "pulse") {
    isHeartDragging = true;
    lastPointerPos = { x, y };

    if (e.pointerType === "mouse" || heartToolMode === "stitch") {
      stitchBatchIndex++;
      applyStitchSegment(x, y, x, y);
    } else {
      applySeverSegment(x, y, x, y);
    }
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!activeAppId) return;
  const x = e.clientX;
  const y = e.clientY;

  if (activeAppId === "gravity") {
    if (!isGravityPointerDown) return;
    const now = performance.now();
    if (now - lastGravitySpawnTime > 85) {
      spawnGravityTile(x, y);
      lastGravitySpawnTime = now;
    }
  } else if (activeAppId === "fusion") {
    if (!isFusionPointerDown) return;
    if (draggedTile) {
      draggedTile.vx = (x - draggedTile.x) * 0.35;
      draggedTile.vy = (y - draggedTile.y) * 0.35;
      draggedTile.x = x;
      draggedTile.y = y;
      return;
    }
    const now = performance.now();
    if (now - lastFusionSpawnTime > 180) {
      spawnFusionTile(x, y);
      lastFusionSpawnTime = now;
    }
  } else if (activeAppId === "pulse") {
    const prev = lastPointerPos || { x, y };

    if (e.pointerType === "mouse") {
      if (isHeartDragging) {
        applyStitchSegment(prev.x, prev.y, x, y);
      } else {
        applySeverSegment(prev.x, prev.y, x, y);
      }
    } else if (isHeartDragging) {
      if (heartToolMode === "sever") {
        applySeverSegment(prev.x, prev.y, x, y);
      } else {
        applyStitchSegment(prev.x, prev.y, x, y);
      }
    }

    lastPointerPos = { x, y };
  }
});

window.addEventListener("pointerup", () => {
  isGravityPointerDown = false;
  isFusionPointerDown = false;
  draggedTile = null;
  isHeartDragging = false;
  lastPointerPos = null;
});

// ============================================================
// 7. UIボタンイベント（Gravity Tiles / Geo Fusion / Pulse & Stitch）
// ============================================================
document.querySelectorAll(".theme-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".theme-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentTheme = THEMES[btn.dataset.theme];

    if (activeAppId === "gravity") {
      gravityTiles.forEach((t) => {
        t.color = getRandomGravityColor();
        t.pulse = 1.2;
      });
    } else if (activeAppId === "fusion") {
      fusionTiles.forEach((t) => {
        t.color = currentTheme.colors[t.level % currentTheme.colors.length];
        t.pulse = 1.18;
      });
    }
  });
});

const gravityBtn = document.getElementById("gravityBtn");
gravityBtn.addEventListener("click", () => {
  isZeroGravity = !isZeroGravity;
  gravityBtn.textContent = isZeroGravity ? "重力: OFF (無重力)" : "重力: ON";
  if (isZeroGravity) {
    const list = activeAppId === "gravity" ? gravityTiles : fusionTiles;
    list.forEach((t) => {
      t.vy -= 3 + Math.random() * 3.5;
      t.vx += (Math.random() - 0.5) * 4;
    });
  }
});

document.getElementById("tileSoundBtn").addEventListener("click", (e) => {
  isSoundOn = !isSoundOn;
  e.target.textContent = isSoundOn ? "音: ON" : "音: OFF";
});

document.getElementById("tileClearBtn").addEventListener("click", () => {
  if (activeAppId === "gravity") {
    gravityTiles = [];
    gravityRipples = [];
  } else if (activeAppId === "fusion") {
    fusionTiles = [];
    fusionEffects = [];
    mergeCount = 0;
    maxReachedLevel = 1;
    updateFusionStats();
  }
});

// Pulse & Stitch UI（英語のみ）
const toolModeBtn = document.getElementById("toolModeBtn");
toolModeBtn.addEventListener("click", () => {
  if (heartToolMode === "sever") {
    heartToolMode = "stitch";
    toolModeBtn.textContent = "Mode: STITCH";
    toolModeBtn.classList.remove("sever-active");
    toolModeBtn.classList.add("stitch-active");
  } else {
    heartToolMode = "sever";
    toolModeBtn.textContent = "Mode: SEVER";
    toolModeBtn.classList.remove("stitch-active");
    toolModeBtn.classList.add("sever-active");
  }
});

const bgModeBtn = document.getElementById("bgModeBtn");
bgModeBtn.addEventListener("click", () => {
  if (heartBgMode === "cream") {
    heartBgMode = "mist";
    bgModeBtn.textContent = "Bg: MIST";
  } else if (heartBgMode === "mist") {
    heartBgMode = "slate";
    bgModeBtn.textContent = "Bg: SLATE";
  } else {
    heartBgMode = "cream";
    bgModeBtn.textContent = "Bg: CREAM";
  }
});

document.getElementById("pulseSoundBtn").addEventListener("click", (e) => {
  isSoundOn = !isSoundOn;
  e.target.textContent = isSoundOn ? "Sound: ON" : "Sound: OFF";
});

document.getElementById("pulseResetBtn").addEventListener("click", () => {
  initPulseHeart();
});

// ============================================================
// 8. メインアニメーションループ
// ============================================================
function mainLoop() {
  if (!activeAppId) return;

  if (activeAppId === "gravity") {
    updateAndDrawGravityTiles();
  } else if (activeAppId === "fusion") {
    updateAndDrawFusion();
  } else if (activeAppId === "pulse") {
    updateAndDrawPulseHeart();
  }

  animationFrameId = requestAnimationFrame(mainLoop);
}