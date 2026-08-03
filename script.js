const PRESETS = [1, 5, 10, 25, 30];
const durationSlider = document.getElementById("durationSlider");
const sliderTicks = document.querySelectorAll(".slider-ticks span");
const flipClock = document.getElementById("flipClock");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const status = document.getElementById("status");
const themeToggle = document.getElementById("themeToggle");

function createFlipDigit(el) {
  const topNum = el.querySelector(".flip-static.top .num");
  const bottomNum = el.querySelector(".flip-static.bottom .num");
  const frontLeaf = el.querySelector(".flip-leaf.front");
  const backLeaf = el.querySelector(".flip-leaf.back");
  const frontNum = frontLeaf.querySelector(".num");
  const backNum = backLeaf.querySelector(".num");

  let current = "0";
  let backTimeoutId = null;

  function set(value) {
    if (value === current) return;
    const previous = current;
    current = value;

    clearTimeout(backTimeoutId);
    frontLeaf.classList.remove("animate");
    backLeaf.classList.remove("animate");
    frontLeaf.style.transition = "none";
    backLeaf.style.transition = "none";
    frontLeaf.style.transform = "rotateX(0deg)";
    backLeaf.style.transform = "rotateX(90deg)";
    frontNum.textContent = previous;
    backNum.textContent = value;
    topNum.textContent = value;

    void el.offsetWidth;

    frontLeaf.style.transition = "";
    backLeaf.style.transition = "";
    frontLeaf.style.transform = "";
    backLeaf.style.transform = "";
    frontLeaf.classList.add("animate");
    backLeaf.classList.add("animate");

    backTimeoutId = setTimeout(() => {
      bottomNum.textContent = value;
    }, 220);
  }

  return { set };
}

const flipDigits = {
  mTens: createFlipDigit(flipClock.querySelector('[data-role="mTens"]')),
  mOnes: createFlipDigit(flipClock.querySelector('[data-role="mOnes"]')),
  sTens: createFlipDigit(flipClock.querySelector('[data-role="sTens"]')),
  sOnes: createFlipDigit(flipClock.querySelector('[data-role="sOnes"]')),
};

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

let totalSeconds = 0;
let remainingSeconds = 0;
let endTime = null;
let intervalId = null;

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

function updateDisplay() {
  const m = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(remainingSeconds % 60).toString().padStart(2, "0");
  flipDigits.mTens.set(m[0]);
  flipDigits.mOnes.set(m[1]);
  flipDigits.sTens.set(s[0]);
  flipDigits.sOnes.set(s[1]);
}

function selectPreset(minutes) {
  clearInterval(intervalId);
  intervalId = null;
  totalSeconds = minutes * 60;
  remainingSeconds = totalSeconds;
  endTime = null;
  updateDisplay();
  sliderTicks.forEach((tick) => {
    tick.classList.toggle("active", Number(tick.dataset.minutes) === minutes);
  });
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = false;
  status.textContent = `${minutes} minute${minutes === 1 ? "" : "s"} ready`;
}

function tick() {
  remainingSeconds = Math.max(0, Math.round((endTime - Date.now()) / 1000));
  updateDisplay();
  if (remainingSeconds <= 0) {
    clearInterval(intervalId);
    intervalId = null;
    onTimerComplete();
  }
}

function startTimer() {
  if (remainingSeconds <= 0) return;
  endTime = Date.now() + remainingSeconds * 1000;
  intervalId = setInterval(tick, 1000);
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  durationSlider.disabled = true;
  status.textContent = "Running…";
}

function pauseTimer() {
  clearInterval(intervalId);
  intervalId = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  durationSlider.disabled = false;
  status.textContent = "Paused";
}

function resetTimer() {
  clearInterval(intervalId);
  intervalId = null;
  remainingSeconds = totalSeconds;
  endTime = null;
  updateDisplay();
  startBtn.disabled = totalSeconds === 0;
  pauseBtn.disabled = true;
  durationSlider.disabled = false;
  status.textContent = totalSeconds ? "Reset" : "Pick a duration to begin";
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
  startBtn.disabled = true;
  pauseBtn.disabled = true;
  durationSlider.disabled = false;
  status.textContent = "Time's up!";

  playAlertSound();
  launchConfetti();

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Timer complete", {
      body: "Your timer has finished.",
      requireInteraction: true,
    });
  }

  document.title = "⏰ Time's up! — Timer";
  window.addEventListener("focus", () => (document.title = "Timer"), { once: true });
}

durationSlider.addEventListener("input", () => {
  selectPreset(PRESETS[Number(durationSlider.value)]);
});
selectPreset(PRESETS[Number(durationSlider.value)]);

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
