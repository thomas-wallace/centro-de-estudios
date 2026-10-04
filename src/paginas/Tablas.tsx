import { Check, Eye, PencilLine, Shuffle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EtiquetaUnidad, FiltroUnidad, Fuente, PaginaEncabezado, useUnidadParam } from '@/components/comunes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Segmentado, Select, Vacio } from '@/components/ui/misc';
import { registrarActividad } from '@/db';
import { corregirTabla, opcionesTabla, sortearCeldas } from '@/lib/practica';
import { pct, plural } from '@/lib/utils';
import { useMateria } from '@/materia';
import type { Comparacion } from '@/schema';
import { TablaComparativa } from './tablas/TablaComparativa';

type Modo = 'ver' | 'practicar';

function Practica({ comp, color, slug }: { comp: Comparacion; color: string; slug: string }) {
  const [ocultas, setOcultas] = useState(() => sortearCeldas(comp));
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<{ aciertos: number; total: number; bien: Set<string> } | null>(null);

  const ocultasSet = useMemo(() => new Set(ocultas), [ocultas]);
  const opciones = useMemo(() => opcionesTabla(comp, ocultas), [comp, ocultas]);
  const respondidas = ocultas.filter((k) => respuestas[k]).length;

  const corregir = () => {
    const r = corregirTabla(comp, ocultas, respuestas);
    setResultado(r);
    void registrarActividad({
      materia: slug,
      herramienta: 'tablas',
      aciertos: r.aciertos,
      total: r.total,
      unidad: comp.unidad,
      detalle: comp.id,
    });
  };

  const otraVez = () => {
    setOcultas(sortearCeldas(comp));
    setRespuestas({});
    setResultado(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Se ocultaron {plural(ocultas.length, 'celda')}. Cada una tiene un selector con todos los valores ocultos:
        emparejalos.
      </p>
      <TablaComparativa
        comp={comp}
        color={color}
        practica={{
          ocultas: ocultasSet,
          opciones,
          respuestas,
          bien: resultado?.bien ?? null,
          onResponder: (k, v) => setRespuestas((prev) => ({ ...prev, [k]: v })),
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        {resultado ? (
          <p className="mr-auto text-sm font-semibold" role="status">
            {resultado.aciertos}/{resultado.total} ({pct(resultado.aciertos, resultado.total)} %)
            {resultado.aciertos === resultado.total ? ' 🎉 ¡Perfecto!' : ''}
          </p>
        ) : (
          <>
            <Button onClick={corregir}>
              <Check /> Corregir
            </Button>
            <span className="mr-auto text-sm text-muted-foreground">
              {respondidas}/{ocultas.length} completadas
            </span>
          </>
        )}
        <Button variant="outline" onClick={otraVez}>
          <Shuffle /> Otra vez
        </Button>
      </div>
    </div>
  );
}

export default function Tablas() {
  const { datos, slug, color } = useMateria();
  const [unidad, setUnidad] = useUnidadParam();
  const [elegida, setElegida] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>('ver');

  const comparaciones = useMemo(
    () => datos.comparaciones.filter((c) => !unidad || c.unidad === unidad),
    [datos.comparaciones, unidad],
  );
  const comp = comparaciones.find((c) => c.id === elegida) ?? comparaciones[0];

  if (datos.comparaciones.length === 0) {
    return (
      <>
        <PaginaEncabezado emoji="⚖️" titulo="Tablas comparativas" />
        <Vacio titulo="Esta materia no tiene tablas comparativas cargadas" />
      </>
    );
  }

  return (
    <>
      <PaginaEncabezado
        emoji="⚖️"
        titulo="Tablas comparativas"
        descripcion="Repasá las diferencias y después completá las celdas que faltan."
      />

      <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <FiltroUnidad valor={unidad} onChange={setUnidad} />
        {comparaciones.length > 0 && (
          <Select
            aria-label="Elegí una tabla"
            value={comp?.id ?? ''}
            onChange={(e) => setElegida(e.target.value)}
            className="w-full min-w-0 sm:w-auto sm:max-w-96"
          >
            {comparaciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        )}
      </div>

      {!comp ? (
        <Vacio titulo="No hay tablas en esta unidad">Probá con otra unidad o elegí “Todas las unidades”.</Vacio>
      ) : (
        <Card className="min-w-0" style={{ borderTop: `4px solid ${color(comp.unidad)}` }}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-lg">{comp.nombre}</CardTitle>
                <EtiquetaUnidad unidad={comp.unidad} className="mt-1" />
              </div>
              <Segmentado<Modo>
                ariaLabel="Modo"
                valor={modo}
                onChange={setModo}
                opciones={[
                  {
                    valor: 'ver',
                    etiqueta: (
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="size-4" /> Ver
                      </span>
                    ),
                  },
                  {
                    valor: 'practicar',
                    etiqueta: (
                      <span className="inline-flex items-center gap-1.5">
                        <PencilLine className="size-4" /> Practicar
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent className="min-w-0">
            {modo === 'ver' ? (
              <TablaComparativa comp={comp} color={color(comp.unidad)} />
            ) : (
              <Practica key={comp.id} comp={comp} color={color(comp.unidad)} slug={slug} />
            )}
            <p className="mt-2 text-xs text-muted-foreground sm:hidden">Deslizá la tabla hacia los costados para ver todas las columnas.</p>
          </CardContent>
          <CardContent>
            <Fuente {...comp.fuente} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
