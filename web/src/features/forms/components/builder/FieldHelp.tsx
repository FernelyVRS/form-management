import { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function FieldHelp({ label, description }: { label: string; description: string }) {
  const [open, setOpen] = useState(false);
  return <Tooltip open={open} onOpenChange={setOpen}>
    <TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={`Ayuda sobre ${label}`}
      onClick={event => { event.preventDefault(); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}><Info aria-hidden="true" /></Button></TooltipTrigger>
    <TooltipContent className="max-w-sm motion-reduce:animate-none motion-reduce:transition-none" onEscapeKeyDown={() => setOpen(false)}>{description}</TooltipContent>
  </Tooltip>;
}
