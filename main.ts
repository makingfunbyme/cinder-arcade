import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Package the original Neon Vault sources together with the supplied capture placeholders.
const entryRoot = fileURLToPath(new URL('.', import.meta.url));
const outputRoot = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outputRoot, { recursive: true });
cpSync(join(entryRoot, 'game'), join(outputRoot, 'game'), { recursive: true });
mkdirSync(join(outputRoot, 'screenshots'), { recursive: true });
if (existsSync(join(entryRoot, 'screenshots'))) {
  cpSync(join(entryRoot, 'screenshots'), join(outputRoot, 'screenshots'), { recursive: true });
}
const dossier = buildDossier(outputRoot, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputRoot, 'dossier.json'), dossier);
console.log(`Neon Vault dossier written: ${join(outputRoot, 'dossier.json')}`);
