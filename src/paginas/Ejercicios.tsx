import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, ChevronRight, ListChecks } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EtiquetaUnidad, FiltroUnidad, PaginaEncabezado, useUnidadParam } from '@/components/comunes';
import { Badge, Select, Vacio } from '@/components/ui/misc';
import { db } from '@/db';
import { plural } from '@/lib/utils';
import { useMateria } from '@/materia';
import { Resolver } from './ejercicios/Resolver';

interface Previo {
  veces: number;
  mejor: number;
  total: number;
}

export default function Ejercicios() {
  const { datos, slug } = useMateria();
  const [params, setParams] = useSearchParams();
  const [unidad, setUnidad] = useUnidadParam();
  const [tipo, setTipo] = useState('');

  const previos = useLiveQuery(
    async () => {
      const acts = await db.actividades
        .where('materia')
        .equals(slug)
        .filter((a) => a.herramienta === 'ejercicios')
        .toArray();
      const m = new Map<string, Previo>();
      for (const a of acts) {
        if (!a.detalle) continue;
        const p = m.get(a.detalle) ?? { veces: 0, mejor: 0, total: a.total };
        m.set(a.detalle, { veces: p.veces + 1, mejor: Math.max(p.mejor, a.aciertos), total: a.total });
      }
      return m;
    },
    [slug],
    new Map<string, Previo>(),
  );

  const seleccionado = params.get('e');
  const ejercicio = seleccionado ? datos.ejercicios.find((e) => e.id === seleccionado) : undefined;

  const tipos = useMemo(
    () => [...new Set(datos.ejercicios.map((e) => e.tipo))].sort((a, b) => a.localeCompare(b, 'es')),
    [datos.ejercicios],
  );
  const lista = datos.ejercicios.filter((e) => (!unidad || e.unidad === unidad) && (!tipo || e.tipo === tipo));

  const abrir = (id: string | null) => {
    setParams(id ? { e: id } : {});
    window.scrollTo({ top: 0 });
  };

  if (ejercicio) {
    return <Resolver key={ejercicio.id} ejercicio={ejercicio} onVolver={() => abrir(null)} />;
  }

  const resueltos = datos.ejercicios.filter((e) => previos.has(e.id)).length;

  return (
    <div>
      <PaginaEncabezado
        emoji="🧩"
        titulo="Ejercicios"
        descripcion={`Resolvé paso a paso, con pistas graduadas. Llevás ${resueltos} de ${plural(datos.ejercicios.length, 'ejercicio')} resueltos.`}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <FiltroUnidad valor={unidad} onChange={setUnidad} className="w-full sm:w-auto" />
        {tipos.length > 1 && (
          <Select
            aria-label="Filtrar por tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full sm:w-auto"
          >
            <option value="">Todos los tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        )}
      </div>

      {lista.length === 0 ? (
        <Vacio titulo="No hay ejercicios con ese filtro">Probá con otra unidad o tipo.</Vacio>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lista.map((e) => {
            const p = previos.get(e.id);
            const perfecto = p && p.mejor === p.total;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => abrir(e.id)}
                  className="group flex h-full w-full flex-col gap-2 rounded-xl border bg-card p-4 text-left shadow-sm transition-shadow outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <div className="flex w-full flex-wrap items-center gap-2">
                    <Badge variant="outline">{e.tipo}</Badge>
                    {p && (
                      <Badge
                        variant={perfecto ? 'success' : 'warning'}
                        title={`Mejor resultado: ${p.mejor}/${p.total} pasos sin ver la solución · ${plural(p.veces, 'vez', 'veces')}`}
                      >
                        <CheckCircle2 /> {perfecto ? 'Resuelto' : `Resuelto ${p.mejor}/${p.total}`}
                      </Badge>
                    )}
                  </div>
                  <span className="flex w-full items-start justify-between gap-2 font-semibold leading-snug">
                    {e.titulo}
                    <ChevronRight
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                  <span className="line-clamp-2 text-sm text-muted-foreground">{e.enunciado}</span>
                  <span className="mt-auto flex w-full flex-wrap items-center justify-between gap-2 pt-1">
                    <EtiquetaUnidad unidad={e.unidad} />
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ListChecks className="size-3.5" aria-hidden /> {plural(e.pasos.length, 'paso')}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
