// Ember & Oak — Rush Hour Kitchen: the hand-in program (Node 22, standard
// library only). It copies the game's static files and its screenshots into
// the output directory and writes the dossier the judge reads, using the
// vendored make.fun library. The game itself needs no build step: game/ is
// plain files a desktop browser loads offline.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps match the gate's own limits: at most 4 screenshots of 256 KiB,
// a game/ of at most 993 files and 48 MiB, and a dossier text of 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Read-back verification (finisher edit): the dossier must parse as JSON
// and the game shell must have landed in the output directory, otherwise
// the grader would receive an unreadable hand-in.
const dossierRaw = readFileSync(join(out, 'dossier.json'), 'utf-8');
const dossier = JSON.parse(dossierRaw) as unknown;
if (typeof dossier !== 'object' || dossier === null) {
  throw new Error('dossier.json did not parse as a JSON object');
}
if (!existsSync(join(out, 'game', 'index.html'))) {
  throw new Error('game/index.html missing from output');
}
