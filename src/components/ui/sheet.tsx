import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  lado = 'left',
  titulo,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { lado?: 'left' | 'right' | 'bottom'; titulo: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col gap-2 bg-card shadow-lg outline-none',
          lado === 'left' && 'inset-y-0 left-0 w-72 max-w-[85vw] border-r',
          lado === 'right' && 'inset-y-0 right-0 w-96 max-w-[92vw] border-l',
          lado === 'bottom' && 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t',
          className,
        )}
        aria-describedby={undefined}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{titulo}</DialogPrimitive.Title>
        {children}
        <DialogPrimitive.Close className="absolute top-3 right-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <XIcon className="size-4" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
