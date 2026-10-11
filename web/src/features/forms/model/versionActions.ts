export type VersionLifecycleStatus = 'Draft' | 'Published' | 'Archived';

export type VersionAction = 'edit' | 'publish' | 'archive' | 'view' | 'createVersion' | 'clone';

export const versionActionMatrix: Record<VersionLifecycleStatus, readonly VersionAction[]> = {
  Draft: ['edit', 'publish', 'archive'],
  Published: ['view', 'createVersion', 'clone'],
  Archived: ['view', 'createVersion', 'clone'],
};

export const versionActionsFor = (status: VersionLifecycleStatus): readonly VersionAction[] =>
  versionActionMatrix[status];

export const statusLabel = (status: VersionLifecycleStatus): string =>
  status === 'Draft' ? 'borrador' : status === 'Published' ? 'publicada' : 'archivada';
