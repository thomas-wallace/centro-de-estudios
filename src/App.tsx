import { materias } from 'virtual:materias';
import { lazy, Suspense, type ReactNode } from 'react';
import { createHashRouter, Link, Navigate, RouterProvider, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Logo } from './components/Logo';
import { Card, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { herramientasDisponibles } from './herramientas';
import { MateriaProvider, useCargaMateria, useMateria } from './materia';

const Inicio = lazy(() => import('./paginas/Inicio'));
const Mapa = lazy(() => import('./paginas/Mapa'));
const Flashcards = lazy(() => import('./paginas/Flashcards'));
const Simulacro = lazy(() => import('./paginas/Simulacro'));
const Glosario = lazy(() => import('./paginas/Glosario'));
const Flujos = lazy(() => import('./paginas/Flujos'));
const Tablas = lazy(() => import('./paginas/Tablas'));
const Submapas = lazy(() => import('./paginas/Submapas'));
const Ejercicios = lazy(() => import('./paginas/Ejercicios'));
const Conexiones = lazy(() => import('./paginas/Conexiones'));
const Ajustes = lazy(() => import('./paginas/Ajustes'));

function Cargando() {
  return (
    <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground" role="status">
      Cargando…
    </div>
  );
}

function SelectorMateria() {
  if (materias.length === 1) return <Navigate to={`/${materias[0].slug}`} replace />;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Logo className="size-10" />
        <div>
          <h1 className="text-2xl font-bold">Centro de estudio</h1>
          <p className="text-sm text-muted-foreground">Elegí la materia que querés estudiar.</p>
        </div>
      </div>
      {materias.length === 0 ? (
        <p className="text-muted-foreground">
          No hay materias. Agregá una carpeta en <code>materias/&lt;slug&gt;/datos.json</code>.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {materias.map((m) => (
            <Link key={m.slug} to={`/${m.slug}`} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <CardTitle>{m.nombre}</CardTitle>
                  {m.descripcion && <CardDescription className="line-clamp-3">{m.descripcion}</CardDescription>}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function RaizMateria() {
  const { slug = '' } = useParams();
  const carga = useCargaMateria(slug);
  if (carga.estado === 'cargando') return <Cargando />;
  if (carga.estado === 'error') {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="mb-2 text-lg font-semibold">No pude cargar la materia</h1>
        <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
          {carga.mensajes.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Corré <code>npm run validar -- {slug}</code> para ver el detalle.
        </p>
      </div>
    );
  }
  return (
    <MateriaProvider slug={slug} datos={carga.datos}>
      <Layout />
    </MateriaProvider>
  );
}

/** Si la herramienta no tiene contenido en esta materia, vuelve al inicio. */
function SiDisponible({ id, children }: { id: string; children: ReactNode }) {
  const { datos, slug } = useMateria();
  if (!herramientasDisponibles(datos).some((h) => h.id === id)) return <Navigate to={`/${slug}`} replace />;
  return <Suspense fallback={<Cargando />}>{children}</Suspense>;
}

const router = createHashRouter([
  { path: '/', element: <SelectorMateria /> },
  {
    path: '/:slug',
    element: <RaizMateria />,
    children: [
      { index: true, element: <SiDisponible id="mapa"><Inicio /></SiDisponible> },
      { path: 'mapa', element: <SiDisponible id="mapa"><Mapa /></SiDisponible> },
      { path: 'flashcards', element: <SiDisponible id="flashcards"><Flashcards /></SiDisponible> },
      { path: 'simulacro', element: <SiDisponible id="simulacro"><Simulacro /></SiDisponible> },
      { path: 'glosario', element: <SiDisponible id="glosario"><Glosario /></SiDisponible> },
      { path: 'flujos', element: <SiDisponible id="flujos"><Flujos /></SiDisponible> },
      { path: 'tablas', element: <SiDisponible id="tablas"><Tablas /></SiDisponible> },
      { path: 'submapas', element: <SiDisponible id="submapas"><Submapas /></SiDisponible> },
      { path: 'ejercicios', element: <SiDisponible id="ejercicios"><Ejercicios /></SiDisponible> },
      { path: 'conexiones', element: <SiDisponible id="conexiones"><Conexiones /></SiDisponible> },
      { path: 'ajustes', element: <SiDisponible id="mapa"><Ajustes /></SiDisponible> },
      { path: '*', element: <Navigate to="." replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
