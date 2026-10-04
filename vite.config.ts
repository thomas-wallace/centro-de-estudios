/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { materiasPlugin } from './vite-plugin-materias.ts';

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  const slug = process.env.MATERIA;

  return {
    // Rutas relativas: funciona en GitHub Pages (subcarpeta), Vercel y como archivo suelto.
    base: './',
    publicDir: single ? false : 'public',
    resolve: { alias: { '@': resolve(import.meta.dirname, 'src') } },
    define: {
      __SINGLE__: JSON.stringify(single),
    },
    plugins: [
      react(),
      tailwindcss(),
      materiasPlugin({ dir: resolve(import.meta.dirname, 'materias'), soloSlug: single ? slug : undefined }),
      single && {
        name: 'favicon-inline',
        transformIndexHtml: (html: string) =>
          html.replace(
            'href="./icono.svg"',
            `href="data:image/svg+xml;base64,${readFileSync(resolve(import.meta.dirname, 'public/icono.svg')).toString('base64')}"`,
          ),
      },
      single
        ? viteSingleFile({ removeViteModuleLoader: true })
        : VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icono.svg'],
            manifest: {
              name: 'Centro de estudio',
              short_name: 'Estudio',
              description: 'Mapas conceptuales, flashcards con repaso espaciado y simulacros de examen.',
              lang: 'es',
              theme_color: '#0f172a',
              background_color: '#0f172a',
              display: 'standalone',
              start_url: './',
              icons: [
                { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
              maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
            },
          }),
    ],
    build: single
      ? { outDir: 'dist-single', emptyOutDir: false, assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 5000 }
      : { outDir: 'dist', chunkSizeWarningLimit: 1500 },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    },
  };
});
