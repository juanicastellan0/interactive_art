import { createAudioController } from "../audio/index.js?v=20260418d";
import { createRenderController } from "../render/index.js?v=20260418";
import { palettes, createVisualModes } from "../scenes/index.js?v=20260418";
import { clamp } from "../shared/math.js?v=20260418d";
import { chooseAutoPreset, presets } from "../shared/presets.js?v=20260418";
import { createInitialState } from "../shared/state.js?v=20260418";

function queryDom() {
  return {
    canvas: document.querySelector("#scene"),
    hud: document.querySelector("#hud"),
    tensionInput: document.querySelector("#tension"),
    driveInput: document.querySelector("#drive"),
    micButton: document.querySelector("#micButton"),
    trackButton: document.querySelector("#trackButton"),
    demoButton: document.querySelector("#demoButton"),
    stopAudioButton: document.querySelector("#stopAudioButton"),
    audioFileInput: document.querySelector("#audioFile"),
    audioStatus: document.querySelector("#audioStatus"),
    trackPanel: document.querySelector("#trackPanel"),
    trackTitle: document.querySelector("#trackTitle"),
    trackTime: document.querySelector("#trackTime"),
    trackPreview: document.querySelector("#trackPreview"),
    trackWaveform: document.querySelector("#trackWaveform"),
    trackNeedle: document.querySelector("#trackNeedle"),
    trackProgress: document.querySelector("#trackProgress"),
    trackCurrentTime: document.querySelector("#trackCurrentTime"),
    trackHoverTime: document.querySelector("#trackHoverTime"),
    trackDurationTime: document.querySelector("#trackDurationTime"),
    trackDetailPreview: document.querySelector("#trackDetailPreview"),
    trackDetailWaveform: document.querySelector("#trackDetailWaveform"),
    trackDetailProgress: document.querySelector("#trackDetailProgress"),
    trackDetailNeedle: document.querySelector("#trackDetailNeedle"),
    trackWindowRange: document.querySelector("#trackWindowRange"),
    trackWindowStart: document.querySelector("#trackWindowStart"),
    trackWindowLabel: document.querySelector("#trackWindowLabel"),
    trackWindowEnd: document.querySelector("#trackWindowEnd"),
    seekBackButton: document.querySelector("#seekBackButton"),
    trackPlayButton: document.querySelector("#trackPlayButton"),
    seekForwardButton: document.querySelector("#seekForwardButton"),
    paletteButton: document.querySelector("#paletteButton"),
    modeButton: document.querySelector("#modeButton"),
    sceneSelector: document.querySelector("#sceneSelector"),
    paletteSelector: document.querySelector("#paletteSelector"),
    clearButton: document.querySelector("#clearButton"),
    pauseButton: document.querySelector("#pauseButton"),
    debugButton: document.querySelector("#debugButton"),
    presetButton: document.querySelector("#presetButton"),
    autoPresetButton: document.querySelector("#autoPresetButton"),
    exportImageButton: document.querySelector("#exportImageButton"),
    exportPresetButton: document.querySelector("#exportPresetButton"),
    meta: document.querySelector("#meta"),
    debugPanel: document.querySelector("#debugPanel"),
    debugSummary: document.querySelector("#debugSummary"),
    debugStages: document.querySelector("#debugStages"),
    debugAudio: document.querySelector("#debugAudio"),
    debugEvents: document.querySelector("#debugEvents"),
  };
}

function formatMs(value) {
  return `${value.toFixed(value >= 10 ? 1 : 2)}ms`;
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatEventAge(ageMs) {
  return ageMs < 1000 ? `${Math.round(ageMs)}ms` : `${(ageMs / 1000).toFixed(1)}s`;
}

function formatClock(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function describeRecentEvents(state, now) {
  if (!state.debug.recentEvents.length) {
    return "Events waiting for adaptive triggers.";
  }

  return `Events ${state.debug.recentEvents
    .map((event) => `${event.type} ${Math.round(event.strength * 100)}%@${formatEventAge(now - event.at)}`)
    .join(" | ")}`;
}

function applyPaletteVariables(palette) {
  document.documentElement.style.setProperty("--bg-1", palette.bg1);
  document.documentElement.style.setProperty("--bg-2", palette.bg2);
  document.documentElement.style.setProperty("--panel", palette.panel);
  document.documentElement.style.setProperty("--accent", palette.accent);
}

function createTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function isInteractiveTarget(target) {
  return target instanceof HTMLElement && Boolean(target.closest("button, input, [role='slider']"));
}

const PALETTE_COPY = {
  Solar: "ember glow and warm dusk",
  Reef: "teal surf and cooler depth",
  Nocturne: "violet haze and neon bloom",
  Verdigris: "moss light and mineral green",
  Cinder: "ash reds and furnace orange",
  Polar: "ice blue and pale white",
  Acid: "chartreuse punch and dark lime",
  Ultramarine: "cobalt depth and silver flare",
  Ochre: "amber dust and kiln heat",
  Rosefire: "rose flare and crimson smoke",
};

const TRACK_SKIP_SECONDS = 10;
const TRACK_KEYBOARD_SKIP_SECONDS = 5;
const EMPTY_TRACK_WAVEFORM = Array.from({ length: 96 }, (_, index) =>
  clamp(0.2 + Math.sin(index * 0.42) * 0.08 + Math.sin(index * 1.17) * 0.035, 0.08, 0.34),
);

export function startApp() {
  const dom = queryDom();
  const ctx = dom.canvas.getContext("2d");
  const initialDebugEnabled = new URLSearchParams(window.location.search).get("debug") === "1";
  const state = createInitialState({
    tension: Number(dom.tensionInput.value),
    drive: Number(dom.driveInput.value),
    debugEnabled: initialDebugEnabled,
  });

  const renderer = createRenderController({
    canvas: dom.canvas,
    ctx,
    state,
  });

  function getCurrentMode() {
    return visualModes[state.modeIndex];
  }

  function setStatus(message) {
    state.audio.status = message;
    dom.audioStatus.textContent = message;
  }

  function getCurrentPresetName() {
    return state.presetIndex >= 0 ? presets[state.presetIndex].name : "Custom";
  }

  let sceneOptionButtons = [];
  let paletteOptionButtons = [];
  let trackHoverRatio = null;
  let trackHoverMessage = "";
  let renderedTrackWaveformKey = "";
  let renderedTrackDetailKey = "";

  function getWaveformBarCount(element, { min = 24, max = 72, density = 6 } = {}) {
    const width = element?.clientWidth || 0;
    if (!width) {
      return min;
    }

    return clamp(Math.floor(width / density), min, max);
  }

  function getTrackWaveformBarCount() {
    const width = dom.trackPreview.clientWidth || 0;
    const density = width < 220 ? 2.1 : width < 320 ? 2.5 : 3.1;
    return getWaveformBarCount(dom.trackPreview, {
      min: 48,
      max: 144,
      density,
    });
  }

  function getTrackDetailBarCount() {
    return getWaveformBarCount(dom.trackDetailPreview, {
      min: 28,
      max: 160,
      density: dom.trackDetailPreview.clientWidth < 420 ? 4.2 : 3.5,
    });
  }

  function downsampleTrackWaveform(peaks, targetCount) {
    if (peaks.length <= targetCount) {
      return peaks;
    }

    const segmentSize = peaks.length / targetCount;
    return Array.from({ length: targetCount }, (_, index) => {
      const start = Math.floor(index * segmentSize);
      const end = Math.max(start + 1, Math.floor((index + 1) * segmentSize));
      let maxPeak = 0;
      let total = 0;
      let count = 0;

      for (let cursor = start; cursor < Math.min(end, peaks.length); cursor += 1) {
        maxPeak = Math.max(maxPeak, peaks[cursor]);
        total += peaks[cursor];
        count += 1;
      }

      const average = count ? total / count : 0;
      return clamp(maxPeak * 0.68 + average * 0.32, 0.08, 1);
    });
  }

  function createWaveformBars(peaks, barClassName, variableName) {
    const bars = peaks.map((peak) => {
      const bar = document.createElement("span");
      bar.className = barClassName;
      bar.style.setProperty(variableName, peak.toFixed(3));
      return bar;
    });

    return bars;
  }

  function renderTrackWaveform(peaks, { placeholder = false, loading = false } = {}) {
    dom.trackWaveform.classList.toggle("is-placeholder", placeholder);
    dom.trackWaveform.classList.toggle("is-loading", loading);
    const bars = createWaveformBars(peaks, "track-waveform__bar", "--track-bar");
    dom.trackWaveform.replaceChildren(...bars);
  }

  function renderTrackDetailWaveform(peaks) {
    const bars = createWaveformBars(peaks, "track-detail__bar", "--track-detail-bar");
    dom.trackDetailWaveform.replaceChildren(...bars);
  }

  function getTrackFocusWindow(peaks, focusRatio, windowFraction = 0.18) {
    if (!peaks.length) {
      return {
        peaks,
        startIndex: 0,
        endIndex: 0,
        startRatio: 0,
        endRatio: 0,
        localRatio: 0,
      };
    }

    const total = peaks.length;
    const windowSize = clamp(Math.round(total * windowFraction), 24, total);
    const focusIndex = Math.round(clamp(focusRatio, 0, 1) * Math.max(total - 1, 1));
    const maxStart = Math.max(0, total - windowSize);
    const startIndex = clamp(focusIndex - Math.floor(windowSize / 2), 0, maxStart);
    const endIndex = Math.min(total, startIndex + windowSize);
    const localRatio = windowSize > 1 ? (focusIndex - startIndex) / (windowSize - 1) : 0;

    return {
      peaks: peaks.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      startRatio: total > 1 ? startIndex / (total - 1) : 0,
      endRatio: total > 1 ? Math.max(startIndex, endIndex - 1) / (total - 1) : 0,
      localRatio: clamp(localRatio, 0, 1),
    };
  }

  function getTrackProgressRatio() {
    if (!state.audio.duration) {
      return 0;
    }

    return clamp(state.audio.currentTime / state.audio.duration, 0, 1);
  }

  function clearTrackHover() {
    trackHoverRatio = null;
    trackHoverMessage = "";
  }

  function setTrackHover(ratio, { scrubbing = false } = {}) {
    if (!state.audio.duration) {
      clearTrackHover();
      return;
    }

    const safeRatio = clamp(ratio, 0, 1);
    trackHoverRatio = safeRatio;
    const nextTime = state.audio.duration * safeRatio;
    trackHoverMessage = `${scrubbing ? "Scrubbing" : "Jump"} to ${formatClock(nextTime)}`;
  }

  function syncTrackUi() {
    const hasTrack = state.audio.mode === "track";
    const progress = getTrackProgressRatio();
    const sourcePeaks = state.audio.waveform.length ? state.audio.waveform : EMPTY_TRACK_WAVEFORM;
    const focusRatio = hasTrack ? (trackHoverRatio ?? progress) : 0;
    const overviewBarCount = getTrackWaveformBarCount();
    const renderedPeaks = downsampleTrackWaveform(sourcePeaks, overviewBarCount);
    const waveformKey = `${state.audio.trackName}:${state.audio.waveformPending}:${state.audio.waveform.length}:${hasTrack}:${overviewBarCount}`;
    const windowFraction = dom.hud.clientWidth > 1100 ? 0.14 : dom.hud.clientWidth > 820 ? 0.18 : 0.24;
    const focusWindow = getTrackFocusWindow(sourcePeaks, focusRatio, windowFraction);
    const detailBarCount = getTrackDetailBarCount();
    const detailPeaks = downsampleTrackWaveform(
      focusWindow.peaks.length ? focusWindow.peaks : EMPTY_TRACK_WAVEFORM,
      detailBarCount,
    );
    const detailKey =
      `${state.audio.trackName}:${state.audio.waveformPending}:${state.audio.waveform.length}:` +
      `${focusWindow.startIndex}:${focusWindow.endIndex}:${detailBarCount}:${hasTrack}`;

    if (renderedTrackWaveformKey !== waveformKey) {
      renderTrackWaveform(renderedPeaks, {
        placeholder: !state.audio.waveform.length,
        loading: state.audio.waveformPending,
      });
      renderedTrackWaveformKey = waveformKey;
    } else {
      dom.trackWaveform.classList.toggle("is-placeholder", !state.audio.waveform.length);
      dom.trackWaveform.classList.toggle("is-loading", state.audio.waveformPending);
    }

    if (renderedTrackDetailKey !== detailKey) {
      renderTrackDetailWaveform(detailPeaks);
      renderedTrackDetailKey = detailKey;
    }

    if (!hasTrack) {
      clearTrackHover();
    }

    dom.trackPanel.classList.toggle("is-active", hasTrack);
    dom.trackTitle.textContent = hasTrack
      ? state.audio.trackName || "Untitled track"
      : "Load a local track to unlock waveform scrubbing.";
    dom.trackTime.textContent = `${formatClock(state.audio.currentTime)} / ${formatClock(state.audio.duration)}`;
    dom.trackCurrentTime.textContent = formatClock(state.audio.currentTime);
    dom.trackDurationTime.textContent = formatClock(state.audio.duration);
    dom.trackPlayButton.textContent = state.audio.isPlaying ? "Pause" : "Play";
    dom.trackPreview.tabIndex = hasTrack ? 0 : -1;
    dom.trackPreview.setAttribute("aria-disabled", String(!hasTrack));
    dom.trackPreview.setAttribute("aria-valuemin", "0");
    dom.trackPreview.setAttribute("aria-valuemax", String(Math.round(state.audio.duration || 0)));
    dom.trackPreview.setAttribute("aria-valuenow", String(Math.round(state.audio.currentTime || 0)));
    dom.trackPreview.setAttribute(
      "aria-valuetext",
      `${formatClock(state.audio.currentTime)} of ${formatClock(state.audio.duration)}`,
    );
    dom.trackPreview.style.setProperty("--track-progress", `${(progress * 100).toFixed(2)}%`);
    dom.trackDetailPreview.style.setProperty("--track-detail-progress", `${(focusWindow.localRatio * 100).toFixed(2)}%`);
    dom.trackWindowStart.textContent = formatClock(state.audio.duration * focusWindow.startRatio);
    dom.trackWindowEnd.textContent = formatClock(state.audio.duration * focusWindow.endRatio);
    dom.trackWindowRange.textContent =
      `${formatClock(state.audio.duration * focusWindow.startRatio)} - ${formatClock(state.audio.duration * focusWindow.endRatio)}`;
    dom.trackWindowLabel.textContent = hasTrack
      ? trackHoverRatio !== null
        ? `Zoom around ${formatClock(state.audio.duration * focusRatio)}.`
        : "Zoom around the playhead."
      : "Load a track to inspect a local detail window.";

    if (trackHoverRatio !== null && hasTrack) {
      dom.trackPreview.classList.add("has-hover");
      dom.trackPreview.style.setProperty("--track-hover", `${(trackHoverRatio * 100).toFixed(2)}%`);
    } else {
      dom.trackPreview.classList.remove("has-hover");
    }

    dom.trackHoverTime.textContent =
      trackHoverMessage ||
      (state.audio.waveformPending
        ? "Analyzing the waveform..."
        : hasTrack
          ? "Click or drag to choose where playback jumps."
          : "Load a local track to scrub visually.");

    dom.seekBackButton.disabled = !hasTrack;
    dom.trackPlayButton.disabled = !hasTrack;
    dom.seekForwardButton.disabled = !hasTrack;
  }

  function updateSelectorSelection() {
    sceneOptionButtons.forEach((button, index) => {
      const selected = index === state.modeIndex;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    paletteOptionButtons.forEach((button, index) => {
      const selected = index === state.paletteIndex;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function syncSelectionButtons() {
    dom.paletteButton.textContent = `Palette: ${palettes[state.paletteIndex].name}`;
    dom.modeButton.textContent = `Mode ${state.modeIndex + 1}/${visualModes.length}: ${getCurrentMode().name}`;
    updateSelectorSelection();
  }

  function syncPresetUi() {
    dom.presetButton.textContent = `Preset: ${getCurrentPresetName()}`;
    dom.autoPresetButton.classList.toggle("is-active", state.auto.enabled);
    dom.autoPresetButton.setAttribute("aria-pressed", String(state.auto.enabled));
  }

  function syncSourceButtons() {
    dom.micButton.classList.toggle("is-active", state.audio.mode === "mic");
    dom.trackButton.classList.toggle("is-active", state.audio.mode === "track");
    dom.demoButton.classList.toggle("is-active", state.audio.mode === "demo");
  }

  const visualModes = createVisualModes(renderer.createSceneTools());

  function buildSceneOption(mode, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-card";
    button.dataset.sceneIndex = String(index);

    const shortcut = document.createElement("span");
    shortcut.className = "choice-card__index";
    shortcut.textContent = `${index + 1}`;

    const title = document.createElement("strong");
    title.className = "choice-card__title";
    title.textContent = mode.name;

    const description = document.createElement("span");
    description.className = "choice-card__description";
    description.textContent = mode.description || `Scene ${index + 1}`;

    button.append(shortcut, title, description);
    button.addEventListener("click", () => {
      markPresetDirty();
      setVisualMode(index);
    });

    return button;
  }

  function buildPaletteOption(palette, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette-chip";
    button.dataset.paletteIndex = String(index);
    button.style.setProperty("--chip-bg-1", palette.bg1);
    button.style.setProperty("--chip-bg-2", palette.bg2);
    button.style.setProperty("--chip-accent", palette.accent);

    const content = document.createElement("div");
    content.className = "palette-chip__content";

    const shortcut = document.createElement("span");
    shortcut.className = "palette-chip__index";
    shortcut.textContent = `P${index + 1}`;

    const title = document.createElement("strong");
    title.className = "palette-chip__title";
    title.textContent = palette.name;

    const description = document.createElement("span");
    description.className = "palette-chip__description";
    description.textContent = PALETTE_COPY[palette.name] || "custom light and shadow mix";

    const swatches = document.createElement("div");
    swatches.className = "palette-chip__swatches";

    for (const color of palette.wells) {
      const swatch = document.createElement("span");
      swatch.className = "palette-chip__swatch";
      swatch.style.setProperty("--swatch", color);
      swatches.append(swatch);
    }

    content.append(shortcut, title, description);
    button.append(content, swatches);
    button.addEventListener("click", () => {
      markPresetDirty();
      setPalette(index);
    });

    return button;
  }

  function renderSelectionLibraries() {
    sceneOptionButtons = visualModes.map((mode, index) => buildSceneOption(mode, index));
    paletteOptionButtons = palettes.map((palette, index) => buildPaletteOption(palette, index));
    dom.sceneSelector.replaceChildren(...sceneOptionButtons);
    dom.paletteSelector.replaceChildren(...paletteOptionButtons);
    updateSelectorSelection();
  }

  function updateMeta() {
    dom.meta.textContent =
      `Scene: ${getCurrentMode().name} | ` +
      `Palette: ${palettes[state.paletteIndex].name} | ` +
      `Preset: ${getCurrentPresetName()} | ` +
      `Auto: ${state.auto.enabled ? "On" : "Off"} | ` +
      `Source: ${state.audio.mode} | ` +
      `Energy: ${Math.round(state.audio.energy * 100)}% | ` +
      `B ${Math.round(state.audio.bass * 100)} M ${Math.round(state.audio.mids * 100)} H ${Math.round(state.audio.high * 100)}`;
  }

  function syncDebugUi(force = false) {
    dom.debugPanel.hidden = !state.debug.enabled;
    dom.debugButton.classList.toggle("is-active", state.debug.enabled);
    dom.debugButton.setAttribute("aria-pressed", String(state.debug.enabled));

    if (!state.debug.enabled) {
      return;
    }

    const now = performance.now();
    if (!force && now - state.debug.lastSyncAt < state.debug.syncIntervalMs) {
      return;
    }

    state.debug.lastSyncAt = now;
    const { bass, mids, high, energy, pulse, presence, centroid, detector, events } = state.audio;
    const bassBand = detector.bands.bass;
    const highBand = detector.bands.high;
    const energyBand = detector.bands.energy;

    dom.debugSummary.textContent =
      `FPS ${state.perf.fps.toFixed(1)} | frame ${formatMs(state.perf.frame.avg)} avg / ` +
      `${formatMs(state.perf.frame.last)} last / ${formatMs(state.perf.frame.max)} max | ` +
      `particles ${state.perf.particles} | dpr ${state.dpr.toFixed(2)}`;

    dom.debugStages.textContent =
      "Stages " +
      `audio ${formatMs(state.perf.stages.audio.avg)} | ` +
      `reactors ${formatMs(state.perf.stages.reactors.avg)} | ` +
      `clear ${formatMs(state.perf.stages.clear.avg)} | ` +
      `backdrop ${formatMs(state.perf.stages.backdrop.avg)} | ` +
      `particles ${formatMs(state.perf.stages.particles.avg)} | ` +
      `overlay ${formatMs(state.perf.stages.overlay.avg)} | ` +
      `hud ${formatMs(state.perf.stages.hud.avg)}`;

    dom.debugAudio.textContent =
      `Audio E ${formatPercent(energy)} B ${formatPercent(bass)} M ${formatPercent(mids)} ` +
      `H ${formatPercent(high)} P ${formatPercent(pulse)} Presence ${formatPercent(presence)} ` +
      `Centroid ${centroid.toFixed(2)} | gaps bass ${Math.round(bassBand.floorMs)}ms ` +
      `high ${Math.round(highBand.floorMs)}ms energy ${Math.round(energyBand.floorMs)}ms | ` +
      `drops bass ${Math.round(bassBand.suppressedMs)}ms high ${Math.round(highBand.suppressedMs)}ms | ` +
      `act bb ${Math.round(events.active.bassBeat * 100)} br ${Math.round(events.active.bassReturn * 100)} ` +
      `hb ${Math.round(events.active.highBeat * 100)} hr ${Math.round(events.active.highReturn * 100)}`;

    dom.debugEvents.textContent = describeRecentEvents(state, now);
  }

  function setDebugEnabled(enabled) {
    state.debug.enabled = enabled;
    state.debug.lastSyncAt = 0;
    syncDebugUi(true);
  }

  function markPresetDirty() {
    if (state.presetIndex === -1) {
      return;
    }

    state.presetIndex = -1;
    syncPresetUi();
  }

  function setPalette(index) {
    state.paletteIndex = (index + palettes.length) % palettes.length;
    applyPaletteVariables(palettes[state.paletteIndex]);
    syncSelectionButtons();
    syncPresetUi();
    updateMeta();
  }

  function cyclePalette() {
    markPresetDirty();
    setPalette(state.paletteIndex + 1);
  }

  function resetScene() {
    renderer.resetScene();
    updateMeta();
  }

  function setVisualMode(index, reseed = true) {
    state.modeIndex = (index + visualModes.length) % visualModes.length;
    syncSelectionButtons();
    syncPresetUi();

    if (reseed && state.width && state.height) {
      resetScene();
    } else {
      updateMeta();
    }
  }

  function cycleMode(step = 1) {
    markPresetDirty();
    setVisualMode(state.modeIndex + step);
  }

  function togglePause() {
    state.paused = !state.paused;
    dom.pauseButton.textContent = state.paused ? "Unfreeze" : "Freeze";

    if (!state.paused) {
      state.lastTime = 0;
    }
  }

  function applyPreset(index, { reason = "manual", reseed = true } = {}) {
    const safeIndex = ((index % presets.length) + presets.length) % presets.length;
    const preset = presets[safeIndex];

    state.presetIndex = safeIndex;
    state.auto.lastReason = reason;
    state.tension = preset.tension;
    state.drive = preset.drive;
    dom.tensionInput.value = preset.tension.toFixed(1);
    dom.driveInput.value = preset.drive.toFixed(1);
    state.paletteIndex = preset.paletteIndex;
    applyPaletteVariables(palettes[state.paletteIndex]);
    state.modeIndex = preset.modeIndex;
    syncSelectionButtons();
    syncPresetUi();

    if (reseed && state.width && state.height) {
      renderer.resetScene();
    }

    updateMeta();
  }

  function cyclePreset() {
    applyPreset(state.presetIndex >= 0 ? state.presetIndex + 1 : 0);
  }

  function setAutoEnabled(enabled) {
    state.auto.enabled = enabled;
    state.auto.blockUntil = performance.now() + 2200;
    state.auto.lastReason = enabled ? "auto-armed" : "manual";
    syncPresetUi();
    updateMeta();
    setStatus(
      enabled
        ? "Auto presets armed. Strong return events can now retune the scene."
        : "Auto presets disabled. Scene changes are back to manual control.",
    );
  }

  function toggleAutoMode() {
    setAutoEnabled(!state.auto.enabled);
  }

  function maybeHandleAutoTransition(event) {
    if (!state.auto.enabled || state.audio.mode === "idle" || event.at <= state.auto.lastHandledEventAt) {
      return;
    }

    const now = performance.now();
    if (now < state.auto.blockUntil) {
      return;
    }

    if (state.audio.mode === "track" && state.audio.currentTime * 1000 < state.auto.minTrackAgeMs) {
      return;
    }

    const nextPreset = chooseAutoPreset(event, state);
    if (!nextPreset) {
      return;
    }

    if (now - state.auto.lastSwitchAt < nextPreset.minSwitchGapMs) {
      return;
    }

    state.auto.lastHandledEventAt = event.at;
    state.auto.lastSwitchAt = now;
    state.auto.rotation[event.type] += 1;
    applyPreset(nextPreset.presetIndex, {
      reason: `auto:${event.type}`,
      reseed: true,
    });
    setStatus(
      `Auto preset ${presets[nextPreset.presetIndex].name} via ${event.type} ${Math.round(event.strength * 100)}%.`,
    );
  }

  async function exportPng() {
    const blob = await new Promise((resolve) => dom.canvas.toBlob(resolve, "image/png"));

    if (!blob) {
      setStatus("PNG export failed. The current frame could not be serialized.");
      return;
    }

    const stem = slugify(`${getCurrentPresetName()}-${getCurrentMode().name}-${state.audio.trackName || state.audio.mode || "idle"}`);
    const filename = `lumen-weave-${stem}-${createTimestamp()}.png`;
    triggerDownload(blob, filename);
    setStatus(`PNG exported: ${filename}`);
  }

  function exportPresetJson() {
    const payload = {
      app: "lumen-weave",
      exportedAt: new Date().toISOString(),
      preset: {
        index: state.presetIndex,
        name: getCurrentPresetName(),
      },
      scene: {
        index: state.modeIndex,
        name: getCurrentMode().name,
      },
      palette: {
        index: state.paletteIndex,
        name: palettes[state.paletteIndex].name,
      },
      controls: {
        tension: state.tension,
        drive: state.drive,
        autoPresets: state.auto.enabled,
      },
      source: {
        mode: state.audio.mode,
        trackName: state.audio.trackName,
      },
    };

    const filename = `lumen-weave-preset-${slugify(getCurrentPresetName())}-${createTimestamp()}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    triggerDownload(blob, filename);
    setStatus(`Preset exported: ${filename}`);
  }

  const audioController = createAudioController({
    state,
    setStatus,
    syncSourceButtons,
    onAdaptiveEvent: maybeHandleAutoTransition,
    onSourceChange: ({ mode }) => {
      const warmupMs = mode === "track" ? 3600 : mode === "demo" ? 2400 : 1800;
      state.auto.blockUntil = performance.now() + warmupMs;
      state.auto.lastHandledEventAt = 0;
      syncTrackUi();

      if (mode === "idle") {
        updateMeta();
      }
    },
  });

  function getTrackRatioFromClientX(clientX) {
    const rect = dom.trackPreview.getBoundingClientRect();
    if (!rect.width) {
      return 0;
    }

    return clamp((clientX - rect.left) / rect.width, 0, 1);
  }

  function seekTrackToRatio(ratio) {
    if (!state.audio.duration) {
      return;
    }

    audioController.seekTrack(state.audio.duration * clamp(ratio, 0, 1));
    syncTrackUi();
  }

  renderer.configure({
    nextPalettes: palettes,
    nextVisualModes: visualModes,
    nextAudioController: audioController,
    nextHudFrame: () => {
      updateMeta();
      syncTrackUi();
      syncDebugUi();
    },
  });

  window.lumenState = state;
  window.toggleLumenDebug = () => setDebugEnabled(!state.debug.enabled);
  renderSelectionLibraries();
  syncTrackUi();

  let activeTrackPointerId = null;

  function releaseTrackPointer(pointerId) {
    if (pointerId === null || typeof dom.trackPreview.releasePointerCapture !== "function") {
      return;
    }

    try {
      if (dom.trackPreview.hasPointerCapture(pointerId)) {
        dom.trackPreview.releasePointerCapture(pointerId);
      }
    } catch {
      // Ignore pointer capture edge cases.
    }
  }

  function finishTrackScrub(pointerId) {
    releaseTrackPointer(pointerId);
    activeTrackPointerId = null;
    dom.trackPreview.classList.remove("is-scrubbing");
    clearTrackHover();
    syncTrackUi();
  }

  dom.trackPreview.addEventListener("pointerdown", (event) => {
    if (!state.audio.duration) {
      return;
    }

    activeTrackPointerId = event.pointerId;
    dom.trackPreview.classList.add("is-scrubbing");
    if (typeof dom.trackPreview.setPointerCapture === "function") {
      dom.trackPreview.setPointerCapture(event.pointerId);
    }
    const ratio = getTrackRatioFromClientX(event.clientX);
    setTrackHover(ratio, { scrubbing: true });
    seekTrackToRatio(ratio);
    event.preventDefault();
  });

  dom.trackPreview.addEventListener("pointermove", (event) => {
    if (!state.audio.duration) {
      return;
    }

    const ratio = getTrackRatioFromClientX(event.clientX);
    if (activeTrackPointerId === event.pointerId) {
      setTrackHover(ratio, { scrubbing: true });
      seekTrackToRatio(ratio);
      return;
    }

    setTrackHover(ratio);
    syncTrackUi();
  });

  dom.trackPreview.addEventListener("pointerleave", () => {
    if (activeTrackPointerId !== null) {
      return;
    }

    clearTrackHover();
    syncTrackUi();
  });

  dom.trackPreview.addEventListener("pointerup", (event) => {
    if (activeTrackPointerId !== event.pointerId) {
      return;
    }

    finishTrackScrub(event.pointerId);
  });

  dom.trackPreview.addEventListener("pointercancel", (event) => {
    if (activeTrackPointerId !== event.pointerId) {
      return;
    }

    finishTrackScrub(event.pointerId);
  });

  dom.trackPreview.addEventListener("keydown", async (event) => {
    if (!state.audio.duration) {
      return;
    }

    const key = event.key;

    if (key === "ArrowLeft") {
      event.preventDefault();
      audioController.skipTrack(-TRACK_KEYBOARD_SKIP_SECONDS);
    } else if (key === "ArrowRight") {
      event.preventDefault();
      audioController.skipTrack(TRACK_KEYBOARD_SKIP_SECONDS);
    } else if (key === "PageDown") {
      event.preventDefault();
      audioController.skipTrack(-TRACK_SKIP_SECONDS);
    } else if (key === "PageUp") {
      event.preventDefault();
      audioController.skipTrack(TRACK_SKIP_SECONDS);
    } else if (key === "Home") {
      event.preventDefault();
      audioController.seekTrack(0);
    } else if (key === "End") {
      event.preventDefault();
      audioController.seekTrack(state.audio.duration);
    } else if (key === " " || key === "Enter") {
      event.preventDefault();
      await audioController.toggleTrackPlayback();
    } else {
      return;
    }

    clearTrackHover();
    syncTrackUi();
  });

  window.addEventListener("resize", () => {
    renderer.fitCanvas();
    syncTrackUi();
  });

  window.addEventListener("keydown", (event) => {
    if (isInteractiveTarget(event.target)) {
      return;
    }

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
      dom.hud.classList.toggle("is-hidden", state.hiddenHud);
    } else if (key === "m") {
      audioController.startMic();
    } else if (key === "u") {
      dom.audioFileInput.click();
    } else if (key === "d") {
      audioController.startDemo();
    } else if (key === "p") {
      setDebugEnabled(!state.debug.enabled);
    } else if (key === "r") {
      cyclePreset();
    } else if (key === "a") {
      toggleAutoMode();
    } else if (key === "e") {
      exportPng();
    } else if (key === "j") {
      exportPresetJson();
    } else if (/^\d$/.test(key)) {
      const sceneIndex = Number(key) - 1;

      if (sceneIndex < 0 || sceneIndex >= visualModes.length) {
        return;
      }

      markPresetDirty();
      setVisualMode(sceneIndex);
    }
  });

  dom.tensionInput.addEventListener("input", () => {
    state.tension = Number(dom.tensionInput.value);
    markPresetDirty();
    syncPresetUi();
    updateMeta();
  });

  dom.driveInput.addEventListener("input", () => {
    state.drive = Number(dom.driveInput.value);
    markPresetDirty();
    syncPresetUi();
    updateMeta();
  });

  dom.micButton.addEventListener("click", audioController.startMic);
  dom.trackButton.addEventListener("click", () => dom.audioFileInput.click());
  dom.demoButton.addEventListener("click", audioController.startDemo);
  dom.stopAudioButton.addEventListener("click", () => {
    clearTrackHover();
    audioController.stopAudioSource();
  });
  dom.audioFileInput.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    event.target.value = "";
    await audioController.startTrack(file);
  });
  dom.seekBackButton.addEventListener("click", () => {
    clearTrackHover();
    audioController.skipTrack(-TRACK_SKIP_SECONDS);
    syncTrackUi();
  });
  dom.trackPlayButton.addEventListener("click", async () => {
    clearTrackHover();
    await audioController.toggleTrackPlayback();
    syncTrackUi();
  });
  dom.seekForwardButton.addEventListener("click", () => {
    clearTrackHover();
    audioController.skipTrack(TRACK_SKIP_SECONDS);
    syncTrackUi();
  });
  dom.paletteButton.addEventListener("click", cyclePalette);
  dom.modeButton.addEventListener("click", () => cycleMode());
  dom.clearButton.addEventListener("click", resetScene);
  dom.pauseButton.addEventListener("click", togglePause);
  dom.debugButton.addEventListener("click", () => setDebugEnabled(!state.debug.enabled));
  dom.presetButton.addEventListener("click", cyclePreset);
  dom.autoPresetButton.addEventListener("click", toggleAutoMode);
  dom.exportImageButton.addEventListener("click", exportPng);
  dom.exportPresetButton.addEventListener("click", exportPresetJson);

  applyPreset(0, { reseed: false, reason: "startup" });
  renderer.fitCanvas();
  updateMeta();
  syncPresetUi();
  syncTrackUi();
  syncDebugUi(true);
  renderer.start();
}
