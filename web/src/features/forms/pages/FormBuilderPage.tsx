import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useParams, useSearchParams } from 'react-router';
import { useStore } from 'zustand';
import { ArrowLeft, Check, Code2, FilePenLine, LayoutList, Loader2, MousePointer2, Plus, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import { createFormBuilderStore, schemaErrorMessage } from '../builder/formBuilderStore';
import { useFormSchemaQuery, useSaveFormSchemaMutation } from '../hooks/useFormSchema';
import { useBuilderDesktop } from '../hooks/useBuilderDesktop';
import { SchemaNodeEditor, type EditorTarget } from '../components/builder/SchemaNodeEditor';
import { SchemaTree } from '../components/builder/SchemaTree';
import { BuilderOutline } from '../components/builder/BuilderOutline';
import { SchemaInspector } from '../components/builder/SchemaInspector';
import { fieldCount, nodeTitle } from '../components/builder/builderUi';
import { locations, type NodeLocation, type SchemaNode } from '../model/formSchemaOperations';
import { useFormDetailQuery } from '../hooks/useFormLifecycle';

const DraggableSchemaTree = lazy(() => import('../components/builder/DraggableSchemaTree'));

export default function FormBuilderPage({ readOnly = false }: { readOnly?: boolean }) {
  const { formId, versionId } = useParams();
  if (!formId || !versionId) return <Alert><AlertTitle>Versión no encontrada</AlertTitle></Alert>;
  return <VersionEditor key={`${formId}/${versionId}/${readOnly}`} formId={formId} versionId={versionId} readOnly={readOnly} />;
}

function VersionEditor({ formId, versionId, readOnly }: { formId: string; versionId: string; readOnly: boolean }) {
  const [store] = useState(() => createFormBuilderStore(formId, versionId));
  const state = useStore(store);
  const query = useFormSchemaQuery(formId, versionId);
  const metadata = useFormDetailQuery(formId);
  const mutation = useSaveFormSchemaMutation(formId, versionId);
  const desktop = useBuilderDesktop();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('node');
  const tab = searchParams.get('tab') === 'json' ? 'json' : 'design';
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const [deleting, setDeleting] = useState<SchemaNode | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [discardProperties, setDiscardProperties] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const [reloadError, setReloadError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const saving = state.saveStatus === 'saving';
  const editable = !readOnly && state.remote?.status === 'Draft' && !saving && !reloading;
  const hasChanges = state.dirty || editorDirty;
  const blocker = useBlocker(({ currentLocation, nextLocation }) => (hasChanges || saving) && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => { if (query.data && !editorDirty) store.getState().hydrate(query.data); }, [query.data, store, editorDirty]);
  useEffect(() => {
    if (!hasChanges && !saving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanges, saving]);
  const write = () => store.getState().save((schema, rowVersion) => mutation.mutateAsync({ schema, rowVersion }));
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!editorDirty && !readOnly && !saving && !reloading) void store.getState().save((schema, rowVersion) => mutation.mutateAsync({ schema, rowVersion }));
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [store, editorDirty, readOnly, saving, reloading, mutation]);

  const requestAction = (action: () => void) => {
    if (editorDirty) { pendingAction.current = action; setDiscardProperties(true); }
    else action();
  };
  const selectId = (id: string) => setSearchParams(previous => { const next = new URLSearchParams(previous); next.set('node', id); next.delete('tab'); return next; }, { replace: true });
  const select = (item: NodeLocation) => {
    if (editor?.node?.id === item.node.id) return;
    requestAction(() => {
    selectId(item.node.id);
    setEditor(editable ? { kind: item.node.type, node: item.node, parentId: item.parentId } : null);
    requestAnimationFrame(() => {
      document.getElementById(`node_${item.node.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      if (desktop && editable) document.getElementById('node-label')?.focus({ preventScroll: true });
    });
    });
  };
  const openEditor = (target: EditorTarget) => requestAction(() => {
    if (target.node) selectId(target.node.id);
    setEditor(target);
  });
  const closeEditor = (applied = false) => {
    if (applied) { setEditorDirty(false); setEditor(null); }
    else requestAction(() => { setEditor(null); setEditorDirty(false); });
  };
  const reload = async () => {
    setReloadError(null); setReloading(true); setDiscarding(false);
    setEditor(null); setEditorDirty(false);
    try {
      const result = await query.refetch();
      if (result.error || !result.data) throw result.error ?? new Error('No se pudo recargar.');
      store.getState().hydrate(result.data, true);
    } catch (error) { setReloadError(schemaErrorMessage(error, 'load')); }
    finally { setReloading(false); }
  };

  if (!state.schema || !state.baseline || !state.remote) {
    return <main data-builder-workspace className="flex min-h-dvh items-center justify-center p-6">
      {query.isError ? <Alert variant="destructive" className="max-w-lg"><AlertTitle>No se pudo cargar la estructura</AlertTitle><AlertDescription>{schemaErrorMessage(query.error, 'load')}<div className="mt-2 flex flex-wrap gap-2"><Button onClick={() => query.refetch()}>Reintentar</Button><Button asChild variant="outline"><Link to="/forms">Volver a formularios</Link></Button></div></AlertDescription></Alert> :
        <div role="status" className="flex w-full max-w-xl flex-col gap-4">Cargando estructura…<Skeleton className="h-12 w-2/3" /><Skeleton className="h-48 w-full" /></div>}
    </main>;
  }
  const all = locations(state.schema);
  const selected = all.find(item => item.node.id === selectedId);
  const title = metadata.data?.nombre ?? (readOnly ? 'Estructura del formulario' : 'Editor del formulario');
  const statusText = saving ? 'Guardando cambios…' : reloading ? 'Recargando…' : editorDirty ? 'Propiedades sin aplicar' : state.saveStatus === 'saved' ? 'Guardado correctamente' : state.dirty ? 'Cambios pendientes' : 'Sin cambios pendientes';
  const treeProps = { schema: state.schema, editable, selectedId, onSelect: select, onEdit: openEditor,
    onRemove: (node: SchemaNode) => requestAction(() => setDeleting(node)),
    onCommand: (command: Parameters<typeof state.apply>[0]) => requestAction(() => { setEditor(null); setEditorDirty(false); store.getState().apply(command); }) };
  const outline = <BuilderOutline schema={state.schema} selectedId={selectedId} editable={editable} onSelect={select} onCreate={() => openEditor({ kind: 'section', parentId: null })} />;

  return <TooltipProvider><div data-builder-workspace className="flex min-w-0 flex-col bg-muted/30">
    <a href="#builder-canvas" className="sr-only focus:not-sr-only focus:p-3">Ir al contenido del formulario</a>
    {desktop ? <a href="#builder-properties" className="sr-only focus:not-sr-only focus:p-3">Ir al panel de propiedades</a> : null}
    <header className="sticky top-0 z-10 flex min-w-0 flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link to={`/forms/${formId}`} aria-label="Volver al formulario"><ArrowLeft aria-hidden="true" /></Link></Button>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><FilePenLine aria-hidden="true" className="size-5" /></div>
        <div className="min-w-0"><h1 className="truncate text-base font-semibold" title={title}>{title} · v{state.remote.number}</h1>
          <p className="text-xs text-muted-foreground">{readOnly ? 'Inspector de estructura' : 'Constructor de formularios'} <span aria-hidden="true">/</span> <span>{state.schema.sections.length} secciones · {fieldCount(state.schema)} preguntas</span></p></div>
        <Badge variant="secondary" className="hidden sm:inline-flex">{state.remote.status === 'Draft' ? 'Borrador' : state.remote.status === 'Published' ? 'Publicada' : 'Archivada'}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span role="status" aria-label="Estado de guardado" aria-live="polite" className="flex items-center gap-1.5 text-xs text-muted-foreground">{saving || reloading ? <Loader2 aria-hidden="true" className="size-3 motion-safe:animate-spin" /> : state.saveStatus === 'saved' ? <Check aria-hidden="true" className="size-3" /> : <span aria-hidden="true" className={cn('size-1.5 rounded-full', hasChanges ? 'bg-primary' : 'bg-muted-foreground')} />}{statusText}</span>
        <Button variant="ghost" size="icon" aria-label="Recargar" title="Recargar desde el servidor" disabled={saving || reloading} onClick={() => hasChanges ? setDiscarding(true) : void reload()}><RotateCcw aria-hidden="true" /></Button>
        {!readOnly && state.remote.status === 'Draft' ? <Button title={editorDirty ? 'Aplica primero las propiedades del elemento.' : 'Guardar cambios (Ctrl/Cmd+S)'} disabled={!state.dirty || editorDirty || saving || reloading || state.saveStatus === 'conflict'} onClick={() => void write()}><Save data-icon="inline-start" aria-hidden="true" />{saving ? 'Guardando…' : 'Guardar'}</Button> : null}
      </div>
    </header>

    <div className="grid min-w-0 flex-1 lg:grid-cols-[14rem_minmax(0,1fr)_22rem] xl:grid-cols-[16rem_minmax(0,1fr)_23rem]">
      {desktop ? <aside className="sticky top-20 h-[calc(100dvh-5rem)] min-w-0 border-r bg-background p-4">{outline}</aside> :
        <details className="border-b bg-background px-4 py-3"><summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Estructura · {state.schema.sections.length} secciones</summary><div className="mt-4 max-h-80 overflow-y-auto">{outline}</div></details>}

      <main id="builder-canvas" tabIndex={-1} className="min-w-0 scroll-mt-24 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:p-6">
        <Tabs value={tab} onValueChange={value => setSearchParams(previous => { const next = new URLSearchParams(previous); if (value === 'json') next.set('tab', 'json'); else next.delete('tab'); return next; }, { replace: true })} className="gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><TabsList aria-label="Vista del constructor">
            <TabsTrigger value="design"><LayoutList aria-hidden="true" />Diseño</TabsTrigger><TabsTrigger value="json"><Code2 aria-hidden="true" />JSON</TabsTrigger>
          </TabsList>{editable ? <Button variant="outline" size="sm" onClick={() => openEditor({ kind: 'section', parentId: null })}><Plus data-icon="inline-start" aria-hidden="true" />Nueva sección</Button> : <Badge variant="outline">Solo lectura</Badge>}</div>
          {readOnly || state.remote.status !== 'Draft' ? <Alert><AlertTitle>Solo lectura</AlertTitle><AlertDescription>Explora la estructura y las propiedades. Esta versión no permite edición.</AlertDescription></Alert> : null}
          {state.error || reloadError ? <Alert variant="destructive"><AlertTitle>{state.saveStatus === 'conflict' ? 'Conflicto de guardado' : 'No se pudo completar la operación'}</AlertTitle><AlertDescription className="whitespace-pre-wrap break-words">{state.error ?? reloadError}</AlertDescription></Alert> : null}
          <TabsContent value="design" className="min-w-0">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-semibold">Contenido del formulario</h2><p className="mt-1 text-xs text-muted-foreground">{editable ? 'Selecciona un elemento para configurar sus propiedades.' : 'Estructura de la versión guardada.'}</p></div><Badge variant="outline" translate="no">schema v1</Badge></div>
            {editable ? <Suspense fallback={<Skeleton className="h-32 w-full" />}><DraggableSchemaTree {...treeProps} /></Suspense> : <SchemaTree {...treeProps} editable={false} />}
          </TabsContent>
          <TabsContent value="json" className="min-w-0"><div className="rounded-xl border bg-background p-4"><h2 className="mb-2 text-sm font-semibold">JSON canónico</h2><p className="mb-4 text-xs text-muted-foreground">Vista de inspección. Edita los elementos desde Diseño.</p><pre className="max-h-[70dvh] overflow-auto text-xs leading-relaxed" translate="no" data-testid="schema-json">{JSON.stringify(state.schema, null, 2)}</pre></div></TabsContent>
          {tab !== 'json' ? <pre hidden data-testid="schema-json">{JSON.stringify(state.schema)}</pre> : null}
        </Tabs>
      </main>

      <aside id="builder-properties" aria-label="Panel de propiedades" tabIndex={-1} className={desktop ? 'sticky top-20 h-[calc(100dvh-5rem)] min-w-0 overflow-y-auto overscroll-contain border-l bg-background p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring' : 'contents'}>
        {editor && editable ? <SchemaNodeEditor key={`${editor.kind}/${editor.node?.id ?? 'new'}/${editor.parentId}`} target={editor} schema={state.schema} baseline={state.baseline}
          mode={desktop ? 'panel' : 'dialog'} onDirtyChange={setEditorDirty} onClose={closeEditor}
          onApply={(node, parentId) => {
            if (!store.getState().apply({ type: 'put', node, parentId })) return store.getState().error;
            selectId(node.id); return null;
          }} /> : desktop ? <>
          <div className="mb-5 flex items-center gap-2"><SlidersHorizontal aria-hidden="true" className="size-4 text-muted-foreground" /><h2 className="text-sm font-semibold">Propiedades</h2></div>
          {selected ? <SchemaInspector selected={selected} editable={editable} onEdit={() => openEditor({ kind: selected.node.type, node: selected.node, parentId: selected.parentId })} /> :
            <Empty className="px-0 py-12"><EmptyHeader><EmptyMedia variant="icon"><MousePointer2 aria-hidden="true" /></EmptyMedia><EmptyTitle>Selecciona un elemento</EmptyTitle><EmptyDescription>Sus propiedades aparecerán aquí. Puedes elegirlo desde la estructura o el formulario.</EmptyDescription></EmptyHeader></Empty>}
          <p className="mt-6 border-t pt-4 text-xs leading-relaxed text-muted-foreground">Los cambios se aplican al borrador. Usa Guardar para enviarlos al servidor.</p>
        </> : null}
      </aside>
    </div>

    <Dialog open={!desktop && !!selected && !editable && !saving && !reloading} onOpenChange={open => { if (!open) setSearchParams(previous => { const next = new URLSearchParams(previous); next.delete('node'); return next; }, { replace: true }); }}><DialogContent><DialogHeader><DialogTitle>Propiedades del elemento</DialogTitle><DialogDescription>Información de la estructura guardada. Esta vista es de solo lectura.</DialogDescription></DialogHeader>
      {selected ? <SchemaInspector selected={selected} editable={false} onEdit={() => {}} /> : null}
    </DialogContent></Dialog>

    <Dialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>Eliminar elemento</DialogTitle><DialogDescription>Se eliminará «{deleting ? nodeTitle(deleting) : ''}» junto con su contenido. Los campos esenciales y las dependencias están protegidos.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button><Button variant="destructive" onClick={() => {
      if (deleting && store.getState().apply({ type: 'remove', id: deleting.id })) {
        setEditor(null); setEditorDirty(false);
        if (selectedId && !locations(store.getState().schema!).some(item => item.node.id === selectedId))
          setSearchParams(previous => { const next = new URLSearchParams(previous); next.delete('node'); return next; }, { replace: true });
      }
      setDeleting(null);
    }}>Confirmar eliminación</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={discarding} onOpenChange={setDiscarding}><DialogContent><DialogHeader><DialogTitle>Descartar cambios</DialogTitle><DialogDescription>Recargar reemplazará las propiedades sin aplicar y el borrador por la versión del servidor.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDiscarding(false)}>Conservar cambios</Button><Button onClick={() => void reload()}>Descartar y recargar</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={discardProperties} onOpenChange={open => { setDiscardProperties(open); if (!open) pendingAction.current = null; }}><DialogContent><DialogHeader><DialogTitle>Propiedades sin aplicar</DialogTitle><DialogDescription>Hay cambios en el panel de propiedades. Aplícalos al borrador o descártalos para continuar.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => { setDiscardProperties(false); pendingAction.current = null; }}>Seguir editando</Button><Button onClick={() => { const action = pendingAction.current; pendingAction.current = null; setDiscardProperties(false); setEditorDirty(false); action?.(); }}>Descartar propiedades</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={blocker.state === 'blocked'} onOpenChange={open => { if (!open && blocker.state === 'blocked') blocker.reset(); }}><DialogContent><DialogHeader><DialogTitle>Cambios sin guardar</DialogTitle><DialogDescription>{saving ? 'Espera a que termine el guardado.' : 'Hay cambios sin guardar o propiedades sin aplicar. Puedes permanecer o descartarlos al salir.'}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => { if (blocker.state === 'blocked') blocker.reset(); }}>Permanecer</Button><Button disabled={saving} onClick={() => { if (blocker.state === 'blocked') blocker.proceed(); }}>Descartar y salir</Button></DialogFooter></DialogContent></Dialog>
  </div></TooltipProvider>;
}
