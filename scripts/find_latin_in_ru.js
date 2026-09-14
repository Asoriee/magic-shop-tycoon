const fs = require('fs');

const ru = fs.readFileSync('src/i18n/locales/ru.ts', 'utf8');
const lines = ru.split('\n');

lines.forEach((l, i) => {
  const valMatch = l.match(/:\s*['"`](.*)['"`]/);
  if (valMatch) {
    const text = valMatch[1]
      .replace(/\{[a-zA-Z0-9_]+\}/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-z]+;/g, '');
    const latinMatches = text.match(/[A-Za-z]+/g);
    if (latinMatches && latinMatches.length > 0) {
      // filter out acceptable single letters like 'x' for multiplier if any
      const meaningful = latinMatches.filter(w => w !== 'x');
      if (meaningful.length > 0) {
        console.log(`${i+1}: [${meaningful.join(', ')}] ---> ${l.trim()}`);
      }
    }
  }
});
