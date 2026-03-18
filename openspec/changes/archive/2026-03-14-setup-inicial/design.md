# Design: Setup Inicial

## Technical Approach

Refactor the monolithic `src/app/page.tsx` into a modular structure using Next.js Route Groups. This establishes a clean separation between global layouts and the authenticated dashboard. We will also implement a centralized UI utility for class merging and a dedicated authentication error page to improve UX and developer experience.

## Architecture Decisions

### Decision: Dashboard Route Group

**Choice**: Introduce `src/app/(dashboard)` route group.
**Alternatives considered**: Maintaining all logic in `src/app/page.tsx`.
**Rationale**: Route groups enable shared layouts (Sidebar, Header) for authenticated routes without cluttering the URL path. This is the recommended pattern for complex SaaS applications in Next.js 16.

### Decision: Centralized UI Utility (`cn`)

**Choice**: Create `src/lib/utils/cn.ts` using `clsx` and `tailwind-merge`.
**Alternatives considered**: Manual class concatenation.
**Rationale**: Simplifies conditional styling and ensures that Tailwind CSS class conflicts are resolved deterministically (last-one-wins), which is essential for reusable components.

### Decision: Custom Auth Error Route

**Choice**: Create `src/app/auth/error/page.tsx`.
**Alternatives considered**: Using the default `error.tsx` or generic alert messages.
**Rationale**: Provides a branded, user-friendly interface to explain authentication failures (e.g., expired links, invalid codes) and provides a clear path back to the login page.

## Data Flow

1. **Root Request**: User hits `/`.
2. **Layout Resolution**: Next.js resolves `src/app/layout.tsx` then `src/app/(dashboard)/layout.tsx`.
3. **Dashboard Rendering**:
   - `Header` and `Sidebar` are rendered in the layout.
   - `Sidebar` performs client-side data fetching for folders and profile info.
4. **Page Rendering**: `src/app/(dashboard)/page.tsx` renders the Editor workspace.
5. **Auth Errors**: Any redirect to `/auth/error?message=...` renders the custom error page with specific feedback.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/layout.tsx` | Modify | Update project metadata and basic structure. |
| `src/app/(dashboard)/layout.tsx` | Create | Shared layout for the app dashboard. |
| `src/app/(dashboard)/page.tsx` | Create | The main editor workspace (logic moved from root `page.tsx`). |
| `src/app/page.tsx` | Delete | Replaced by the modular dashboard page. |
| `src/app/auth/error/page.tsx` | Create | UI for authentication error feedback. |
| `src/components/shared/Header.tsx` | Create | Extracted Header component for better modularity. |
| `src/lib/utils/cn.ts` | Create | `cn` utility for Tailwind class management. |

## Interfaces / Contracts

### `cn` Utility
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `cn` utility | Test with combinations of strings, objects, and conflicting Tailwind classes. |
| Integration | Dashboard Layout | Verify Sidebar and Header render on the home route. |
| Manual | Auth Error Page | Navigate to `/auth/error?message=Test` and verify display. |

## Migration / Rollout

1. Create new files (`cn.ts`, `Header.tsx`, `(dashboard)/layout.tsx`).
2. Move logic from `src/app/page.tsx` to `src/app/(dashboard)/page.tsx`.
3. Verify the home page still works as expected.
4. Delete the old `src/app/page.tsx`.

## Open Questions

- None.
