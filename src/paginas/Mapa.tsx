import { ReactFlowProvider } from '@xyflow/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PaginaEncabezado, useUnidadParam } from '@/components/comunes';
import { Segmentado } from '@/components/ui/misc';
import { useMateria } from '@/materia';
import { Explorar } from './mapa/Explorar';
import { Huecos } from './mapa/Huecos';
import { Reconstruir } from './mapa/Reconstruir';

type Modo = 'explorar' | 'huecos' | 'reconstruir';

const DESCRIPCION: Record<Modo, string> = {
  explorar: 'Recorré los conceptos y cómo se relacionan. Buscá uno o filtrá por unidad.',
  huecos: 'Completá los conceptos o las relaciones que faltan en el mapa.',
  reconstruir: 'Armá de memoria las relaciones entre los conceptos de una unidad.',
};

export default function Mapa() {
  const { conceptos } = useMateria();
  const [params, setParams] = useSearchParams();
  const [unidad, setUnidad] = useUnidadParam();
  const [modo, setModo] = useState<Modo>('explorar');

  // `?c=<conceptoId>` (desde el glosario): abrir Explorar con ese concepto seleccionado y centrado.
  const cParam = params.get('c');
  const [conceptoInicial] = useState(() => (cParam && conceptos.has(cParam) ? cParam : null));
  useEffect(() => {
    if (!cParam) return;
    const c = conceptos.get(cParam);
    // Una sola actualización de la URL: se consume `c` y, si había un filtro de otra unidad, se pasa a la del concepto.
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        n.delete('c');
        const u = n.get('unidad');
        if (c && u && u !== c.unidad) n.set('unidad', c.unidad);
        return n;
      },
      { replace: true },
    );
  }, [cParam, conceptos, setParams]);

  return (
    <div>
      <PaginaEncabezado
        emoji="🗺️"
        titulo="Mapa conceptual"
        descripcion={DESCRIPCION[modo]}
        acciones={
          <Segmentado<Modo>
            ariaLabel="Modo del mapa"
            valor={modo}
            onChange={setModo}
            opciones={[
              { valor: 'explorar', etiqueta: 'Explorar' },
              { valor: 'huecos', etiqueta: 'Mapa con huecos' },
              { valor: 'reconstruir', etiqueta: 'Reconstruir' },
            ]}
          />
        }
      />
      <ReactFlowProvider key={modo}>
        {modo === 'explorar' && <Explorar unidad={unidad} setUnidad={setUnidad} conceptoInicial={conceptoInicial} />}
        {modo === 'huecos' && <Huecos unidad={unidad} setUnidad={setUnidad} />}
        {modo === 'reconstruir' && <Reconstruir unidadInicial={unidad} />}
      </ReactFlowProvider>
    </div>
  );
}
