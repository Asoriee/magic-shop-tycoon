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
  const content = fs.readFileSync(f, 'utf8');
  // strip <script>...</script> and <style>...</style>
  const templateOnly = content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '');

  const lines = templateOnly.split('\n');
  lines.forEach((l, i) => {
    // Look for text nodes outside of tags
    const textChunks = l.split(/<[^>]+>/);
    for (const chunk of textChunks) {
      // remove {$t(...)} or svelte expressions { ... }
      const cleanChunk = chunk.replace(/\{[^}]+\}/g, '').trim();
      // find Latin words (more than 1 letter, not CSS or colors or SVG attributes)
      const words = cleanChunk.match(/[A-Za-z]{2,}/g);
      if (words) {
        // filter out common harmless things if any
        console.log(`${f}:${i+1} [WORDS: ${words.join(', ')}] in "${cleanChunk}"`);
      }
    }
  });
}
