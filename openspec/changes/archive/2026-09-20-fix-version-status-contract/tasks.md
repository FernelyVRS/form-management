## 1. Frontend Status Alignment

- [x] 1.1 Update `VersionModal` to filter selectable sources with the canonical `Published` status while preserving the existing localized UI copy and Published-only behavior.
- [x] 1.2 Verify `VersionCard` and `StatusBadge` map `Draft`, `Published`, and `Archived` consistently without expanding the change into navigation, cloning, or publishing behavior.

## 2. Verification

- [x] 2.1 Search version-related frontend source for obsolete localized values used as status comparisons and confirm any remaining Spanish terms are presentation-only text.
- [x] 2.2 Run `pnpm build` from `web/` and confirm the production build completes without `TS2367` or another version-status type error.
