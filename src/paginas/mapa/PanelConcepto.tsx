import { ArrowLeftIcon, ArrowRightIcon, XIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { EtiquetaUnidad, Fuente } from '@/components/comunes';
import { Button } from '@/components/ui/button';
import { PuntoUnidad } from '@/components/ui/misc';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMateria } from '@/materia';
import { useEsDesktop } from './hooks';
import { ALTO_LIENZO } from './Lienzo';

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{titulo}</h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function DetalleConcepto({ id, onIr }: { id: string; onIr: (id: string) => void }) {
  const { conceptos, vecinos, color } = useMateria();
  const c = conceptos.get(id);
  if (!c) return null;
  const conexiones = vecinos.get(id) ?? [];
  return (
    <div className="space-y-4">
      <div className="pr-8">
        <h2 className="text-lg leading-tight font-bold">{c.nombre}</h2>
        <EtiquetaUnidad unidad={c.unidad} className="mt-1" />
      </div>
      <p className="text-sm leading-relaxed font-medium">{c.definicion}</p>
      <Seccion titulo="Más en detalle">{c.definicion_extendida}</Seccion>
      <Seccion titulo="Ejemplo">{c.ejemplo}</Seccion>
      <Seccion titulo="Por qué importa">{c.por_que_importa}</Seccion>
      <Fuente archivo={c.fuente.archivo} seccion={c.fuente.seccion} />
      <Seccion titulo={`Conexiones (${conexiones.length})`}>
        {conexiones.length === 0 ? (
          <p className="text-muted-foreground">No tiene relaciones en el mapa.</p>
        ) : (
          <ul className="space-y-1">
            {conexiones.map((v, i) => (
              <li key={`${v.concepto.id}-${i}`}>
                <button
                  type="button"
                  onClick={() => onIr(v.concepto.id)}
                  className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                  aria-label={
                    v.sentido === 'sale'
                      ? `${c.nombre} ${v.verbo} ${v.concepto.nombre}. Ir a ${v.concepto.nombre}`
                      : `${v.concepto.nombre} ${v.verbo} ${c.nombre}. Ir a ${v.concepto.nombre}`
                  }
                >
                  {v.sentido === 'sale' ? (
                    <ArrowRightIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ArrowLeftIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0">
                    {v.sentido === 'sale' ? (
                      <>
                        <span className="text-muted-foreground">{v.verbo}</span>{' '}
                        <PuntoUnidad color={color(v.concepto.unidad)} className="mx-0.5 inline-block" />{' '}
                        <span className="font-medium">{v.concepto.nombre}</span>
                      </>
                    ) : (
                      <>
                        <PuntoUnidad color={color(v.concepto.unidad)} className="mx-0.5 inline-block" />{' '}
                        <span className="font-medium">{v.concepto.nombre}</span>{' '}
                        <span className="text-muted-foreground">{v.verbo} este concepto</span>
                      </>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Seccion>
    </div>
  );
}

/** Detalle del concepto: panel a la derecha en desktop, Sheet desde abajo en móvil. */
export function PanelConcepto({ id, onIr, onCerrar }: { id: string | null; onIr: (id: string) => void; onCerrar: () => void }) {
  const desktop = useEsDesktop();
  const { conceptos } = useMateria();
  if (desktop) {
    if (!id) return null;
    return (
      <aside
        className="relative w-80 shrink-0 overflow-y-auto rounded-xl border bg-card p-4 lg:w-96"
        style={{ height: ALTO_LIENZO }}
        aria-label="Detalle del concepto"
      >
        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onCerrar} aria-label="Cerrar detalle">
          <XIcon />
        </Button>
        <DetalleConcepto id={id} onIr={onIr} />
      </aside>
    );
  }
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onCerrar()}>
      <SheetContent lado="bottom" titulo={(id && conceptos.get(id)?.nombre) || 'Concepto'} className="overflow-y-auto p-4 pb-8">
        {id && <DetalleConcepto id={id} onIr={onIr} />}
      </SheetContent>
    </Sheet>
  );
}
