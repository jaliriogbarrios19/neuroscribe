# Tasks: Setup Inicial

## Phase 1: Foundation & Utilities

- [x] 1.1 Create `src/lib/utils/cn.ts` with `clsx` and `tailwind-merge` integration.
- [x] 1.2 Create `src/components/shared/Header.tsx` by extracting the header logic from `src/app/page.tsx`.
- [x] 1.3 Update `src/app/layout.tsx` with corrected metadata and clean structure.

## Phase 2: Dashboard Refactor

- [x] 2.1 Create `src/app/(dashboard)/layout.tsx` to include `Header` and `Sidebar`.
- [x] 2.2 Create `src/app/(dashboard)/page.tsx` and move the main workspace logic from `src/app/page.tsx`.
- [x] 2.3 Verify functionality of the new dashboard structure at `/`.
- [x] 2.4 Delete the original `src/app/page.tsx`.

## Phase 3: Auth & Error Handling

- [x] 3.1 Create `src/app/auth/error/page.tsx` for authentication error feedback.
- [x] 3.2 Implement logic in `auth/error/page.tsx` to handle `message` and `code` query parameters.

## Phase 4: Testing & Verification

- [x] 4.1 Unit test `cn` utility for class merging and conflict resolution.
- [x] 4.2 Verify Dashboard layout renders `Header` and `Sidebar` correctly.
- [x] 4.3 Manually verify `/auth/error` page with various query parameters.
- [x] 4.4 Ensure all imports are correctly updated throughout the refactored files.
