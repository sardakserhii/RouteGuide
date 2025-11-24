---
trigger: always_on
---

You are working in a React codebase that follows a feature-based architecture and a clear separation of concerns between model (logic), view (UI) and utilities.

ARCHITECTURE RULES (ALWAYS APPLY)

1. Feature-based structure

- Prefer organizing code by feature, not by technology:
  - `src/features/<feature-name>/ui` for presentational components.
  - `src/features/<feature-name>/model` for hooks and types.
  - `src/features/<feature-name>/lib` for pure helper functions.
- When you add or refactor functionality related to a specific feature, keep all files inside that feature folder.

2. Hooks as "controllers" / model layer

- Put business logic, data derivation and local state into custom hooks.
- Hooks should:
  - have no JSX.
  - expose a clear API (inputs as arguments, outputs as returned object).
  - contain derived data (sorted lists, filters, computed fields).
- Example: `usePoiListModel` manages all logic for POI list (distance, categories, filters, visible items).

3. Presentational components as view layer

- UI components in `ui/` should be as "dumb" as possible:
  - receive all data and callbacks via props.
  - contain mostly JSX and minimal glue logic.
  - not perform network requests, not call complex business logic directly.
- Split large components into smaller ones (cards, headers, filters) when:
  - they exceed ~150–200 lines,
  - they mix multiple visual sections,
  - they have repeated UI patterns.

4. Utilities and types

- Put pure, reusable functions into `lib/` (e.g. distance calculation, category derivation, formatting).
- Put feature-specific types/interfaces into `model/types.ts`.
- Do not duplicate utility functions; reuse them across hooks and components.

5. State and effects

- Prefer local state inside custom hooks.
- Use `useEffect` only in hooks or container components, not in low-level dumb components.
- When you add new stateful behavior:
  - First consider adding it to an existing hook.
  - If it grows, extract a new hook.

6. General coding guidelines

- Use modern React with functional components and hooks. Never introduce class-based components.
- Keep behavior backwards compatible when refactoring.
- Preserve existing CSS classes and visual design unless explicitly asked to change UI.
- Favor small, composable units:
  - short functions,
  - small components,
  - single-responsibility hooks.

WHEN IMPLEMENTING OR MODIFYING FRONTEND CODE:

- Before writing JSX, think: “Which hook is the model for this UI? Which feature folder does it belong to?”
- If you detect a "God component" that mixes logic and UI, propose or perform a split into:
  - `use<Feature>Model` hook,
  - smaller `ui/` components,
  - `lib/` utilities.

Always explain in your diff or comments how the changes align with these architecture rules.
