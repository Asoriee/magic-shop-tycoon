import fs from 'fs';

const filePath = 'src/store.ts';
let content = fs.readFileSync(filePath, 'utf8');

const startMark = 'const defaultUpgrades: Upgrade[] = [';
const endMark = 'export const defaultSecretUpgrades: SecretUpgrade[] = [';

const startIdx = content.indexOf(startMark);
const endIdx = content.indexOf(endMark);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

let block = content.substring(startIdx, endIdx);
const regex = /id:\s*'([^']+)',\s*\n\s*name:\s*'[^\n]+',\s*\n\s*description:\s*'[^\n]+',/g;

let count = 0;
block = block.replace(regex, (match, id) => {
  count++;
  return `id: '${id}',\n        get name() { return getUpgradeName('${id}'); },\n        get description() { return getUpgradeDesc('${id}'); },`;
});

console.log(`Replaced ${count} upgrades in defaultUpgrades`);
content = content.substring(0, startIdx) + block + content.substring(endIdx);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated store.ts');
