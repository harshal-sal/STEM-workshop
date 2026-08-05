# Chronoscope Heritage AR (Goa Heritage Site Reconstruction)

A production-shaped WebXR prototype for the **Meta Quest 3S** built with **A-Frame** and plain HTML/JS.

## Features
- **Meta Quest 3S Passthrough & AR**: Designed for `immersive-ar` with WebXR hit-test reticle placement and room-mesh occlusion.
- **Goa Site Reconstruction**: Built around the **Basilica of Bom Jesus**, transitioning between 1594 and modern times.
- **Semantic Control Mapping**: Controller & hand gesture abstractions for time scrubbing, grabbing/scaling models, and voice interactions.
- **Performance HUD**: Embedded FPS, draw calls, and triangle counter targeting 72+ FPS frame budgets.
- **Interactive Guide Persona**: Spatial audio avatar integrated with STT and LLM fallback bridges.

## Running Locally

1. Launch a local web server (e.g. using Vite or any static HTTP server):
   ```bash
   npx vite --host
   ```
2. **Desktop Preview**: Open the URL in any modern browser to test orbit controls and basic interactions.
3. **Quest 3S AR**: Open the HTTPS URL inside the Meta Quest Browser and select **Enter AR**.

## Performance Budget Guidelines
- ≤ 150 draw calls per frame
- ≤ 350k visible triangles
- ≤ 60 MB total texture memory