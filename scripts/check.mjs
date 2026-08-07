import { readFileSync } from 'node:fs';
const html = readFileSync('index.html', 'utf8');
const readme = readFileSync('README.md', 'utf8');
const required = ['SHOW/RIFT', 'localStorage', 'exportHtml', 'addHotspot', 'data:image/svg+xml'];
const missing = required.filter((item) => !html.includes(item));
if (missing.length) throw new Error(`index.html missing: ${missing.join(', ')}`);
if (!readme.includes('Quick Start') || !readme.includes('Privacy')) throw new Error('README is incomplete');
console.log('SHOW/RIFT check passed');
