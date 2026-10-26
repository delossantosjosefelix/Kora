import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../..', import.meta.url));

const EXTENSIONES = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.html',
  '.md',
  '.json',
  '.sql',
  '.yml',
  '.yaml',
  '.txt',
]);

const IGNORAR = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.agents',
  '.obsidian',
  '.vite',
  'package-lock.json',
]);

const PATRON_EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/u;

const archivos = [];

function recorrer(directorio) {
  for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
    if (IGNORAR.has(entrada.name)) continue;

    const ruta = join(directorio, entrada.name);

    if (entrada.isDirectory()) {
      recorrer(ruta);
      continue;
    }

    if (EXTENSIONES.has(extname(entrada.name).toLowerCase())) {
      archivos.push(ruta);
    }
  }
}

recorrer(raiz);

const hallazgos = [];

for (const archivo of archivos) {
  const lineas = readFileSync(archivo, 'utf8').split(/\r?\n/);

  lineas.forEach((linea, indice) => {
    const coincidencia = linea.match(PATRON_EMOJI);
    if (!coincidencia) return;

    hallazgos.push({
      archivo: relative(raiz, archivo),
      linea: indice + 1,
      columna: linea.indexOf(coincidencia[0]) + 1,
      emoji: coincidencia[0],
    });
  });
}

if (hallazgos.length > 0) {
  console.error(`Se encontraron ${hallazgos.length} emoji(s) o glifo(s) prohibidos:`);
  for (const hallazgo of hallazgos) {
    console.error(
      `  ${hallazgo.archivo}:${hallazgo.linea}:${hallazgo.columna}  ${hallazgo.emoji}`,
    );
  }
  console.error('');
  console.error('Regla de Kora: cero emojis. Usa iconos de reicon-react.');
  process.exit(1);
}

console.log(`Sin emojis ni glifos prohibidos en ${archivos.length} archivos.`);
