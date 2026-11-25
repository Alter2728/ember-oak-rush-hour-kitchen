# Ember &amp; Oak — Rush Hour Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/altertera28/ember-oak-rush-hour-kitchen/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/altertera28/ember-oak-rush-hour-kitchen/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete, original 2D cooking game that runs in a desktop browser from static files — no build step, no network requests. You are the chef of Ember &amp; Oak, a little neighbourhood kitchen, and the lunch rush has just started.

## How to play

Orders land on the board with a patience timer. For each ticket:

1. **Grab** an ingredient at the pantry — click a crate, or stand by the pantry and press **1–7**.
2. **Chop** it on the chopping board — place it with **E**, then **hold E** to chop.
3. **Cook** it on the stove — **E** to place it on a burner, **E** again to take it when it dings. Leave it too long and it burns.
4. **Plate** it on the plating counter — **E** adds each finished component; **E** with empty hands picks the plate up.
5. **Serve** it at the serving window before the ticket's patience runs out.

Serve fast for a tip, and chain serves for a combo bonus. Five recipes unlock as the shift heats up: Garden Salad, Ember Burger, Sunny Soup, Pasta Pomodoro and Cheesy Melt.

**Win the shift:** bank **$150** before the 3-minute timer ends. **Lose it:** let 3 orders expire, or finish the shift short of the target.

**Controls:** WASD / arrow keys to move (or click anywhere to walk there, click a station to walk over and use it), **E** or **Space** to interact, **1–7** to grab pantry ingredients, **P** to pause, **M** to mute, **R** to restart after a shift. All sound is synthesized in the browser; all art is drawn on canvas.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser and press Enter (or click **START SHIFT**).

The entry's hand-in program is `main.ts` (Node 22, standard library only): it copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/index.html` + `game/style.css` — the page shell.
- `game/src/config.js` — tuning, ingredients, recipes, levels.
- `game/src/world.js` — the simulation: orders, stations, scoring.
- `game/src/render.js` — all canvas drawing.
- `game/src/input.js` — keyboard and mouse.
- `game/src/audio.js` — synthesized sound effects (WebAudio, no files).
- `game/src/shots.js` — deterministic staged scenes behind `?shot=start|play|serve|end`.
- `game/src/main.js` — the game loop.
- `screenshots/` — four real renders of the game, taken in a browser.

---

<sub>Entered on [make.fun](https://make.fun/?ref=6e6p7qpw&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
