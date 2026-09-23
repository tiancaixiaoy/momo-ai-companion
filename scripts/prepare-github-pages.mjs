import { readFile, writeFile } from 'node:fs/promises';

const indexPath = new URL('../dist/index.html', import.meta.url);
const html = await readFile(indexPath, 'utf8');
const portableHtml = html
  .replaceAll('href="/', 'href="./')
  .replaceAll('src="/', 'src="./');

await writeFile(indexPath, portableHtml);

if (/\b(?:href|src)="\//.test(portableHtml)) {
  throw new Error('GitHub Pages build still contains root-relative asset URLs.');
}

console.log('Prepared Expo web export for a GitHub Pages project path.');
