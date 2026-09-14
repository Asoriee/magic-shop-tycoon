const fs = require('fs');

const ru = fs.readFileSync('src/i18n/locales/ru.ts', 'utf8');
const lines = ru.split('\n');

lines.forEach((l, i) => {
  // Extract all quoted string literals from the line
  const matches = [...l.matchAll(/['"`](.*?)['"`]/g)];
  for (const m of matches) {
    const val = m[1];
    // Strip placeholders and HTML
    const cleaned = val
      .replace(/\{[a-zA-Z0-9_]+\}/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-z]+;/g, '');
    const latin = cleaned.match(/[A-Za-z]+/g);
    if (latin) {
      // Exclude allowed single 'x' (like x2, x5)
      const meaningful = latin.filter(w => w !== 'x');
      if (meaningful.length > 0) {
        console.log(`${i+1}: [${meaningful.join(', ')}] in "${val}"`);
      }
    }
  }
});
