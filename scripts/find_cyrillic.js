import fs from 'fs';
import path from 'path';

function scanDir(dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanDir(full, results);
    } else if (/\.(svelte|ts|js|html)$/.test(file)) {
      if (full.includes('ru.ts')) continue;
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      const cyrillicLines = [];
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('<!--')) return;
        if (/[\u0400-\u04FF]/.test(line)) {
          cyrillicLines.push({ line: idx + 1, text: trimmed });
        }
      });
      if (cyrillicLines.length > 0) {
        results.push({
          file: path.relative(process.cwd(), full),
          count: cyrillicLines.length,
          lines: cyrillicLines
        });
      }
    }
  }
  return results;
}

const results = scanDir('src');
console.log('--- SUMMARY ---');
results.forEach(r => console.log(`${r.file}: ${r.count} lines`));
console.log('---------------');
