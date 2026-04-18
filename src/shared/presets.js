export const presets = [
  {
    name: "Undertow",
    description: "Watery low-end swells with colder depth.",
    modeIndex: 6,
    paletteIndex: 5,
    tension: 1.05,
    drive: 1.35,
  },
  {
    name: "Solar Drift",
    description: "Long-flowing currents with warm bass anchors.",
    modeIndex: 0,
    paletteIndex: 0,
    tension: 1.1,
    drive: 1.3,
  },
  {
    name: "Prism Choir",
    description: "Sharper mirrored spokes and brighter returns.",
    modeIndex: 1,
    paletteIndex: 2,
    tension: 1.2,
    drive: 1.5,
  },
  {
    name: "Grid Furnace",
    description: "Harder lattice pulses and energy-led scanlines.",
    modeIndex: 2,
    paletteIndex: 6,
    tension: 1.5,
    drive: 1.45,
  },
  {
    name: "Verdant Bloom",
    description: "Softer bloom mass for mids and bass returns.",
    modeIndex: 3,
    paletteIndex: 3,
    tension: 0.95,
    drive: 1.35,
  },
  {
    name: "Night Signals",
    description: "Sparse constellation lines for treble rebounds.",
    modeIndex: 4,
    paletteIndex: 1,
    tension: 1.15,
    drive: 1.4,
  },
  {
    name: "Faultline Surge",
    description: "Angular shards and fracture flashes for peak sections.",
    modeIndex: 5,
    paletteIndex: 4,
    tension: 1.55,
    drive: 1.55,
  },
  {
    name: "Monolith Echo",
    description: "Brutalist lifts, block hits, and heavier stage bars.",
    modeIndex: 7,
    paletteIndex: 8,
    tension: 1.7,
    drive: 1.5,
  },
  {
    name: "Survey Lines",
    description: "Contour rings and measured mids for wider arrangements.",
    modeIndex: 8,
    paletteIndex: 7,
    tension: 1.05,
    drive: 1.35,
  },
];

const AUTO_PRESET_RULES = {
  "bass-return": {
    minStrength: 0.3,
    minSwitchGapMs: 3400,
    candidates: [0, 4, 1, 7],
    peakCandidates: [4, 0, 7, 1],
  },
  "mids-return": {
    minStrength: 0.24,
    minSwitchGapMs: 3600,
    candidates: [8, 4, 2, 0],
    peakCandidates: [8, 4, 5, 2],
  },
  "high-return": {
    minStrength: 0.3,
    minSwitchGapMs: 4200,
    candidates: [2, 5, 6, 7],
    peakCandidates: [5, 7, 6, 2],
  },
  "energy-return": {
    minStrength: 0.34,
    minSwitchGapMs: 4600,
    candidates: [3, 6, 7, 1],
    peakCandidates: [7, 6, 3, 5],
  },
  "silence-break": {
    minStrength: 0.32,
    minSwitchGapMs: 5200,
    candidates: [8, 5, 0],
    peakCandidates: [8, 5, 7],
  },
  "bass-beat": {
    minStrength: 0.7,
    minSwitchGapMs: 5800,
    candidates: [1, 0, 4, 7],
    peakCandidates: [4, 7, 0, 1],
  },
  "high-beat": {
    minStrength: 0.7,
    minSwitchGapMs: 6200,
    candidates: [2, 6, 5, 7],
    peakCandidates: [7, 6, 5, 2],
  },
  "energy-beat": {
    minStrength: 0.72,
    minSwitchGapMs: 6800,
    candidates: [3, 7, 6, 1],
    peakCandidates: [7, 6, 3, 5],
  },
};

export function chooseAutoPreset(event, state) {
  const rule = AUTO_PRESET_RULES[event.type];

  if (!rule || event.strength < rule.minStrength) {
    return null;
  }

  const rotation = state.auto.rotation[event.type] || 0;
  const candidates = event.strength >= 0.72 && rule.peakCandidates ? rule.peakCandidates : rule.candidates;
  let presetIndex = candidates[rotation % candidates.length];

  if (presetIndex === state.presetIndex && candidates.length > 1) {
    presetIndex = candidates[(rotation + 1) % candidates.length];
  }

  return {
    presetIndex,
    minSwitchGapMs: rule.minSwitchGapMs,
  };
}
