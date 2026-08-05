# ChronoScape VR 🏛️ — Spatial Time Machine for Meta Quest 3S

> **"Travel Through Time"** — A WebXR heritage tourism experience designed for Meta Quest 3S. Stand inside ancient archaeological ruins and trigger a 10-second temporal reconstruction to watch ancient history materialize around you. Includes support for high-detail 3D architecture/monuments imported from **Sketchfab**.

---

## 🌟 Features

- **Sketchfab 3D Monument Support**: Seamlessly load, scale, ground-align, and interact with 3D models downloaded directly from Sketchfab (`.glb` / `.gltf`).
- **Spatial Time Machine (10s Reconstruction)**: Press the **Right Trigger** on your Meta Quest 3S controller to initiate a staged 10-second animated reconstruction:
  - Columns rise from subterranean foundations.
  - Fractured walls scale up and repair.
  - Temple roof and pediment drop from above.
  - Torches ignite with flickering light.
  - Banners wave in the wind.
  - Historical citizens and avatars materialize.
- **Meta Quest 3S Optimization**: Built targeting a rock-solid **90 FPS**:
  - Teleport locomotion (Thumbstick / Grip)
  - Smooth locomotion (Left Thumbstick)
  - Snap Turn (Right Thumbstick)
  - Laser Pointer & Holographic Raycasting UI
- **AI Historical Guide ("Archilochus")**:
  - Spawns upon entry, greets the traveler, and guides them through the experience.
  - Interactive 3D Q&A panel to answer historical questions.
- **Interactive Holographic Info Cards**:
  - Point laser pointer at historical artefacts and Sketchfab 3D models to inspect period, purpose, construction materials, and historical facts.
  - Glassmorphic panels auto-orient toward the player.
- **Dynamic Time Layers**:
  - Toggle between **Present (Ruins)**, **500 Years Ago**, **1000 Years Ago**, and **Original Construction (~2100 BCE)**.
  - Dynamically shifts lighting, sky gradients, fog density, and ambient audio soundscapes.

---

## 🎨 How to Add 3D Monuments from Sketchfab

1. **Find & Download a Model from Sketchfab**:
   - Visit [Sketchfab.com](https://sketchfab.com) and search for ancient ruins or architectural monuments (e.g. *Parthenon*, *Roman Colosseum*, *Greek Temple*, *Ancient Statue*).
   - Filter by **Downloadable** and select **Format: glTF / GLB**.

2. **Save to Project**:
   - Place your downloaded `.glb` file in the `assets/models/` folder:
     ```
     ChronoScape_VR/assets/models/my_sketchfab_monument.glb
     ```

3. **Add to Scene (`index.html`)**:
   - Use the built-in `sketchfab-model` component:
     ```html
     <a-entity 
       position="0 0 -8" 
       sketchfab-model="
         src: assets/models/my_sketchfab_monument.glb;
         targetScale: 6.0;
         autoCenter: true;
         title: Roman Archway;
         period: 100 BCE;
         purpose: Triumphal Arch;
         material: Carved Travertine Stone;
         fact: Scanned 3D monument from Sketchfab.">
     </a-entity>
     ```

---

## 📁 Architecture & File Layout

```
ChronoScape_VR/
├── index.html                  # Main WebXR scene entry point
├── css/
│   └── style.css               # Glassmorphic UI overlays & loading screen styling
├── js/
│   └── main.js                 # App bootstrap, state management & era switching
├── components/
│   ├── sketchfab-model.js      # Sketchfab 3D GLTF/GLB importer, scaling & ground aligner
│   ├── time-reconstruction.js  # Staged 10-second world rebuild animation system
│   ├── npc-controller.js       # AI avatar state machine (walk, talk, idle, wave)
│   ├── guide-controller.js     # AI Guide avatar & speech sequence manager
│   ├── info-panel.js          # Floating 3D holographic information cards
│   ├── interaction-system.js   # Teleport, smooth locomotion, snap-turn, laser pointer
│   ├── audio-manager.js        # Web Audio synth, spatial sound & era audio profiles
│   └── visual-effects.js       # Dust particles, leaves, god rays, fire, magic sparks
└── assets/
    └── models/                 # Store Sketchfab .glb / .gltf files here
```

---

## 🚀 How to Run Locally

1. Launch any HTTP web server from the project directory:
   ```bash
   cd ChronoScape_VR
   python3 -m http.server 8080
   ```

2. Open in browser or Meta Quest Browser:
   ```
   http://localhost:8080
   ```

3. **In Meta Quest 3S**: Click **"Enter VR"** on the WebXR prompt to start the full 6DoF spatial experience.

---

## 🎮 VR Controls (Meta Quest 3S)

| Action | Control |
|---|---|
| **Trigger Time Reconstruction** | Right Controller Trigger / A Button (or Spacebar on Desktop) |
| **Teleport** | Right Thumbstick Push / Release |
| **Smooth Movement** | Left Thumbstick |
| **Snap Turn** | Right Thumbstick Left/Right |
| **Interact / Inspect Artefact & 3D Model** | Right Controller Laser Pointer + Trigger |
| **Cinematic Aerial Overview** | HUD button or 'C' key on Desktop |
| **Switch Eras** | Side Panel or Keys 1–4 on Desktop |
