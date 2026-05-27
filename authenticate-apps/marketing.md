---
hero_headline: "Lock down any sandbox app behind a username and password."
hero_subhead: "Self-bootstrapping login on the first visit. Every visit after that is gated. No secrets ever touch chat."
install_time: "~3 minutes"
requires: "A sandbox app using the standard Fastify scaffold"
---

## Super powers this unlocks

- First visit picks the password; every visit after is gated.
- Works inside the Motion app previewer iframe.
- Adds drop-in login endpoints for any React frontend.
- No external dependencies beyond what your sandbox already has.

## How it works

The first time anyone opens the app, they pick a username and password. Your Runneth hashes the password and stores it on disk. From then on, every request outside the explicit allow-list is gated behind /login.

## A real example

Reza builds a private internal dashboard for the Motion team. Before sharing the URL he installs authenticate-apps. The first teammate to open it sets the password. The second sees the login page. The dashboard now runs on the same VM, behind the same Motion previewer, and no one outside the team can read it. Setup took three minutes.
