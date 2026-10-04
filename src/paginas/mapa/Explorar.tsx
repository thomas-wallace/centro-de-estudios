import type { NodeChange } from '@xyflow/react';
import { SearchIcon, XIcon, MaximizeIcon, MinimizeIcon } from 'lucide-react';
import { useEffect, useId, useMemo, useState, useRef } from 'react';
import { FiltroUnidad } from '@/components/comunes';
import { Input, PuntoUnidad } from '@/components/ui/misc';
import { normalizar } from '@/lib/texto';
import { cn } from '@/lib/utils';
import { useMateria } from '@/materia';
import type { Concepto } from '@/schema';
import { useCentrar } from './centrar';
import { aristaConcepto, nodosDesdeLayout, useGrafo } from './construir';
import type { Punto } from '@/lib/mapa';
import { useLayout } from './hooks';
import { Lienzo } from './Lienzo';
import { PanelConcepto } from './PanelConcepto';

/** Arrastres del usuario, guardados por clave de layout (se descartan al cambiar de unidad). */
export function useMovidos(clave: string) {
  const [movidos, setMovidos] = useState<{ clave: string; pos: Map<string, Punto> }>({ clave, pos: new Map() });
  const pos = movidos.clave === clave ? movidos.pos : null;
  const onNodesChange = (changes: NodeChange[]) => {
    const nuevos = changes.filter((c) => c.type === 'position' && c.position);
    if (!nuevos.length) return;
    setMovidos((m) => {
      const p = new Map(m.clave === clave ? m.pos : []);
      for (const c of nuevos) if (c.type === 'position' && c.position) p.set(c.id, c.position);
      return { clave, pos: p };
    });
  };
  return { pos, onNodesChange };
}

function Busqueda({ onElegir, onConsulta }: { onElegir: (c: Concepto) => void; onConsulta: (q: string) => void }) {
  const { datos, color } = useMateria();
  const [q, setQ] = useState('');
  const [abierta, setAbierta] = useState(false);
  const [activa, setActiva] = useState(0);
  const idLista = useId();

  const resultados = useMemo(() => {
    const n = normalizar(q);
    if (n.length < 2) return [];
    return datos.conceptos
      .filter((c) => normalizar(c.nombre).includes(n))
      .sort((a, b) => normalizar(a.nombre).indexOf(n) - normalizar(b.nombre).indexOf(n))
      .slice(0, 8);
  }, [q, datos.conceptos]);

  useEffect(() => onConsulta(q), [q, onConsulta]);

  const elegir = (c: Concepto) => {
    setQ(c.nombre);
    setAbierta(false);
    onElegir(c);
  };

  return (
    <div className="relative w-full sm:w-72">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        role="combobox"
        aria-label="Buscar un concepto en el mapa"
        aria-expanded={abierta && resultados.length > 0}
        aria-controls={idLista}
        aria-activedescendant={abierta && resultados[activa] ? `${idLista}-${activa}` : undefined}
        placeholder="Buscar concepto…"
        className="pr-8 pl-8"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierta(true);
          setActiva(0);
        }}
        onFocus={() => setAbierta(true)}
        onBlur={() => window.setTimeout(() => setAbierta(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiva((a) => Math.min(a + 1, resultados.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiva((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter' && resultados[activa]) {
            e.preventDefault();
            elegir(resultados[activa]);
          } else if (e.key === 'Escape') {
            setAbierta(false);
          }
        }}
      />
      {q && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            setQ('');
            setAbierta(false);
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      )}
      {abierta && q.trim().length >= 2 && (
        <ul
          id={idLista}
          role="listbox"
          className="absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-md border bg-popover p-1 text-sm shadow-lg"
        >
          {resultados.length === 0 ? (
            <li className="px-2 py-1.5 text-muted-foreground">No hay conceptos con ese nombre.</li>
          ) : (
            resultados.map((c, i) => (
              <li
                key={c.id}
                id={`${idLista}-${i}`}
                role="option"
                aria-selected={i === activa}
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(c);
                }}
                className={cn('flex cursor-pointer items-center gap-2 rounded px-2 py-1.5', i === activa && 'bg-muted')}
              >
                <PuntoUnidad color={color(c.unidad)} />
                {c.nombre}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export function Leyenda({ unidad }: { unidad: string }) {
  const { datos } = useMateria();
  const us = unidad ? datos.unidades.filter((u) => u.id === unidad) : datos.unidades;
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Colores por unidad">
      {us.map((u) => (
        <li key={u.id} className="inline-flex items-center gap-1.5">
          <PuntoUnidad color={u.color} />
          {u.nombre}
        </li>
      ))}
      {unidad && <li className="inline-flex items-center gap-1.5 opacity-60">Atenuados: vecinos de otras unidades</li>}
    </ul>
  );
}

export function Explorar({
  unidad,
  setUnidad,
  conceptoInicial = null,
}: {
  unidad: string;
  setUnidad: (u: string) => void;
  /** Concepto a abrir al entrar (p. ej. desde el glosario con `?c=`). */
  conceptoInicial?: string | null;
}) {
  const { slug, conceptos, color, nombreUnidad, vecinos } = useMateria();
  const { sub, nodosLayout, desvios } = useGrafo(unidad);
  const clave = `${slug}|${unidad || '*'}|explorar`;
  const { layout, error } = useLayout(clave, nodosLayout, sub.aristas);
  const { pos: movidos, onNodesChange } = useMovidos(clave);
  const centrar = useCentrar();
  const lienzo = useRef<HTMLDivElement>(null);

  const [sel, setSel] = useState<string | null>(conceptoInicial);
  const [buscado, setBuscado] = useState<string | null>(conceptoInicial);
  const [consulta, setConsulta] = useState('');
  const [pendiente, setPendiente] = useState<string | null>(conceptoInicial);
  const [esPantallaCompleta, setEsPantallaCompleta] = useState(false);

  const visibles = useMemo(() => new Set(sub.nodos.map((n) => n.id)), [sub.nodos]);

  const coinciden = useMemo(() => {
    const n = normalizar(consulta);
    if (n.length < 2) return new Set<string>();
    return new Set([...conceptos.values()].filter((c) => normalizar(c.nombre).includes(n)).map((c) => c.id));
  }, [consulta, conceptos]);

  const cercanos = useMemo(() => (sel ? new Set((vecinos.get(sel) ?? []).map((v) => v.concepto.id)) : null), [sel, vecinos]);

  const nodes = useMemo(() => {
    if (!layout) return [];
    return nodosDesdeLayout(layout, sub.nodos, conceptos, color, nombreUnidad, (id) => {
      const base = sub.nodos.find((n) => n.id === id)?.atenuado ?? false;
      return {
        atenuado: base || (!!cercanos && id !== sel && !cercanos.has(id)),
        resaltado: id === buscado,
        coincide: coinciden.has(id) && id !== buscado,
      };
    }).map((n) => {
      const p = movidos?.get(n.id);
      return { ...n, position: p ?? n.position, selected: n.id === sel };
    });
  }, [layout, sub.nodos, conceptos, color, nombreUnidad, cercanos, sel, buscado, coinciden, movidos]);

  const edges = useMemo(
    () =>
      sub.aristas.map((r) =>
        aristaConcepto(r.id, r.origen, r.destino, {
          verbo: r.verbo,
          desvio: desvios.get(r.id) ?? 0,
          estado: sel ? (r.origen === sel || r.destino === sel ? 'resaltada' : 'atenuada') : 'normal',
        }),
      ),
    [sub.aristas, desvios, sel],
  );

  // Centrar cuando el concepto pedido ya está en el mapa visible.
  useEffect(() => {
    if (pendiente && layout && visibles.has(pendiente)) {
      centrar(pendiente, { zoom: 1.15 });
      setPendiente(null);
    }
  }, [pendiente, layout, visibles, centrar]);

  const irA = (id: string) => {
    if (!visibles.has(id)) setUnidad('');
    setSel(id);
    setBuscado(id);
    setPendiente(id);
  };

  const togglePantallaCompleta = async () => {
    if (!lienzo.current) return;

    if (!esPantallaCompleta) {
      try {
        if (lienzo.current.requestFullscreen) {
          await lienzo.current.requestFullscreen();
        } else if ((lienzo.current as any).webkitRequestFullscreen) {
          await (lienzo.current as any).webkitRequestFullscreen();
        }
        setEsPantallaCompleta(true);
      } catch (err) {
        console.log('Fullscreen no disponible:', err);
      }
    } else {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen();
        }
        setEsPantallaCompleta(false);
      } catch (err) {
        console.log('Error al salir de fullscreen:', err);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const esFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setEsPantallaCompleta(esFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div ref={lienzo} className={cn(esPantallaCompleta && 'fixed inset-0 z-50 flex flex-col bg-background')}>
      {!esPantallaCompleta && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Busqueda onElegir={(c) => irA(c.id)} onConsulta={setConsulta} />
            <FiltroUnidad
              valor={unidad}
              onChange={(u) => {
                setUnidad(u);
                setSel(null);
              }}
            />
            <span className="text-xs text-muted-foreground">
              {sub.nodos.length} conceptos · {sub.aristas.length} relaciones
            </span>
            <button
              type="button"
              onClick={togglePantallaCompleta}
              aria-label="Pantalla completa"
              className="ml-auto rounded p-1.5 hover:bg-muted"
              title="Expandir a pantalla completa"
            >
              <MaximizeIcon className="size-4" />
            </button>
          </div>
          <Leyenda unidad={unidad} />
          {error && <p className="mb-2 text-sm text-destructive">No pude ordenar el mapa: {error}</p>}
        </>
      )}
      <div className={cn('flex gap-3', esPantallaCompleta && 'flex-1 overflow-hidden')}>
        <Lienzo
          key={clave}
          className={cn('flex-1', esPantallaCompleta && 'rounded-none border-0 h-full')}
          cargando={!layout}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeClick={(_, n) => n.type === 'concepto' && setSel(n.id)}
          onPaneClick={() => setSel(null)}
          nodesConnectable={false}
          elementsSelectable
        />
        {!esPantallaCompleta && <PanelConcepto id={sel} onIr={irA} onCerrar={() => setSel(null)} />}
        {esPantallaCompleta && (
          <button
            type="button"
            onClick={togglePantallaCompleta}
            aria-label="Salir de pantalla completa"
            className="absolute top-3 right-3 z-10 rounded-lg bg-background/90 p-2 hover:bg-background"
            title="Salir de pantalla completa"
          >
            <MinimizeIcon className="size-5" />
          </button>
        )}
      </div>
      {!esPantallaCompleta && (
        <p className="mt-2 text-xs text-muted-foreground">
          Tocá un concepto para ver su detalle y resaltar sus conexiones. Se lee: origen → verbo → destino.
        </p>
      )}
    </div>
  );
}
