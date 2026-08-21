# Image generation call

This file is the single swap point for how images are generated. The workflow never
calls the model anywhere else, so when the native path ships, only this file changes.

## Current path — workspace Gemini key (stored secret + secure-fetch)

Status: interim. A native, token-billed image-generation tool is in progress and will
replace this path; until it lands, generation uses the workspace's own Gemini API key.

- The key is collected during setup through the standard secret-input flow and stored
  as a workspace secret with `generativelanguage.googleapis.com` in its allowed hosts.
- Call the Gemini image model via `secure-fetch run` with the stored key: POST the
  generateContent request with the reference images as inline parts **before** the
  prompt text part (signature-detail photo first).
- The response carries the image as base64 — raise the secure-fetch max response size
  (default 256KB is far too small; images run 1-8MB, cap is 10MB), decode, and save.
- One bounded test call during setup verifies the key before config marks generation
  ready. Treat quota and auth errors as failures that alert the owner, never as an
  empty result.

## Future path — native image-generation tool (pending)

When Runneth's native image-generation tool ships (Gemini managed by the platform,
usage billed as tokens), replace the secure-fetch call here with the native tool call,
drop the key-collection step from setup, and retire the stored key. The prompt
contract (references first, text after, reference-images-only rule) does not change.
