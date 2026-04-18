# Lumen Weave

Lumen Weave is a dependency-free audio-reactive canvas piece built with plain HTML, CSS, and the Web Audio API.

It listens to a microphone, uploaded track, or internal demo signal and maps the audio into:

- bass, mids, and treble energy
- overall motion and spectral centroid
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
- `Mode` or `N` cycles scenes
- `1-5` jumps directly to a specific scene
- `Space` cycles palettes
- `C` clears and reseeds the particle field
- `H` hides the HUD
- `Freeze` pauses animation while preserving the current frame

## Scenes

- `1 Flow`: the base particle stream scene with spectral veil, halo rings, and reactor markers
- `2 Kaleido`: mirrored radial drawing with petal-like symmetry and rotating bands
- `3 Pulse Grid`: a deformed audio grid with rectilinear particles and grid overlays
- `4 Bloom`: softer mist, expanding rings, and more floral radial motion
- `5 Constellation`: point cloud with line connections and orbital motion

## Audio Sources

- `Mic`: uses `getUserMedia`; best tested on `localhost` or `https`
- `Track`: creates a local object URL from a chosen audio file and routes it through the analyser
- `Demo`: builds a synthetic Web Audio graph so the piece can be tested without external input

## File Layout

- `index.html`: canvas and HUD markup
- `styles.css`: visual system for the overlay panel and page shell
- `script.js`: audio analysis, scene system, rendering, controls, and demo audio graph
- `favicon.svg`: local favicon so the page stays clean in the console
- `screenshots/`: captured reference images from this session

## Architecture Notes

The runtime in `script.js` is organized around a few core pieces:

- `state.audio`: Web Audio context, analyser buffers, smoothed audio features, and source status
- `state.reactors`: moving attractor/repulsor points derived from current audio features
- `visualModes`: scene registry; each mode defines its own field sampler, backdrop, particle renderer, overlay, and particle behavior
- `tick()`: reads audio, rebuilds reactors, clears the frame with mode-specific persistence, updates particles, renders overlays, and refreshes HUD text

## Verification

The current version was checked with:

- `node --check script.js`
- browser render verification with Playwright
- demo audio activation and stop/reset behavior
- scene switching through `Mode`, `N`, and direct keys `1-5`
- a quick mobile viewport pass to confirm the HUD still fits on narrow screens

## Next Recommended Work

- add beat detection so transients can trigger visual events, flashes, and scene transitions
- add presets to store combinations of scene, palette, tension, and drive
- add export controls for screenshots and short video capture
- add an auto mode that chooses scenes based on audio sections
- add one harsher scene family such as `Glitch` or `Topographic` for stronger contrast

## Session Handoff

For a more explicit handoff of what was built in this session, see [SESSION_NOTES.md](./SESSION_NOTES.md).
