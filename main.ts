// Burner Rush — the hand-in program (Node 22, standard library only).
//
// The game lives in this repository as plain static files under game/ (an
// index.html plus ES modules, no library, no network request) with 3 or 4
// screenshots of it under screenshots/. This program copies both folders into
// the grader's output directory and writes /output/dossier.json, the summary
// the judge reads, using the vendored make.fun library.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The two runs the grader does must write identical bytes: cpSync copies the
// files as they are and buildDossier is a pure function of the copied tree
// (no timestamps, no randomness), so the second run matches the first.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast with a clear message instead of letting the dossier builder
// complain later about a missing folder.
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
if (!existsSync(gameDir)) throw new Error('missing game/ directory');
if (!existsSync(shotsDir) || readdirSync(shotsDir).length === 0) {
  throw new Error('missing screenshots/ directory or no screenshots in it');
}

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (see the kit's RULES.txt): the text budget shapes the
// dossier's bytes; the rest refuse an entry the scorer would refuse — more than
// 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB
// of game files in all, or a path under game/ over 1000 bytes. game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json.
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
