# Guía para generar el contenido de una materia

Esta guía describe cómo escribir `materias/<slug>/datos.json` (o sus partes en `materias/<slug>/partes/*.json`).
El esquema formal está en `src/schema.ts` (Zod); leelo antes de empezar.

## Regla de oro

El material en `materias/<slug>/material/*.md` es la **única fuente de verdad**. No agregues nada que no esté ahí.
Si algo es ambiguo, contradictorio o incompleto, no lo inventes: agregalo a `dudas` con su `fuente`.
Si el material trae un error evidente (un cálculo mal hecho), usá la versión correcta del propio material si existe
y anotá la duda.

## Formato de una parte

Una parte es un JSON con cualquiera de estas colecciones (las mismas de `datos.json`, sin `materia` ni `unidades`):

```json
{
  "conceptos": [], "relaciones": [], "taxonomias": [], "procesos": [],
  "comparaciones": [], "ejercicios": [], "preguntas": [], "glosario": [], "dudas": []
}
```

`base.json` tiene `materia` y `unidades`. `npm run unir -- <slug>` junta base + partes en `datos.json`.

Validar una parte:

```bash
npm run validar -- <slug> --parte materias/<slug>/partes/<archivo>.json
```

## Ids

- kebab-case: minúsculas sin tildes, números y guiones (`csma-cd`, `trama-ethernet-ii`).
- Si existe `anclas.json`, los conceptos ancla de tu unidad **deben** existir con ese id exacto.
- Los demás conceptos llevan un prefijo corto de la unidad para evitar choques entre partes
  (por ejemplo `enl-ventana-n`, `ip-clase-a`). Lo mismo para preguntas (`enl-p01`), ejercicios, procesos, etc.
- Podés relacionar tus conceptos con los conceptos ancla de **otras** unidades (son relaciones entre unidades,
  muy valiosas: incluí varias).

## Calidad por tipo

**Conceptos**
- `definicion`: 1 oración, la que iría en una flashcard (sin repetir el nombre al inicio).
- `definicion_extendida`: 2–4 oraciones con el detalle técnico del material.
- `ejemplo`: concreto, con valores del material cuando los haya (IPs, MACs, tamaños, velocidades).
- `por_que_importa`: para qué sirve en la práctica o qué problema resuelve.
- `fuente`: archivo `.md` + título de la sección.

**Relaciones**
- Verbos precisos en minúscula que lean bien en "Origen <verbo> Destino":
  "es un tipo de", "es parte de", "usa", "mitiga", "resuelve", "se encapsula en", "se calcula con",
  "reemplaza a", "opera en", "depende de", "contrasta con", "detecta", "evita", "separa", "genera"…
- Todo concepto debe tener al menos una relación. Apuntá a 1,5–2 relaciones por concepto.
- Nada de relaciones duplicadas ni de un concepto consigo mismo.

**Taxonomías**: árboles `{ nombre, descripcion?, hijos[] }` de 2–3 niveles para clasificaciones del material.

**Procesos**: pasos con `actor` (quién hace), `accion` (qué hace), `por_que` (por qué ocurre ese paso) y,
si el material trae números, `valores: [{ nombre, valor }]` ya resueltos.

**Comparaciones**: `columnas` (lo que se compara: A, B, C…) y `filas` con `criterio` + una celda por columna.
Celdas cortas.

**Ejercicios**: problemas del material (o variantes directas con los mismos datos) resueltos paso a paso.
- Cada paso tiene `consigna`, `respuesta` canónica, `tipo_respuesta`
  (`numero` | `ip` | `binario` | `texto` | `opcion`), `explicacion`, y opcionalmente `alternativas`.
- Usá `texto` solo para respuestas de una o dos palabras; si la respuesta es una frase, usá `opcion` con 3–4 `opciones`.
- `ip` sirve para direcciones y prefijos (`192.168.1.0/25`). Usá `alternativas` para formatos equivalentes.
- `pistas`: 2–3 pistas graduadas, de la más general a la más concreta (sin dar la respuesta final).
- `errores_comunes`: errores típicos reales.

**Preguntas** (opción múltiple, 4 opciones)
- Distractores = errores conceptuales reales y plausibles (confundir capas, dispositivos, campos, protocolos,
  valores cercanos). Nada de relleno ni opciones absurdas. Ningún distractor puede ser también correcto.
- `correcta` (0–3) repartida de forma pareja: cada letra entre 20 % y 30 % de tus preguntas.
- La correcta **no** debe ser la opción más larga en más del 30 % de tus preguntas: igualá largos
  o alargá algún distractor.
- `explicacion`: por qué la correcta es correcta. `por_que_falla`: un texto por opción explicando el error
  del distractor; en la posición de la correcta va `""`.
- Variá el tipo: definición, aplicación a un caso, cálculo, "¿cuál NO…?", comparación, interpretación de
  una salida de comando o captura.
- Evitá "todas las anteriores" / "ninguna de las anteriores".

**Glosario**: `termino`, `sigla` expandida si aplica (p. ej. "Carrier Sense Multiple Access with Collision Detection"),
`definicion` breve, `unidad`.

## Estilo

Español rioplatense neutro y técnico (voseo si te dirigís al estudiante). JSON válido en UTF-8,
con tildes y eñes reales.
