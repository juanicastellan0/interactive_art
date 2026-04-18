# Session Notes

Date: 2026-04-16

## What Was Built

The project started as an empty folder and was turned into a self-contained browser artwork.

Work completed in this session:

- created the initial HTML canvas piece and HUD
- converted it into an audio-reactive sketch using the Web Audio API
- added `Mic`, `Track`, `Demo`, and `Stop` source controls
- added analyser-driven bass, mids, treble, centroid, pulse, and energy features
- replaced the single visual behavior with a scene system
- implemented 5 scenes:
  - `Flow`
  - `Kaleido`
  - `Pulse Grid`
  - `Bloom`
  - `Constellation`
- added local favicon handling to avoid the previous `favicon.ico` 404 noise
- captured reference screenshots in `screenshots/`

## Current Interaction Model

The piece is primarily audio-first now.

- audio drives the field
- `Tension` changes how strongly the field bends
- `Audio Drive` scales the analyser response
- `Mode` changes the scene grammar
- `Palette` changes the color system
- `Freeze` stops animation but keeps the frame visible

## Important Implementation Details

The important state lives in `script.js`:

- `state.audio`
  - owns audio context, analyser, source nodes, and smoothed feature extraction
- `state.reactors`
  - moving points rebuilt from audio values each frame
- `visualModes`
  - registry for scene behavior
  - each entry defines:
    - density
    - particle lifetime and width
    - drag and force tuning
    - trail alpha
    - `sampleField`
    - `drawBackdrop`
    - `drawParticle`
    - `drawOverlay`

This means new scenes should usually be added by creating a new mode object and its helper functions instead of branching the main render loop.

## Verified Today

- `script.js` parses with `node --check`
- browser render works
- no active console errors in normal load
- demo audio path drives the analyser correctly
- scene switching works through:
  - UI button
  - `N`
  - keys `1-5`
- mobile viewport still fits the current control panel

## Known Caveats

- microphone mode still depends on browser permission and secure-context rules
- there is no persistence yet for palette, scene, or slider settings
- there is no export shortcut yet
- there is no beat detector; scenes respond continuously but not eventfully
- rendering is intentionally CPU-based canvas; if the piece grows much more complex, WebGL may become worth considering

## Recommended Next Steps

Priority order:

1. Add beat detection and event triggers.
2. Add presets and keyboard recall.
3. Add screenshot and recording export.
4. Add auto-scene transitions driven by audio.
5. Add 1-2 more scene families with a stronger contrast profile.

## Reference Assets

- screenshots live in `screenshots/`
- the cleanest saved frame is `screenshots/lumen-weave-demo-nocturne-clean.png`
