import { SiteManifestLoader } from './data/manifest.js';

// Global state
window.appState = {
    siteId: 'goa',
    manifest: null,
    xrMode: 'desktop' // desktop, vr, ar-basic, ar-hit, ar-full
};

async function boot() {
    console.log("Booting Chronoscope AR...");
    
    // 1. Load manifest
    const manifest = await SiteManifestLoader.load('goa');
    if (!manifest) {
        console.error("Failed to load manifest. Cannot boot.");
        return;
    }
    window.appState.manifest = manifest;
    console.log("Loaded manifest for:", manifest.name);
    
    // Inject assets into A-Frame based on manifest
    const assetsEl = document.querySelector('a-assets');
    
    // Example: Add mock GLB paths to assets (they won't load if files don't exist, but A-Frame handles it)
    // <a-asset-item id="ruin-model" src="./assets/sites/goa/ruin.glb"></a-asset-item>
    
    // 2. Feature detection ladder
    detectXR();
}

async function detectXR() {
    if (!navigator.xr) {
        console.log("WebXR not supported. Using desktop preview.");
        window.appState.xrMode = 'desktop';
        return;
    }

    try {
        const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
        const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');

        if (arSupported) {
            // We'll let A-Frame handle the actual session request, but we can configure the scene's webxr component
            // based on what's available. For now, the HTML asks for everything as optional features.
            window.appState.xrMode = 'ar-full';
            console.log("Immersive AR supported.");
            
            // Note: The actual fallback logic will run when the session starts and we see which optional features were granted.
        } else if (vrSupported) {
            window.appState.xrMode = 'vr';
            console.log("Immersive VR supported (no AR).");
            // Switch background for VR
            document.querySelector('a-scene').setAttribute('background', 'color: #87CEEB');
        } else {
            console.log("No immersive sessions supported. Desktop only.");
            window.appState.xrMode = 'desktop';
        }
    } catch (e) {
        console.warn("XR Detection error", e);
        window.appState.xrMode = 'desktop';
    }
    
    // Setup listener for XR session start to manage UI
    const sceneEl = document.querySelector('a-scene');
    sceneEl.addEventListener('enter-vr', function () {
        document.getElementById('desktop-ui').style.display = 'none';
        
        // If AR, maybe disable orbit controls or change rig setup
        if (sceneEl.is('ar-mode')) {
            console.log("Entered AR Mode");
        }
    });
    sceneEl.addEventListener('exit-vr', function () {
        document.getElementById('desktop-ui').style.display = 'block';
    });
}

// Start boot process
document.addEventListener('DOMContentLoaded', boot);
