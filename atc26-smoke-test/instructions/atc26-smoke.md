# AI Training Camp 26 smoke package

The `atc26-smoke-test` package is installed. It verifies package instruction
injection, file and skill delivery, executable staging, and multi-file app
source delivery for the `ai-training-camp-26` package-intent category.

When the user says **"run the atc26 smoke test"**:

1. Read `/agent/brain/atc26/smoke-marker.md`.
2. Find the first token shaped like `ATC26_SMOKE_V<number>`.
3. Reply with that exact token only. Do not rely on a remembered version.

When the user asks to build, show, or open the ATC26 smoke dashboard:

1. Work from `/agent/brain/atc26/app`.
2. Run `node scripts/build.mjs`; this reads the staged marker and builds
   `dist/index.html`.
3. Start `node server.mjs` with an available `PORT` if the default is occupied.
4. Open the resulting dashboard URL for the user.

Package installation and sync only stage these files. They do not build or
start the dashboard automatically.
