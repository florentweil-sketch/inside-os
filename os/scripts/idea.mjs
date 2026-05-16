import fs from 'fs';
import path from 'path';

const ideasPath = path.resolve('IDEAS.md');
const idea = process.argv.slice(2).join(' ');

if (!idea) {
  console.log('Usage: npm run os:idea -- "ton idee ici"');
  process.exit(1);
}

const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
const line = `- [RAW] ${now} — ${idea}\n`;

fs.appendFileSync(ideasPath, line, 'utf8');
console.log(`✅ Idee ajoutee : ${line.trim()}`);
