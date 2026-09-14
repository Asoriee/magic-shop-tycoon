const fs = require('fs');

function scanDir(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = dir + '/' + item.name;
    if (item.isDirectory()) {
      files = files.concat(scanDir(fullPath));
    } else if (item.name.endsWith('.svelte')) {
      files.push(fullPath);
    }
  }
  return files;
}

const svelteFiles = scanDir('src');
for (const f of svelteFiles) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, i) => {
    // Check for "VIP" or "vip" in template text or title/aria attributes
    const templateTextMatches = l.match(/>([^<]*[Vv][Ii][Pp][^<]*)</);
    const attrMatches = l.match(/(?:title|aria-label)=["']([^"']*[Vv][Ii][Pp][^"']*)["']/);
    if (templateTextMatches) {
      console.log(`${f}:${i+1} [TEXT] ${templateTextMatches[1].trim()}`);
    }
    if (attrMatches) {
      console.log(`${f}:${i+1} [ATTR] ${attrMatches[1].trim()}`);
    }
  });
}
