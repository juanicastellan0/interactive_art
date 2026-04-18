import { clamp, lerp, rand } from "../shared/math.js";

function createBloomSprite(accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const spriteCtx = canvas.getContext("2d");
  const gradient = spriteCtx.createRadialGradient(48, 48, 2, 48, 48, 48);

  gradient.addColorStop(0, "rgba(255, 255, 255, 0.92)");
  gradient.addColorStop(0.18, `${accent}cc`);
  gradient.addColorStop(0.5, `${accent}45`);
  gradient.addColorStop(1, `${accent}00`);

  spriteCtx.fillStyle = gradient;
  spriteCtx.beginPath();
  spriteCtx.arc(48, 48, 48, 0, Math.PI * 2);
  spriteCtx.fill();

  return canvas;
}

export function createRenderController({ canvas, ctx, state }) {
  let palettes = [];
  let visualModes = [];
  let audioController = null;
  let onHudFrame = () => {};

  const bloomSpriteCache = new Map();

  function configure({ nextPalettes, nextVisualModes, nextAudioController, nextHudFrame }) {
    palettes = nextPalettes;
    visualModes = nextVisualModes;
    audioController = nextAudioController;
    onHudFrame = nextHudFrame;
  }

  function getCurrentMode() {
    return visualModes[state.modeIndex];
  }

  function getCurrentPalette() {
    return palettes[state.paletteIndex];
  }

  function recordMetric(metric, sample, smoothing = 0.18) {
    metric.last = sample;
    metric.max = Math.max(metric.max, sample);
    metric.avg = metric.avg ? lerp(metric.avg, sample, smoothing) : sample;
  }

  function recordStageMetric(stage, sample) {
    recordMetric(state.perf.stages[stage], sample);
  }

  function measureStage(stage, callback) {
    const start = performance.now();
    const result = callback();
    recordStageMetric(stage, performance.now() - start);
    return result;
  }

  function getEventIntensity(key) {
    return state.audio.events.active[key] || 0;
  }

  function particleCount() {
    const area = state.width * state.height;
    const baseCount = Math.max(700, Math.min(2200, Math.floor(area / 1150)));
    return Math.max(220, Math.floor(baseCount * getCurrentMode().density));
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
    const offset = source ? source.radius * 1.35 : 0;
    const x = source ? source.x + rand(-offset, offset) : rand(0, state.width);
    const y = source ? source.y + rand(-offset, offset) : rand(0, state.height);

    const particle = {
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

    return mode.createParticle ? { ...particle, ...mode.createParticle(particle) } : particle;
  }

  function seedParticles() {
    state.particles = Array.from({ length: particleCount() }, () => makeParticle(true));
    state.perf.particles = state.particles.length;
  }

  function fitCanvas() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    seedParticles();
    clearFrame(1);
  }

  function clearFrame(alpha = 0.08) {
    const palette = getCurrentPalette();
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = palette.fade.replace(/[\d.]+\)$/u, `${alpha})`);
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.restore();
  }

  function pickColor(mix) {
    const colors = getCurrentPalette().colors;
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

  function getAudioCenter(t) {
    const { centroid, presence, pulse, bass, mids } = state.audio;
    const bassReturn = getEventIntensity("bassReturn");
    const highReturn = getEventIntensity("highReturn");

    return {
      x:
        state.width *
        (0.5 +
          (centroid - 0.5) * 0.24 +
          Math.sin(t * 0.27) * 0.03 * (presence + pulse * 0.22 + highReturn * 0.35)),
      y:
        state.height *
        (0.5 +
          Math.cos(t * 0.23) * 0.045 * (presence + 0.18) -
          bass * 0.06 -
          bassReturn * 0.05 +
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

  function buildReactors(t) {
    const { bass, mids, high, energy, pulse, centroid, presence } = state.audio;
    const bassReturn = getEventIntensity("bassReturn");
    const highReturn = getEventIntensity("highReturn");
    const centerX = state.width * (0.5 + (centroid - 0.5) * 0.34);
    const centerY = state.height * (0.5 + Math.sin(t * 0.45) * 0.04 * (presence + highReturn * 0.25 + 0.2));
    const spread = state.width * (0.17 + mids * 0.17 + highReturn * 0.05);
    const topShift = Math.sin(t * (1 + high * 2.4)) * state.width * 0.07 * (high + highReturn * 0.4 + 0.15);

    state.reactors = [
      {
        x: centerX,
        y: state.height * (0.74 - bass * 0.2 - bassReturn * 0.08),
        polarity: 1,
        strength: 0.9 + bass * 3.1 + bassReturn * 1.2,
        swirl: 0.8 + pulse * 1.8,
        radius: 26 + bass * 60 + bassReturn * 32,
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
        swirl: 0.9 + high * 1.4 + highReturn * 0.4,
        radius: 18 + mids * 44,
        band: mids,
      },
      {
        x: state.width * (0.5 + topShift / state.width + (centroid - 0.5) * 0.22),
        y: state.height * (0.23 + high * 0.12 + highReturn * 0.04),
        polarity: -1,
        strength: 0.6 + high * 2.5 + highReturn * 1.2,
        swirl: 1.2 + high * 1.8 + highReturn * 1.1,
        radius: 16 + high * 40 + highReturn * 18,
        band: high,
      },
      {
        x: state.width * (0.5 + Math.cos(t * 0.65) * 0.16 * (energy + 0.2)),
        y: state.height * (0.5 + Math.sin(t * 0.8) * 0.12 * (presence + 0.2)),
        polarity: pulse > 0.42 ? -1 : 1,
        strength: 0.55 + energy * 1.8 + getEventIntensity("energyReturn") * 0.9,
        swirl: 0.5 + pulse * 2.1,
        radius: 14 + energy * 34,
        band: energy,
      },
    ];
  }

  function getBloomSprite() {
    const key = `${state.paletteIndex}`;

    if (!bloomSpriteCache.has(key)) {
      bloomSpriteCache.set(key, createBloomSprite(getCurrentPalette().accent));
    }

    return bloomSpriteCache.get(key);
  }

  function drawBloomGlow(x, y, radius, alpha) {
    const sprite = getBloomSprite();
    const size = radius * 2.6;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, x - size * 0.5, y - size * 0.5, size, size);
    ctx.restore();
  }

  function drawReactors(t, opacityScale = 1) {
    const palette = getCurrentPalette();
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

  function updateParticles(t) {
    const mode = getCurrentMode();
    const { energy, high, mids, pulse, centroid, bass, presence } = state.audio;
    const drag = clamp(mode.dragBase - energy * mode.dragByEnergy, 0.76, 0.97);
    const force = mode.forceBase + energy * mode.forceByEnergy + high * mode.forceByHigh;
    const center = getAudioCenter(t);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    if (mode.beforeParticles) {
      mode.beforeParticles();
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
        mids,
        pulse,
        centroid,
        bass,
        presence,
        index: i,
        events: state.audio.events.active,
      });
    }

    if (mode.afterParticles) {
      mode.afterParticles();
    }

    ctx.restore();
  }

  function resetScene() {
    seedParticles();
    clearFrame(1);
  }

  function tick(now) {
    if (state.paused) {
      state.animationFrame = requestAnimationFrame(tick);
      return;
    }

    const frameStart = performance.now();
    const elapsed = state.lastTime ? (now - state.lastTime) / 1000 : 0;
    const elapsedMs = elapsed * 1000 || 16.67;
    state.lastTime = now;
    const t = now * 0.001;

    measureStage("audio", () => audioController.readAudioFeatures(elapsedMs, frameStart));
    measureStage("reactors", () => buildReactors(t));

    const mode = getCurrentMode();
    measureStage("clear", () => clearFrame(mode.trailAlpha(elapsed)));
    measureStage("backdrop", () => mode.drawBackdrop(t));
    measureStage("particles", () => updateParticles(t));
    measureStage("overlay", () => mode.drawOverlay(t));
    measureStage("hud", () => onHudFrame());

    const frameTime = performance.now() - frameStart;
    recordMetric(state.perf.frame, frameTime, 0.14);
    state.perf.fps = state.perf.frame.avg ? 1000 / state.perf.frame.avg : 0;

    state.animationFrame = requestAnimationFrame(tick);
  }

  function start() {
    tick(0);
  }

  function createSceneTools() {
    return {
      state,
      ctx,
      clamp,
      pickColor,
      getAudioCenter,
      getReactorInfluence,
      getEventIntensity,
      drawReactors,
      drawBloomGlow,
      getCurrentPalette,
    };
  }

  return {
    configure,
    fitCanvas,
    clearFrame,
    resetScene,
    start,
    getCurrentMode,
    getCurrentPalette,
    createSceneTools,
  };
}
