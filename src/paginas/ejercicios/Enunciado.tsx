import { cn } from '@/lib/utils';

/** ¿Parece una tabla, código o diagrama en texto plano (mejor en monoespaciada)? */
function esBloqueMono(bloque: string): boolean {
  const lineas = bloque.split('\n');
  const tecnicas = lineas.filter(
    (l) =>
      /\|/.test(l) ||
      /\t/.test(l) ||
      / {2,}\S/.test(l.trimEnd()) ||
      /^\s{2,}\S/.test(l) ||
      /^[-+=_|]{3,}/.test(l.trim()) ||
      /^(\$|#|>|[A-Za-z0-9-]+[#>]\s)/.test(l.trim()),
  );
  if (bloque.startsWith('```')) return true;
  return lineas.length >= 2 ? tecnicas.length >= 2 : tecnicas.length === 1 && /\|.*\|/.test(bloque);
}

/** Muestra un texto respetando saltos de línea; los bloques con tablas/código van en fuente mono. */
export function TextoConFormato({ texto, className }: { texto: string; className?: string }) {
  const bloques = texto
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .filter((b) => b.trim() !== '');
  return (
    <div className={cn('space-y-3', className)}>
      {bloques.map((b, i) =>
        esBloqueMono(b) ? (
          <pre
            key={i}
            className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-[13px] leading-relaxed whitespace-pre"
          >
            {b.replace(/^```\w*\n?|\n?```$/g, '')}
          </pre>
        ) : (
          <p key={i} className="leading-relaxed whitespace-pre-wrap">
            {b}
          </p>
        ),
      )}
    </div>
  );
}
