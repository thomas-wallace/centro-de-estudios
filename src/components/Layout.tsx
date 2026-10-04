import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeftRightIcon, HomeIcon, MenuIcon, MonitorIcon, MoonIcon, SettingsIcon, SunIcon } from 'lucide-react';
import { materias } from 'virtual:materias';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { db } from '@/db';
import { herramientasDisponibles } from '@/herramientas';
import { useMateria } from '@/materia';
import { cn } from '@/lib/utils';
import { useApp, type Tema } from '@/store';
import { Logo } from './Logo';
import { Button } from './ui/button';
import { Sheet, SheetContent } from './ui/sheet';

function SelectorTema() {
  const { tema, setTema } = useApp();
  const siguiente: Record<Tema, Tema> = { sistema: 'claro', claro: 'oscuro', oscuro: 'sistema' };
  const Icono = tema === 'claro' ? SunIcon : tema === 'oscuro' ? MoonIcon : MonitorIcon;
  const nombre = { claro: 'claro', oscuro: 'oscuro', sistema: 'del sistema' }[tema];
  return (
    <Button variant="ghost" size="icon" onClick={() => setTema(siguiente[tema])} title={`Tema ${nombre} (cambiar)`}>
      <Icono />
      <span className="sr-only">Tema {nombre}</span>
    </Button>
  );
}

function Navegacion({ onNavegar }: { onNavegar?: () => void }) {
  const { slug, datos } = useMateria();
  const pendientes = useLiveQuery(
    () =>
      db.tarjetas
        .where('[materia+due]')
        .between([slug, 0], [slug, Date.now()])
        .count()
        .catch(() => 0),
    [slug],
  );
  const item = (activo: boolean) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
      activo ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    );

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Herramientas">
      <NavLink to={`/${slug}`} end className={({ isActive }) => item(isActive)} onClick={onNavegar}>
        <HomeIcon className="size-4" /> Inicio y progreso
      </NavLink>
      <div className="mt-3 mb-1 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Herramientas</div>
      {herramientasDisponibles(datos).map((h) => (
        <NavLink key={h.id} to={`/${slug}/${h.ruta}`} className={({ isActive }) => item(isActive)} onClick={onNavegar}>
          <span className="w-4 text-center">{h.emoji}</span>
          <span className="flex-1">{h.nombre}</span>
          {h.id === 'flashcards' && !!pendientes && (
            <span className="rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">{pendientes}</span>
          )}
        </NavLink>
      ))}
      <div className="mt-3 border-t pt-3">
        <NavLink to={`/${slug}/ajustes`} className={({ isActive }) => item(isActive)} onClick={onNavegar}>
          <SettingsIcon className="size-4" /> Examen y ajustes
        </NavLink>
        {materias.length > 1 && (
          <Link to="/" className={item(false)} onClick={onNavegar}>
            <ArrowLeftRightIcon className="size-4" /> Cambiar materia
          </Link>
        )}
      </div>
    </nav>
  );
}

export function Layout() {
  const { datos } = useMateria();
  const [abierto, setAbierto] = useState(false);
  const variasMaterias = materias.length > 1;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:px-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setAbierto(true)}>
            <MenuIcon />
            <span className="sr-only">Abrir menú</span>
          </Button>
          <Link to={variasMaterias ? '/' : `/${datos.materia.slug}`} className="flex min-w-0 items-center gap-2">
            <Logo className="size-7" />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold">{datos.materia.nombre}</div>
              <div className="hidden text-xs text-muted-foreground sm:block">Centro de estudio</div>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            {variasMaterias && (
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/">Cambiar materia</Link>
              </Button>
            )}
            <SelectorTema />
          </div>
        </div>
      </header>

      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent titulo="Menú" lado="left" className="overflow-y-auto p-4 pt-12">
          <Navegacion onNavegar={() => setAbierto(false)} />
        </SheetContent>
      </Sheet>

      <div className="mx-auto flex max-w-7xl gap-6 px-3 sm:px-4">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto py-5 lg:block">
          <Navegacion />
        </aside>
        <main className="min-w-0 flex-1 py-5 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
