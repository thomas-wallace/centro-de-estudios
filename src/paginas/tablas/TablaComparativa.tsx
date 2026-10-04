import { Check, X } from 'lucide-react';
import { claveCelda } from '@/lib/practica';
import { cn } from '@/lib/utils';
import type { Comparacion } from '@/schema';
import { Select } from '@/components/ui/misc';

export interface EstadoPractica {
  ocultas: Set<string>;
  opciones: string[];
  respuestas: Record<string, string>;
  /** Celdas acertadas; `null` mientras no se corrigió. */
  bien: Set<string> | null;
  onResponder: (clave: string, valor: string) => void;
}

/**
 * Tabla comparativa responsive: scroll horizontal dentro de su contenedor y primera columna fija.
 * Si recibe `practica`, las celdas ocultas se reemplazan por un selector de emparejamiento.
 */
export function TablaComparativa({
  comp,
  color,
  practica,
}: {
  comp: Comparacion;
  color: string;
  practica?: EstadoPractica;
}) {
  return (
    <div
      className="relative max-w-full overflow-x-auto overscroll-x-contain rounded-lg border"
      role="region"
      aria-label={`Tabla: ${comp.nombre}`}
      tabIndex={0}
    >
      <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">{comp.nombre}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 border-b border-r bg-muted px-3 py-2 text-left text-xs font-semibold text-muted-foreground"
            >
              Criterio
            </th>
            {comp.columnas.map((c) => (
              <th
                key={c}
                scope="col"
                className="min-w-32 border-b bg-muted px-3 py-2 text-left font-semibold"
                style={{ boxShadow: `inset 0 -2px 0 ${color}` }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comp.filas.map((f, i) => (
            <tr key={f.criterio} className="group">
              <th
                scope="row"
                className="sticky left-0 z-10 border-r border-b bg-card px-3 py-2 text-left align-top font-medium group-last:border-b-0"
              >
                <div className="w-24 break-words sm:w-auto sm:max-w-48 sm:min-w-28">{f.criterio}</div>
              </th>
              {f.celdas.map((celda, j) => {
                const k = claveCelda(i, j);
                const oculta = practica?.ocultas.has(k);
                if (!practica || !oculta) {
                  return (
                    <td key={j} className="border-b px-3 py-2 align-top group-last:border-b-0">
                      <div className="max-w-56 min-w-24 break-words sm:max-w-64">{celda}</div>
                    </td>
                  );
                }
                const corregido = practica.bien !== null;
                const ok = practica.bien?.has(k) ?? false;
                const elegido = practica.respuestas[k] ?? '';
                return (
                  <td
                    key={j}
                    className={cn(
                      'border-b px-2 py-1.5 align-top group-last:border-b-0',
                      corregido && (ok ? 'bg-success/10' : 'bg-destructive/10'),
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Select
                        aria-label={`${f.criterio} — ${comp.columnas[j]}`}
                        value={elegido}
                        disabled={corregido}
                        onChange={(e) => practica.onResponder(k, e.target.value)}
                        className={cn(
                          'w-full min-w-28 max-w-56',
                          !elegido && !corregido && 'border-dashed text-muted-foreground',
                          corregido && (ok ? 'border-success' : 'border-destructive'),
                        )}
                      >
                        <option value="">— Elegí —</option>
                        {practica.opciones.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                      {corregido &&
                        (ok ? (
                          <Check className="size-4 shrink-0 text-success" aria-label="Correcta" />
                        ) : (
                          <X className="size-4 shrink-0 text-destructive" aria-label="Incorrecta" />
                        ))}
                    </div>
                    {corregido && !ok && (
                      <p className="mt-1 max-w-56 text-xs break-words">
                        <span className="text-muted-foreground">Correcta: </span>
                        <span className="font-medium text-success">{celda}</span>
                      </p>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
