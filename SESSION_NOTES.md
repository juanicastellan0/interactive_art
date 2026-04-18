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

## Phase 1 Baseline Added

Date: 2026-04-17

The first instrumentation pass is now in place:

- added a `Debug` button and `P` shortcut to toggle the baseline panel
- added smoothed frame timing and per-stage timing metrics
- exposed candidate audio-trigger events in the HUD for future beat and contrast work
- measured all 5 scenes with the built-in `Demo` source
- wrote the current baseline and findings to `docs/performance-baseline.md`

## Phase 2 Runtime Rework

Date: 2026-04-17

Follow-up work completed after the initial baseline:

- optimized `Bloom` so it is no longer the clear render outlier
- replaced the provisional event log with an adaptive detector for beats and band returns
- updated the demo generator so it creates clearer presence/absence cycles for validation
- split the runtime into `src/audio`, `src/render`, `src/scenes`, `src/ui`, and `src/shared`
- kept the debug baseline panel working across the refactor

## Phase 3 Scene Event Pass

Date: 2026-04-18

Follow-up work completed on top of the modular runtime:

- wired adaptive beat/return events into `Flow`, `Kaleido`, `Pulse Grid`, and `Constellation` so they respond more visibly when bands reappear
- reduced `Constellation` overlay cost by capping sampled nodes, using squared-distance checks, and keeping the return accents cheaper than the old dense link pass
- extended the detector with relative drop tracking so it can detect returns in dense mixes, not only after near-silence
- added detector warmup on source changes to give the baselines a moment to settle before logging events
- tuned the detector against the included real track `01-hemka-abyss.mp3`
- added debug HUD visibility for relative drop timers alongside the older gap timers

## Phase 4 Presets, Export, And Multi-Track Validation

Date: 2026-04-18

Follow-up work completed after the scene event pass:

- added a preset system that packages scene, palette, tension, and drive into one switch
- added auto presets so strong adaptive events can retune the whole look without manual scene changes
- used return events as the primary trigger and strong beats as a fallback on denser tracks
- added `PNG` export for the current frame
- added `Preset JSON` export for the current state
- validated the detector against five bundled tracks instead of a single reference song

## Phase 5 Visual Contrast Pass

Date: 2026-04-18

Follow-up work completed after presets/export:

- added a clearer per-frequency visual vocabulary:
  - bass as low anchors and heavy rings
  - mids as ribbons and structural contour lines
  - highs as sparks and spoke flares
  - silence as darker subtraction with exposed guide lines
- increased beat readability with a stronger beat beacon/flash layer
- increased quiet-section contrast by clearing trails more aggressively when the field drops
- added more palettes and two more scenes:
  - `Faultline`
  - `Tideglass`
- expanded presets and auto-preset routing so the new scenes are reachable in normal use

## Phase 6 Selector, Detector Rebalance, And Scene Expansion

Date: 2026-04-18

Follow-up work completed after the visual contrast pass:

- reprofiled the scene set in browser and used the numbers to trim `Faultline` and `Tideglass`
- lowered `Faultline` density and replaced some of its shared overlay language with cheaper seam/crack drawing
- lowered `Tideglass` density and gave it broader surf bands plus glass-panel overlays so it reads less like the other radial scenes
- added a visual scene library and a visual palette library so selection is no longer cycle-only
- added three more palettes:
  - `Ultramarine`
  - `Ochre`
  - `Rosefire`
- added two more distinct scenes:
  - `Monolith`
  - `Topograph`
- expanded presets and auto-preset routing so the new scenes are available to both manual and automatic switching
- rebalanced the adaptive detector so `high-return` is no longer the dominant event on dense tracks; returns now lean more toward bass/mids/energy unless treble genuinely drops out and comes back

## Current Interaction Model

The piece is primarily audio-first now.

- audio drives the field
- `Tension` changes how strongly the field bends
- `Audio Drive` scales the analyser response
- `Mode` changes the scene grammar
- `Palette` changes the color system
- `Freeze` stops animation but keeps the frame visible

## Important Implementation Details

The current runtime is modular:

- `src/audio/index.js`
  - owns audio context, sources, smoothed features, and adaptive event detection
- `src/render/index.js`
  - owns the render loop, particles, palette helpers, reactors, and timing instrumentation
- `src/scenes/index.js`
  - owns scene behavior and palette definitions
- `src/ui/index.js`
  - owns controls, HUD sync, palette/mode switching, and debug panel updates

## Verified Today

- `script.js` and the runtime modules parse with `node --check`
- browser render works
- no active console errors in normal load
- demo audio path drives the analyser correctly
- adaptive event logging now shows beat/return activity instead of the old provisional spikes
- dense-track validation now no longer overproduces `high-return`
- auto presets now produce real scene transitions in browser validation
- scene switching works through:
  - UI button
  - `N`
  - keys `1-9`
  - the visual scene library
  - the visual palette library
- mobile viewport still fits the current control panel

## Known Caveats

- microphone mode still depends on browser permission and secure-context rules
- there is no persistence yet for palette, scene, or slider settings
- export currently covers `PNG` and `Preset JSON`, but not short recordings yet
- the demo source now exercises adaptive events better, but user tracks are still the best way to validate musically meaningful returns
- `high-return` is now intentionally conservative on dense material; brighter song sections should still be checked before treating the new balance as final
- rendering is intentionally CPU-based canvas; if the piece grows much more complex, WebGL may become worth considering

## Recommended Next Steps

Priority order:

1. Validate the detector against several more real tracks and rebalance `high-return` if it proves too chatty over longer listening windows.
2. Add preset import so the exported JSON can be reapplied.
3. Add short recording export on top of the current PNG path.
4. Consider a section-aware auto mode that also uses track structure, not only adaptive events.
5. If the debug HUD needs to stay open during long profiling passes, consider separating HUD timing from the core render cost to avoid devtools-specific distortion.

## Reference Assets

- screenshots live in `screenshots/`
- the cleanest saved frame is `screenshots/lumen-weave-demo-nocturne-clean.png`

## End Of Day Handoff

Date: 2026-04-18

What is true right now:

- the app is modular and running from `script.js` into `src/audio`, `src/render`, `src/scenes`, `src/ui`, and `src/shared`
- the visual set now has `9` scenes and `10` palettes
- scene and palette selection are no longer cycle-only; there are visual selector grids in the HUD
- the current scene family feels materially more separated than before:
  - `Flow`, `Bloom`, and `Tideglass` are no longer carrying nearly the same silhouette
  - `Faultline` is now a fracture/slab scene instead of another soft radial one
  - `Monolith` and `Topograph` add two clearly different visual languages
- the adaptive detector was rebalanced so dense tracks no longer spam `high-return`

Current performance picture:

- the scenes that still cost the most are `Flow`, `Pulse Grid`, and `Bloom`
- `Faultline` and `Monolith` are cheap enough that they should not be the next optimization target
- `Constellation` is visually differentiated, but its overlay is still heavier than the newest scenes

Last validation pass:

- all touched runtime modules parsed with `node --check`
- browser validation was run with Playwright
- visual scene/palette selectors were exercised
- direct key switching `1-9` was exercised
- the five bundled tracks were used for detector validation
- current-page browser console was clean after the final reload

If work resumes next:

1. Start with `docs/performance-baseline.md` for the latest measured numbers.
2. If the next task is performance, begin with `Flow`, `Pulse Grid`, and `Bloom`.
3. If the next task is audio behavior, validate brighter song sections before loosening `high-return` again.
4. If the next task is product polish, the clearest wins are:
   - preset import
   - short video export
   - section-aware auto mode

Practical resume note:

- the documented port is still `4173`, but if it is already occupied locally, just run the server on another open port and keep using `?debug=1`
