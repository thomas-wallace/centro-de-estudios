import { ChevronsDownUp, ChevronsUpDown, GraduationCap, Shuffle, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EtiquetaUnidad, FiltroUnidad, Fuente, PaginaEncabezado, useUnidadParam } from '@/components/comunes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Progress, Vacio } from '@/components/ui/misc';
import { ancestros, contarNodos, elegirNivel, nodoEnRuta, rutaHijo, rutasConHijos } from '@/lib/practica';
import { plural } from '@/lib/utils';
import { useMateria } from '@/materia';
import type { Taxonomia } from '@/schema';
import { NodoArbol, type Autoevaluacion } from './submapas/Arbol';

interface EstadoPractica {
  taxonomia: string;
  ruta: string;
  revelados: Set<number>;
  marcas: Record<number, Autoevaluacion>;
}

/** Por defecto se ven la raíz y el primer nivel desplegados. */
const expandidosIniciales = (t: Taxonomia) => new Set(rutasConHijos(t.raiz).filter((r) => !r.includes('.')));

export default function Submapas() {
  const { datos, color } = useMateria();
  const [unidad, setUnidad] = useUnidadParam();
  const [expandidos, setExpandidos] = useState<Record<string, Set<string>>>({});
  const [practica, setPractica] = useState<EstadoPractica | null>(null);

  const taxonomias = useMemo(
    () => datos.taxonomias.filter((t) => !unidad || t.unidad === unidad),
    [datos.taxonomias, unidad],
  );

  const expandidosDe = (t: Taxonomia) => expandidos[t.id] ?? expandidosIniciales(t);

  const alternar = (t: Taxonomia, ruta: string) => {
    setExpandidos((prev) => {
      const s = new Set(prev[t.id] ?? expandidosIniciales(t));
      if (s.has(ruta)) s.delete(ruta);
      else s.add(ruta);
      return { ...prev, [t.id]: s };
    });
  };

  const expandirTodo = () =>
    setExpandidos((prev) => {
      const nuevo = { ...prev };
      for (const t of taxonomias) nuevo[t.id] = new Set(rutasConHijos(t.raiz));
      return nuevo;
    });

  const colapsarTodo = () =>
    setExpandidos((prev) => {
      const nuevo = { ...prev };
      for (const t of taxonomias) {
        // Si hay una práctica en curso en esta taxonomía, el nivel practicado queda visible.
        nuevo[t.id] = practica?.taxonomia === t.id ? new Set([...ancestros(practica.ruta), practica.ruta]) : new Set();
      }
      return nuevo;
    });

  const practicar = (t: Taxonomia) => {
    const anterior = practica?.taxonomia === t.id ? practica.ruta : undefined;
    const ruta = elegirNivel(t.raiz, Math.random, anterior);
    if (ruta === null) return;
    const nodo = nodoEnRuta(t.raiz, ruta);
    setPractica({ taxonomia: t.id, ruta, revelados: new Set(), marcas: {} });
    setExpandidos((prev) => {
      const s = new Set(prev[t.id] ?? expandidosIniciales(t));
      for (const a of ancestros(ruta)) s.add(a);
      s.add(ruta);
      // Los hijos ocultos arrancan colapsados para no dar pistas.
      nodo?.hijos.forEach((_, i) => s.delete(rutaHijo(ruta, i)));
      return { ...prev, [t.id]: s };
    });
  };

  if (datos.taxonomias.length === 0) {
    return (
      <>
        <PaginaEncabezado emoji="🌳" titulo="Sub-mapas" />
        <Vacio titulo="Esta materia no tiene clasificaciones cargadas" />
      </>
    );
  }

  return (
    <>
      <PaginaEncabezado
        emoji="🌳"
        titulo="Sub-mapas"
        descripcion="Clasificaciones y jerarquías como árboles desplegables. Practicá ocultando un nivel."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FiltroUnidad valor={unidad} onChange={setUnidad} className="w-full sm:w-auto" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandirTodo}>
            <ChevronsUpDown /> Expandir todo
          </Button>
          <Button variant="outline" size="sm" onClick={colapsarTodo}>
            <ChevronsDownUp /> Colapsar todo
          </Button>
        </div>
      </div>

      {taxonomias.length === 0 ? (
        <Vacio titulo="No hay sub-mapas en esta unidad">Probá con otra unidad o elegí “Todas las unidades”.</Vacio>
      ) : (
        <div className="flex flex-col gap-4">
          {taxonomias.map((t) => {
            const c = color(t.unidad);
            const p = practica?.taxonomia === t.id ? practica : null;
            const hijosPractica = p ? (nodoEnRuta(t.raiz, p.ruta)?.hijos.length ?? 0) : 0;
            const ok = p ? Object.values(p.marcas).filter((m) => m === 'ok').length : 0;
            const mal = p ? Object.values(p.marcas).filter((m) => m === 'mal').length : 0;
            const terminado = p !== null && ok + mal === hijosPractica;
            const nombreNivel = p ? nodoEnRuta(t.raiz, p.ruta)?.nombre : undefined;
            return (
              <Card key={t.id} className="min-w-0" style={{ borderTop: `4px solid ${c}` }}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-lg">{t.nombre}</CardTitle>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <EtiquetaUnidad unidad={t.unidad} />
                        <span className="text-xs text-muted-foreground">{plural(contarNodos(t.raiz), 'nodo')}</span>
                      </div>
                    </div>
                    {p ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => practicar(t)}>
                          <Shuffle /> Otro nivel
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setPractica(null)} aria-label="Terminar práctica">
                          <X /> Salir
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => practicar(t)} disabled={t.raiz.hijos.length === 0}>
                        <GraduationCap /> Practicar
                      </Button>
                    )}
                  </div>
                  {p && (
                    <div className="mt-2 flex flex-col gap-2 rounded-lg bg-muted/60 p-3 text-sm" role="status">
                      <p>
                        ¿Qué hay dentro de <strong>{nombreNivel}</strong>? Pensá cada uno, revelalo y marcá si lo
                        sabías.
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="success">✓ {ok}</Badge>
                        <Badge variant="destructive">✗ {mal}</Badge>
                        <Badge variant="secondary">
                          {plural(hijosPractica - ok - mal, 'pendiente', 'pendientes')}
                        </Badge>
                        {terminado && (
                          <span className="font-medium">
                            {ok === hijosPractica ? '🎉 ¡Todos!' : `Sabías ${ok} de ${hijosPractica}.`}
                          </span>
                        )}
                      </div>
                      <Progress value={hijosPractica ? ((ok + mal) / hijosPractica) * 100 : 0} color={c} />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="min-w-0">
                  <ul aria-label={t.nombre} className="min-w-0">
                    <NodoArbol
                      idBase={t.id}
                      nodo={t.raiz}
                      ruta=""
                      nivel={0}
                      color={c}
                      expandidos={expandidosDe(t)}
                      onAlternar={(r) => alternar(t, r)}
                      practica={
                        p
                          ? {
                              ruta: p.ruta,
                              revelados: p.revelados,
                              marcas: p.marcas,
                              onRevelar: (i) =>
                                setPractica((prev) =>
                                  prev ? { ...prev, revelados: new Set(prev.revelados).add(i) } : prev,
                                ),
                              onMarcar: (i, m) =>
                                setPractica((prev) => (prev ? { ...prev, marcas: { ...prev.marcas, [i]: m } } : prev)),
                            }
                          : undefined
                      }
                    />
                  </ul>
                </CardContent>
                <CardContent>
                  <Fuente {...t.fuente} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
