import {
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  useInternalNode,
  useStore,
  type Edge,
  type EdgeProps,
  type InternalNode,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { XIcon } from 'lucide-react';
import { memo, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

// ── Tipos ────────────────────────────────────────────────────────────────────

export type EstadoHueco = 'pendiente' | 'ok' | 'mal';

export type HuecoVisual = {
  n: number;
  /** Lo que escribió/eligió el estudiante (o la respuesta correcta al terminar). */
  texto?: string;
  estado: EstadoHueco;
};

export type DatosNodo = {
  nombre: string;
  color: string;
  ancho: number;
  atenuado?: boolean;
  /** Encontrado por la búsqueda. */
  resaltado?: boolean;
  /** Coincide con lo que se está escribiendo en la búsqueda. */
  coincide?: boolean;
  hueco?: HuecoVisual;
  conectable?: boolean;
};
export type NodoConceptoT = Node<DatosNodo, 'concepto'>;

export type DatosGrupo = { nombre: string; color: string; ancho: number; alto: number };
export type NodoGrupoT = Node<DatosGrupo, 'grupo'>;

export type EstadoArista = 'normal' | 'resaltada' | 'atenuada' | 'ok' | 'parcial' | 'mal' | 'faltante';

export type DatosArista = {
  verbo: string;
  /** Desvío para aristas paralelas (0 = recta). */
  desvio: number;
  estado?: EstadoArista;
  hueco?: HuecoVisual;
  /** Texto secundario bajo el verbo (p. ej. el verbo correcto). */
  nota?: string;
  onBorrar?: () => void;
  onClickEtiqueta?: () => void;
};
export type AristaConceptoT = Edge<DatosArista, 'concepto'>;

export type NodoMapa = NodoConceptoT | NodoGrupoT;

// ── Nodos ────────────────────────────────────────────────────────────────────

const handleOculto: CSSProperties = {
  opacity: 0,
  pointerEvents: 'none',
  left: '50%',
  top: '50%',
  width: 1,
  height: 1,
  minWidth: 0,
  minHeight: 0,
  border: 0,
};

const ESTILO_HUECO: Record<EstadoHueco, string> = {
  pendiente: 'border-dashed',
  ok: 'border-solid !border-success',
  mal: 'border-solid !border-destructive',
};

function NodoConceptoBase({ data, selected }: NodeProps<NodoConceptoT>) {
  const { nombre, color, ancho, atenuado, resaltado, coincide, hueco, conectable } = data;
  return (
    <div
      className={cn(
        'relative flex min-h-11 items-center justify-center rounded-lg border-2 px-3 py-2 text-center text-[13px] leading-tight font-medium text-foreground shadow-sm transition-[opacity,box-shadow]',
        atenuado && 'opacity-40',
        coincide && 'ring-2 ring-warning',
        (selected || resaltado) && 'ring-4 ring-primary/60',
        hueco && ESTILO_HUECO[hueco.estado],
      )}
      style={{
        width: ancho,
        borderColor: color,
        background: `color-mix(in oklch, ${color} ${atenuado ? 8 : 16}%, var(--card))`,
      }}
      title={hueco ? `Hueco ${hueco.n}` : nombre}
    >
      <Handle type="target" id="in" position={Position.Top} isConnectable={false} style={handleOculto} />
      <Handle type="source" id="out" position={Position.Bottom} isConnectable={false} style={handleOculto} />
      {hueco ? (
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white',
              hueco.estado === 'ok' ? 'bg-success' : hueco.estado === 'mal' ? 'bg-destructive' : 'bg-primary',
            )}
          >
            {hueco.n}
          </span>
          <span className={cn(!hueco.texto && 'text-muted-foreground', hueco.estado === 'pendiente' && 'italic')}>
            {hueco.texto || '¿…?'}
          </span>
        </span>
      ) : (
        nombre
      )}
      {conectable &&
        [Position.Top, Position.Right, Position.Bottom, Position.Left].map((p) => (
          <Handle
            key={p}
            id={p}
            type="source"
            position={p}
            className="!size-3.5 !border-2"
            aria-label={`Conectar desde ${nombre}`}
          />
        ))}
    </div>
  );
}
export const NodoConcepto = memo(NodoConceptoBase);

function NodoGrupoBase({ data }: NodeProps<NodoGrupoT>) {
  return (
    <div
      className="pointer-events-none rounded-2xl border-2 border-dashed"
      style={{
        width: data.ancho,
        height: data.alto,
        borderColor: `color-mix(in oklch, ${data.color} 45%, transparent)`,
        background: `color-mix(in oklch, ${data.color} 5%, transparent)`,
      }}
    >
      <div className="px-4 pt-3 text-base font-semibold" style={{ color: data.color }}>
        {data.nombre}
      </div>
    </div>
  );
}
export const NodoGrupo = memo(NodoGrupoBase);

// ── Aristas flotantes (de borde a borde, en línea recta o curva) ─────────────

function centro(n: InternalNode) {
  const w = n.measured.width ?? 0;
  const h = n.measured.height ?? 0;
  return { x: n.internals.positionAbsolute.x + w / 2, y: n.internals.positionAbsolute.y + h / 2, w, h };
}

/** Punto del borde del rectángulo `c` en dirección a `hacia`. */
function borde(c: { x: number; y: number; w: number; h: number }, hacia: { x: number; y: number }, margen = 3) {
  const dx = hacia.x - c.x;
  const dy = hacia.y - c.y;
  if (dx === 0 && dy === 0) return { x: c.x, y: c.y };
  const t = Math.min(dx !== 0 ? (c.w / 2 + margen) / Math.abs(dx) : Infinity, dy !== 0 ? (c.h / 2 + margen) / Math.abs(dy) : Infinity);
  return { x: c.x + dx * t, y: c.y + dy * t };
}

const COLOR_ARISTA: Record<EstadoArista, string> = {
  normal: 'var(--muted-foreground)',
  resaltada: 'var(--primary)',
  atenuada: 'var(--muted-foreground)',
  ok: 'var(--success)',
  parcial: 'var(--warning)',
  mal: 'var(--destructive)',
  faltante: 'var(--muted-foreground)',
};

export function marcadorArista(estado: EstadoArista = 'normal') {
  return { type: MarkerType.ArrowClosed, color: COLOR_ARISTA[estado], width: 18, height: 18 };
}

const zoomLegible = (s: { transform: [number, number, number] }) => s.transform[2] >= 0.45;

function AristaConceptoBase({ id, source, target, data, markerEnd, selected }: EdgeProps<AristaConceptoT>) {
  const ns = useInternalNode(source);
  const nt = useInternalNode(target);
  const legible = useStore(zoomLegible);
  if (!ns || !nt || !data) return null;

  const a = centro(ns);
  const b = centro(nt);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const largo = Math.hypot(dx, dy) || 1;
  const desvio = data.desvio * 70;
  const ctrl = { x: (a.x + b.x) / 2 + (-dy / largo) * desvio, y: (a.y + b.y) / 2 + (dx / largo) * desvio };
  const s = borde(a, desvio ? ctrl : b);
  const t = borde(b, desvio ? ctrl : a, 5);
  const path = desvio ? `M ${s.x} ${s.y} Q ${ctrl.x} ${ctrl.y} ${t.x} ${t.y}` : `M ${s.x} ${s.y} L ${t.x} ${t.y}`;
  const lx = desvio ? 0.25 * s.x + 0.5 * ctrl.x + 0.25 * t.x : (s.x + t.x) / 2;
  const ly = desvio ? 0.25 * s.y + 0.5 * ctrl.y + 0.25 * t.y : (s.y + t.y) / 2;

  const estado = data.estado ?? 'normal';
  const color = COLOR_ARISTA[estado];
  const destacada = estado !== 'normal' && estado !== 'atenuada';
  const mostrarEtiqueta = estado !== 'atenuada' && (legible || destacada || !!data.hueco || selected);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={16}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : destacada ? 2.25 : 1.5,
          strokeDasharray: estado === 'faltante' ? '6 5' : undefined,
          opacity: estado === 'atenuada' ? 0.15 : estado === 'normal' ? 0.75 : 1,
        }}
      />
      {mostrarEtiqueta && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute"
            style={{ transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`, pointerEvents: 'all' }}
          >
            <EtiquetaArista data={data} color={color} estado={estado} />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

function EtiquetaArista({ data, color, estado }: { data: DatosArista; color: string; estado: EstadoArista }) {
  const { hueco } = data;
  const contenido = hueco ? (
    <span className="flex items-center gap-1">
      <span
        className={cn(
          'inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
          hueco.estado === 'ok' ? 'bg-success' : hueco.estado === 'mal' ? 'bg-destructive' : 'bg-primary',
        )}
      >
        {hueco.n}
      </span>
      <span className={cn(!hueco.texto && 'text-muted-foreground', hueco.estado === 'pendiente' && 'italic')}>
        {hueco.texto || '¿…?'}
      </span>
    </span>
  ) : (
    <span>{data.verbo}</span>
  );
  const clase = cn(
    'block max-w-[150px] rounded-md border bg-card px-1.5 py-0.5 text-center text-[11px] leading-tight shadow-xs',
    estado === 'normal' ? 'text-muted-foreground' : 'font-medium text-foreground',
    hueco && 'border-dashed',
  );
  return (
    <div className="flex items-center gap-0.5">
      {data.onClickEtiqueta ? (
        <button type="button" onClick={data.onClickEtiqueta} className={clase} style={{ borderColor: color }}>
          {contenido}
        </button>
      ) : (
        <span className={clase} style={{ borderColor: estado === 'normal' ? undefined : color }}>
          {contenido}
          {data.nota && <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">{data.nota}</span>}
        </span>
      )}
      {data.onBorrar && (
        <button
          type="button"
          onClick={data.onBorrar}
          aria-label={`Borrar la relación "${data.verbo}"`}
          className="inline-flex size-5 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-xs hover:bg-destructive hover:text-white"
        >
          <XIcon className="size-3" />
        </button>
      )}
    </div>
  );
}

export const AristaConcepto = memo(AristaConceptoBase);

export const nodeTypes = { concepto: NodoConcepto, grupo: NodoGrupo };
export const edgeTypes = { concepto: AristaConcepto };
