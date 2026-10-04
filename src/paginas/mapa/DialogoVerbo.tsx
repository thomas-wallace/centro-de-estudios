import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeftRightIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/misc';
import { normalizar } from '@/lib/texto';
import { useMateria } from '@/materia';

export interface ConexionPendiente {
  origen: string;
  destino: string;
}

/** Diálogo para elegir el verbo de una relación nueva (y opcionalmente invertir el sentido). */
export function DialogoVerbo({
  pendiente,
  verbos,
  onConfirmar,
  onCancelar,
}: {
  pendiente: ConexionPendiente | null;
  verbos: string[];
  onConfirmar: (c: ConexionPendiente & { verbo: string }) => void;
  onCancelar: () => void;
}) {
  return (
    <Dialog.Root open={!!pendiente} onOpenChange={(o) => !o && onCancelar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-4 shadow-lg outline-none"
        >
          {pendiente && (
            <Formulario key={`${pendiente.origen}>${pendiente.destino}`} inicial={pendiente} verbos={verbos} onConfirmar={onConfirmar} />
          )}
          <Dialog.Close className="absolute top-3 right-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <XIcon className="size-4" />
            <span className="sr-only">Cancelar</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Formulario({
  inicial,
  verbos,
  onConfirmar,
}: {
  inicial: ConexionPendiente;
  verbos: string[];
  onConfirmar: (c: ConexionPendiente & { verbo: string }) => void;
}) {
  const { conceptos } = useMateria();
  const [par, setPar] = useState(inicial);
  const [filtro, setFiltro] = useState('');
  const [verbo, setVerbo] = useState('');
  const filtrados = useMemo(() => {
    const f = normalizar(filtro);
    return f ? verbos.filter((v) => normalizar(v).includes(f)) : verbos;
  }, [filtro, verbos]);
  const elegido = filtrados.includes(verbo) ? verbo : (filtrados[0] ?? '');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (elegido) onConfirmar({ ...par, verbo: elegido });
      }}
      className="space-y-3"
    >
      <Dialog.Title className="pr-8 text-base font-semibold">Nueva relación</Dialog.Title>
      <div className="flex items-center gap-2 rounded-lg bg-muted p-2 text-sm">
        <span className="min-w-0 flex-1 font-medium">{conceptos.get(par.origen)?.nombre}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setPar({ origen: par.destino, destino: par.origen })}
          aria-label="Invertir el sentido de la relación"
          title="Invertir sentido"
        >
          <ArrowLeftRightIcon />
        </Button>
        <span className="min-w-0 flex-1 text-right font-medium">{conceptos.get(par.destino)?.nombre}</span>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Filtrar verbos</span>
        <Input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="p. ej. tipo, usa, contrasta…" autoFocus />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Verbo ({filtrados.length})</span>
        <Select className="w-full" value={elegido} onChange={(e) => setVerbo(e.target.value)} aria-label="Verbo de la relación">
          {filtrados.length === 0 && <option value="">No hay verbos con ese filtro</option>}
          {filtrados.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Select>
      </label>
      <p className="text-sm">
        Se lee: <strong>{conceptos.get(par.origen)?.nombre}</strong> <em>{elegido || '…'}</em>{' '}
        <strong>{conceptos.get(par.destino)?.nombre}</strong>
      </p>
      <div className="flex justify-end gap-2">
        <Dialog.Close asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Dialog.Close>
        <Button type="submit" disabled={!elegido}>
          Agregar relación
        </Button>
      </div>
    </form>
  );
}
