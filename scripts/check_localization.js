import fs from 'fs';
import path from 'path';
import { ru } from '../src/i18n/locales/ru.ts';
import { en } from '../src/i18n/locales/en.ts';
import { tr } from '../src/i18n/locales/tr.ts';

console.log('=== Checking all $t calls in codebase ===');

function findCalls(dir, calls = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      findCalls(full, calls);
    } else if (/\.(svelte|ts)$/.test(f)) {
      const code = fs.readFileSync(full, 'utf8');
      const matches = code.matchAll(/(?:\$t|\btranslate|\bt)\(\s*['"]([a-zA-Z0-9_.]+)['"]/g);
      for (const m of matches) {
        calls.push({ key: m[1], file: path.relative(process.cwd(), full) });
      }
    }
  }
  return calls;
}

function getVal(obj, keyPath) {
  const parts = keyPath.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr == null || typeof curr !== 'object') return undefined;
    curr = curr[p];
  }
  return curr;
}

const allCalls = findCalls('src');
console.log(`Found ${allCalls.length} $t() calls.`);

const missingInLocales = [];
for (const item of allCalls) {
  if (item.key.endsWith('.')) continue;
  const ruVal = getVal(ru, item.key);
  const enVal = getVal(en, item.key);
  const trVal = getVal(tr, item.key);
  if (ruVal === undefined || enVal === undefined || trVal === undefined) {
    missingInLocales.push({
      key: item.key,
      file: item.file,
      ru: ruVal !== undefined,
      en: enVal !== undefined,
      tr: trVal !== undefined
    });
  }
}

if (missingInLocales.length > 0) {
  console.log(`\n--- MISSING STATIC KEYS IN LOCALES (${missingInLocales.length}) ---`);
  missingInLocales.forEach(m => console.log(`${m.file}: '${m.key}' -> RU:${m.ru}, EN:${m.en}, TR:${m.tr}`));
} else {
  console.log('\nAll static $t() keys exist in all locales.');
}

console.log('\n=== Checking Upgrades in store.ts ===');
const storeCode = fs.readFileSync('src/store.ts', 'utf8');
const idRegex = /id:\s*['"]([^'"]+)['"]/g;
let m;
while ((m = idRegex.exec(storeCode)) !== null) {
  const id = m[1];
  if (id.startsWith('upg_') || id.startsWith('click_') || id.startsWith('mastery_')) {
    if (!ru.upgrades[id]) console.log('Missing in ru.upgrades:', id);
    if (!en.upgrades[id]) console.log('Missing in en.upgrades:', id);
    if (!tr.upgrades[id]) console.log('Missing in tr.upgrades:', id);
  }
}

console.log('\n=== Checking Pets in store.ts / petBonuses.ts ===');
const petIds = ['pet_rat', 'pet_slime', 'pet_bat', 'pet_frog', 'pet_spirit', 'pet_owl', 'pet_fox', 'pet_gryphon', 'pet_golem', 'pet_dragon', 'pet_manticore', 'pet_moon_cat', 'pet_astral_dragon', 'pet_phoenix', 'pet_void_titan', 'pet_hedgehog', 'pet_chameleon', 'pet_basilisk'];
for (const pid of petIds) {
  if (!ru.pets[pid]) console.log('Missing in ru.pets:', pid);
  if (!en.pets[pid]) console.log('Missing in en.pets:', pid);
  if (!tr.pets[pid]) console.log('Missing in tr.pets:', pid);
}

console.log('\n=== Done ===');
