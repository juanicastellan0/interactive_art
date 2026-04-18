# Performance Baseline

Date: 2026-04-17

## Scope

This file now tracks two checkpoints:

- the original Phase 1 instrumentation baseline
- the follow-up runtime rework with `Bloom` optimization, adaptive event detection, and modularization
- the scene event pass with `Constellation` optimization and real-track detector tuning
- the presets/export pass with five-track detector validation
- the scene-library pass with detector rebalance, `Faultline` / `Tideglass` tuning, and two more scene families

Goals:

- establish a repeatable render baseline before refactoring
- expose frame cost by stage instead of guessing
- verify the impact of the `Bloom` rewrite
- verify that the adaptive detector still works after the modular refactor
- verify the `Constellation` overlay rewrite and return detection on a real track
- verify event coverage across a broader set of bundled tracks
- verify that the new scene/palette libraries do not erase the current perf headroom

## How To Reproduce

1. Run a local server:

   ```bash
   cd /home/sevenfrex/dev/interactive_art
   python3 -m http.server 4173
   ```

2. Open:

   ```text
   http://127.0.0.1:4173/?debug=1
   ```

3. Start `Demo`.
4. Leave `Tension` at `1.2` and `Audio Drive` at `1.4`.
5. Switch scenes with `1-9`.

## What The Debug Panel Shows

- `FPS` and `frame`
  - smoothed average, last frame, and max observed frame time
- `Stages`
  - `audio`, `reactors`, `clear`, `backdrop`, `particles`, `overlay`, `hud`
- `Audio`
  - energy, bass, mids, high, pulse, presence, centroid
  - adaptive gap timers plus relative drop timers for bass and high
- `Events`
  - adaptive beat and band-return log

## Baseline Run: Original Phase 1

Environment:

- local server on `127.0.0.1:4173`
- Playwright browser pass
- built-in `Demo` source
- default controls
- debug enabled through `?debug=1`

Measured samples:

| Scene | Particles | FPS | Frame avg | Backdrop avg | Particles avg | Overlay avg |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 Flow | 700 | 521.9 | 1.916 ms | 0.111 ms | 1.547 ms | 0.102 ms |
| 2 Kaleido | 260 | 601.6 | 1.662 ms | 0.143 ms | 1.321 ms | 0.073 ms |
| 3 Pulse Grid | 364 | 315.0 | 3.174 ms | 0.860 ms | 1.973 ms | 0.092 ms |
| 4 Bloom | 420 | 217.8 | 4.592 ms | 0.741 ms | 3.832 ms | 0.183 ms |
| 5 Constellation | 294 | 554.1 | 1.805 ms | 0.173 ms | 0.706 ms | 0.772 ms |

## Baseline Run: Current Runtime

Environment:

- same local server and Playwright pass
- same `Demo` source
- same default controls
- modular runtime in `src/`

Measured samples:

| Scene | Particles | FPS | Frame avg | Backdrop avg | Particles avg | Overlay avg |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 Flow | 700 | 444.5 | 2.250 ms | 0.142 ms | 1.864 ms | 0.077 ms |
| 2 Kaleido | 238 | 598.9 | 1.670 ms | 0.152 ms | 1.292 ms | 0.062 ms |
| 3 Pulse Grid | 364 | 460.9 | 2.170 ms | 0.239 ms | 1.740 ms | 0.047 ms |
| 4 Bloom | 280 | 436.0 | 2.294 ms | 0.034 ms | 2.057 ms | 0.097 ms |
| 5 Constellation | 294 | 428.3 | 2.335 ms | 0.198 ms | 0.844 ms | 1.066 ms |

Observed adaptive events during browser verification:

- repeated `bass-beat`
- repeated `high-beat`
- `mids-return` observed on the built-in demo signal

## Findings

1. `Bloom` is no longer the cost outlier.
   - Frame average improved from `4.592 ms` to `2.294 ms`.
   - Particle-stage average improved from `3.832 ms` to `2.057 ms`.
   - The biggest win came from lowering density, removing the expensive blur-heavy particle path, and replacing it with a lighter glow-stamp approach.

2. `Constellation` is now the clearest overlay hotspot.
   - Its overlay stage is still more expensive than its particle stage.
   - If another optimization pass is needed, this is the next obvious candidate.

3. `Pulse Grid` remains distinct, but its backdrop no longer dominates the frame the way it did in the first baseline.

4. The adaptive detector is working inside the modular runtime.
   - The debug HUD now reports adaptive events instead of the earlier provisional spike log.
   - The built-in demo reliably exercises beat events and at least one return path during browser verification.

## Checkpoint: Scene Event Pass And Track Tuning

Date: 2026-04-18

Environment:

- same local server and Playwright pass
- `Demo` source for the `Constellation` perf re-check
- included real track `01-hemka-abyss.mp3` for detector tuning
- default `Tension` `1.2` and `Audio Drive` `1.4`

Focused measurements:

- `Constellation` with `Demo` after the overlay rewrite:
  - `294` particles
  - `709.9` FPS
  - `1.409 ms` frame average
  - `0.213 ms` backdrop average
  - `0.882 ms` particles average
  - `0.123 ms` overlay average

- `Flow` with `01-hemka-abyss.mp3` during a 20 second browser pass:
  - observed `bass-return` `2` times
  - observed `high-return` `18` times
  - observed `mids-return` `6` times
  - observed `energy-return` `4` times
  - no current-page console errors during the validation pass

Track-tuning findings:

1. `bass-return` needed relative-drop logic, not just silence-gap logic.
   - On the real track, bass rarely vanished completely after smoothing.
   - A detector based only on near-zero floors missed the low-end comeback moments entirely.

2. The new drop-aware detector now catches low-end rebounds on dense material.
   - The included track now produces real `bass-return` events instead of only `high-return`.
   - Bass shaping was desaturated so the smoothed low band no longer pins at `1.0`.

3. `high-return` is intentionally the more active signal right now.
   - It works on the real track, but it is still comparatively chatty.
   - The next validation pass should use more songs before those thresholds are treated as final.

4. `Constellation` is no longer the obvious overlay hotspot.
   - Relative to the prior modular-runtime baseline, its overlay stage dropped from `1.066 ms` to `0.123 ms` in the current `Demo` check.
   - The lighter node sampling and cheaper flare vocabulary preserved the scene identity without carrying the old overlay cost.

## Checkpoint: Presets, Export, And Five-Track Validation

Date: 2026-04-18

Environment:

- same local server and Playwright browser pass
- built-in `Demo` for auto-preset smoke checks
- bundled real tracks for detector coverage:
  - `01-hemka-abyss.mp3`
  - `01-kid_smpl-blistering_across-6939561e.mp3`
  - `01-redeyes-timelapse.mp3`
  - `01-trilucid-the_rift_between_(extended_mix).mp3`
  - `01-vanta-dissociative_drift.mp3`

Feature checks:

- `Preset` button cycles scene/palette/tension/drive bundles
- `Auto Presets` triggers live scene changes from adaptive events
- `PNG` produces a real browser download
- `Preset JSON` produces a real browser download

Auto-preset check:

- `Demo` was used with auto presets enabled
- the scene changed from `Prism Choir` to `Night Signals`
- the status line reported `Auto preset Night Signals via high-return 76%`

Detector validation snapshot:

| Track | Observed highlights in the sampled window |
| --- | --- |
| `01-hemka-abyss.mp3` | `bass-beat`, `mids-beat`, `energy-beat`, and both `mids-return` / `high-return` |
| `01-kid_smpl-blistering_across-6939561e.mp3` | sparse first-window activity, mainly one `high-return` |
| `01-redeyes-timelapse.mp3` | a clear `bass-return` with long low/high suppression windows |
| `01-trilucid-the_rift_between_(extended_mix).mp3` | dense first-window beat activity (`energy-beat`, `high-beat`, `mids-beat`) with few returns |
| `01-vanta-dissociative_drift.mp3` | very quiet first window; essentially no adaptive events in the sampled slice |

Interpretation:

1. The detector now covers more than one musical profile.
   - It catches low-end rebounds on `redeyes`.
   - It catches brighter return moments on `hemka` and `kid_smpl`.
   - It still finds beat structure on denser material such as `trilucid`.

2. A return-only automation strategy was too narrow.
   - Some dense tracks produced mostly beats in the sampled window.
   - Auto presets were expanded to treat strong `bass-beat`, `high-beat`, and `energy-beat` as fallback transition triggers with longer cooldowns.

3. Very quiet or slowly evolving material can still remain mostly manual.
   - `vanta` stayed below meaningful event thresholds in the first sampled window.
   - That is acceptable for now, but longer-window validation should still be part of the next tuning pass.

## Checkpoint: Scene Library, New Families, And Detector Rebalance

Date: 2026-04-18

Environment:

- same local server and Playwright browser pass
- built-in `Demo` source for scene profiling
- bundled real tracks for detector re-check
- default controls after reload

Measured samples:

| Scene | Particles | FPS | Frame avg | Backdrop avg | Particles avg | Overlay avg |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 Flow | 700 | 180.5 | 5.539 ms | 0.190 ms | 4.812 ms | 0.240 ms |
| 2 Kaleido | 238 | 350.1 | 2.857 ms | 0.195 ms | 2.078 ms | 0.212 ms |
| 3 Pulse Grid | 364 | 253.1 | 3.951 ms | 0.271 ms | 2.676 ms | 0.157 ms |
| 4 Bloom | 280 | 304.0 | 3.290 ms | 0.049 ms | 2.601 ms | 0.190 ms |
| 5 Constellation | 294 | 353.2 | 2.831 ms | 0.244 ms | 1.803 ms | 0.564 ms |
| 6 Faultline | 231 | 720.9 | 1.387 ms | 0.091 ms | 0.905 ms | 0.093 ms |
| 7 Tideglass | 266 | 452.4 | 2.210 ms | 0.053 ms | 1.759 ms | 0.126 ms |
| 8 Monolith | 220 | 820.6 | 1.219 ms | 0.107 ms | 0.755 ms | 0.105 ms |
| 9 Topograph | 224 | 548.1 | 1.825 ms | 0.196 ms | 1.269 ms | 0.192 ms |

Detector validation snapshot after the rebalance:

| Track | Window | Observed highlights |
| --- | --- | --- |
| `01-hemka-abyss.mp3` | first `12s` | `mids-return`, `energy-beat`, `high-beat`; no `high-return` spike burst |
| `01-kid_smpl-blistering_across-6939561e.mp3` | first `12s` | no adaptive events in the sampled slice |
| `01-redeyes-timelapse.mp3` | first `12s` | one `bass-beat`; no treble-return spam |
| `01-trilucid-the_rift_between_(extended_mix).mp3` | first `12s` | `bass-return`, `mids-return`, `energy-return`, plus a few beats |
| `01-vanta-dissociative_drift.mp3` | first `12s` | no adaptive events in the sampled slice |
| `01-hemka-abyss.mp3` | first `20s` | `bass-return` `2`, `mids-return` `2`, `energy-return` `2`, `high-beat` `4`, still no runaway `high-return` |
| `01-trilucid-the_rift_between_(extended_mix).mp3` | first `20s` | `bass-return` `10`, `mids-return` `8`, `energy-return` `7`, and no `high-return` flood |

Interpretation:

1. `Faultline` and `Tideglass` are no longer perf concerns.
   - `Faultline` dropped to `231` particles and now sits at `1.387 ms` frame average.
   - `Tideglass` dropped to `266` particles and stays near `2.210 ms` frame average while reading more distinctly.

2. The new scene families are materially different and cheap enough to keep.
   - `Monolith` is the lightest of the structured scenes.
   - `Topograph` lands well below the older `Flow`, `Grid`, and `Bloom` costs.

3. `high-return` is no longer the dominant dense-track event.
   - In the current sampled windows, dense material is producing bass/mids/energy returns plus treble beats instead of repeated `high-return`.
   - This is closer to the intended contrast logic: treble should re-enter only when it actually disappeared, not every time it twitches.

4. `Flow`, `Pulse Grid`, and `Bloom` are now the obvious CPU hotspots in the 9-scene set.
   - Their particle passes dominate more than the new scenes do.
   - If another perf pass is needed, those three are the right next targets, not `Faultline` or `Tideglass`.

## Verification

Checked across the current runtime pass:

- `node --check script.js`
- `node --check src/audio/index.js`
- `node --check src/render/index.js`
- `node --check src/scenes/index.js`
- `node --check src/ui/index.js`
- `node --check src/shared/state.js`
- `node --check src/shared/math.js`
- `node --check src/shared/presets.js`
- browser render with debug panel enabled
- demo source activation
- scene switching across `1-9`
- visual scene-library selection
- visual palette-library selection
- preset cycling and auto-preset toggling
- real browser downloads for `PNG` and `Preset JSON`
- five-track detector sampling pass
- current-page browser console errors after the final reload: none observed

## Immediate Implications

- `Faultline` and `Tideglass` are no longer good optimization targets.
- `Flow`, `Pulse Grid`, and `Bloom` are now the clearest render hotspots in the larger scene set.
- `high-return` has been pushed back into a specialist role; the next detector pass should verify brighter song sections rather than dense intros.
