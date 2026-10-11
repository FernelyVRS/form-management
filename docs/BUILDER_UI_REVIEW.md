# Builder workspace UI/UX

## Implemented experience

- Full-width desktop workspace with outline/search, compact composition canvas and property inspector.
- Form name, version, counters, pending/success status and explicit Save remain in the top bar.
- Selection and Design/JSON tabs are reflected in `node` and `tab` URL parameters.
- Existing shadcn/Radix primitives compose the UI; technical keys remain canonical v1 while UI copy is Spanish.
- RHF editors run inline on desktop and as accessible dialogs on mobile. The same editor instance retains values when crossing the responsive breakpoint.
- Unapplied property changes are separate from the document draft: selection changes, cancellation and leaving the page require an explicit decision. Save is disabled until properties are applied.
- Static options use compact label/value rows. Dependent options are edited visually per source value, retaining JSON as an advanced inspection/editing tool.
- Property action footer stays visible while its fields scroll. Technical identity settings are secondary; preserved variables and core protection remain enforced.
- Movement handles and contextual arrows replace large repeated action footers. Drop hints appear during dragging, and keyboard/editor movement remains available.
- Numeric validation errors are inline and focused; schema/network problems have actionable Spanish copy.
- Read-only versions have desktop/mobile inspectors with no editing controls.

## Skills and focused review

Used `shadcn` to inspect installed Radix components, documentation and composition patterns, and `web-design-guidelines` to review interaction/accessibility/layout behavior. No Figma changes are claimed by this local implementation.

Reviewed fixes:

- `web/src/styles/App.css:8` — scoped removal of Vite's fixed-width/padded/centered builder layout.
- `web/src/features/forms/pages/FormBuilderPage.tsx` — named polite save status, keyboard shortcut, skip links, version identity, dirty guards and URL-backed selection/tabs.
- `web/src/features/forms/components/builder/SchemaTree.tsx` — compact rows, labeled native buttons, focus/hover states, long-text handling and mobile action wrapping.
- `web/src/features/forms/components/builder/SchemaNodeEditor.tsx` — semantic fieldsets, associated labels, autocomplete/name, numeric validation/aria-invalid, first-error focus, visible footer and mobile focus without opening the software keyboard automatically.
- `web/src/features/forms/components/builder/DependencyMapEditor.tsx` — labeled visual map groups and inputs, long-key handling and preserved advanced edits.
- `web/src/features/forms/components/builder/DraggableSchemaTree.tsx` — selection disabled/inert content while dragging, compatible drop targets and non-gesture alternatives.
- `web/src/styles/index.css` — safe-area padding, touch targets, native color schemes and reduced-motion support.

This is a focused source/behavior review, not a claim of a full automated accessibility certification.

## Verification

- `pnpm lint`: 0 errors, 6 existing warnings outside the new workspace components.
- `pnpm build`: successful; existing bundle-size warning remains, DnD is still a lazy chunk.
- `pnpm test:unit`: 63 passed.
- Targeted Playwright workspace/builder/list tests with read-only local API smoke: 21 passed.
- Tests cover preserved CRUD/save/conflict/navigation behavior, visual dependency maps, unsaved-property protection, URL state, pointer drag, Ctrl+S, no horizontal overflow, responsive editor persistence and mobile read-only inspection.
- Desktop/mobile screenshots were captured and inspected. Mobile title wrapping was corrected after the first visual pass.

Captures in the approved temporary directory:

- `C:\Users\ferne\AppData\Local\Temp\opencode\builder-workspace-desktop.png`
- `C:\Users\ferne\AppData\Local\Temp\opencode\builder-workspace-mobile.png`

Reproduce captures by setting `BUILDER_CAPTURE_DIR` to an existing directory when running `tests/builder-workspace.spec.ts`. Set `FORM_SCHEMA_LIVE_SMOKE=1` to include the existing-version read-only API check. Mocked write scenarios do not modify development data.
