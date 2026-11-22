# Solara Bay

[![make.fun gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/c/gta6-01)
[![rank](https://make.fun/badge/gta6-01/takoyakimaru333/gta6-01/rank.svg)](https://make.fun/c/gta6-01)
[![reward](https://make.fun/badge/gta6-01/takoyakimaru333/gta6-01/reward.svg)](https://make.fun/c/gta6-01)

**Solara Bay** is an original open-world crime game for the [make.fun gta6-01 bounty](https://make.fun/c/gta6-01), built as static files with no build step and no network requests. It runs in desktop Chrome from `game/index.html` (serve the folder with any static server, or `node serve.ts` and open http://localhost:8080).

You are **Kai Mercer**, a broke boat mechanic in the sun-soaked bay city of Solara Bay. You owe the Rios family 40 grand. Fixer **Lena Voss** has work that pays — if the SBPD doesn't take you first.

## How to play

- **WASD / arrows** — walk (or drive, in a car) · **Shift** — sprint
- **Mouse** — aim · **Click / F** — punch or shoot · **1 / 2 / 3 / Q** — switch weapon
- **E** — steal / enter / exit a car · **Space** — brake · **P / Esc** — pause
- Progress, cash, weapons and data chips **save automatically** to localStorage. On the title screen, Enter continues a saved game and **N** starts fresh.

## What's in the game

- A full city on foot and by car: a road grid with named landmarks (Cafe Alba, Rios Garage, Canal Warehouse, Bay Clinic, Aurelia Tower, Solara Pier, Hilltop Hideout), a park, a canal and a beach on the bay.
- Living traffic that drives the lanes, turns at intersections and brakes for the car ahead; 40+ pedestrians who stroll, flee gunfire and get carjacked.
- Cars to steal and drive — 7 original models, parked and occupied — with speed, damage, smoke, skid marks and a garage that buys what you bring in.
- A 5-star wanted system: SBPD cruisers chase and ram you, officers pursue on foot, shoot at high heat and bust you if they hold you; break line of sight to cool the heat down.
- Combat: fists, the Harbor Pistol and the Canal SMG, with ammo, health and cash pickups, muzzle flash, particles and synthesized WebAudio sound (engine, sirens, shots) — no audio assets.
- A 6-mission story: *First Coffee*, *Borrowed Wheels*, *Hot Package* (timed), *Warehouse Debts* (shootout), *Sirens at Dusk* (escape), and *The Last Tide* (finale) — plus free-roam garage deliveries and 10 hidden data chips.
- HUD with health, cash, weapon, wanted stars, objective banner with distance and timer, and a circular minimap with objective, police and chip blips.
- Title, pause, busted, wasted and story-complete screens; respawn at Bay Clinic.

## Layout

- `game/src/world.js` — city generation, landmarks, collision
- `game/src/entities.js` — traffic, pedestrians, police factories and AI
- `game/src/missions.js` — the story as data
- `game/src/main.js` — game loop, driving, police heat, combat, missions, save
- `game/src/render.js` — world renderer and screens · `game/src/hud.js` — HUD and minimap
- `game/src/audio.js` — WebAudio synth · `game/src/input.js` — keyboard and mouse
- `main.ts` — hands the entry in: copies `game/` and `screenshots/` to the output and writes the dossier

## Screenshots

`screenshots/1-chase.jpg` (cover) is a three-star SBPD chase mid-mission; the others show the title screen, a stolen Palma Coupe on a garage run, and the warehouse shootout.
