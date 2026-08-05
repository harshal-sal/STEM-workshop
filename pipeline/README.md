# Offline Asset Generation Pipeline Contract

This directory defines the contract for offline generative AI / photogrammetry pipelines that generate modern `.glb` assets for the runtime.

## Asset Outputs Expected per Site:
- `ruin.glb`: The current modern ruin state of the site.
- `reconstructed.glb`: The fully restored historical reconstruction.
- `occluders.glb`: Pre-baked structural proxy geometry used for occlusion.
- `guide.glb`: Rigged 3D avatar of the historical guide.

## Optimization Checklist (Targeting Quest 3S):
1. All `.glb` files MUST be Draco-compressed.
2. Textures MUST be KTX2 / Basis compressed, max 2048x2048.
3. Total triangle count visible per frame must be ≤ 350k.
4. Material count per GLB minimized to keep draw calls ≤ 150.
