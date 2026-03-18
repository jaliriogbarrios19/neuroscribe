# UI Specification (Delta)

## ADDED Requirements

### Requirement: Dashboard Layout Group

The system MUST organize authenticated routes within a `(dashboard)` route group to share common layout components (Sidebar, Navbar) without affecting the root path structure.

#### Scenario: Navigating to the home page (dashboard)
- GIVEN the user is authenticated.
- WHEN they navigate to `/`.
- THEN the system MUST render the `src/app/(dashboard)/layout.tsx`.
- AND it MUST display the shared sidebar and the dashboard content.

### Requirement: Utility `cn` for Tailwind Classes

The system MUST provide a central utility `cn` to merge Tailwind CSS classes conditionally, ensuring that conflicting classes are resolved correctly.

#### Scenario: Merging tailwind classes conditionally
- GIVEN a component that needs conditional styling.
- WHEN the `cn` function is called with a mix of static classes and conditional objects.
- THEN it MUST return a single string with all valid classes.
- AND it MUST prioritize the last class in case of Tailwind conflicts (e.g., `p-2` and `p-4`).
