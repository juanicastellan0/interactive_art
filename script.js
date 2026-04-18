const canvas = document.querySelector("#scene");
const ctx = canvas.getContext("2d");

const hud = document.querySelector("#hud");
const tensionInput = document.querySelector("#tension");
const driveInput = document.querySelector("#drive");
const micButton = document.querySelector("#micButton");
const trackButton = document.querySelector("#trackButton");
const demoButton = document.querySelector("#demoButton");
const stopAudioButton = document.querySelector("#stopAudioButton");
const audioFileInput = document.querySelector("#audioFile");
const audioStatus = document.querySelector("#audioStatus");
const paletteButton = document.querySelector("#paletteButton");
const modeButton = document.querySelector("#modeButton");
const clearButton = document.querySelector("#clearButton");
const pauseButton = document.querySelector("#pauseButton");
const meta = document.querySelector("#meta");

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioElement = new Audio();
audioElement.preload = "auto";
audioElement.loop = true;

const palettes = [
  {
    name: "Solar",
    bg1: "#120d08",
    bg2: "#251a12",
    panel: "rgba(18, 15, 13, 0.6)",
    accent: "#ff9652",
    fade: "rgba(18, 13, 8, 0.085)",
    wells: ["#ffc56b", "#ff6d47"],
    colors: [
      [255, 111, 76],
      [255, 168, 89],
      [255, 235, 185],
    ],
  },
  {
    name: "Reef",
    bg1: "#061319",
    bg2: "#123040",
    panel: "rgba(8, 18, 23, 0.58)",
    accent: "#66e3d3",
    fade: "rgba(6, 19, 25, 0.08)",
    wells: ["#8ef7f0", "#4fb0ff"],
    colors: [
      [90, 245, 222],
      [101, 170, 255],
      [233, 255, 248],
    ],
  },
  {
    name: "Nocturne",
    bg1: "#100814",
    bg2: "#1d1038",
    panel: "rgba(16, 8, 20, 0.56)",
    accent: "#f08bff",
    fade: "rgba(14, 8, 20, 0.075)",
    wells: ["#ffb5fb", "#9381ff"],
    colors: [
      [141, 129, 255],
      [240, 139, 255],
      [255, 242, 250],
    ],
  },
  {
    name: "Verdigris",
    bg1: "#08140c",
    bg2: "#1a2916",
    panel: "rgba(9, 18, 12, 0.58)",
    accent: "#a5f57b",
    fade: "rgba(8, 20, 12, 0.08)",
    wells: ["#f6fd92", "#5fd97a"],
    colors: [
      [95, 217, 122],
      [165, 245, 123],
      [244, 255, 221],
    ],
  },
];

const visualModes = [
  {
    id: "flow",
    name: "Flow",
    density: 1,
    spawnBias: 0.72,
    ageMin: 120,
    ageMax: 320,
    widthMin: 0.6,
    widthMax: 2.6,
    dragBase: 0.9,
    dragByEnergy: 0.08,
    forceBase: 0.022,
    forceByEnergy: 0.026,
    forceByHigh: 0.01,
    trailAlpha(elapsed) {
      return clamp(0.09 - state.audio.energy * 0.045 + elapsed * 0.16, 0.03, 0.11);
    },
    sampleField: sampleFlowField,
    drawBackdrop: drawSpectrumVeil,
    drawParticle: drawFlowParticle,
    drawOverlay: drawFlowOverlay,
  },
  {
    id: "kaleido",
    name: "Kaleido",
    density: 0.34,
    spawnBias: 0.78,
    ageMin: 110,
    ageMax: 240,
    widthMin: 0.55,
    widthMax: 1.55,
    dragBase: 0.9,
    dragByEnergy: 0.07,
    forceBase: 0.024,
    forceByEnergy: 0.018,
    forceByHigh: 0.02,
    trailAlpha(elapsed) {
      return clamp(0.14 - state.audio.energy * 0.06 + elapsed * 0.18, 0.04, 0.14);
    },
    sampleField: sampleKaleidoField,
    drawBackdrop: drawRadialVeil,
    drawParticle: drawKaleidoParticle,
    drawOverlay: drawKaleidoOverlay,
  },
  {
    id: "grid",
    name: "Pulse Grid",
    density: 0.52,
    spawnBias: 0.58,
    ageMin: 110,
    ageMax: 260,
    widthMin: 0.7,
    widthMax: 1.8,
    dragBase: 0.92,
    dragByEnergy: 0.06,
    forceBase: 0.02,
    forceByEnergy: 0.018,
    forceByHigh: 0.006,
    trailAlpha(elapsed) {
      return clamp(0.16 - state.audio.energy * 0.07 + elapsed * 0.18, 0.045, 0.16);
    },
    sampleField: samplePulseGridField,
    drawBackdrop: drawPulseGrid,
    drawParticle: drawGridParticle,
    drawOverlay: drawGridOverlay,
  },
  {
    id: "bloom",
    name: "Bloom",
    density: 0.6,
    spawnBias: 0.86,
    ageMin: 80,
    ageMax: 180,
    widthMin: 0.8,
    widthMax: 2.1,
    dragBase: 0.87,
    dragByEnergy: 0.08,
    forceBase: 0.018,
    forceByEnergy: 0.014,
    forceByHigh: 0.004,
    trailAlpha(elapsed) {
      return clamp(0.18 - state.audio.energy * 0.09 + elapsed * 0.15, 0.05, 0.18);
    },
    sampleField: sampleBloomField,
    drawBackdrop: drawMistVeil,
    drawParticle: drawBloomParticle,
    drawOverlay: drawBloomOverlay,
  },
  {
    id: "constellation",
    name: "Constellation",
    density: 0.42,
    spawnBias: 0.64,
    ageMin: 150,
    ageMax: 340,
    widthMin: 0.7,
    widthMax: 1.5,
    dragBase: 0.94,
    dragByEnergy: 0.05,
    forceBase: 0.014,
    forceByEnergy: 0.01,
    forceByHigh: 0.006,
    trailAlpha(elapsed) {
      return clamp(0.2 - state.audio.energy * 0.06 + elapsed * 0.14, 0.05, 0.2);
    },
    sampleField: sampleConstellationField,
    drawBackdrop: drawStarfield,
    drawParticle: drawConstellationParticle,
    drawOverlay: drawConstellationOverlay,
  },
];

const state = {
  width: 0,
  height: 0,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  particles: [],
  reactors: [],
  paletteIndex: 0,
  modeIndex: 0,
  tension: Number(tensionInput.value),
  drive: Number(driveInput.value),
  paused: false,
  hiddenHud: false,
  animationFrame: 0,
  lastTime: 0,
  audio: {
    context: null,
    analyser: null,
    outputGain: null,
    mediaElementSource: null,
    sourceNode: null,
    cleanup: null,
    stream: null,
    objectUrl: null,
    mode: "idle",
    freqData: null,
    timeData: null,
    spectrum: Array.from({ length: 48 }, () => 0),
    bass: 0,
    mids: 0,
    high: 0,
    energy: 0,
    presence: 0,
    centroid: 0.5,
    pulse: 0,
    previousBass: 0,
    status: "Source idle. Start a signal and the field will lock onto it.",
  },
};

window.lumenState = state;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function getCurrentMode() {
  return visualModes[state.modeIndex];
}

function setStatus(message) {
  state.audio.status = message;
  audioStatus.textContent = message;
}

function disconnectNode(node) {
  if (!node) {
    return;
  }

  try {
    node.disconnect();
  } catch {
    // Node may already be disconnected.
  }
}

async function ensureAudioReady() {
  if (!AudioContextClass) {
    throw new Error("This browser does not expose the Web Audio API.");
  }

  if (!state.audio.context) {
    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    const outputGain = context.createGain();

    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.82;
    outputGain.gain.value = 0.7;
    outputGain.connect(context.destination);

    state.audio.context = context;
    state.audio.analyser = analyser;
    state.audio.outputGain = outputGain;
    state.audio.freqData = new Uint8Array(analyser.frequencyBinCount);
    state.audio.timeData = new Uint8Array(analyser.frequencyBinCount);
  }

  if (state.audio.context.state === "suspended") {
    await state.audio.context.resume();
  }
}

function particleCount() {
  const area = state.width * state.height;
  const baseCount = Math.max(700, Math.min(2200, Math.floor(area / 1150)));
  return Math.max(260, Math.floor(baseCount * getCurrentMode().density));
}

function chooseReactor() {
  if (!state.reactors.length) {
    return null;
  }

  const weighted = state.reactors.map((reactor) => reactor.band + 0.18);
  const total = weighted.reduce((sum, value) => sum + value, 0);
  let threshold = Math.random() * total;

  for (let i = 0; i < state.reactors.length; i += 1) {
    threshold -= weighted[i];
    if (threshold <= 0) {
      return state.reactors[i];
    }
  }

  return state.reactors[state.reactors.length - 1];
}

function makeParticle(firstPass = false) {
  const mode = getCurrentMode();
  const burst = !firstPass && Math.random() < mode.spawnBias;
  const source = burst ? chooseReactor() : null;
  const offset = source ? source.radius * 1.4 : 0;
  const x = source ? source.x + rand(-offset, offset) : rand(0, state.width);
  const y = source ? source.y + rand(-offset, offset) : rand(0, state.height);

  return {
    x,
    y,
    px: x,
    py: y,
    vx: rand(-0.25, 0.25),
    vy: rand(-0.25, 0.25),
    age: 0,
    maxAge: rand(mode.ageMin, mode.ageMax),
    width: rand(mode.widthMin, mode.widthMax),
    tint: Math.random(),
  };
}

function seedParticles() {
  state.particles = Array.from({ length: particleCount() }, () => makeParticle(true));
}

function fitCanvas() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  seedParticles();
  clearFrame(1);
}

function clearFrame(alpha = 0.08) {
  const palette = palettes[state.paletteIndex];
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = palette.fade.replace(/[\d.]+\)$/u, `${alpha})`);
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.restore();
}

function pickColor(mix) {
  const colors = palettes[state.paletteIndex].colors;
  const scaled = mix * (colors.length - 1);
  const index = Math.floor(scaled);
  const next = Math.min(colors.length - 1, index + 1);
  const t = scaled - index;
  const a = colors[index];
  const b = colors[next];
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

function averageBins(buffer, start, end) {
  let total = 0;
  const safeStart = clamp(Math.floor(start), 0, buffer.length - 1);
  const safeEnd = clamp(Math.floor(end), safeStart + 1, buffer.length);

  for (let index = safeStart; index < safeEnd; index += 1) {
    total += buffer[index];
  }

  return total / (safeEnd - safeStart);
}

function getAudioCenter(t) {
  const { centroid, presence, pulse, bass, mids } = state.audio;
  return {
    x:
      state.width *
      (0.5 +
        (centroid - 0.5) * 0.24 +
        Math.sin(t * 0.27) * 0.03 * (presence + pulse * 0.22)),
    y:
      state.height *
      (0.5 +
        Math.cos(t * 0.23) * 0.045 * (presence + 0.18) -
        bass * 0.06 +
        mids * 0.028),
  };
}

function getReactorInfluence(x, y, pullScale = 1, swirlScale = 1) {
  let fx = 0;
  let fy = 0;

  for (const reactor of state.reactors) {
    const dx = reactor.x - x;
    const dy = reactor.y - y;
    const distance = dx * dx + dy * dy + reactor.radius * reactor.radius * 18;
    const pull = (26000 * reactor.polarity * reactor.strength * state.tension * pullScale) / distance;
    const spin = (17500 * reactor.swirl * state.tension * swirlScale) / distance;

    fx += dx * pull - dy * spin;
    fy += dy * pull + dx * spin;
  }

  return { x: fx, y: fy };
}

function decayAudioState() {
  state.audio.bass = lerp(state.audio.bass, 0, 0.08);
  state.audio.mids = lerp(state.audio.mids, 0, 0.08);
  state.audio.high = lerp(state.audio.high, 0, 0.08);
  state.audio.energy = lerp(state.audio.energy, 0, 0.08);
  state.audio.presence = lerp(state.audio.presence, 0, 0.08);
  state.audio.pulse *= 0.92;

  for (let i = 0; i < state.audio.spectrum.length; i += 1) {
    state.audio.spectrum[i] = lerp(state.audio.spectrum[i], 0, 0.08);
  }
}

function readAudioFeatures() {
  if (!state.audio.analyser || state.audio.mode === "idle") {
    decayAudioState();
    return;
  }

  const { analyser, freqData, timeData } = state.audio;
  analyser.getByteFrequencyData(freqData);
  analyser.getByteTimeDomainData(timeData);

  const drive = state.drive;
  const bassRaw = averageBins(freqData, 1, freqData.length * 0.08) / 255;
  const midsRaw = averageBins(freqData, freqData.length * 0.08, freqData.length * 0.42) / 255;
  const highRaw = averageBins(freqData, freqData.length * 0.42, freqData.length * 0.88) / 255;
  const energyRaw = averageBins(freqData, 0, freqData.length * 0.92) / 255;

  let waveformMotion = 0;
  let weight = 0;
  let weightedIndex = 0;

  for (let i = 0; i < timeData.length; i += 1) {
    waveformMotion += Math.abs((timeData[i] - 128) / 128);
  }

  for (let i = 0; i < freqData.length; i += 1) {
    const amount = freqData[i] / 255;
    weight += amount;
    weightedIndex += amount * (i / freqData.length);
  }

  const centroid = weight > 0 ? weightedIndex / weight : 0.5;
  const bass = Math.pow(clamp(bassRaw * drive * 1.25, 0, 1), 0.88);
  const mids = Math.pow(clamp(midsRaw * drive * 1.15, 0, 1), 0.95);
  const high = Math.pow(clamp(highRaw * drive * 1.4, 0, 1), 1.02);
  const presence = clamp((waveformMotion / timeData.length) * drive * 2.4, 0, 1);
  const energy = clamp(energyRaw * drive * 1.15, 0, 1);
  const transient = Math.max(0, bass - state.audio.previousBass * 0.84);

  state.audio.bass = lerp(state.audio.bass, bass, 0.22);
  state.audio.mids = lerp(state.audio.mids, mids, 0.2);
  state.audio.high = lerp(state.audio.high, high, 0.22);
  state.audio.presence = lerp(state.audio.presence, presence, 0.16);
  state.audio.energy = lerp(state.audio.energy, energy, 0.18);
  state.audio.centroid = lerp(state.audio.centroid, centroid, 0.12);
  state.audio.pulse = Math.max(state.audio.pulse * 0.9, transient * 4.6, state.audio.energy * 0.18);
  state.audio.previousBass = state.audio.bass;

  for (let i = 0; i < state.audio.spectrum.length; i += 1) {
    const start = (i / state.audio.spectrum.length) * freqData.length;
    const end = ((i + 1) / state.audio.spectrum.length) * freqData.length;
    const band = clamp((averageBins(freqData, start, end) / 255) * drive * 1.25, 0, 1);
    state.audio.spectrum[i] = lerp(state.audio.spectrum[i], band, 0.22);
  }
}

function buildReactors(t) {
  const { bass, mids, high, energy, pulse, centroid, presence } = state.audio;
  const centerX = state.width * (0.5 + (centroid - 0.5) * 0.34);
  const centerY = state.height * (0.5 + Math.sin(t * 0.45) * 0.04 * (presence + 0.2));
  const spread = state.width * (0.17 + mids * 0.17);
  const topShift = Math.sin(t * (1 + high * 2.4)) * state.width * 0.07 * (high + 0.15);

  state.reactors = [
    {
      x: centerX,
      y: state.height * (0.74 - bass * 0.2),
      polarity: 1,
      strength: 0.9 + bass * 3.1,
      swirl: 0.8 + pulse * 1.8,
      radius: 26 + bass * 60,
      band: bass,
    },
    {
      x: centerX - spread,
      y: centerY + Math.sin(t * 1.3) * state.height * 0.09,
      polarity: -1,
      strength: 0.7 + mids * 2.1,
      swirl: -(0.8 + mids * 1.2),
      radius: 18 + mids * 44,
      band: mids,
    },
    {
      x: centerX + spread,
      y: centerY + Math.cos(t * 1.15) * state.height * 0.09,
      polarity: 1,
      strength: 0.7 + mids * 2,
      swirl: 0.9 + high * 1.4,
      radius: 18 + mids * 44,
      band: mids,
    },
    {
      x: state.width * (0.5 + topShift / state.width + (centroid - 0.5) * 0.22),
      y: state.height * (0.23 + high * 0.12),
      polarity: -1,
      strength: 0.6 + high * 2.5,
      swirl: 1.2 + high * 1.8,
      radius: 16 + high * 40,
      band: high,
    },
    {
      x: state.width * (0.5 + Math.cos(t * 0.65) * 0.16 * (energy + 0.2)),
      y: state.height * (0.5 + Math.sin(t * 0.8) * 0.12 * (presence + 0.2)),
      polarity: pulse > 0.42 ? -1 : 1,
      strength: 0.55 + energy * 1.8,
      swirl: 0.5 + pulse * 2.1,
      radius: 14 + energy * 34,
      band: energy,
    },
  ];
}

function sampleFlowField(x, y, t) {
  const nx = x / state.width - 0.5;
  const ny = y / state.height - 0.5;
  const { bass, mids, high, energy, centroid, pulse } = state.audio;
  const drift = (centroid - 0.5) * 2.2;

  const wave =
    Math.sin(nx * (7 + high * 11) - t * (0.45 + bass * 1.35)) +
    Math.cos(ny * (8 + mids * 9.5) + t * (0.32 + high * 1.2)) +
    Math.sin((nx + ny) * (5.6 + bass * 8.2) + t * (0.28 + energy * 1.6));

  let fx = Math.cos(wave * Math.PI);
  let fy = Math.sin(wave * Math.PI);

  fx += -ny * (0.7 + mids * 1.5 + pulse * 0.8) + drift * 0.42;
  fy += nx * (0.7 + mids * 1.5 + pulse * 0.8) + Math.sin(t * 0.7 + x * 0.002) * 0.08;

  const reactor = getReactorInfluence(x, y, 1, 1);
  fx += reactor.x;
  fy += reactor.y;

  return { x: fx, y: fy };
}

function sampleKaleidoField(x, y, t) {
  const center = getAudioCenter(t);
  const dx = x - center.x;
  const dy = y - center.y;
  const radius = Math.hypot(dx, dy) + 1;
  const angle = Math.atan2(dy, dx);
  const { bass, mids, high, energy, pulse } = state.audio;
  const petals = 4 + Math.round(high * 6 + pulse * 2.5);
  const fold = Math.sin(angle * petals + t * (0.9 + bass * 2.4));
  const banding = Math.cos(radius * (0.014 + mids * 0.009) - t * (0.8 + high * 1.7));
  let fx = (-dy / radius) * (1.3 + high * 2.2 + pulse * 1.4);
  let fy = (dx / radius) * (1.3 + high * 2.2 + pulse * 1.4);

  fx += (dx / radius) * fold * (0.8 + bass * 1.5);
  fy += (dy / radius) * fold * (0.8 + bass * 1.5);
  fx += (dx / radius) * banding * (0.7 + energy * 1.3);
  fy += (dy / radius) * banding * (0.7 + energy * 1.3);

  const reactor = getReactorInfluence(x, y, 0.82, 1.35);
  fx += reactor.x;
  fy += reactor.y;

  return { x: fx, y: fy };
}

function samplePulseGridField(x, y, t) {
  const center = getAudioCenter(t);
  const { bass, mids, high, energy, pulse, centroid } = state.audio;
  const cell = 32 + (1 - energy) * 22 + mids * 12;
  const gx = (x - center.x) / cell;
  const gy = (y - center.y) / cell;
  const waveX =
    Math.sin(gy * (1.4 + high * 2.1) + t * (1.1 + high * 1.8)) +
    Math.cos(gx * 0.8 - t * (0.55 + bass * 1.5));
  const waveY =
    Math.cos(gx * (1.2 + mids * 1.6) - t * (0.75 + bass * 1.1)) -
    Math.sin(gy * 0.95 + t * (0.5 + high * 1.3));

  let fx = Math.sign(waveX) * (0.65 + Math.abs(waveX)) + (-gy) * (0.08 + pulse * 0.4);
  let fy = Math.sign(waveY) * (0.65 + Math.abs(waveY)) + gx * (0.08 + pulse * 0.4);

  fx += (centroid - 0.5) * 1.4;
  fy += Math.sin(t * 0.65 + gx) * 0.32;

  const reactor = getReactorInfluence(x, y, 0.55, 0.45);
  fx += reactor.x;
  fy += reactor.y;

  return { x: fx, y: fy };
}

function sampleBloomField(x, y, t) {
  const center = getAudioCenter(t);
  const dx = x - center.x;
  const dy = y - center.y;
  const radius = Math.hypot(dx, dy) + 1;
  const angle = Math.atan2(dy, dx);
  const { bass, mids, high, energy, pulse } = state.audio;
  const petals = 3 + Math.round(mids * 4);
  const ring = Math.sin(radius * 0.028 - t * (2 + bass * 2.5));
  const blossom = Math.cos(angle * petals - t * (0.45 + high * 1.2));
  let fx = (dx / radius) * ring * (1.5 + bass * 2.3 + pulse * 1.2);
  let fy = (dy / radius) * ring * (1.5 + bass * 2.3 + pulse * 1.2);

  fx += (-dy / radius) * blossom * (0.6 + mids * 1.4 + energy * 0.5);
  fy += (dx / radius) * blossom * (0.6 + mids * 1.4 + energy * 0.5);

  const reactor = getReactorInfluence(x, y, 1.2, 0.9);
  fx += reactor.x;
  fy += reactor.y;

  return { x: fx, y: fy };
}

function sampleConstellationField(x, y, t) {
  const center = getAudioCenter(t);
  const dx = x - center.x;
  const dy = y - center.y;
  const radius = Math.hypot(dx, dy) + 1;
  const { mids, high, centroid, pulse } = state.audio;
  let fx = (-dy / (radius + 90)) * (18 + mids * 28);
  let fy = (dx / (radius + 90)) * (18 + mids * 28);

  fx += Math.sin(t * 0.7 + y * 0.006) * (0.55 + high * 1.1) + (centroid - 0.5) * 1.2;
  fy += Math.cos(t * 0.55 + x * 0.006) * (0.55 + high * 1.1) + pulse * 0.35;

  const reactor = getReactorInfluence(x, y, 0.7, 0.65);
  fx += reactor.x;
  fy += reactor.y;

  return { x: fx, y: fy };
}

function drawMirroredSegment(x1, y1, x2, y2, center, copies) {
  const rel1x = x1 - center.x;
  const rel1y = y1 - center.y;
  const rel2x = x2 - center.x;
  const rel2y = y2 - center.y;
  const step = (Math.PI * 2) / copies;

  for (let i = 0; i < copies; i += 1) {
    const angle = step * i;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const ax1 = center.x + rel1x * cos - rel1y * sin;
    const ay1 = center.y + rel1x * sin + rel1y * cos;
    const ax2 = center.x + rel2x * cos - rel2y * sin;
    const ay2 = center.y + rel2x * sin + rel2y * cos;

    ctx.beginPath();
    ctx.moveTo(ax1, ay1);
    ctx.lineTo(ax2, ay2);
    ctx.stroke();

    const bx1 = center.x + rel1x * cos + rel1y * sin;
    const by1 = center.y + rel1x * sin - rel1y * cos;
    const bx2 = center.x + rel2x * cos + rel2y * sin;
    const by2 = center.y + rel2x * sin - rel2y * cos;

    ctx.beginPath();
    ctx.moveTo(bx1, by1);
    ctx.lineTo(bx2, by2);
    ctx.stroke();
  }
}

function drawFlowParticle(particle, detail) {
  const { speed, t, centroid, energy, pulse } = detail;
  const alpha = Math.min(0.34, 0.03 + speed * 0.013 + energy * 0.11 + pulse * 0.08);
  const mix = (particle.tint + t * (0.015 + energy * 0.06) + centroid * 0.36 + speed * 0.03) % 1;
  const [r, g, b] = pickColor(mix);

  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  ctx.lineWidth = particle.width + Math.min(speed * 0.16 + pulse * 0.8, 2.2);
  ctx.beginPath();
  ctx.moveTo(particle.px, particle.py);
  ctx.lineTo(particle.x, particle.y);
  ctx.stroke();
}

function drawKaleidoParticle(particle, detail) {
  const { center, speed, energy, pulse, high, t } = detail;
  const alpha = Math.min(0.18, 0.025 + speed * 0.009 + energy * 0.05 + pulse * 0.06);
  const [r, g, b] = pickColor((particle.tint + t * 0.028 + high * 0.24 + speed * 0.02) % 1);
  const copies = 5 + Math.round(high * 4 + pulse * 2);

  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  ctx.lineWidth = 0.55 + particle.width * 0.55 + Math.min(speed * 0.05, 0.8);
  drawMirroredSegment(particle.px, particle.py, particle.x, particle.y, center, copies);
}

function drawGridParticle(particle, detail) {
  const { speed, energy, pulse, t, centroid } = detail;
  const [r, g, b] = pickColor((particle.tint + t * 0.014 + centroid * 0.25) % 1);
  const alpha = 0.06 + energy * 0.14 + pulse * 0.06;
  const size = 1.2 + particle.width + pulse * 0.45;

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  ctx.fillRect(particle.x - size * 0.5, particle.y - size * 0.5, size, size);

  if (speed > 1.2) {
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`;
    ctx.lineWidth = 0.7 + energy * 0.8;
    ctx.beginPath();
    ctx.moveTo(particle.px, particle.py);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();
  }
}

function drawBloomParticle(particle, detail) {
  const { speed, energy, pulse, bass, t } = detail;
  const [r, g, b] = pickColor((particle.tint + t * 0.022 + bass * 0.3) % 1);
  const alpha = Math.min(0.24, 0.035 + energy * 0.09 + pulse * 0.08);
  const radius = particle.width * 0.8 + bass * 1.6 + pulse * 0.9;

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
  ctx.fill();

  if (speed > 0.5) {
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.55})`;
    ctx.lineWidth = 0.8 + speed * 0.05;
    ctx.beginPath();
    ctx.moveTo(particle.px, particle.py);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();
  }
}

function drawConstellationParticle(particle, detail) {
  const { energy, pulse, t, centroid } = detail;
  const [r, g, b] = pickColor((particle.tint + t * 0.01 + centroid * 0.2) % 1);
  const radius = 0.8 + particle.width * 0.45 + pulse * 0.35;

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.08 + energy * 0.14})`;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function updateParticles(t) {
  const mode = getCurrentMode();
  const { energy, high, pulse, centroid, bass } = state.audio;
  const drag = clamp(mode.dragBase - energy * mode.dragByEnergy, 0.76, 0.97);
  const force = mode.forceBase + energy * mode.forceByEnergy + high * mode.forceByHigh;
  const center = getAudioCenter(t);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  if (mode.id === "bloom") {
    ctx.shadowBlur = 18 + energy * 26;
    ctx.shadowColor = palettes[state.paletteIndex].accent;
  } else {
    ctx.shadowBlur = 0;
  }

  for (let i = 0; i < state.particles.length; i += 1) {
    const particle = state.particles[i];
    const flow = mode.sampleField(particle.x, particle.y, t);

    particle.px = particle.x;
    particle.py = particle.y;
    particle.vx = particle.vx * drag + flow.x * force;
    particle.vy = particle.vy * drag + flow.y * force;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.age += 1;

    const outside =
      particle.x < -120 ||
      particle.x > state.width + 120 ||
      particle.y < -120 ||
      particle.y > state.height + 120;

    if (outside || particle.age > particle.maxAge) {
      state.particles[i] = makeParticle();
      continue;
    }

    const speed = Math.hypot(particle.vx, particle.vy);
    mode.drawParticle(particle, {
      center,
      speed,
      t,
      energy,
      high,
      pulse,
      centroid,
      bass,
      index: i,
    });
  }

  ctx.restore();
}

function drawReactors(t, opacityScale = 1) {
  const palette = palettes[state.paletteIndex];
  const { pulse, energy } = state.audio;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < state.reactors.length; i += 1) {
    const reactor = state.reactors[i];
    const color = palette.wells[i % palette.wells.length];
    const pulseScale = 1 + pulse * 0.7 + Math.sin(t * 2.4 + i) * 0.08;

    ctx.strokeStyle = `${color}${Math.round(136 * opacityScale).toString(16).padStart(2, "0")}`;
    ctx.lineWidth = (1.25 + energy * 1.8) * opacityScale;
    ctx.beginPath();
    ctx.arc(reactor.x, reactor.y, reactor.radius * pulseScale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `${color}${Math.round(38 * opacityScale).toString(16).padStart(2, "0")}`;
    ctx.beginPath();
    ctx.arc(reactor.x, reactor.y, reactor.radius * (1.8 + energy * 0.7), 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `${color}${Math.round(255 * opacityScale).toString(16).padStart(2, "0")}`;
    ctx.beginPath();
    ctx.arc(reactor.x, reactor.y, 2.4 + reactor.band * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHalo(t) {
  const { spectrum, energy, pulse, centroid, presence } = state.audio;
  const cx = state.width * (0.5 + (centroid - 0.5) * 0.22);
  const cy = state.height * (0.5 + Math.sin(t * 0.55) * 0.03 * (presence + 0.15));
  const baseRadius = Math.min(state.width, state.height) * (0.16 + energy * 0.1);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let ring = 0; ring < 2; ring += 1) {
    const [r, g, b] = pickColor((ring * 0.3 + centroid + pulse * 0.2) % 1);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.08 + energy * 0.18})`;
    ctx.lineWidth = 1.2 + ring * 1.4 + energy * 1.2;
    ctx.shadowBlur = 22 + energy * 28;
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${0.24 + energy * 0.22})`;

    ctx.beginPath();

    for (let i = 0; i <= spectrum.length; i += 1) {
      const band = spectrum[i % spectrum.length];
      const angle = (i / spectrum.length) * Math.PI * 2;
      const radius =
        baseRadius * (1 + ring * 0.28) +
        band * (52 + ring * 24) +
        pulse * 12 * Math.sin(angle * 2 + t * 2.2);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}

function drawSpectrumVeil() {
  const { spectrum, energy } = state.audio;
  const barWidth = state.width / spectrum.length;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < spectrum.length; i += 1) {
    const band = spectrum[i];
    const [r, g, b] = pickColor((i / spectrum.length + state.audio.centroid * 0.3) % 1);
    const height = band * state.height * 0.18;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.02 + energy * 0.06})`;
    ctx.fillRect(i * barWidth, state.height - height, Math.ceil(barWidth), height);
  }

  ctx.restore();
}

function drawRadialVeil(t) {
  const { spectrum, energy, high, pulse } = state.audio;
  const center = getAudioCenter(t);
  const baseRadius = Math.min(state.width, state.height) * (0.12 + energy * 0.08);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < spectrum.length; i += 1) {
    const band = spectrum[i];
    const angle = (i / spectrum.length) * Math.PI * 2 + t * (0.06 + high * 0.08);
    const inner = baseRadius * 0.55;
    const outer = inner + band * 180 + pulse * 28;
    const [r, g, b] = pickColor((i / spectrum.length + pulse * 0.1) % 1);

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.04 + band * 0.18})`;
    ctx.lineWidth = 0.8 + band * 2.2;
    ctx.beginPath();
    ctx.moveTo(center.x + Math.cos(angle) * inner, center.y + Math.sin(angle) * inner);
    ctx.lineTo(center.x + Math.cos(angle) * outer, center.y + Math.sin(angle) * outer);
    ctx.stroke();
  }

  ctx.restore();
}

function drawKaleidoOverlay(t) {
  const { spectrum, high, pulse, energy } = state.audio;
  const center = getAudioCenter(t);
  const petals = 6 + Math.round(high * 4);
  const baseRadius = Math.min(state.width, state.height) * (0.12 + energy * 0.07);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let ring = 0; ring < 2; ring += 1) {
    const [r, g, b] = pickColor((ring * 0.18 + pulse * 0.18 + state.audio.centroid * 0.24) % 1);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.07 + energy * 0.14})`;
    ctx.lineWidth = 1.1 + ring * 1.2 + pulse * 0.8;
    ctx.beginPath();

    for (let i = 0; i <= spectrum.length; i += 1) {
      const band = spectrum[i % spectrum.length];
      const angle = (i / spectrum.length) * Math.PI * 2;
      const radius =
        baseRadius * (1 + ring * 0.34) +
        Math.sin(angle * petals + t * (0.8 + ring * 0.25)) * (18 + band * 52) +
        band * 38 +
        pulse * 16;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
  drawReactors(t, 0.55);
}

function drawPulseGrid() {
  const { spectrum, bass, high, pulse, centroid, energy } = state.audio;
  const cols = 18;
  const rows = 14;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let row = 0; row <= rows; row += 1) {
    ctx.beginPath();

    for (let col = 0; col <= cols; col += 1) {
      const baseX = (col / cols) * state.width;
      const baseY = (row / rows) * state.height;
      const band = spectrum[Math.floor((col / cols) * (spectrum.length - 1))];
      const offsetX =
        Math.sin(row * 0.52 + baseX * 0.002 + performance.now() * 0.0012 * (1 + high)) * (12 + band * 34) +
        (centroid - 0.5) * 38;
      const offsetY =
        Math.cos(col * 0.35 - performance.now() * 0.0009 * (1 + bass * 1.6)) * (8 + band * 28) +
        pulse * 16 * Math.sin(col * 0.4 + row * 0.18);
      const x = baseX + offsetX;
      const y = baseY + offsetY;

      if (col === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    const [r, g, b] = pickColor((row / rows + state.audio.centroid * 0.18) % 1);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.04 + energy * 0.08})`;
    ctx.lineWidth = 0.9 + pulse * 0.7;
    ctx.stroke();
  }

  for (let col = 0; col <= cols; col += 1) {
    ctx.beginPath();

    for (let row = 0; row <= rows; row += 1) {
      const baseX = (col / cols) * state.width;
      const baseY = (row / rows) * state.height;
      const band = spectrum[Math.floor((row / rows) * (spectrum.length - 1))];
      const offsetX =
        Math.sin(row * 0.48 + baseY * 0.0016 + performance.now() * 0.001) * (10 + band * 24) +
        (centroid - 0.5) * 30;
      const offsetY =
        Math.cos(col * 0.42 - performance.now() * 0.0011 * (1 + high)) * (12 + band * 30) +
        pulse * 12 * Math.sin(row * 0.44);
      const x = baseX + offsetX;
      const y = baseY + offsetY;

      if (row === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    const [r, g, b] = pickColor((col / cols + 0.14 + state.audio.centroid * 0.2) % 1);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.035 + energy * 0.065})`;
    ctx.lineWidth = 0.85 + pulse * 0.55;
    ctx.stroke();
  }

  ctx.restore();
}

function drawGridOverlay(t) {
  const center = getAudioCenter(t);
  const { pulse, energy } = state.audio;
  const [r, g, b] = pickColor((state.audio.centroid + pulse * 0.14) % 1);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.1 + energy * 0.18})`;
  ctx.lineWidth = 1.2 + pulse * 1.2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 52 + energy * 90 + pulse * 32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawReactors(t, 0.4);
}

function drawMistVeil(t) {
  const center = getAudioCenter(t);
  const { bass, high, energy, pulse } = state.audio;
  const radius = Math.min(state.width, state.height) * (0.32 + bass * 0.18 + pulse * 0.06);
  const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
  const [r, g, b] = pickColor((state.audio.centroid + t * 0.01) % 1);

  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.1 + energy * 0.16})`);
  gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${0.03 + high * 0.05})`);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.restore();
}

function drawBloomOverlay(t) {
  const center = getAudioCenter(t);
  const { bass, mids, pulse, energy } = state.audio;
  const ringCount = 4;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let ring = 0; ring < ringCount; ring += 1) {
    const [r, g, b] = pickColor((ring / ringCount + pulse * 0.15) % 1);
    const radius =
      68 +
      ring * (34 + mids * 18) +
      Math.sin(t * (1.2 + ring * 0.24) + ring) * 12 +
      bass * 42 +
      pulse * 28;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.05 + energy * 0.16})`;
    ctx.lineWidth = 1.2 + energy * 1.6 - ring * 0.14;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const reactor of state.reactors) {
    const [r, g, b] = pickColor((reactor.band + pulse * 0.2) % 1);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.05 + reactor.band * 0.2})`;
    ctx.lineWidth = 1 + reactor.band * 1.8;
    ctx.beginPath();
    ctx.arc(reactor.x, reactor.y, reactor.radius * (1.4 + pulse * 0.35), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
  drawReactors(t, 0.75);
}

function drawStarfield(t) {
  const center = getAudioCenter(t);
  const { spectrum, energy, presence } = state.audio;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < spectrum.length; i += 1) {
    const band = spectrum[i];
    const angle = (i / spectrum.length) * Math.PI * 2 + t * (0.03 + presence * 0.06);
    const radius = Math.min(state.width, state.height) * (0.24 + band * 0.5) + (i % 6) * 18;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius * 0.72;
    const [r, g, b] = pickColor((i / spectrum.length + state.audio.centroid * 0.18) % 1);

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.05 + band * 0.18})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.7 + band * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawConstellationOverlay(t) {
  const sampleStep = Math.max(1, Math.floor(state.particles.length / 82));
  const nodes = [];

  for (let i = 0; i < state.particles.length; i += sampleStep) {
    nodes.push(state.particles[i]);
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const distance = Math.hypot(dx, dy);

      if (distance > 112) {
        continue;
      }

      const alpha = (1 - distance / 112) * (0.03 + state.audio.energy * 0.11);
      const [r, g, b] = pickColor((i / nodes.length + state.audio.centroid * 0.2) % 1);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.lineWidth = 0.6 + state.audio.pulse * 0.8;
      ctx.beginPath();
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(nodes[j].x, nodes[j].y);
      ctx.stroke();
    }
  }

  const center = getAudioCenter(t);
  const [r, g, b] = pickColor((state.audio.centroid + state.audio.pulse * 0.12) % 1);
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.08 + state.audio.energy * 0.14})`;
  ctx.lineWidth = 1.1 + state.audio.pulse * 0.9;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 74 + state.audio.mids * 90, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
  drawReactors(t, 0.36);
}

function drawFlowOverlay(t) {
  drawHalo(t);
  drawReactors(t, 1);
}

function updateMeta() {
  meta.textContent =
    `Scene: ${getCurrentMode().name} | ` +
    `Palette: ${palettes[state.paletteIndex].name} | ` +
    `Source: ${state.audio.mode} | ` +
    `Energy: ${Math.round(state.audio.energy * 100)}% | ` +
    `B ${Math.round(state.audio.bass * 100)} M ${Math.round(state.audio.mids * 100)} H ${Math.round(state.audio.high * 100)}`;
}

function setPalette(index) {
  state.paletteIndex = (index + palettes.length) % palettes.length;
  const palette = palettes[state.paletteIndex];
  document.documentElement.style.setProperty("--bg-1", palette.bg1);
  document.documentElement.style.setProperty("--bg-2", palette.bg2);
  document.documentElement.style.setProperty("--panel", palette.panel);
  document.documentElement.style.setProperty("--accent", palette.accent);
  updateMeta();
}

function cyclePalette() {
  setPalette(state.paletteIndex + 1);
}

function setVisualMode(index, reseed = true) {
  state.modeIndex = (index + visualModes.length) % visualModes.length;
  modeButton.textContent = `Mode: ${getCurrentMode().name}`;

  if (reseed && state.width && state.height) {
    resetScene();
  } else {
    updateMeta();
  }
}

function cycleMode(step = 1) {
  setVisualMode(state.modeIndex + step);
}

function resetScene() {
  seedParticles();
  clearFrame(1);
  updateMeta();
}

function togglePause() {
  state.paused = !state.paused;
  pauseButton.textContent = state.paused ? "Unfreeze" : "Freeze";

  if (!state.paused) {
    state.lastTime = 0;
  }
}

function syncSourceButtons() {
  micButton.classList.toggle("is-active", state.audio.mode === "mic");
  trackButton.classList.toggle("is-active", state.audio.mode === "track");
  demoButton.classList.toggle("is-active", state.audio.mode === "demo");
}

async function stopAudioSource(message = "Source idle. Start a signal and the field will lock onto it.") {
  if (state.audio.cleanup) {
    state.audio.cleanup();
    state.audio.cleanup = null;
  }

  if (state.audio.stream) {
    for (const track of state.audio.stream.getTracks()) {
      track.stop();
    }
    state.audio.stream = null;
  }

  if (state.audio.sourceNode) {
    disconnectNode(state.audio.sourceNode);
    state.audio.sourceNode = null;
  }

  if (state.audio.mediaElementSource) {
    disconnectNode(state.audio.mediaElementSource);
  }

  audioElement.pause();
  audioElement.currentTime = 0;

  if (state.audio.objectUrl) {
    URL.revokeObjectURL(state.audio.objectUrl);
    state.audio.objectUrl = null;
  }

  audioElement.removeAttribute("src");
  audioElement.load();
  state.audio.mode = "idle";
  syncSourceButtons();
  setStatus(message);
}

function createDemoGraph(context) {
  const master = context.createGain();
  master.gain.value = 0.24;
  master.connect(state.audio.analyser);
  master.connect(state.audio.outputGain);

  const bassOsc = context.createOscillator();
  bassOsc.type = "sine";
  bassOsc.frequency.value = 54;

  const bassGain = context.createGain();
  bassGain.gain.value = 0.0001;
  bassOsc.connect(bassGain).connect(master);

  const pulseLfo = context.createOscillator();
  pulseLfo.type = "triangle";
  pulseLfo.frequency.value = 2.1;

  const pulseDepth = context.createGain();
  pulseDepth.gain.value = 0.14;
  pulseLfo.connect(pulseDepth).connect(bassGain.gain);

  const midOsc = context.createOscillator();
  midOsc.type = "triangle";
  midOsc.frequency.value = 210;

  const midGain = context.createGain();
  midGain.gain.value = 0.045;
  midOsc.connect(midGain).connect(master);

  const midDrift = context.createOscillator();
  midDrift.type = "sine";
  midDrift.frequency.value = 0.33;

  const midDepth = context.createGain();
  midDepth.gain.value = 52;
  midDrift.connect(midDepth).connect(midOsc.frequency);

  const highOsc = context.createOscillator();
  highOsc.type = "sawtooth";
  highOsc.frequency.value = 720;

  const highGain = context.createGain();
  highGain.gain.value = 0.018;
  highOsc.connect(highGain).connect(master);

  const shimmer = context.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.value = 6.2;

  const shimmerDepth = context.createGain();
  shimmerDepth.gain.value = 0.02;
  shimmer.connect(shimmerDepth).connect(highGain.gain);

  bassOsc.start();
  pulseLfo.start();
  midOsc.start();
  midDrift.start();
  highOsc.start();
  shimmer.start();

  return () => {
    for (const node of [bassOsc, pulseLfo, midOsc, midDrift, highOsc, shimmer]) {
      try {
        node.stop();
      } catch {
        // Oscillator may already be stopped.
      }
    }

    for (const node of [
      bassOsc,
      bassGain,
      pulseLfo,
      pulseDepth,
      midOsc,
      midGain,
      midDrift,
      midDepth,
      highOsc,
      highGain,
      shimmer,
      shimmerDepth,
      master,
    ]) {
      disconnectNode(node);
    }
  };
}

async function startMic() {
  try {
    await ensureAudioReady();
    await stopAudioSource();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false,
      },
    });

    const source = state.audio.context.createMediaStreamSource(stream);
    source.connect(state.audio.analyser);
    state.audio.stream = stream;
    state.audio.sourceNode = source;
    state.audio.mode = "mic";
    syncSourceButtons();
    setStatus("Microphone live. Use localhost or https so the browser can grant access.");
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown microphone error.";
    setStatus(`Microphone unavailable. ${detail}`);
    state.audio.mode = "idle";
    syncSourceButtons();
  }
}

async function startTrack(file) {
  if (!file) {
    return;
  }

  try {
    await ensureAudioReady();
    await stopAudioSource();

    if (!state.audio.mediaElementSource) {
      state.audio.mediaElementSource = state.audio.context.createMediaElementSource(audioElement);
    }

    state.audio.objectUrl = URL.createObjectURL(file);
    audioElement.src = state.audio.objectUrl;
    state.audio.mediaElementSource.connect(state.audio.analyser);
    state.audio.mediaElementSource.connect(state.audio.outputGain);
    await audioElement.play();

    state.audio.sourceNode = state.audio.mediaElementSource;
    state.audio.mode = "track";
    syncSourceButtons();
    setStatus(`Track loaded: ${file.name}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown playback error.";
    setStatus(`Track failed to start. ${detail}`);
    state.audio.mode = "idle";
    syncSourceButtons();
  }
}

async function startDemo() {
  try {
    await ensureAudioReady();
    await stopAudioSource();
    state.audio.cleanup = createDemoGraph(state.audio.context);
    state.audio.mode = "demo";
    syncSourceButtons();
    setStatus("Demo signal active. It is synthetic, but the visuals are reading the same analyser path as mic and track modes.");
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown demo error.";
    setStatus(`Demo signal failed. ${detail}`);
    state.audio.mode = "idle";
    syncSourceButtons();
  }
}

function tick(now) {
  if (state.paused) {
    state.animationFrame = requestAnimationFrame(tick);
    return;
  }

  const elapsed = state.lastTime ? (now - state.lastTime) / 1000 : 0;
  state.lastTime = now;
  const t = now * 0.001;

  readAudioFeatures();
  buildReactors(t);

  const mode = getCurrentMode();
  clearFrame(mode.trailAlpha(elapsed));
  mode.drawBackdrop(t);
  updateParticles(t);
  mode.drawOverlay(t);
  updateMeta();

  state.animationFrame = requestAnimationFrame(tick);
}

window.addEventListener("resize", fitCanvas);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (event.key === " ") {
    event.preventDefault();
    cyclePalette();
  } else if (key === "n") {
    cycleMode();
  } else if (key === "c") {
    resetScene();
  } else if (key === "h") {
    state.hiddenHud = !state.hiddenHud;
    hud.classList.toggle("is-hidden", state.hiddenHud);
  } else if (key === "m") {
    startMic();
  } else if (key === "u") {
    audioFileInput.click();
  } else if (key === "d") {
    startDemo();
  } else if ("12345".includes(key)) {
    setVisualMode(Number(key) - 1);
  }
});

tensionInput.addEventListener("input", () => {
  state.tension = Number(tensionInput.value);
});

driveInput.addEventListener("input", () => {
  state.drive = Number(driveInput.value);
});

micButton.addEventListener("click", startMic);
trackButton.addEventListener("click", () => audioFileInput.click());
demoButton.addEventListener("click", startDemo);
stopAudioButton.addEventListener("click", () => stopAudioSource());
audioFileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  event.target.value = "";
  await startTrack(file);
});
paletteButton.addEventListener("click", cyclePalette);
modeButton.addEventListener("click", () => cycleMode());
clearButton.addEventListener("click", resetScene);
pauseButton.addEventListener("click", togglePause);

setPalette(0);
setVisualMode(0, false);
fitCanvas();
updateMeta();
tick(0);
