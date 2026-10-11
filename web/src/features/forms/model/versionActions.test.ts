import { describe, expect, it } from 'vitest';
import { statusLabel, versionActionMatrix, versionActionsFor } from './versionActions';

describe('versionActionMatrix', () => {
  it('offers edit, publish and archive for Drafts', () => {
    expect(versionActionsFor('Draft')).toEqual(['edit', 'publish', 'archive']);
  });

  it('offers view, createVersion and clone for Published versions', () => {
    expect(versionActionsFor('Published')).toEqual(['view', 'createVersion', 'clone']);
  });

  it('offers view, createVersion and clone for Archived versions', () => {
    expect(versionActionsFor('Archived')).toEqual(['view', 'createVersion', 'clone']);
  });

  it('never exposes publish or archive outside Drafts', () => {
    for (const status of ['Published', 'Archived'] as const) {
      expect(versionActionsFor(status)).not.toContain('publish');
      expect(versionActionsFor(status)).not.toContain('archive');
    }
  });

  it('never exposes derivation or cloning for Drafts', () => {
    expect(versionActionsFor('Draft')).not.toContain('clone');
    expect(versionActionsFor('Draft')).not.toContain('createVersion');
    expect(versionActionsFor('Draft')).not.toContain('view');
  });

  it('defines an action set for every known status', () => {
    for (const status of ['Draft', 'Published', 'Archived'] as const) {
      expect(versionActionMatrix[status].length).toBeGreaterThan(0);
    }
  });
});

describe('statusLabel', () => {
  it('labels each status in Spanish', () => {
    expect(statusLabel('Draft')).toBe('borrador');
    expect(statusLabel('Published')).toBe('publicada');
    expect(statusLabel('Archived')).toBe('archivada');
  });
});
