# Local Model Import

The 3D demo loads one local player model without committing it to the public
repository.

1. Download a model you are permitted to test.
2. Prefer a single `.glb` file with its skeleton and animations embedded.
3. Create `prototype/web-demo/local-assets/`.
4. Name the file `player.glb`.
5. Open the demo, for example:

   `http://127.0.0.1:4173/prototype/web-demo/`

The local-assets folder is ignored by Git. If the file is absent or fails to
load, a procedural fallback frame remains available for local debugging.

The initial scale is intentionally generic. Once a specific model is available,
adjust the scale, vertical offset, animation selection, and weapon attachment
point in `src/main.js`.
