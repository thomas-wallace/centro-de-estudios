import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRightIcon, CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Fuente } from '@/components/comunes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Progress, PuntoUnidad } from '@/components/ui/misc';
import { db } from '@/db';
import { herramientasDisponibles } from '@/herramientas';
import { FASES, generarPlan } from '@/lib/plan';
import { calcularProgreso, recomendar } from '@/lib/progreso';
import { aFechaISO, cn, diasEntre, fechaCorta, fechaLarga, parsearFechaISO, pct } from '@/lib/utils';
import { useMateria } from '@/materia';

export default function Inicio() {
  const { slug, datos, tarjetas, config, nombreUnidad } = useMateria();
  const estados = useLiveQuery(() => db.tarjetas.where('materia').equals(slug).toArray().catch(() => []), [slug]);
  const simulacros = useLiveQuery(() => db.simulacros.where('materia').equals(slug).toArray().catch(() => []), [slug]);
  const actividades = useLiveQuery(() => db.actividades.where('materia').equals(slug).toArray().catch(() => []), [slug]);

  const progreso = useMemo(
    () =>
      calcularProgreso({
        unidades: datos.unidades,
        conceptos: datos.conceptos,
        tarjetas,
        estados: estados ?? [],
        simulacros: simulacros ?? [],
        actividades: actividades ?? [],
      }),
    [datos, tarjetas, estados, simulacros, actividades],
  );

  const herramientas = herramientasDisponibles(datos).map((h) => h.id);
  const hoy = new Date();
  const plan = useMemo(
    () =>
      generarPlan({
        hoy,
        fechaExamen: config.fechaExamenEfectiva,
        unidades: datos.unidades,
        herramientas,
        debiles: progreso.porUnidad.filter((u) => u.debil).map((u) => u.unidad),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.fechaExamenEfectiva, datos.unidades, progreso.porUnidad, aFechaISO(hoy)],
  );
  const diaHoy = plan.dias.find((d) => d.fecha === aFechaISO(hoy));

  if (!estados || !simulacros || !actividades) return null;

  const ult = progreso.ultimoSimulacro;
  const rec = recomendar(progreso, {
    faseHoy: diaHoy?.fase,
    unidadesHoy: diaHoy?.unidades,
    nombreUnidad,
    diasDesdeSimulacro: ult ? diasEntre(new Date(ult.fecha), hoy) : null,
  });
  const fechaExamen = config.fechaExamenEfectiva ? parsearFechaISO(config.fechaExamenEfectiva) : null;
  const faltan = fechaExamen ? diasEntre(hoy, fechaExamen) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{datos.materia.nombre}</h1>
          {datos.materia.descripcion && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{datos.materia.descripcion}</p>}
        </div>
        <Link
          to={`/${slug}/ajustes`}
          className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-xs hover:bg-muted"
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          {fechaExamen ? (
            <span>
              Examen: <strong>{fechaCorta(fechaExamen)}</strong>{' '}
              <span className="text-muted-foreground">
                ({faltan! > 0 ? `faltan ${faltan} días` : faltan === 0 ? '¡es hoy!' : 'ya pasó'})
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Configurá la fecha del examen</span>
          )}
        </Link>
      </div>

      {/* Recomendación */}
      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Qué estudiar ahora</p>
            <p className="mt-1 text-lg font-semibold">{rec.titulo}</p>
            <p className="text-sm text-muted-foreground">{rec.detalle}</p>
          </div>
          <Button asChild size="lg">
            <Link to={`/${slug}/${rec.herramienta}${rec.unidad ? `?unidad=${rec.unidad}` : ''}`}>
              Ir <ArrowRightIcon />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          titulo="Conceptos dominados"
          valor={`${progreso.conceptosDominados}/${progreso.conceptosTotal}`}
          detalle={<Progress value={pct(progreso.conceptosDominados, progreso.conceptosTotal)} />}
        />
        <Indicador
          titulo="Flashcards pendientes"
          valor={String(progreso.pendientesHoy)}
          detalle={<span>{progreso.nuevasDisponibles} sin ver</span>}
          enlace={`/${slug}/flashcards`}
        />
        <Indicador
          titulo="Último simulacro"
          valor={ult ? `${pct(ult.aciertos, ult.total)} %` : '—'}
          detalle={<span>{ult ? `${ult.aciertos}/${ult.total} · ${fechaCorta(ult.fecha)}` : 'Todavía no hiciste ninguno'}</span>}
          enlace={`/${slug}/simulacro`}
        />
        <Indicador
          titulo="Unidades débiles"
          valor={String(progreso.porUnidad.filter((u) => u.debil).length)}
          detalle={<span>puntaje menor a 60 %</span>}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.1fr]">
        {/* Progreso por unidad */}
        <Card>
          <CardHeader>
            <CardTitle>Progreso por unidad</CardTitle>
            <CardDescription>Combina flashcards dominadas, simulacros y prácticas.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {progreso.porUnidad.map((u) => {
              const unidad = datos.unidades.find((x) => x.id === u.unidad)!;
              const sinDatos = u.tarjetasVistas === 0 && u.aciertoSimulacro === null && u.aciertoPracticas === null;
              return (
                <div key={u.unidad} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <PuntoUnidad color={unidad.color} />
                    <span className="min-w-0 flex-1 truncate font-medium">{unidad.nombre}</span>
                    <span className="text-xs text-muted-foreground">peso {unidad.peso} %</span>
                    {u.debil && <Badge variant="destructive">débil</Badge>}
                    <span className="w-10 text-right text-sm tabular-nums">{sinDatos ? '—' : `${u.puntaje}%`}</span>
                  </div>
                  <Progress value={sinDatos ? 0 : u.puntaje} color={unidad.color} />
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>
                      {u.dominados}/{u.conceptos} conceptos
                    </span>
                    <span>
                      {u.tarjetasVistas}/{u.tarjetas} tarjetas vistas
                    </span>
                    {u.aciertoSimulacro !== null && <span>simulacro {Math.round(u.aciertoSimulacro)} %</span>}
                    {u.aciertoPracticas !== null && <span>prácticas {Math.round(u.aciertoPracticas)} %</span>}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Plan de estudio */}
        <Plan plan={plan} hoy={aFechaISO(hoy)} />
      </div>

      <Dudas />
    </div>
  );
}

function Indicador({ titulo, valor, detalle, enlace }: { titulo: string; valor: string; detalle?: React.ReactNode; enlace?: string }) {
  const contenido = (
    <Card className={cn('h-full gap-1 py-4', enlace && 'transition-shadow hover:shadow-md')}>
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{titulo}</span>
        <span className="text-2xl font-bold tabular-nums">{valor}</span>
        <div className="text-xs text-muted-foreground">{detalle}</div>
      </CardContent>
    </Card>
  );
  return enlace ? <Link to={enlace}>{contenido}</Link> : contenido;
}

function Plan({ plan, hoy }: { plan: ReturnType<typeof generarPlan>; hoy: string }) {
  const { slug, nombreUnidad, color } = useMateria();
  const [verTodo, setVerTodo] = useState(false);
  const idxHoy = Math.max(0, plan.dias.findIndex((d) => d.fecha === hoy));
  const visibles = verTodo ? plan.dias : plan.dias.slice(idxHoy, idxHoy + 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan de estudio · {plan.dias.length} días</CardTitle>
        <CardDescription>
          {plan.conFecha ? 'Hasta el día anterior al examen.' : 'Sin fecha de examen: plan de 14 días. Configurala en Examen y ajustes.'}
        </CardDescription>
        <div className="mt-2 flex gap-1" aria-hidden>
          {plan.dias.map((d) => (
            <div
              key={d.fecha}
              title={`${d.fecha} · ${d.fase}`}
              className={cn(
                'h-2 flex-1 rounded-full',
                { entender: 'bg-violet-400', memorizar: 'bg-sky-400', aplicar: 'bg-emerald-400', medirse: 'bg-amber-400' }[d.fase],
                d.fecha === hoy && 'ring-2 ring-foreground ring-offset-1 ring-offset-card',
                d.fecha < hoy && 'opacity-40',
              )}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {FASES.map((f) => (
            <span key={f.id}>
              {f.emoji} {f.nombre}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {visibles.map((d) => {
          const fase = FASES.find((f) => f.id === d.fase)!;
          const esHoy = d.fecha === hoy;
          return (
            <div key={d.fecha} className={cn('rounded-lg border p-3', esHoy && 'border-primary bg-primary/5')}>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold first-letter:uppercase">{esHoy ? 'Hoy' : fechaLarga(parsearFechaISO(d.fecha))}</span>
                <Badge variant="secondary">
                  {fase.emoji} {fase.nombre}
                </Badge>
                {d.unidades.map((u) => (
                  <span key={u} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <PuntoUnidad color={color(u)} className="size-2" />
                    {nombreUnidad(u)}
                  </span>
                ))}
              </div>
              <ul className="flex flex-col gap-1">
                {d.tareas.map((t, i) => (
                  <li key={i}>
                    <Link
                      to={`/${slug}/${t.herramienta}${t.unidad ? `?unidad=${t.unidad}` : ''}`}
                      className="flex items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted"
                    >
                      <span className="text-muted-foreground">→</span> {t.texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        <Button variant="ghost" size="sm" onClick={() => setVerTodo((v) => !v)}>
          {verTodo ? 'Ver solo los próximos días' : `Ver el plan completo (${plan.dias.length} días)`}
          <ChevronDownIcon className={cn('transition-transform', verTodo && 'rotate-180')} />
        </Button>
      </CardContent>
    </Card>
  );
}

function Dudas() {
  const { datos } = useMateria();
  const [abierto, setAbierto] = useState(false);
  if (!datos.dudas.length) return null;
  return (
    <Card>
      <CardHeader>
        <button className="flex items-center justify-between text-left" onClick={() => setAbierto((a) => !a)} aria-expanded={abierto}>
          <div>
            <CardTitle>⚠️ Dudas y contradicciones del material ({datos.dudas.length})</CardTitle>
            <CardDescription>Puntos ambiguos del material fuente: conviene consultarlos con el docente.</CardDescription>
          </div>
          <ChevronDownIcon className={cn('size-5 shrink-0 transition-transform', abierto && 'rotate-180')} />
        </button>
      </CardHeader>
      {abierto && (
        <CardContent>
          <ul className="flex flex-col gap-3">
            {datos.dudas.map((d, i) => (
              <li key={i} className="border-l-2 border-warning pl-3 text-sm">
                <p>{d.texto}</p>
                <Fuente {...d.fuente} />
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
