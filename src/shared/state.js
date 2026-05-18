function createMetricBucket() {
  return {
    avg: 0,
    last: 0,
    max: 0,
  };
}

function createAdaptiveBandState() {
  return {
    baseline: 0.02,
    variance: 0.0004,
    floorMs: 0,
    suppressedMs: 0,
    cooldownUntil: 0,
    returnCooldownUntil: 0,
    lastLevel: 0,
    troughLevel: 1,
    beatThreshold: 0,
    returnThreshold: 0,
  };
}

function createAdaptiveDetectorState() {
  return {
    warmupUntil: 0,
    bands: {
      bass: createAdaptiveBandState(),
      mids: createAdaptiveBandState(),
      high: createAdaptiveBandState(),
      energy: createAdaptiveBandState(),
    },
  };
}

function createEventActivityState() {
  return {
    bassBeat: 0,
    midsBeat: 0,
    highBeat: 0,
    energyBeat: 0,
    bassReturn: 0,
    midsReturn: 0,
    highReturn: 0,
    energyReturn: 0,
    silenceBreak: 0,
  };
}

function createPerfState() {
  return {
    fps: 0,
    particles: 0,
    frame: createMetricBucket(),
    stages: {
      audio: createMetricBucket(),
      reactors: createMetricBucket(),
      clear: createMetricBucket(),
      backdrop: createMetricBucket(),
      particles: createMetricBucket(),
      overlay: createMetricBucket(),
      hud: createMetricBucket(),
    },
  };
}

function createDebugState(enabled) {
  return {
    enabled,
    lastSyncAt: 0,
    syncIntervalMs: 180,
    eventLimit: 8,
    recentEvents: [],
  };
}

function createAudioState() {
  return {
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
    trackName: "",
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    waveform: [],
    waveformPending: false,
    status: "Source idle. Start a signal and the field will lock onto it.",
    detector: createAdaptiveDetectorState(),
    events: {
      active: createEventActivityState(),
      lastTriggered: null,
    },
  };
}

function createAutomationState() {
  return {
    enabled: false,
    blockUntil: 0,
    lastSwitchAt: 0,
    lastHandledEventAt: 0,
    lastReason: "manual",
    minTrackAgeMs: 3400,
    rotation: {
      "bass-return": 0,
      "mids-return": 0,
      "high-return": 0,
      "energy-return": 0,
      "silence-break": 0,
      "bass-beat": 0,
      "high-beat": 0,
      "energy-beat": 0,
    },
  };
}

export function createInitialState({ tension, drive, debugEnabled }) {
  return {
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    particles: [],
    reactors: [],
    paletteIndex: 0,
    presetIndex: 0,
    modeIndex: 0,
    tension,
    drive,
    paused: false,
    hiddenHud: false,
    animationFrame: 0,
    lastTime: 0,
    perf: createPerfState(),
    debug: createDebugState(debugEnabled),
    auto: createAutomationState(),
    audio: createAudioState(),
  };
}
