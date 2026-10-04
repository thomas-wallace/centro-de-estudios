/**
 * Genera public/icono-192.png, public/icono-512.png y public/icono.svg (un pequeño grafo de nodos).
 * Sin dependencias: rasteriza a mano y codifica PNG con zlib.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const dirPublic = resolve(import.meta.dirname, '..', 'public');
mkdirSync(dirPublic, { recursive: true });

// Coordenadas en un lienzo de 100×100.
const nodos = [
  { x: 50, y: 26, r: 10, c: [139, 92, 246] },
  { x: 26, y: 66, r: 9, c: [16, 185, 129] },
  { x: 74, y: 66, r: 9, c: [6, 182, 212] },
  { x: 50, y: 80, r: 6, c: [245, 158, 11] },
];
const aristas = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [2, 3],
];
const fondo = [15, 23, 42];

function distSegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function mezclar(base, color, alfa) {
  return base.map((v, i) => Math.round(v * (1 - alfa) + color[i] * alfa));
}

function pixel(u, v) {
  // u, v en [0, 100)
  let col = fondo;
  for (const [a, b] of aristas) {
    const d = distSegmento(u, v, nodos[a].x, nodos[a].y, nodos[b].x, nodos[b].y);
    const alfa = Math.max(0, Math.min(1, 2.2 - d));
    if (alfa > 0) col = mezclar(col, [148, 163, 184], alfa * 0.9);
  }
  for (const n of nodos) {
    const d = Math.hypot(u - n.x, v - n.y);
    const alfa = Math.max(0, Math.min(1, n.r - d + 0.5));
    if (alfa > 0) col = mezclar(col, n.c, alfa);
  }
  return col;
}

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

function png(tam) {
  const crudo = Buffer.alloc(tam * (tam * 3 + 1));
  const ss = 3; // supersampling
  for (let y = 0; y < tam; y++) {
    crudo[y * (tam * 3 + 1)] = 0;
    for (let x = 0; x < tam; x++) {
      let acc = [0, 0, 0];
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const p = pixel(((x + (sx + 0.5) / ss) / tam) * 100, ((y + (sy + 0.5) / ss) / tam) * 100);
          acc = acc.map((v, i) => v + p[i]);
        }
      }
      const o = y * (tam * 3 + 1) + 1 + x * 3;
      acc.forEach((v, i) => (crudo[o + i] = Math.round(v / (ss * ss))));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tam, 0);
  ihdr.writeUInt32BE(tam, 4);
  ihdr[8] = 8; // profundidad
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(crudo)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const tam of [192, 512]) writeFileSync(join(dirPublic, `icono-${tam}.png`), png(tam));

const rgb = (c) => `rgb(${c.join(',')})`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect width="100" height="100" rx="22" fill="${rgb(fondo)}"/>
${aristas.map(([a, b]) => `<line x1="${nodos[a].x}" y1="${nodos[a].y}" x2="${nodos[b].x}" y2="${nodos[b].y}" stroke="rgb(148,163,184)" stroke-width="4" stroke-linecap="round"/>`).join('\n')}
${nodos.map((n) => `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${rgb(n.c)}"/>`).join('\n')}
</svg>
`;
writeFileSync(join(dirPublic, 'icono.svg'), svg);
console.log('✔ Íconos generados en public/');
