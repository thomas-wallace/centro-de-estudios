import { useLiveQuery } from 'dexie-react-hooks';
import { CheckIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EtiquetaUnidad, Fuente, PaginaEncabezado } from '@/components/comunes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Progress, PuntoUnidad, Segmentado } from '@/components/ui/misc';
import { db, type RespuestaSimulacro, type Seguridad, type Simulacro as RegistroSimulacro } from '@/db';
import { armarConPreguntas, armarSimulacro, type PreguntaArmada } from '@/lib/simulacro';
import { LETRAS } from '@/lib/texto';
import { cn, fechaCorta, pct } from '@/lib/utils';
import { useMateria } from '@/materia';

const SEGURIDADES: { id: Seguridad; etiqueta: string; emoji: string }[] = [
  { id: 'seguro', etiqueta: 'Seguro', emoji: '💪' },
  { id: 'dudo', etiqueta: 'Dudo', emoji: '🤔' },
  { id: 'adivino', etiqueta: 'Adivino', emoji: '🎲' },
];

type Modo = 'corto' | 'completo';
const CANTIDAD: Record<Modo, number> = { corto: 10, completo: 40 };

type Fase =
  | { tipo: 'inicio' }
  | { tipo: 'jugando'; modo: RegistroSimulacro['modo']; preguntas: PreguntaArmada[]; indice: number; respuestas: RespuestaSimulacro[] }
  | { tipo: 'resultado'; modo: RegistroSimulacro['modo']; preguntas: PreguntaArmada[]; respuestas: RespuestaSimulacro[] };

export default function Simulacro() {
  const { slug, datos } = useMateria();
  const [modo, setModo] = useState<Modo>('corto');
  const [fase, setFase] = useState<Fase>({ tipo: 'inicio' });
  const historial = useLiveQuery(
    () => db.simulacros.where('materia').equals(slug).reverse().sortBy('fecha').catch(() => []),
    [slug],
  );

  const empezar = (preguntas: PreguntaArmada[], m: RegistroSimulacro['modo']) =>
    setFase({ tipo: 'jugando', modo: m, preguntas, indice: 0, respuestas: [] });

  const terminar = async (f: Extract<Fase, { tipo: 'jugando' }>, respuestas: RespuestaSimulacro[]) => {
    setFase({ tipo: 'resultado', modo: f.modo, preguntas: f.preguntas, respuestas });
    try {
      await db.simulacros.add({
        materia: slug,
        fecha: Date.now(),
        modo: f.modo,
        respuestas,
        aciertos: respuestas.filter((r) => r.correcta).length,
        total: respuestas.length,
      });
    } catch (e) {
      console.warn('No se pudo guardar el simulacro', e);
    }
  };

  if (fase.tipo === 'jugando') {
    return <Pregunta fase={fase} onResponder={(r) => {
      const respuestas = [...fase.respuestas, r];
      if (fase.indice + 1 >= fase.preguntas.length) terminar(fase, respuestas);
      else setFase({ ...fase, indice: fase.indice + 1, respuestas });
    }} onSalir={() => setFase({ tipo: 'inicio' })} />;
  }

  if (fase.tipo === 'resultado') {
    return (
      <Resultado
        fase={fase}
        onReintentarFalladas={() => {
          const ids = new Set(fase.respuestas.filter((r) => !r.correcta).map((r) => r.pregunta));
          empezar(armarConPreguntas(datos.preguntas.filter((p) => ids.has(p.id))), 'repaso');
        }}
        onNuevo={() => setFase({ tipo: 'inicio' })}
      />
    );
  }

  const n = Math.min(CANTIDAD[modo], datos.preguntas.length);
  return (
    <div className="mx-auto max-w-2xl">
      <PaginaEncabezado
        emoji="📝"
        titulo="Simulacro de examen"
        descripcion="Preguntas mezcladas de todas las unidades, en proporción a su peso. Antes de responder, marcá qué tan seguro estás."
      />
      <Card>
        <CardContent className="flex flex-col gap-4">
          <Segmentado
            ariaLabel="Modo"
            valor={modo}
            onChange={setModo}
            opciones={[
              { valor: 'corto', etiqueta: `Corto (${Math.min(10, datos.preguntas.length)})` },
              { valor: 'completo', etiqueta: `Completo (${Math.min(40, datos.preguntas.length)})` },
            ]}
          />
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Las opciones se mezclan en cada intento.</li>
            <li>• La corrección se muestra al final, con el porqué de cada distractor.</li>
            <li>• Ojo con los errores marcados como «Seguro»: son los conceptos mal aprendidos.</li>
          </ul>
          <Button size="lg" onClick={() => empezar(armarSimulacro(datos.preguntas, datos.unidades, n), modo)}>
            Empezar ({n} preguntas)
          </Button>
        </CardContent>
      </Card>

      {!!historial?.length && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Simulacros anteriores</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {historial.slice(0, 8).map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-16 text-muted-foreground">{fechaCorta(s.fecha)}</span>
                  <Badge variant="outline">{s.modo}</Badge>
                  <Progress value={pct(s.aciertos, s.total)} className="flex-1" />
                  <span className="w-20 text-right tabular-nums">
                    {s.aciertos}/{s.total} · {pct(s.aciertos, s.total)} %
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Pregunta({
  fase,
  onResponder,
  onSalir,
}: {
  fase: Extract<Fase, { tipo: 'jugando' }>;
  onResponder: (r: RespuestaSimulacro) => void;
  onSalir: () => void;
}) {
  const [elegida, setElegida] = useState<number | null>(null);
  const [seguridad, setSeguridad] = useState<Seguridad | null>(null);
  const { pregunta, orden } = fase.preguntas[fase.indice];

  const confirmar = () => {
    if (elegida === null || !seguridad) return;
    const original = orden[elegida];
    onResponder({
      pregunta: pregunta.id,
      unidad: pregunta.unidad,
      elegida: original,
      correcta: original === pregunta.correcta,
      seguridad,
    });
    setElegida(null);
    setSeguridad(null);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center gap-3">
        <Progress value={(fase.indice / fase.preguntas.length) * 100} />
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {fase.indice + 1}/{fase.preguntas.length}
        </span>
        <Button variant="ghost" size="sm" onClick={onSalir}>
          Abandonar
        </Button>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <EtiquetaUnidad unidad={pregunta.unidad} />
          <p className="text-lg leading-relaxed font-medium whitespace-pre-line">{pregunta.enunciado}</p>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Opciones">
            {orden.map((orig, i) => (
              <button
                key={orig}
                role="radio"
                aria-checked={elegida === i}
                onClick={() => setElegida(i)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                  elegida === i ? 'border-primary bg-primary/10' : 'hover:bg-muted',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                    elegida === i && 'border-primary bg-primary text-primary-foreground',
                  )}
                >
                  {LETRAS[i]}
                </span>
                <span className="pt-0.5">{pregunta.opciones[orig]}</span>
              </button>
            ))}
          </div>
          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-medium">¿Qué tan seguro estás?</p>
            <div className="grid grid-cols-3 gap-2">
              {SEGURIDADES.map((s) => (
                <Button
                  key={s.id}
                  variant={seguridad === s.id ? 'default' : 'outline'}
                  onClick={() => setSeguridad(s.id)}
                  aria-pressed={seguridad === s.id}
                >
                  {s.emoji} {s.etiqueta}
                </Button>
              ))}
            </div>
          </div>
          <Button size="lg" disabled={elegida === null || !seguridad} onClick={confirmar}>
            {fase.indice + 1 === fase.preguntas.length ? 'Terminar' : 'Siguiente'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Resultado({
  fase,
  onReintentarFalladas,
  onNuevo,
}: {
  fase: Extract<Fase, { tipo: 'resultado' }>;
  onReintentarFalladas: () => void;
  onNuevo: () => void;
}) {
  const { datos, color, nombreUnidad } = useMateria();
  const { respuestas, preguntas } = fase;
  const aciertos = respuestas.filter((r) => r.correcta).length;
  const falladas = respuestas.length - aciertos;
  const nota = pct(aciertos, respuestas.length);

  const porUnidad = useMemo(
    () =>
      datos.unidades
        .map((u) => {
          const rs = respuestas.filter((r) => r.unidad === u.id);
          return { u, total: rs.length, ok: rs.filter((r) => r.correcta).length };
        })
        .filter((x) => x.total > 0),
    [datos.unidades, respuestas],
  );

  const matriz = SEGURIDADES.map((s) => ({
    s,
    ok: respuestas.filter((r) => r.seguridad === s.id && r.correcta).length,
    mal: respuestas.filter((r) => r.seguridad === s.id && !r.correcta).length,
  }));
  const segurosMal = matriz[0].mal;

  return (
    <div className="mx-auto max-w-3xl">
      <PaginaEncabezado emoji="📊" titulo="Resultado del simulacro" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col items-center gap-2 text-center">
            <div className={cn('text-5xl font-bold tabular-nums', nota >= 70 ? 'text-success' : nota >= 50 ? 'text-warning' : 'text-destructive')}>
              {nota} %
            </div>
            <p className="text-sm text-muted-foreground">
              {aciertos} de {respuestas.length} correctas · {nota >= 70 ? '¡Por encima del 70 % de exoneración!' : 'Seguí practicando'}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {falladas > 0 && <Button onClick={onReintentarFalladas}>Reintentar las {falladas} falladas</Button>}
              <Button variant="outline" onClick={onNuevo}>
                Nuevo simulacro
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguridad × acierto</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="pb-2 text-left font-normal" />
                  <th className="pb-2 font-normal">✓ Correcta</th>
                  <th className="pb-2 font-normal">✗ Incorrecta</th>
                </tr>
              </thead>
              <tbody>
                {matriz.map(({ s, ok, mal }) => (
                  <tr key={s.id}>
                    <td className="py-1 pr-2">
                      {s.emoji} {s.etiqueta}
                    </td>
                    <td className="py-1">
                      <div className="rounded-md bg-success/10 py-2 text-center font-semibold tabular-nums">{ok}</div>
                    </td>
                    <td className="py-1 pl-1">
                      <div
                        className={cn(
                          'rounded-md py-2 text-center font-semibold tabular-nums',
                          s.id === 'seguro' && mal > 0 ? 'bg-destructive text-white' : 'bg-destructive/10',
                        )}
                      >
                        {mal}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {segurosMal > 0 && (
              <p className="mt-3 text-xs text-destructive">
                ⚠ {segurosMal} error{segurosMal > 1 ? 'es' : ''} con «Seguro»: son conceptos que creés saber pero tenés mal. Revisalos primero.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Por unidad</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {porUnidad.map(({ u, total, ok }) => (
            <div key={u.id} className="flex items-center gap-3 text-sm">
              <PuntoUnidad color={u.color} />
              <span className="w-40 truncate sm:w-64">{u.nombre}</span>
              <Progress value={pct(ok, total)} color={u.color} className="flex-1" />
              <span className="w-16 text-right tabular-nums">
                {ok}/{total}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <h2 className="mt-6 mb-3 font-semibold">Corrección</h2>
      <div className="flex flex-col gap-3">
        {respuestas.map((r, i) => {
          const p = preguntas.find((x) => x.pregunta.id === r.pregunta)!.pregunta;
          return (
            <Card key={r.pregunta} className={cn('gap-3 py-4', !r.correcta && r.seguridad === 'seguro' && 'border-destructive/60')}>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {r.correcta ? (
                    <Badge variant="success">
                      <CheckIcon /> Correcta
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XIcon /> Incorrecta
                    </Badge>
                  )}
                  <Badge variant="outline">{SEGURIDADES.find((s) => s.id === r.seguridad)?.etiqueta}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {i + 1}. <PuntoUnidad color={color(p.unidad)} className="mx-1 size-2" />
                    {nombreUnidad(p.unidad)}
                  </span>
                </div>
                <p className="font-medium whitespace-pre-line">{p.enunciado}</p>
                {!r.correcta && r.elegida !== null && (
                  <p className="text-destructive">
                    Elegiste: {p.opciones[r.elegida]}
                    <span className="block text-muted-foreground">→ {p.por_que_falla[r.elegida]}</span>
                  </p>
                )}
                <p className="text-success">✓ {p.opciones[p.correcta]}</p>
                <p className="text-muted-foreground">{p.explicacion}</p>
                <Fuente {...p.fuente} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
