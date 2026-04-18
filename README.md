# Lumen Weave

Lumen Weave is a dependency-free audio-reactive canvas piece built with plain HTML, CSS, and the Web Audio API.

It listens to a microphone, uploaded track, or internal demo signal and maps the audio into:

- bass, mids, and treble energy
- overall motion and spectral centroid
- adaptive beat and band-return events
- scene-specific particle flow fields
- scene overlays, halos, rings, grids, and line systems

## Run

For `Demo` or uploaded tracks, you can open `index.html` directly in a browser. For microphone input, run a local server:

```bash
cd /home/sevenfrex/dev/interactive_art
python3 -m http.server 4173
```

Then visit:

```text
http://127.0.0.1:4173
```

## Controls

- `Mic` listens to live microphone input
- `Track` loads an audio file from disk
- `Demo` starts a built-in signal so the piece is reactive without external audio
- `Stop` disconnects the current audio source
- the new scene and palette libraries let you pick visually instead of only cycling
- `Mode` or `N` cycles scenes
- `1-9` jumps directly to a specific scene
- `Space` cycles palettes
- `C` clears and reseeds the particle field
- `H` hides the HUD
- `Debug` or `P` toggles the baseline panel with frame timing, adaptive gaps, and relative drop instrumentation
- `Preset` or `R` cycles the built-in scene presets
- `Auto Presets` or `A` enables event-driven preset transitions
- `PNG` or `E` exports the current canvas frame
- `Preset JSON` or `J` exports the current scene/palette/control state as JSON
- `Freeze` pauses animation while preserving the current frame

## Scenes

- `1 Flow`: the base particle stream scene with spectral veil plus visible bass/high return shock accents
- `2 Kaleido`: mirrored radial drawing with petal-like symmetry and stronger treble-return spokes
- `3 Pulse Grid`: a deformed audio grid with rectilinear particles, scanlines, and event-driven spark crosses
- `4 Bloom`: softer mist, expanding rings, and more floral radial motion
- `5 Constellation`: point cloud with line connections, return flares, and a lighter overlay path
- `6 Faultline`: broken seams, slab fractures, and sharper peak cuts with a cheaper overlay path
- `7 Tideglass`: broader surf ribbons plus translucent panel refractions
- `8 Monolith`: brutalist columns, lift shafts, and block flashes
- `9 Topograph`: survey contours, range rings, and elevation markers

## Frequency Vocabulary

- bass now reads primarily as weight: low anchors, wide rings, and floor pressure
- mids now read primarily as structure: ribbons, folds, and contour motion
- highs now read primarily as detail: sparks, spokes, and sharp flare accents
- silence now reads as subtraction: darker masks, exposed skeleton lines, and faster trail clearing

## Audio Sources

- `Mic`: uses `getUserMedia`; best tested on `localhost` or `https`
- `Track`: creates a local object URL from a chosen audio file and routes it through the analyser
- `Demo`: builds a synthetic Web Audio graph so the piece can be tested without external input

## Presets And Auto Mode

- presets now package scene, palette, tension, and drive into one switch
- auto presets listen for strong adaptive return events and use strong beats as a fallback on denser tracks
- the current auto mapping pushes:
  - bass-led events toward `Tideglass`, `Bloom`, `Flow`, and `Survey Lines`
  - treble-led events toward `Kaleido`, `Faultline`, `Tideglass`, and `Monolith`
  - mids-led events toward `Topograph`, `Constellation`, and `Pulse Grid`
  - energy-led events toward `Bloom`, `Faultline`, and `Monolith`
- very quiet tracks may still stay mostly manual if they do not generate meaningful adaptive events in the current section

## Export

- `PNG` downloads the current frame at the current canvas resolution
- `Preset JSON` downloads the current scene, palette, source metadata, and control values

## File Layout

- `index.html`: canvas and HUD markup
- `styles.css`: visual system for the overlay panel and page shell
- `script.js`: tiny bootstrap that starts the modular runtime
- `src/audio/`: Web Audio input, feature extraction, adaptive detector, and demo graph
- `src/render/`: canvas renderer, particle system, reactor build, and performance instrumentation
- `src/scenes/`: scene registry plus palette definitions
- `src/ui/`: DOM wiring, HUD updates, controls, and debug panel sync
- `src/shared/`: math helpers and state factories
- `favicon.svg`: local favicon so the page stays clean in the console
- `docs/performance-baseline.md`: phase-1 measurements and current performance findings
- `screenshots/`: captured reference images from this session

## Architecture Notes

The runtime is now split into a few explicit layers:

- `state.audio`: Web Audio context, analyser buffers, smoothed audio features, and source status
- `state.perf`: smoothed frame and stage timings used by the debug baseline panel
- `state.debug`: debug HUD state plus recent adaptive event log
- `state.reactors`: moving attractor/repulsor points derived from current audio features
- `src/audio/index.js`: owns audio input, smoothed band features, and adaptive beat/return detection
- `src/render/index.js`: owns the render loop, particles, reactors, palette-aware helpers, and per-stage timing
- `src/scenes/index.js`: defines `visualModes`; each mode owns its field sampler, particle renderer, backdrop, and overlay
- `src/ui/index.js`: wires controls, status text, palette/mode switching, and debug HUD updates

## Verification

The current version was checked with:

- `node --check script.js`
- `node --check src/audio/index.js`
- `node --check src/render/index.js`
- `node --check src/scenes/index.js`
- `node --check src/ui/index.js`
- browser render verification with Playwright
- demo audio activation and stop/reset behavior
- scene switching through `Mode`, the visual scene library, and direct keys `1-9`
- palette switching through `Space` and the visual palette library
- adaptive detector tuning against the five bundled tracks, with special focus on dense sections where `high-return` used to dominate
- multi-track detector validation with the five bundled tracks
- real download checks for both `PNG` and `Preset JSON`
- a quick mobile viewport pass to confirm the HUD still fits on narrow screens

## Debug Baseline

Open the debug baseline with the `Debug` button, press `P`, or load:

```text
http://127.0.0.1:4173/?debug=1
```

The panel reports:

- smoothed FPS and frame time
- per-stage timings for audio, reactor build, clear, backdrop, particles, overlay, and HUD updates
- particle count and DPR
- current audio feature levels plus adaptive gap timers and relative drop timers for bass and high
- a short adaptive event log used to inspect beats and band returns during scene work

Current measured baseline notes live in [docs/performance-baseline.md](./docs/performance-baseline.md).

## Next Recommended Work

- add preset import so the exported JSON can round-trip back into the app
- add short video export on top of the current PNG path
- make auto mode section-aware so it reacts to track structure, not only isolated events
- consider a lighter HUD update path for the heaviest browser/devtool combinations if `Flow` or `Pulse Grid` need more headroom during debugging
- consider moving the heaviest overlays to WebGL if the scene vocabulary keeps growing

## Session Handoff

For a more explicit handoff of what was built in this session, see [SESSION_NOTES.md](./SESSION_NOTES.md).
