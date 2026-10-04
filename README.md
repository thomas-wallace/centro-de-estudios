# Centro de estudio

App de estudio interactiva y reutilizable: **la app se construye una vez** y cada materia es un paquete de
contenido (`materias/<slug>/datos.json`). Para estudiar otra materia no se toca el código.

Herramientas: 🗺️ mapa conceptual (explorar, con huecos, reconstruir) · 🃏 flashcards con repaso espaciado (FSRS) ·
📝 simulacro con nivel de seguridad · 📖 glosario · 🔁 flujos · ⚖️ tablas comparativas · 🌳 sub-mapas ·
🧩 ejercicios guiados · 🎯 quiz de conexiones. Más un panel de progreso, una recomendación de "qué estudiar ahora"
y un plan de estudio en 4 fases hasta la fecha del examen (configurable desde la app).

## Uso

```bash
npm install
npm run dev                       # http://localhost:5173
npm run build                     # sitio estático PWA en dist/ (GitHub Pages, Vercel, Netlify…)
npm run build:single -- <slug>    # un único HTML en dist-single/<slug>.html (doble clic para abrirlo)
npm run validar -- <slug>         # valida el contenido de una materia
npm test                          # tests (Vitest)
```

El progreso se guarda en el navegador (IndexedDB). Desde **Examen y ajustes** se exporta e importa en JSON
para pasarlo a otro dispositivo. No hace falta servidor ni base de datos.

## Estructura

```
centro-de-estudio/
├─ src/                      la app (React + TypeScript), igual para todas las materias
│  ├─ schema.ts              esquema Zod de datos.json (de acá salen los tipos)
│  ├─ lib/                   lógica pura: validación, FSRS, plan, progreso, simulacro…
│  └─ paginas/               una página por herramienta
├─ materias/
│  └─ <slug>/
│     ├─ material/*.md       el material fuente (única fuente de verdad)
│     ├─ base.json           (opcional) materia + unidades, si el contenido se arma por partes
│     ├─ partes/*.json       (opcional) contenido por unidad
│     └─ datos.json          el paquete que carga la app
├─ scripts/
│  ├─ validar.ts             esquema, ids, referencias, cobertura y calidad de preguntas
│  ├─ unir.ts                base.json + partes/*.json → datos.json
│  └─ build-single.mjs       build de un solo archivo
└─ docs/GUIA_CONTENIDO.md    criterios de calidad para generar contenido
```

Las herramientas **base** (mapa, flashcards, simulacro, glosario) siempre aparecen. Las **condicionales**
(flujos, tablas, sub-mapas, ejercicios, conexiones) aparecen solo si `datos.json` tiene ese tipo de contenido.

## Agregar una materia nueva

1. Creá `materias/<slug>/material/` y poné ahí los apuntes en Markdown.
2. Abrí Claude Code en esta carpeta y pegá el **Prompt B** (abajo) completando los `{{ }}`.
3. Claude lee el material y te propone unidades, pesos, cantidades y las dudas que encontró. Después de tu OK,
   genera `datos.json` y lo valida.
4. `npm run dev` → la materia aparece sola en el selector.

Lo que exige `npm run validar`:
- respeta el esquema; no hay ids duplicados ni relaciones a conceptos inexistentes;
- ningún concepto queda aislado y hay relaciones entre unidades distintas;
- cada unidad tiene conceptos, preguntas y flashcards en proporción a su peso (imprime la tabla de cobertura);
- las correctas están repartidas entre A–D (ninguna letra > 35 %) y la correcta no es la opción más larga
  en más del 40 % de las preguntas.

### Prompt B

> Quiero agregar la materia **{{MATERIA}}** (slug `{{SLUG}}`) al centro de estudio.
>
> - **Material fuente:** todos los `.md` de `materias/{{SLUG}}/material/`. Es la única fuente de verdad: no agregues
>   nada que no esté ahí. Si algo es ambiguo o incompleto, anotalo como duda en vez de inventarlo.
> - **Examen:** {{FORMATO}}. Fecha: {{FECHA}} (también se puede configurar desde la app).
> - **Temas clave:** {{TEMAS_CLAVE o "deducilo del material"}}.
>
> **Paso 1 — Leer y proponer.** Leé todos los `.md` completos y `docs/GUIA_CONTENIDO.md`. Antes de generar nada,
> mostrame: las unidades que detectaste y su peso, cuántos elementos esperás por tipo, qué herramientas condicionales
> van a aparecer y las dudas o contradicciones del material. Esperá mi OK.
>
> **Paso 2 — Generar** `materias/{{SLUG}}/datos.json` (o `base.json` + `partes/<unidad>.json` y `npm run unir`)
> respetando `src/schema.ts` y la guía de contenido.
>
> **Paso 3 — Verificar.** `npm run validar -- {{SLUG}}` hasta que pase (mostrame la cobertura); compará 10 preguntas
> y 10 conceptos al azar contra el `.md` fuente; abrí la app en esa materia y revisá que todas las herramientas
> carguen; generá `npm run build:single -- {{SLUG}}`.
>
> Entregá un resumen con conteos, herramientas activas, dudas del material y correcciones hechas.

## Stack

Vite · React 19 · TypeScript strict · Tailwind v4 + componentes estilo shadcn/ui · Zustand · React Flow + ELK ·
ts-fsrs · Dexie (IndexedDB) · Zod · Motion · React Router (hash) · Fuse.js · vite-plugin-pwa ·
vite-plugin-singlefile · Vitest.
