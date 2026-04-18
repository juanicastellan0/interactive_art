import { averageBins, clamp, lerp } from "../shared/math.js";

const AudioContextClass = window.AudioContext || window.webkitAudioContext;

const BAND_EVENT_CONFIG = {
  bass: {
    minLevel: 0.14,
    minRise: 0.012,
    minBeatDelta: 0.055,
    beatRatio: 0.28,
    sigma: 1.55,
    cooldownMs: 240,
    floorRatio: 0.46,
    floorMin: 0.065,
    quietLevel: 0.22,
    dipRatio: 0.96,
    dipSlack: 0.014,
    dipMin: 0.16,
    dipGapMs: 110,
    baselineRise: 0.026,
    baselineFall: 0.004,
    returnGapMs: 140,
    returnLift: 1.16,
    returnFromDipLift: 1.02,
    dipReturnFactor: 0.18,
    returnRise: 0.01,
    minReturnDelta: 0.03,
    returnSigma: 0.92,
    returnRatio: 0.14,
    returnCooldownMs: 420,
    beatEvent: "bass-beat",
    returnEvent: "bass-return",
  },
  mids: {
    minLevel: 0.12,
    minRise: 0.01,
    minBeatDelta: 0.045,
    beatRatio: 0.22,
    sigma: 1.4,
    cooldownMs: 220,
    floorRatio: 0.5,
    floorMin: 0.05,
    quietLevel: 0.08,
    dipRatio: 0.78,
    dipMin: 0.08,
    dipGapMs: 120,
    baselineRise: 0.032,
    baselineFall: 0.006,
    returnGapMs: 120,
    returnLift: 1.14,
    returnFromDipLift: 1.08,
    dipReturnFactor: 0.38,
    returnRise: 0.009,
    minReturnDelta: 0.024,
    returnSigma: 0.88,
    returnRatio: 0.12,
    returnCooldownMs: 360,
    beatEvent: "mids-beat",
    returnEvent: "mids-return",
  },
  high: {
    minLevel: 0.018,
    minRise: 0.002,
    minBeatDelta: 0.005,
    beatRatio: 0.22,
    sigma: 1.45,
    cooldownMs: 170,
    floorRatio: 0.48,
    floorMin: 0.012,
    quietLevel: 0.01,
    dipRatio: 0.84,
    dipMin: 0.045,
    dipGapMs: 130,
    baselineRise: 0.038,
    baselineFall: 0.006,
    returnGapMs: 120,
    returnLift: 1.22,
    returnFromDipLift: 1.12,
    dipReturnFactor: 0.52,
    returnRise: 0.003,
    minReturnDelta: 0.0052,
    returnSigma: 0.94,
    returnRatio: 0.115,
    returnCooldownMs: 620,
    denseReturnThresholdBoost: 0.48,
    denseDipGapBoostMs: 90,
    denseReturnGapBoostMs: 70,
    denseReturnRiseBoost: 0.0012,
    denseLiftBoost: 0.08,
    dominanceRatio: 0.86,
    dominanceSlack: 0.004,
    beatEvent: "high-beat",
    returnEvent: "high-return",
  },
  energy: {
    minLevel: 0.1,
    minRise: 0.009,
    minBeatDelta: 0.03,
    beatRatio: 0.16,
    sigma: 1.25,
    cooldownMs: 220,
    floorRatio: 0.52,
    floorMin: 0.04,
    quietLevel: 0.05,
    dipRatio: 0.82,
    dipMin: 0.06,
    dipGapMs: 160,
    baselineRise: 0.03,
    baselineFall: 0.008,
    returnGapMs: 180,
    returnLift: 1.18,
    returnFromDipLift: 1.08,
    dipReturnFactor: 0.4,
    returnRise: 0.01,
    minReturnDelta: 0.03,
    returnSigma: 0.8,
    returnRatio: 0.12,
    returnCooldownMs: 560,
    beatEvent: "energy-beat",
    returnEvent: "energy-return",
  },
};

const EVENT_ACTIVITY_DECAY = {
  bassBeat: 0.86,
  midsBeat: 0.87,
  highBeat: 0.84,
  energyBeat: 0.88,
  bassReturn: 0.91,
  midsReturn: 0.9,
  highReturn: 0.88,
  energyReturn: 0.92,
  silenceBreak: 0.93,
};

const EVENT_ACTIVITY_KEY = {
  "bass-beat": "bassBeat",
  "mids-beat": "midsBeat",
  "high-beat": "highBeat",
  "energy-beat": "energyBeat",
  "bass-return": "bassReturn",
  "mids-return": "midsReturn",
  "high-return": "highReturn",
  "energy-return": "energyReturn",
  "silence-break": "silenceBreak",
};

function createAudioElement() {
  const element = new Audio();
  element.preload = "auto";
  element.loop = true;
  return element;
}

export function createAudioController({
  state,
  setStatus,
  syncSourceButtons,
  onAdaptiveEvent = () => {},
  onSourceChange = () => {},
}) {
  const audioElement = createAudioElement();

  function pushAdaptiveEvent(type, strength, now = performance.now(), band = null) {
    const activityKey = EVENT_ACTIVITY_KEY[type];

    if (activityKey) {
      state.audio.events.active[activityKey] = Math.max(state.audio.events.active[activityKey], strength);
    }

    state.audio.events.lastTriggered = {
      type,
      band,
      strength,
      at: now,
    };

    state.debug.recentEvents.unshift({
      type,
      band,
      strength,
      at: now,
      scene: state.modeIndex,
    });
    state.debug.recentEvents = state.debug.recentEvents.slice(0, state.debug.eventLimit);
    onAdaptiveEvent({
      type,
      band,
      strength,
      at: now,
      scene: state.modeIndex,
    });
  }

  function decayEventActivity() {
    for (const [key, value] of Object.entries(state.audio.events.active)) {
      state.audio.events.active[key] = value * EVENT_ACTIVITY_DECAY[key];
    }
  }

  function shapeBandLevel(rawLevel, gain, curve = 1) {
    const driven = Math.max(0, rawLevel * state.drive * gain);
    const compressed = 1 - Math.exp(-driven);
    return clamp(Math.pow(compressed, curve), 0, 1);
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

  function resetDetectorLevels() {
    state.audio.detector.warmupUntil = 0;
    state.audio.events.lastTriggered = null;
    state.debug.recentEvents = [];

    for (const bandState of Object.values(state.audio.detector.bands)) {
      bandState.lastLevel = 0;
      bandState.floorMs = 0;
      bandState.suppressedMs = 0;
      bandState.troughLevel = 1;
    }

    for (const key of Object.keys(state.audio.events.active)) {
      state.audio.events.active[key] = 0;
    }
  }

  function armDetectorWarmup(durationMs = 520) {
    state.audio.detector.warmupUntil = performance.now() + durationMs;
  }

  function decayAudioState() {
    state.audio.bass = lerp(state.audio.bass, 0, 0.08);
    state.audio.mids = lerp(state.audio.mids, 0, 0.08);
    state.audio.high = lerp(state.audio.high, 0, 0.08);
    state.audio.energy = lerp(state.audio.energy, 0, 0.08);
    state.audio.presence = lerp(state.audio.presence, 0, 0.08);
    state.audio.pulse *= 0.92;
    state.audio.currentTime = 0;
    state.audio.duration = 0;

    for (let i = 0; i < state.audio.spectrum.length; i += 1) {
      state.audio.spectrum[i] = lerp(state.audio.spectrum[i], 0, 0.08);
    }
  }

  function updateBandDetector(name, level, elapsedMs, now, eventsEnabled = true) {
    const config = BAND_EVENT_CONFIG[name];
    const bandState = state.audio.detector.bands[name];
    const delta = level - bandState.lastLevel;
    const baselineT = level > bandState.baseline ? config.baselineRise : config.baselineFall;
    bandState.baseline = lerp(bandState.baseline, level, baselineT);
    const deviation = level - bandState.baseline;
    const denseMix =
      name === "high"
        ? clamp(
            Math.max(0, state.audio.energy - 0.34) * 1.8 +
              Math.max(0, state.audio.mids - 0.26) * 1.4 +
              Math.max(0, bandState.baseline - 0.08) * 6,
            0,
            1,
          )
        : 0;
    bandState.variance = lerp(bandState.variance, deviation * deviation, 0.08);

    const sigma = Math.sqrt(bandState.variance);
    const floorThreshold = Math.max(config.floorMin, bandState.baseline * config.floorRatio);
    const quietThreshold = Math.max(config.quietLevel, floorThreshold);
    const suppressionThreshold = Math.max(
      config.dipMin,
      bandState.baseline * config.dipRatio,
      bandState.baseline - (config.dipSlack || 0),
    );
    const priorQuietMs = bandState.floorMs;
    const priorSuppressedMs = bandState.suppressedMs;
    const priorTroughLevel = Math.min(bandState.troughLevel, bandState.lastLevel || level);
    bandState.floorMs = level < quietThreshold ? bandState.floorMs + elapsedMs : 0;
    bandState.suppressedMs = level < suppressionThreshold ? bandState.suppressedMs + elapsedMs : 0;
    bandState.troughLevel =
      level < suppressionThreshold
        ? Math.min(bandState.troughLevel, level)
        : lerp(priorTroughLevel, bandState.baseline, 0.12);

    bandState.beatThreshold = Math.max(
      config.minBeatDelta,
      bandState.baseline * config.beatRatio,
      sigma * config.sigma,
    );
    bandState.returnThreshold = Math.max(
      config.minReturnDelta,
      bandState.baseline * config.returnRatio,
      sigma * config.returnSigma,
    );
    const effectiveReturnThreshold =
      bandState.returnThreshold * (1 + denseMix * (config.denseReturnThresholdBoost || 0));
    const effectiveDipGapMs = config.dipGapMs + denseMix * (config.denseDipGapBoostMs || 0);
    const effectiveReturnGapMs = config.returnGapMs + denseMix * (config.denseReturnGapBoostMs || 0);
    const effectiveReturnRise = config.returnRise + denseMix * (config.denseReturnRiseBoost || 0);
    const effectiveReturnLift = config.returnLift + denseMix * (config.denseLiftBoost || 0);
    const dominanceFloor =
      name === "high"
        ? state.audio.mids * (config.dominanceRatio || 0) + (config.dominanceSlack || 0)
        : -Infinity;

    const returnFromQuiet =
      priorQuietMs > effectiveReturnGapMs &&
      level > floorThreshold * effectiveReturnLift &&
      deviation > config.minReturnDelta * 0.75;
    const returnFromDip =
      priorSuppressedMs > effectiveDipGapMs &&
      level > suppressionThreshold &&
      level > priorTroughLevel * config.returnFromDipLift &&
      level - priorTroughLevel >
        Math.max(config.minReturnDelta * 0.65, effectiveReturnThreshold * config.dipReturnFactor);

    const qualifiesForReturn =
      eventsEnabled &&
      delta > effectiveReturnRise &&
      (returnFromQuiet || returnFromDip) &&
      level >= dominanceFloor &&
      now >= bandState.returnCooldownUntil;

    if (
      level > config.minLevel &&
      delta > config.minRise &&
      deviation > bandState.beatThreshold &&
      eventsEnabled &&
      now >= bandState.cooldownUntil
    ) {
      const strength = clamp(deviation / (bandState.beatThreshold * 1.6 || 1), 0.18, 1);
      pushAdaptiveEvent(config.beatEvent, strength, now, name);
      bandState.cooldownUntil = now + config.cooldownMs;

      if (qualifiesForReturn) {
        pushAdaptiveEvent(config.returnEvent, strength, now, name);
        bandState.returnCooldownUntil = now + config.returnCooldownMs;
        bandState.floorMs = 0;
      }
    }

    if (qualifiesForReturn && now >= bandState.cooldownUntil) {
      const strength = clamp(
        Math.max(deviation + delta, level - priorTroughLevel) /
          ((effectiveReturnThreshold + config.minReturnDelta) * 1.8 || 1),
        0.18,
        1,
      );
      pushAdaptiveEvent(config.returnEvent, strength, now, name);
      bandState.returnCooldownUntil = now + config.returnCooldownMs;
      bandState.floorMs = 0;
      bandState.suppressedMs = 0;
      bandState.troughLevel = level;
    }

    bandState.lastLevel = level;
  }

  function updateAdaptiveEvents(elapsedMs, now = performance.now()) {
    decayEventActivity();
    const eventsEnabled = now >= state.audio.detector.warmupUntil;

    updateBandDetector("bass", state.audio.bass, elapsedMs, now, eventsEnabled);
    updateBandDetector("mids", state.audio.mids, elapsedMs, now, eventsEnabled);
    updateBandDetector("high", state.audio.high, elapsedMs, now, eventsEnabled);
    updateBandDetector("energy", state.audio.energy, elapsedMs, now, eventsEnabled);

    const energyBand = state.audio.detector.bands.energy;
    const energyBaseline = Math.max(BAND_EVENT_CONFIG.energy.floorMin, energyBand.baseline);
    const energyDelta = state.audio.energy - energyBand.lastLevel;

    if (
      eventsEnabled &&
      energyBand.floorMs > 760 &&
      state.audio.energy > energyBaseline * 1.34 &&
      energyDelta > 0.012
    ) {
      const strength = clamp(state.audio.energy / (energyBaseline * 2.2 || 1), 0.2, 1);
      pushAdaptiveEvent("silence-break", strength, now, "energy");
      energyBand.floorMs = 0;
    }
  }

  function readAudioFeatures(elapsedMs = 16.67, now = performance.now()) {
    if (!state.audio.analyser || state.audio.mode === "idle") {
      decayAudioState();
      updateAdaptiveEvents(elapsedMs, now);
      return;
    }

    const { analyser, freqData, timeData } = state.audio;
    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(timeData);

    if (state.audio.mode === "track") {
      state.audio.currentTime = audioElement.currentTime || 0;
      state.audio.duration = Number.isFinite(audioElement.duration) ? audioElement.duration : 0;
    }

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
    const bass = shapeBandLevel(bassRaw, 1.24, 1.08);
    const mids = Math.pow(clamp(midsRaw * drive * 1.15, 0, 1), 0.95);
    const high = Math.pow(clamp(highRaw * drive * 1.4, 0, 1), 1.02);
    const presence = clamp((waveformMotion / timeData.length) * drive * 2.4, 0, 1);
    const energy = clamp(energyRaw * drive * 1.15, 0, 1);
    const transient = Math.max(0, bass - state.audio.previousBass * 0.84);

    state.audio.bass = lerp(state.audio.bass, bass, 0.26);
    state.audio.mids = lerp(state.audio.mids, mids, 0.2);
    state.audio.high = lerp(state.audio.high, high, 0.22);
    state.audio.presence = lerp(state.audio.presence, presence, 0.16);
    state.audio.energy = lerp(state.audio.energy, energy, 0.18);
    state.audio.centroid = lerp(state.audio.centroid, centroid, 0.12);
    state.audio.pulse = Math.max(
      state.audio.pulse * 0.9,
      transient * 4.6,
      state.audio.events.active.bassBeat * 0.4,
      state.audio.energy * 0.18,
    );
    state.audio.previousBass = state.audio.bass;

    for (let i = 0; i < state.audio.spectrum.length; i += 1) {
      const start = (i / state.audio.spectrum.length) * freqData.length;
      const end = ((i + 1) / state.audio.spectrum.length) * freqData.length;
      const band = clamp((averageBins(freqData, start, end) / 255) * drive * 1.25, 0, 1);
      state.audio.spectrum[i] = lerp(state.audio.spectrum[i], band, 0.22);
    }

    updateAdaptiveEvents(elapsedMs, now);
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
    state.audio.trackName = "";
    state.audio.currentTime = 0;
    state.audio.duration = 0;
    resetDetectorLevels();
    syncSourceButtons();
    setStatus(message);
    onSourceChange({
      mode: "idle",
      trackName: "",
    });
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
    const bassWindow = context.createGain();
    bassWindow.gain.value = 0.24;
    bassOsc.connect(bassGain).connect(bassWindow).connect(master);

    const pulseLfo = context.createOscillator();
    pulseLfo.type = "triangle";
    pulseLfo.frequency.value = 2.1;

    const pulseDepth = context.createGain();
    pulseDepth.gain.value = 0.14;
    pulseLfo.connect(pulseDepth).connect(bassGain.gain);

    const bassGate = context.createOscillator();
    bassGate.type = "sine";
    bassGate.frequency.value = 0.28;

    const bassGateDepth = context.createGain();
    bassGateDepth.gain.value = 0.22;
    bassGate.connect(bassGateDepth).connect(bassWindow.gain);

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
    highOsc.frequency.value = 880;

    const highGain = context.createGain();
    highGain.gain.value = 0.05;
    const highWindow = context.createGain();
    highWindow.gain.value = 0.3;
    highOsc.connect(highGain).connect(highWindow).connect(master);

    const shimmer = context.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.value = 6.2;

    const shimmerDepth = context.createGain();
    shimmerDepth.gain.value = 0.05;
    shimmer.connect(shimmerDepth).connect(highGain.gain);

    const highGate = context.createOscillator();
    highGate.type = "triangle";
    highGate.frequency.value = 0.24;

    const highGateDepth = context.createGain();
    highGateDepth.gain.value = 0.28;
    highGate.connect(highGateDepth).connect(highWindow.gain);

    bassOsc.start();
    pulseLfo.start();
    bassGate.start();
    midOsc.start();
    midDrift.start();
    highOsc.start();
    shimmer.start();
    highGate.start();

    return () => {
      for (const node of [bassOsc, pulseLfo, bassGate, midOsc, midDrift, highOsc, shimmer, highGate]) {
        try {
          node.stop();
        } catch {
          // Oscillator may already be stopped.
        }
      }

      for (const node of [
        bassOsc,
        bassGain,
        bassWindow,
        pulseLfo,
        pulseDepth,
        bassGate,
        bassGateDepth,
        midOsc,
        midGain,
        midDrift,
        midDepth,
        highOsc,
        highGain,
        highWindow,
        shimmer,
        shimmerDepth,
        highGate,
        highGateDepth,
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
      state.audio.trackName = "";
      armDetectorWarmup();
      syncSourceButtons();
      setStatus("Microphone live. Use localhost or https so the browser can grant access.");
      onSourceChange({
        mode: "mic",
        trackName: "",
      });
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
      state.audio.trackName = file.name;
      armDetectorWarmup();
      syncSourceButtons();
      setStatus(`Track loaded: ${file.name}`);
      onSourceChange({
        mode: "track",
        trackName: file.name,
      });
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
      state.audio.trackName = "";
      armDetectorWarmup();
      syncSourceButtons();
      setStatus("Demo signal active. It is synthetic, but the visuals are reading the same analyser path as mic and track modes.");
      onSourceChange({
        mode: "demo",
        trackName: "",
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown demo error.";
      setStatus(`Demo signal failed. ${detail}`);
      state.audio.mode = "idle";
      syncSourceButtons();
    }
  }

  return {
    readAudioFeatures,
    startMic,
    startTrack,
    startDemo,
    stopAudioSource,
  };
}
