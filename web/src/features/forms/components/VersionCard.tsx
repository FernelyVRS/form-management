import { FileEdit, CheckCircle, Archive, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import type { Version } from '@/types/form';
import { versionActionsFor, type VersionLifecycleStatus } from '../model/versionActions';
import { cn } from '@/lib/utils';

interface VersionCardProps {
  version: Version;
  className?: string;
  onView?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onCreateVersion?: () => void;
  onClone?: () => void;
  busy?: boolean;
}

const statusIcons: Record<VersionLifecycleStatus, { icon: typeof FileEdit; bg: string; text: string }> = {
  Draft: {
    icon: FileEdit,
    bg: 'bg-gray-100',
    text: 'text-gray-600',
  },
  Published: {
    icon: CheckCircle,
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  Archived: {
    icon: Archive,
    bg: 'bg-slate-100',
    text: 'text-slate-500',
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const outlineButton = 'border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors';

export function VersionCard({
  version,
  className,
  onView,
  onPublish,
  onArchive,
  onCreateVersion,
  onClone,
  busy = false,
}: VersionCardProps) {
  const statusConfig = statusIcons[version.estado] || statusIcons['Draft'];
  const StatusIcon = statusConfig.icon;
  const availableActions = versionActionsFor(version.estado);

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
              statusConfig.bg,
              statusConfig.text
            )}
          >
            <StatusIcon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900">
                Versión {version.numero}
              </span>
              <StatusBadge status={version.estado} />
            </div>

            {version.descripcion && (
              <p className="text-sm text-muted-foreground mb-2">
                {version.descripcion}
              </p>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(version.createdAt)}</span>
              </div>
              {version.editadoPor && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{version.editadoPor}</span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 max-w-full">
            <div className="flex flex-wrap gap-2 justify-end">
              {availableActions.includes('edit') && (
                <Button variant="outline" size="sm" className={outlineButton} onClick={onView} disabled={busy}>
                  Editar
                </Button>
              )}
              {availableActions.includes('publish') && (
                <Button size="sm" onClick={onPublish} disabled={busy}>
                  {busy ? 'Publicando…' : 'Publicar'}
                </Button>
              )}
              {availableActions.includes('archive') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-700 hover:bg-slate-600 hover:text-white hover:border-slate-600 transition-colors"
                  onClick={onArchive}
                  disabled={busy}
                >
                  Archivar borrador
                </Button>
              )}
              {availableActions.includes('view') && (
                <Button variant="outline" size="sm" className={outlineButton} onClick={onView}>
                  Ver estructura
                </Button>
              )}
              {availableActions.includes('createVersion') && (
                <Button variant="outline" size="sm" className={outlineButton} onClick={onCreateVersion}>
                  Crear versión
                </Button>
              )}
              {availableActions.includes('clone') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                  onClick={onClone}
                >
                  Clonar formulario
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
