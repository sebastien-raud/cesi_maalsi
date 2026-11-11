// Construction des slides pour GitHub Pages : chaque présentation NN-*.md des dossiers slides/,
// puis une page d'accueil par module et une liste des modules.
//   node .slides/build.mjs [base]   base par défaut : /cesi_maalsi/
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const THEME = path.join(import.meta.dirname, 'theme');
const DIST = path.join(ROOT, 'dist');
const BASE = process.argv[2] ?? '/cesi_maalsi/';

const MODULE_DIR = /^(\d\d) - (.+)$/;
const DECK_FILE = /^(\d\d)-.+\.md$/;

// Titre : champ title de l'en-tête YAML, sinon le nom du fichier.
function readTitle(markdown, fallback) {
  const header = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const title = header?.[1].match(/^title:\s*(.+)$/m)?.[1].trim().replace(/^(['"])(.*)\1$/, '$2');
  return title || fallback;
}

// Modules ayant au moins une présentation, triés par numéro.
const modules = readdirSync(ROOT, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && MODULE_DIR.test(entry.name))
  .map(entry => {
    const [, num, name] = entry.name.match(MODULE_DIR);
    const slidesDir = path.join(ROOT, entry.name, 'slides');
    const decks = existsSync(slidesDir)
      ? readdirSync(slidesDir)
        .filter(file => DECK_FILE.test(file) && statSync(path.join(slidesDir, file)).isFile())
        .sort()
        .map(file => {
          const slug = file.replace(/\.md$/, '');
          return { num: file.slice(0, 2), slug, file: path.join(slidesDir, file), title: readTitle(readFileSync(path.join(slidesDir, file), 'utf8'), slug) };
        })
      : [];
    return { num, name, slidesDir, decks };
  })
  .filter(module => module.decks.length > 0)
  .sort((a, b) => a.num.localeCompare(b.num));

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

for (const module of modules) {
  for (const deck of module.decks) {
    const out = path.join(DIST, module.num, deck.slug);
    console.log(`Construction : ${module.num}/${deck.slug}`);
    // Les .md référencent ./public/nom.svg (lisible sur GitHub) ; Slidev attend /nom.svg :
    // on construit une copie temporaire, à côté de l'original pour garder le même dossier public/.
    const temp = path.join(module.slidesDir, `.build-${deck.slug}.md`);
    writeFileSync(temp, readFileSync(deck.file, 'utf8').replace(/(src="|\]\()\.\/public\//g, '$1/'));
    const result = spawnSync('slidev', ['build', temp, '--base', `${BASE}${module.num}/${deck.slug}/`, '--out', out, '--theme', THEME], { stdio: 'inherit' });
    rmSync(temp);
    if (result.status !== 0) {
      console.error(`Échec de la construction de ${deck.file}`);
      process.exit(1);
    }
  }
  // Fichiers temporaires de Slidev laissés à côté des présentations.
  rmSync(path.join(module.slidesDir, 'node_modules'), { recursive: true, force: true });
}

// Pages d'accueil, style du thème (Inter, liens bleus).
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const STYLE = `
@font-face { font-family: "Inter"; font-weight: 300; font-display: swap; src: url("${BASE}fonts/inter-latin-300-normal.woff2") format("woff2"); }
@font-face { font-family: "Inter"; font-weight: 700; font-display: swap; src: url("${BASE}fonts/inter-latin-700-normal.woff2") format("woff2"); }
:root { --bg: #fff; --text: #222; --muted: #888; --link: #27e; font-family: "Inter", "Roboto", sans-serif; }
@media (prefers-color-scheme: dark) { :root { --bg: #000; --text: #ddd; --muted: #888; --link: #49f; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font-weight: 300; line-height: 1.6; }
main { max-width: 48rem; margin: 0 auto; padding: 4rem 1.5rem; }
h1 { margin: 0 0 0.5rem; font-size: clamp(2.2rem, 6vw, 3.5rem); font-weight: 700; letter-spacing: -0.01em; line-height: 1.3; }
.subtitle { margin: 0 0 2.5rem; color: var(--muted); font-size: 1.3rem; }
ol { list-style: none; padding: 0; margin: 0; }
li { margin: 0.9rem 0; }
a.item { display: flex; align-items: baseline; gap: 1.2rem; color: var(--link); text-decoration: none; font-size: 1.5rem; }
a.item:hover, a.item:focus-visible { text-decoration: underline; text-decoration-thickness: 2px; outline: none; }
.num { font-variant-numeric: tabular-nums; color: var(--muted); min-width: 2rem; }
.back { color: var(--muted); text-decoration: none; }
.back:hover { text-decoration: underline; }
`;
const layout = (title, body) => `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)}</title>
  <style>${STYLE}</style>
</head>
<body>
  <main>
${body}
  </main>
</body>
</html>
`;
const list = items => `    <ol>
${items.map(({ href, num, label }) => `      <li><a class="item" href="${escape(href)}"><span class="num">${escape(num)}</span><span>${escape(label)}</span></a></li>`).join('\n')}
    </ol>`;

cpSync(path.join(THEME, 'fonts'), path.join(DIST, 'fonts'), { recursive: true, filter: src => !src.endsWith('.txt') });
writeFileSync(path.join(DIST, 'index.html'), layout('Slides', `    <h1>Slides</h1>
    <p class="subtitle">Modules</p>
${list(modules.map(m => ({ href: `${BASE}${m.num}/`, num: m.num, label: m.name })))}`));
for (const module of modules) {
  writeFileSync(path.join(DIST, module.num, 'index.html'), layout(module.name, `    <p><a class="back" href="${BASE}">← Modules</a></p>
    <h1>${escape(module.name)}</h1>
    <p class="subtitle">Présentations</p>
${list(module.decks.map(d => ({ href: `${BASE}${module.num}/${d.slug}/`, num: d.num, label: d.title })))}`));
}

console.log(`\n${modules.reduce((n, m) => n + m.decks.length, 0)} présentation(s) dans ${path.relative(ROOT, DIST)}/`);
