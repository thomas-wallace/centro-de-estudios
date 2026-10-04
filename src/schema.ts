import { z } from 'zod';

/**
 * Esquema del paquete de contenido de una materia (`materias/<slug>/datos.json`).
 * Todas las referencias entre elementos se hacen por `id`.
 */

const id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Los ids van en kebab-case: minúsculas, números y guiones');

export const FuenteSchema = z.object({
  archivo: z.string().min(1),
  seccion: z.string().min(1),
});

export const MateriaInfoSchema = z.object({
  nombre: z.string().min(1),
  slug: id,
  descripcion: z.string().optional(),
  /** Valores por defecto: el usuario los puede cambiar desde la app. */
  examen: z.object({
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    formato: z.string().optional(),
  }),
  temas_clave: z.array(z.string()).default([]),
});

export const UnidadSchema = z.object({
  id,
  nombre: z.string().min(1),
  archivos: z.array(z.string()).min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /** Peso relativo en el examen, en porcentaje. La suma de todas las unidades debe dar 100. */
  peso: z.number().positive().max(100),
});

export const ConceptoSchema = z.object({
  id,
  nombre: z.string().min(1),
  unidad: id,
  definicion: z.string().min(1),
  definicion_extendida: z.string().min(1),
  ejemplo: z.string().min(1),
  por_que_importa: z.string().min(1),
  fuente: FuenteSchema,
});

export const RelacionSchema = z.object({
  origen: id,
  destino: id,
  verbo: z.string().min(1),
  fuente: FuenteSchema,
});

export type NodoTaxonomia = {
  nombre: string;
  descripcion?: string;
  hijos: NodoTaxonomia[];
};

export const NodoTaxonomiaSchema: z.ZodType<NodoTaxonomia> = z.lazy(() =>
  z.object({
    nombre: z.string().min(1),
    descripcion: z.string().optional(),
    hijos: z.array(NodoTaxonomiaSchema),
  }),
);

export const TaxonomiaSchema = z.object({
  id,
  nombre: z.string().min(1),
  unidad: id,
  raiz: NodoTaxonomiaSchema,
  fuente: FuenteSchema,
});

export const ValorNumericoSchema = z.object({
  nombre: z.string().min(1),
  valor: z.string().min(1),
});

export const PasoProcesoSchema = z.object({
  actor: z.string().min(1),
  accion: z.string().min(1),
  por_que: z.string().min(1),
  valores: z.array(ValorNumericoSchema).optional(),
});

export const ProcesoSchema = z.object({
  id,
  nombre: z.string().min(1),
  unidad: id,
  descripcion: z.string().min(1),
  pasos: z.array(PasoProcesoSchema).min(2),
  fuente: FuenteSchema,
});

export const ComparacionSchema = z
  .object({
    id,
    nombre: z.string().min(1),
    unidad: id,
    columnas: z.array(z.string().min(1)).min(2),
    filas: z
      .array(
        z.object({
          criterio: z.string().min(1),
          celdas: z.array(z.string().min(1)),
        }),
      )
      .min(2),
    fuente: FuenteSchema,
  })
  .superRefine((c, ctx) => {
    c.filas.forEach((f, i) => {
      if (f.celdas.length !== c.columnas.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['filas', i, 'celdas'],
          message: `La fila "${f.criterio}" tiene ${f.celdas.length} celdas y hay ${c.columnas.length} columnas`,
        });
      }
    });
  });

export const PasoEjercicioSchema = z.object({
  consigna: z.string().min(1),
  /** Respuesta canónica que se muestra como solución. */
  respuesta: z.string().min(1),
  /**
   * Cómo se compara lo que escribe el estudiante:
   * - texto: sin distinguir mayúsculas, tildes ni espacios sobrantes
   * - numero: compara numéricamente (acepta coma o punto decimal)
   * - ip: dirección IPv4 o prefijo (normaliza espacios)
   * - binario: ignora espacios y puntos entre bits
   * - opcion: el estudiante elige entre `opciones`
   */
  tipo_respuesta: z.enum(['texto', 'numero', 'ip', 'binario', 'opcion']),
  /** Otras formas válidas de la misma respuesta. */
  alternativas: z.array(z.string()).optional(),
  /** Solo para tipo_respuesta = "opcion". Debe incluir `respuesta`. */
  opciones: z.array(z.string()).optional(),
  /** Tolerancia absoluta para tipo_respuesta = "numero". */
  tolerancia: z.number().nonnegative().optional(),
  explicacion: z.string().min(1),
});

export const EjercicioSchema = z.object({
  id,
  titulo: z.string().min(1),
  unidad: id,
  tipo: z.string().min(1),
  enunciado: z.string().min(1),
  pasos: z.array(PasoEjercicioSchema).min(1),
  /** Pistas graduadas: de la más general a la más específica (la solución se muestra aparte). */
  pistas: z.array(z.string().min(1)).min(2),
  errores_comunes: z.array(z.string().min(1)).min(1),
  fuente: FuenteSchema,
});

export const PreguntaSchema = z
  .object({
    id,
    unidad: id,
    enunciado: z.string().min(1),
    opciones: z.array(z.string().min(1)).length(4),
    correcta: z.number().int().min(0).max(3),
    explicacion: z.string().min(1),
    /** Un texto por opción; el de la opción correcta va vacío (""). */
    por_que_falla: z.array(z.string()).length(4),
    fuente: FuenteSchema,
  })
  .superRefine((p, ctx) => {
    p.por_que_falla.forEach((t, i) => {
      if (i !== p.correcta && t.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['por_que_falla', i],
          message: 'Cada distractor necesita su explicación de por qué falla',
        });
      }
    });
    if (new Set(p.opciones.map((o) => o.trim().toLowerCase())).size !== 4) {
      ctx.addIssue({ code: 'custom', path: ['opciones'], message: 'Hay opciones repetidas' });
    }
  });

export const GlosarioSchema = z.object({
  termino: z.string().min(1),
  sigla: z.string().optional(),
  definicion: z.string().min(1),
  unidad: id,
});

export const DudaSchema = z.object({
  texto: z.string().min(1),
  fuente: FuenteSchema,
});

export const DatosSchema = z.object({
  materia: MateriaInfoSchema,
  unidades: z.array(UnidadSchema).min(1),
  conceptos: z.array(ConceptoSchema).min(1),
  relaciones: z.array(RelacionSchema),
  taxonomias: z.array(TaxonomiaSchema).default([]),
  procesos: z.array(ProcesoSchema).default([]),
  comparaciones: z.array(ComparacionSchema).default([]),
  ejercicios: z.array(EjercicioSchema).default([]),
  preguntas: z.array(PreguntaSchema).default([]),
  glosario: z.array(GlosarioSchema).default([]),
  /** Ambigüedades o contradicciones del material fuente. */
  dudas: z.array(DudaSchema).default([]),
});

export type Fuente = z.infer<typeof FuenteSchema>;
export type MateriaInfo = z.infer<typeof MateriaInfoSchema>;
export type Unidad = z.infer<typeof UnidadSchema>;
export type Concepto = z.infer<typeof ConceptoSchema>;
export type Relacion = z.infer<typeof RelacionSchema>;
export type Taxonomia = z.infer<typeof TaxonomiaSchema>;
export type PasoProceso = z.infer<typeof PasoProcesoSchema>;
export type Proceso = z.infer<typeof ProcesoSchema>;
export type Comparacion = z.infer<typeof ComparacionSchema>;
export type PasoEjercicio = z.infer<typeof PasoEjercicioSchema>;
export type Ejercicio = z.infer<typeof EjercicioSchema>;
export type Pregunta = z.infer<typeof PreguntaSchema>;
export type EntradaGlosario = z.infer<typeof GlosarioSchema>;
export type Duda = z.infer<typeof DudaSchema>;
export type Datos = z.infer<typeof DatosSchema>;
