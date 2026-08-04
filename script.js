import { FlipDigit } from "./js/flip-digit.js?v=2";
import { TimerController } from "./js/timer-controller.js?v=1";

const PRESETS = [1, 5, 10, 25, 30];
const durationSlider = document.getElementById("durationSlider");
const sliderTicks = document.querySelectorAll(".slider-ticks span");
const sizeSlider = document.getElementById("sizeSlider");
const flipClock = document.getElementById("flipClock");
const playPauseBtn = document.getElementById("playPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const themeToggle = document.getElementById("themeToggle");
const fontToggle = document.getElementById("fontToggle");
const colorSwatches = document.querySelectorAll(".color-swatch");
const paletteToggle = document.getElementById("paletteToggle");
const colorDropdown = document.getElementById("colorDropdown");

function applySize(percent) {
  document.documentElement.style.setProperty("--size-scale", percent / 100);
}

const savedSize = localStorage.getItem("timer-size");
if (savedSize) sizeSlider.value = savedSize;
applySize(Number(sizeSlider.value));

sizeSlider.addEventListener("input", () => {
  applySize(Number(sizeSlider.value));
  localStorage.setItem("timer-size", sizeSlider.value);
});

const flipDigits = {
  mTens: new FlipDigit(flipClock.querySelector('[data-role="mTens"]')),
  mOnes: new FlipDigit(flipClock.querySelector('[data-role="mOnes"]')),
  sTens: new FlipDigit(flipClock.querySelector('[data-role="sTens"]')),
  sOnes: new FlipDigit(flipClock.querySelector('[data-role="sOnes"]')),
};

const timerController = new TimerController({
  digits: flipDigits,
  onComplete: () => onTimerComplete(),
});

const confettiCanvas = document.getElementById("confettiCanvas");
const confettiCtx = confettiCanvas.getContext("2d");
let confettiAnimationId = null;

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfettiCanvas);
resizeConfettiCanvas();

function launchConfetti() {
  const colors = ["#6366f1", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#ec4899"];
  const particles = Array.from({ length: 160 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: -20 - Math.random() * 300,
    size: 6 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: 2.5 + Math.random() * 3,
    speedX: -2 + Math.random() * 4,
    rotation: Math.random() * 360,
    rotationSpeed: -8 + Math.random() * 16,
  }));

  const duration = 3500;
  let elapsed = 0;
  let lastTime = performance.now();

  function frame(now) {
    const dt = now - lastTime;
    lastTime = now;
    elapsed += dt;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;
      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.rotation * Math.PI) / 180);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      confettiCtx.restore();
    });

    if (elapsed < duration) {
      confettiAnimationId = requestAnimationFrame(frame);
    } else {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiAnimationId = null;
    }
  }

  if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
  confettiAnimationId = requestAnimationFrame(frame);
}

function launchBalloons() {
  const colors = ["#10b981", "#34d399", "#6ee7b7", "#059669", "#a7f3d0"];
  const count = 14;
  const particles = Array.from({ length: count }, (_, i) => ({
    x: (confettiCanvas.width / (count + 1)) * (i + 1) + (Math.random() * 40 - 20),
    y: confettiCanvas.height + 60 + Math.random() * 300,
    size: 26 + Math.random() * 18,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: 1.2 + Math.random() * 1.1,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.02 + Math.random() * 0.02,
    swayAmount: 15 + Math.random() * 15,
  }));

  const duration = 4500;
  let elapsed = 0;
  let lastTime = performance.now();

  function frame(now) {
    const dt = now - lastTime;
    lastTime = now;
    elapsed += dt;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    particles.forEach((p) => {
      p.y -= p.speedY * (dt / 16.67);
      p.sway += p.swaySpeed * (dt / 16.67);
      const x = p.x + Math.sin(p.sway) * p.swayAmount;

      confettiCtx.strokeStyle = "rgba(0, 0, 0, 0.25)";
      confettiCtx.lineWidth = 1.5;
      confettiCtx.beginPath();
      confettiCtx.moveTo(x, p.y + p.size * 0.9);
      confettiCtx.lineTo(x, p.y + p.size * 0.9 + 30);
      confettiCtx.stroke();

      confettiCtx.fillStyle = p.color;
      confettiCtx.beginPath();
      confettiCtx.ellipse(x, p.y, p.size * 0.72, p.size, 0, 0, Math.PI * 2);
      confettiCtx.fill();

      confettiCtx.beginPath();
      confettiCtx.moveTo(x - 4, p.y + p.size * 0.85);
      confettiCtx.lineTo(x + 4, p.y + p.size * 0.85);
      confettiCtx.lineTo(x, p.y + p.size * 0.95);
      confettiCtx.closePath();
      confettiCtx.fill();

      confettiCtx.fillStyle = "rgba(255, 255, 255, 0.35)";
      confettiCtx.beginPath();
      confettiCtx.ellipse(x - p.size * 0.25, p.y - p.size * 0.35, p.size * 0.18, p.size * 0.28, -0.4, 0, Math.PI * 2);
      confettiCtx.fill();
    });

    if (elapsed < duration && particles.some((p) => p.y > -120)) {
      confettiAnimationId = requestAnimationFrame(frame);
    } else {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiAnimationId = null;
    }
  }

  if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
  confettiAnimationId = requestAnimationFrame(frame);
}

function launchSparkles() {
  const colors = ["#f59e0b", "#fcd34d", "#fde68a", "#ffffff"];
  const count = 90;
  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * confettiCanvas.height,
    size: 4 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 1400,
    life: 600 + Math.random() * 500,
  }));

  const duration = 3200;
  let elapsed = 0;
  let lastTime = performance.now();

  function drawSparkle(cx, cy, r, color, alpha) {
    confettiCtx.save();
    confettiCtx.globalAlpha = alpha;
    confettiCtx.strokeStyle = color;
    confettiCtx.lineWidth = 1.4;
    confettiCtx.beginPath();
    confettiCtx.moveTo(cx, cy - r);
    confettiCtx.lineTo(cx, cy + r);
    confettiCtx.moveTo(cx - r, cy);
    confettiCtx.lineTo(cx + r, cy);
    confettiCtx.moveTo(cx - r * 0.6, cy - r * 0.6);
    confettiCtx.lineTo(cx + r * 0.6, cy + r * 0.6);
    confettiCtx.moveTo(cx - r * 0.6, cy + r * 0.6);
    confettiCtx.lineTo(cx + r * 0.6, cy - r * 0.6);
    confettiCtx.stroke();
    confettiCtx.restore();
  }

  function frame(now) {
    const dt = now - lastTime;
    lastTime = now;
    elapsed += dt;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    particles.forEach((p) => {
      if (elapsed < p.delay) return;
      const t = elapsed - p.delay;
      if (t > p.life) return;
      const progress = t / p.life;
      const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      drawSparkle(p.x, p.y, p.size * (0.6 + 0.4 * Math.sin(progress * Math.PI)), p.color, Math.max(0, alpha));
    });

    if (elapsed < duration) {
      confettiAnimationId = requestAnimationFrame(frame);
    } else {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiAnimationId = null;
    }
  }

  if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
  confettiAnimationId = requestAnimationFrame(frame);
}

function launchCompletionEffect() {
  const accent = document.documentElement.getAttribute("data-accent");
  if (accent === "emerald") {
    launchBalloons();
  } else if (accent === "amber") {
    launchSparkles();
  } else {
    launchConfetti();
  }
}

if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

const savedTheme = localStorage.getItem("timer-theme");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
applyTheme(savedTheme || systemTheme);

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  localStorage.setItem("timer-theme", next);
  applyTheme(next);
});

function applyFont(font) {
  document.documentElement.setAttribute("data-font", font);
}

const FONTS = ["orbitron", "bebas", "pixel"];
const savedFont = localStorage.getItem("timer-font");
applyFont(savedFont || FONTS[0]);

fontToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-font");
  const next = FONTS[(FONTS.indexOf(current) + 1) % FONTS.length];
  localStorage.setItem("timer-font", next);
  applyFont(next);
});

function applyAccent(accent) {
  document.documentElement.setAttribute("data-accent", accent);
  colorSwatches.forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.accent === accent);
  });
}

const savedAccent = localStorage.getItem("timer-accent");
applyAccent(savedAccent || "indigo");

colorSwatches.forEach((swatch) => {
  swatch.addEventListener("click", () => {
    const accent = swatch.dataset.accent;
    localStorage.setItem("timer-accent", accent);
    applyAccent(accent);

    if (accent === "cyberpunk") {
      localStorage.setItem("timer-theme", "dark");
      applyTheme("dark");
      localStorage.setItem("timer-font", "pixel");
      applyFont("pixel");
    }

    colorDropdown.classList.remove("open");
  });
});

paletteToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  colorDropdown.classList.toggle("open");
});

document.addEventListener("click", (event) => {
  if (!colorDropdown.contains(event.target) && event.target !== paletteToggle) {
    colorDropdown.classList.remove("open");
  }
});

function setPlayPauseIcon(running) {
  playPauseBtn.classList.toggle("is-running", running);
  const label = running ? "Pause" : "Start";
  playPauseBtn.setAttribute("aria-label", label);
  playPauseBtn.setAttribute("title", label);
}

function selectPreset(minutes) {
  timerController.setDuration(minutes * 60);
  sliderTicks.forEach((tick) => {
    tick.classList.toggle("active", Number(tick.dataset.minutes) === minutes);
  });
  playPauseBtn.disabled = false;
  setPlayPauseIcon(false);
  resetBtn.disabled = false;
}

function startTimer() {
  if (!timerController.start()) return;
  setPlayPauseIcon(true);
  durationSlider.disabled = true;
}

function pauseTimer() {
  timerController.pause();
  setPlayPauseIcon(false);
  durationSlider.disabled = false;
}

function togglePlayPause() {
  if (timerController.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function resetTimer() {
  timerController.reset();
  playPauseBtn.disabled = timerController.remainingSeconds === 0;
  setPlayPauseIcon(false);
  durationSlider.disabled = false;
}

function playAlertSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const beepTimes = [0, 0.4, 0.8];
  beepTimes.forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + 0.35);
  });
}

function onTimerComplete() {
  playPauseBtn.disabled = true;
  setPlayPauseIcon(false);
  durationSlider.disabled = false;

  playAlertSound();
  launchCompletionEffect();

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Timer complete", {
      body: "Your timer has finished.",
      requireInteraction: true,
    });
  }

  document.title = "⏰ Time's up! — Timer";
  window.addEventListener("focus", () => (document.title = "Timer"), { once: true });

  setTimeout(resetTimer, 2500);
}

durationSlider.addEventListener("input", () => {
  selectPreset(PRESETS[Number(durationSlider.value)]);
});
selectPreset(PRESETS[Number(durationSlider.value)]);

playPauseBtn.addEventListener("click", togglePlayPause);
resetBtn.addEventListener("click", resetTimer);
