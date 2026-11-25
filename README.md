# BURNER RUSH — a tiny kitchen rush

[![bounty](https://make.fun/bounty/best-cooking-game-20261125-0137/badge)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![repo](https://img.shields.io/badge/repo-burner--rush-2ea44f)](https://github.com/tuyullsxx1-cmd/burner-rush)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A complete original cooking game built for the
[make.fun bounty "Make the best cooking game"](https://make.fun/bounty/best-cooking-game-20261125-0137)
($250 prize pool, 1st $60).

## The game

Overcooked-lite, single player, 1280×720 canvas. You are the only chef in a
tiny kitchen. Order tickets arrive on the board — each one names a dish and a
recipe. Run the kitchen, plate the dish, serve it before the customer's
patience bar runs out.

**Stations**

- **Pantry** — Tomato, Lettuce, Patty, Bun, Cheese
- **Chopping board** — chop tomato / lettuce (1.4 s)
- **Stove** — 2 burners, cook a patty (6 s); leave it too long and it burns
- **Plates** — take a clean plate
- **Assembly** — build the dish on the plate, in any order
- **Serve window** — serve the finished plate, earn coins + tip
- **Trash** — throw away a wrong ingredient or a burnt patty

**Dishes**

| Dish | Recipe | Price |
| --- | --- | --- |
| Garden Salad | chopped tomato + chopped lettuce | 10 coins |
| Cheese Burger | bun + cooked patty + cheese | 14 coins |
| Deluxe Burger | bun + cooked patty + cheese + chopped tomato | 18 coins |

Tip = round(10 × time fraction left on the ticket); a combo of 3 or more
serves in a row adds +2. Three hearts: an expired ticket or a wrong dish
costs one. Shift lasts 150 seconds; orders arrive faster and patience
shrinks as the rush builds.

**Controls**

- WASD / arrow keys — move the chef
- E / Space — use the station you are standing at
- Click a station — walk there and use it on arrival
- Enter — start, R — restart, M — mute

Everything is drawn in code (no image or audio files, no network, no
libraries). Sound is a tiny WebAudio synth. Source is split by job:

- `game/src/config.js` — field, stations, recipes, timings, palette
- `game/src/random.js` — seeded RNG and helpers
- `game/src/recipes.js` — order generation and dish matching
- `game/src/world.js` — simulation: movement, stations, serving, scoring
- `game/src/input.js` — keyboard + pointer
- `game/src/sound.js` — WebAudio synth effects
- `game/src/render.js` — all drawing
- `game/src/shots.js` — scripted autopilot that plays real games for the screenshots
- `game/main.js` — boot and frame loop

## Run it

```sh
node serve.ts 8080
# open http://localhost:8080/
```

Screenshot mode (used for the four shots in `screenshots/`):

```
http://localhost:8080/?shot=cover&seed=1
http://localhost:8080/?shot=play&seed=1
http://localhost:8080/?shot=rush&seed=1
http://localhost:8080/?shot=serve&seed=1
```

## Build (make.fun entrypoint)

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` into
`/output` and writes `/output/dossier.json` with `buildDossier` from the
kit's vendored `vendor/makefun-game.ts` (copied from the kit unchanged).
