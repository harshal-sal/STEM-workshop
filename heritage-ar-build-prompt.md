# Build Prompt — "Chronoscope" Heritage AR (A-Frame · WebXR · Meta Quest 3S)

> Paste into Antigravity IDE as the project brief. Fill the `<<< >>>` slots before running.

---

## 0. Role & mandate

You are a senior WebXR engineer. Build a **production-shaped prototype** of a heritage-site
reconstruction experience that runs in the **Meta Quest Browser on a Quest 3S**, in
`immersive-ar` (passthrough) mode, using **A-Frame + plain HTML/JS only**.

Work autonomously. Do not stop to ask permission for routine decisions — make the call, add a
`// ASSUMPTION:` comment, and keep going. Only surface a question if two options materially
change the architecture.

**Scope correction you must respect:** generative AI does *not* rebuild geometry at runtime.
Runtime is **retrieval + placement + interaction**. Model generation is an offline pipeline that
outputs `.glb` files into `/assets/sites/`. Build the runtime against a mocked asset manifest;
stub the generation pipeline behind an interface.

---

## 1. Target device constraints (do not violate)

- **Device:** Meta Quest 3S. Snapdragon XR2 Gen 2. **Color passthrough, but no dedicated depth
  projector** — depth quality is worse than Quest 3. Do **not** rely on live per-frame depth
  sensing for occlusion. Use the **Scene API room mesh** (from the user's Space Setup) as
  invisible occluders instead.
- **Runtime:** Meta Quest Browser (Chromium). No native APK, no Unity, no build step required to
  run — the app must open from a static URL and enter AR.
- **Frame budget:** hold **72 fps** minimum, target 90. That means:
  - ≤ 150 draw calls per frame
  - ≤ 350k triangles visible
  - ≤ 60 MB total texture memory; all textures KTX2/Basis compressed, max 2048²
  - all GLB models Draco-compressed
  - zero per-frame allocations in `tick()` — reuse `THREE.Vector3`/`Quaternion` scratch objects
- **No** post-processing, no realtime shadows beyond one baked-shadow plane, no dynamic lights
  beyond 1 directional + 1 ambient. Bake lighting into textures.
- **HTTPS required** for WebXR. Include a local dev cert / tunnel note in the README.

---

## 2. Stack (pinned, no substitutions)

- **A-Frame** — pin the current stable release via CDN with an integrity hash. Verify the exact
  latest version before writing the tag; do not guess.
- Vanilla ES modules. **No React, no Vue, no bundler required for the base build.**
- three.js only via `AFRAME.THREE` — never import a second three.js copy.
- Optional dev server: `vite` for HTTPS + hot reload only. The app must still work as static files.

---

## 3. Deliverable file tree

```
/index.html                 # single entry, scene graph, asset preload
/src/
  boot.js                   # XR session setup, feature detection, fallback ladder
  components/
    site-anchor.js          # hit-test placement + WebXR anchor persistence
    time-slider.js          # ruined <-> reconstructed crossfade
    room-occluder.js        # Scene API mesh -> invisible depth-write occluders
    avatar-guide.js         # gaze/proximity state machine, viseme playback
    llm-bridge.js           # streaming request/response, abort, retry, rate-limit
    stt-ptt.js              # push-to-talk capture -> transcript
    controller-input.js     # Touch Plus mapping -> semantic events
    hand-input.js           # pinch fallback when controllers are down
    perf-hud.js             # fps / drawcalls / tris, toggled by menu button
  data/
    manifest.js             # site manifest schema + loader
    sites/hampi.json        # example site record
/assets/
  sites/<site-id>/{ruin.glb, reconstructed.glb, occluders.glb, guide.glb}
  audio/                    # ambience + TTS cache
/pipeline/
  README.md                 # offline generation pipeline contract (stub)
/README.md                  # setup, HTTPS, sideload-free testing, perf notes
```

---

## 4. Meta Quest 3S control mapping (Touch Plus)

Use A-Frame's **`meta-touch-controls`** (not the legacy `oculus-touch-controls` name) plus
`laser-controls` for raycasting. Emit **semantic** events from `controller-input.js` so nothing
downstream knows about raw buttons.

| Physical input | Event on A-Frame entity | Semantic action |
|---|---|---|
| Right trigger | `triggerdown` / `triggerup` | **Select / place** — confirm anchor, press UI button |
| Right grip | `gripdown` / `gripup` | **Grab & reposition** the whole reconstruction |
| Right thumbstick X | `thumbstickmoved` | **Scrub time** — year slider, ruined → restored |
| Right thumbstick Y | `thumbstickmoved` | Scale reconstruction (0.05× miniature ↔ 1:1) |
| Left thumbstick | `thumbstickmoved` | Smooth-locomote in miniature mode only; disabled at 1:1 |
| `A` button | `abuttondown` | **Talk to guide** — push-to-talk, hold to speak |
| `B` button | `bbuttondown` | Toggle **passthrough opacity** (AR ↔ full VR reconstruction) |
| `X` button | `xbuttondown` | Toggle **info hotspots** |
| `Y` button | `ybuttondown` | Toggle **layer view** (structural / material / chronology) |
| Menu button | `menudown` | Perf HUD + reset anchor |
| Hand pinch (no controllers) | `pinchstarted` / `pinchended` | Mirrors trigger; A-button action moves to a wrist UI button |

Rules:
- Debounce thumbstick to a deadzone of 0.15.
- Every action must be reachable **both** by controller and by hand tracking.
- Haptics: pulse on anchor placed, on guide starts speaking, on scrub crossing a era boundary.

---

## 5. Feature ladder (must degrade, never crash)

Request in this order, and gracefully fall back:

1. `immersive-ar` + `hit-test` + `anchors` + `mesh-detection` + `plane-detection` → full experience
2. `immersive-ar` + `hit-test` only → place on floor plane, no real-world occlusion
3. `immersive-ar` only → place 2 m in front of user at head height, manual nudge controls
4. `immersive-vr` → render inside a neutral skybox, passthrough disabled
5. No XR (desktop browser) → orbit-camera preview mode with mouse/keyboard, for dev iteration

Detect with `navigator.xr.isSessionSupported()` and `optionalFeatures`; never hard-require a
feature that would block session start.

---

## 6. Core interaction spec

**Placement.** On entering AR, show a reticle driven by `hit-test`. Trigger places the site anchor.
Persist via a WebXR anchor + `localStorage` so a re-entered session restores position.

**Time scrub.** Two GLBs per site (`ruin.glb`, `reconstructed.glb`) occupying the same local space.
Thumbstick X drives a normalized `t ∈ [0,1]` mapped to a **year range** from the manifest.
Crossfade via per-material `opacity` + a dissolve mask, **not** by toggling visibility — the
transition must read as stone re-assembling. Show the current year on a world-locked label.

**Occlusion.** Load the Scene API room mesh, apply a material with
`colorWrite: false, depthWrite: true`, render order `-1`. Real walls now hide virtual geometry.

**Hotspots.** Manifest-driven points of interest. Ray-hover scales them; trigger opens a panel with
title, 40-word summary, and a "Ask the guide about this" affordance that seeds the LLM context.

**Avatar guide.** A rigged GLB placed at a manifest-defined spot. State machine:
`idle → attentive (user gaze > 1.2 s) → listening (A held) → thinking → speaking → idle`.
Spatial audio via `<a-entity sound>` with `positional: true`, `refDistance: 1.5`, `rolloffFactor: 1.5`.
Drive visemes from an amplitude envelope of the TTS clip if no phoneme data is available.

---

## 7. LLM + speech integration

- `llm-bridge.js` exposes `ask({ transcript, siteId, year, focusedHotspot, history })`.
- **Stream** the response; begin TTS on the first complete sentence so perceived latency < 1.2 s.
- System prompt is built from the site manifest: era, materials, patron, excavation history,
  and an explicit **"say you don't know rather than invent dates or names"** instruction.
- Keep `history` to the last 6 turns; summarize older turns into a rolling context string.
- Hard-abort in-flight requests when the user releases A and re-presses, or walks to a new hotspot.
- **STT:** Web Speech API is unreliable in Quest Browser — implement push-to-talk `MediaRecorder`
  capture posting to a transcription endpoint, with Web Speech API as an opportunistic fast path.
- All network keys live in `/config.example.js`; the committed code must never contain a real key.
- Every network call needs a timeout, one retry with jitter, and a spoken fallback line on failure.

---

## 8. Example site manifest (implement this schema)

```json
{
  "id": "hampi-vittala",
  "name": "<<< SITE NAME >>>",
  "location": { "lat": 0, "lon": 0 },
  "eraRange": { "from": 1509, "to": 2025 },
  "keyframes": [
    { "year": 1509, "model": "reconstructed.glb", "label": "Construction complete" },
    { "year": 1565, "model": "ruin.glb", "label": "After the siege" }
  ],
  "guide": { "model": "guide.glb", "persona": "<<< e.g. a 16th-c. temple stonemason >>>", "voiceId": "" },
  "hotspots": [
    { "id": "h1", "position": [2.1, 1.4, -3.0], "title": "", "summary": "", "context": "" }
  ],
  "scale": { "miniature": 0.05, "lifeSize": 1.0 },
  "attribution": "<<< survey / photogrammetry source, license >>>"
}
```

---

## 9. Acceptance criteria (verify each, report pass/fail)

1. Cold-loads and enters `immersive-ar` on Quest 3S in under 8 s on Wi-Fi.
2. Sustains ≥ 72 fps with the full reconstruction visible; perf HUD proves it.
3. Anchor survives exiting and re-entering the session.
4. Every listed control works on Touch Plus **and** has a hand-tracking equivalent.
5. Time scrub is continuous and frame-stable across the full year range.
6. Virtual columns are correctly occluded by a real wall when room mesh is available.
7. Guide answers a spoken question with audible output starting < 1.5 s after speech ends.
8. Killing the network mid-question produces a spoken fallback, not a stuck state.
9. Runs on desktop Chrome in preview mode for iteration without a headset.
10. No console errors, no memory growth over a 10-minute session (check `performance.memory`).

---

## 10. Build order

1. Static scene + desktop preview mode + perf HUD
2. XR session boot + feature ladder + fallbacks
3. Controller/hand input layer with semantic events
4. Hit-test placement + anchor persistence
5. Time scrub crossfade
6. Room-mesh occlusion
7. Hotspots
8. Avatar state machine with canned audio
9. LLM + STT/TTS bridge
10. Perf pass against the budget in §1

Commit at each step. After each step, print what you built, what you assumed, and what's untested
on real hardware.
