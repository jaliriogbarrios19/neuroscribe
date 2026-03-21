# Core Specification (Delta)

## ADDED Requirements

### Requirement: Modular Directory Structure

The project MUST follow a modular and scalable folder structure, separating application logic (Next.js App Router) from UI components and system utilities.

#### Scenario: Navigating the project folders
- GIVEN the standard folder structure.
- WHEN a developer looks for the `cn` utility.
- THEN it MUST be found in `src/lib/utils/`.
- AND the application routes MUST be contained within `src/app/`.

### Requirement: Next.js 16 (App Router) Standards

The system MUST adhere to Next.js 16 App Router standards, including the use of route groups and server/client components where appropriate.

#### Scenario: Server Component implementation
- GIVEN a layout component within the `(dashboard)` group.
- WHEN the layout is accessed via a route.
- THEN it SHOULD be rendered as a React Server Component (RSC) by default unless interactivity requires `use client`.
