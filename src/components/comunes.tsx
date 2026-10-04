import { useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMateria } from '@/materia';
import { cn } from '@/lib/utils';
import { PuntoUnidad, Select } from './ui/misc';

export function PaginaEncabezado({
  emoji,
  titulo,
  descripcion,
  acciones,
}: {
  emoji?: string;
  titulo: string;
  descripcion?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {emoji && <span className="mr-2">{emoji}</span>}
          {titulo}
        </h1>
        {descripcion && <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}

/** Unidad seleccionada sincronizada con `?unidad=` (así los enlaces del plan abren la herramienta ya filtrada). */
export function useUnidadParam(): [string, (u: string) => void] {
  const [params, setParams] = useSearchParams();
  const { unidades } = useMateria();
  const valor = params.get('unidad') ?? '';
  const set = useCallback(
    (u: string) =>
      setParams(
        (p) => {
          const n = new URLSearchParams(p);
          if (u) n.set('unidad', u);
          else n.delete('unidad');
          return n;
        },
        { replace: true },
      ),
    [setParams],
  );
  return [unidades.has(valor) ? valor : '', set];
}

/** Selector de unidad ("" = todas). */
export function FiltroUnidad({
  valor,
  onChange,
  todas = true,
  className,
}: {
  valor: string;
  onChange: (u: string) => void;
  todas?: boolean;
  className?: string;
}) {
  const { datos } = useMateria();
  return (
    <Select
      aria-label="Filtrar por unidad"
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className={cn('max-w-full sm:max-w-72', className)}
    >
      {todas && <option value="">Todas las unidades</option>}
      {datos.unidades.map((u) => (
        <option key={u.id} value={u.id}>
          {u.nombre}
        </option>
      ))}
    </Select>
  );
}

export function EtiquetaUnidad({ unidad, className }: { unidad: string; className?: string }) {
  const { color, nombreUnidad } = useMateria();
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <PuntoUnidad color={color(unidad)} />
      {nombreUnidad(unidad)}
    </span>
  );
}

export function Fuente({ archivo, seccion }: { archivo: string; seccion: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      📄 {archivo} · {seccion}
    </p>
  );
}
