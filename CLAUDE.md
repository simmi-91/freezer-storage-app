# Freezer Storage Web App

## Description

A web application to manage and track the contents of a home freezer. Users can add, edit, remove, and search items stored in their freezer, with tracking for categories, quantities, and expiry dates.

## Tech Stack

| Layer              | Technology                                       |
| ------------------ | ------------------------------------------------ |
| Frontend           | React 19 + TypeScript via Vite                   |
| Package Manager    | pnpm                                             |
| Backend (Phase 2)  | Node.js + Express + TypeScript                   |
| Database (Phase 2) | MySQL 8.x via `mysql2` (connection pool, no ORM) |

## Current Status

**Phase 1D — Dashboard** (complete)

## Roadmap

### Phase 1A — Project Setup & Data Model (complete)

-   [x] Initialize Vite + React + TypeScript project
-   [x] Define TypeScript interfaces (`FreezerItem`, `Category`, `FreezerItemFormData`, `ViewMode`)
-   [x] Create `useItems` hook with CRUD, search, and filter logic
-   [x] Create `SearchBar` and `CategoryFilter` components
-   [x] Add `localStorage` persistence to `useItems` hook
-   [x] Add `utils/dates.ts` with expiry status helpers
-   [x] Create mock dataset
-   [x] Clean up Vite boilerplate (`App.tsx`, `main.tsx`, `index.html`)

### Phase 1B — Core UI Components (complete)

-   [x] `App.tsx` — layout shell with header, view switching via `ViewMode`, hook wiring
-   [x] `ItemList` — renders filtered/sorted item grid with SearchBar and CategoryFilter
-   [x] `ItemCard` — single item display with name, category tag, quantity, expiry color badge, edit/remove buttons
-   [x] `ItemForm` — single form component for both add and edit (modal or inline); auto-select expiry date from category shelf life (max months)
-   [x] `ShelfLifeTable` — reference table showing recommended freezer storage times per category
-   [x] `SortControl` — dropdown to sort by name, date added, expiry date
-   [x] Basic CSS stylesheet — card layout, responsive grid, color-coded expiry badges
-   [x] Empty states — no items, no search results

### Phase 1C — Polish & Validation (complete)

-   [x] Form validation (required fields: name, category, quantity, unit, expiry date; `dateAdded` is optional)
-   [x] Expiry date shortcuts in form ("3 months", "6 months", "1 year" buttons)
-   [x] Responsive layout (breakpoint at 768px, single column on mobile)
-   [x] Basic accessibility (`aria-label`, `aria-pressed`, semantic HTML, focus indicators)
-   [x] Back-button support via `history.pushState` / `popstate`
-   [x] Only show categories that have items in CategoryFilter

### Phase 1D — Dashboard (complete)

-   [x] `Dashboard` component — stats summary, expiring-soon list, category breakdown
-   [x] Make dashboard the landing page, item list as second view
-   [x] Sidebar navigation (desktop) / bottom tabs (mobile)

### Phase 2 — Backend & Database

-   [ ] Express server with `mysql2` connection pool
-   [ ] REST API endpoints (`/api/items`) — CRUD
-   [ ] MySQL table schema (CREATE TABLE IF NOT EXISTS, no migrations tool)
-   [ ] Vite proxy config for `/api` -> `http://localhost:3001`
-   [ ] Swap `useItems` from localStorage to fetch calls
-   [ ] Add loading/error states to components
-   [ ] Delete mock data

## Data Model

### FreezerItem

```typescript
export interface FreezerItem {
    id: number; // Auto-increment (Phase 1: in-memory counter, Phase 2: MySQL AUTO_INCREMENT)
    name: string; // Required
    category: Category; // From CATEGORIES const
    quantity: number; // Units or count
    unit: string; // e.g. "pcs", "kg", "bags"
    dateAdded: string; // ISO date (YYYY-MM-DD) or "" if unknown
    expiryDate: string; // ISO date (YYYY-MM-DD) — best-before / use-by
    notes: string; // Optional free-text
}
```

### FreezerItemFormData

```typescript
export type FreezerItemFormData = {
    name: string;
    category: Category;
    quantity: string; // String in form, parsed to number on submit
    unit: string;
    dateAdded: string; // ISO date string or ""
    expiryDate: string; // ISO date string or ""
    notes: string;
};
```

### ViewMode (UI state)

```typescript
type ViewMode = { kind: "list" } | { kind: "add" } | { kind: "edit"; itemId: number };
```

### Default Categories

Meat, Poultry, Seafood, Vegetables, Fruit, Bread & Bakery, Prepared Meals, Dairy, Other

### Freezer Shelf Life by Category

This table should be displayed in the UI (e.g. as a reference section or tooltip). The `max` value is used to auto-select the expiry date when a category is chosen in the form.

| Category       | Shelf Life  | Auto-select (max) |
| -------------- | ----------- | ------------------ |
| Meat           | 6–12 months | 12 months          |
| Poultry        | 9–12 months | 12 months          |
| Seafood        | 2–6 months  | 6 months           |
| Vegetables     | 8–12 months | 12 months          |
| Fruit          | 6–12 months | 12 months          |
| Bread & Bakery | 2–3 months  | 3 months           |
| Prepared Meals | 2–3 months  | 3 months           |
| Dairy          | 3–6 months  | 6 months           |
| Other          | 3–6 months  | 6 months           |

### Expiry Color Coding

| Condition               | Color            | Label               |
| ----------------------- | ---------------- | ------------------- |
| Expired (past today)    | Red (#DC2626)    | "Expired"           |
| Expiring within 7 days  | Orange (#F59E0B) | "Expires in X days" |
| Expiring within 14 days | Yellow (#EAB308) | "Expires in X days" |
| More than 14 days       | Green (#22C55E)  | "Good until [date]" |

## Project Structure

```
├── CLAUDE.md
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── App.css
│       ├── types/
│       │   └── index.ts          # FreezerItem, Category, FormData, ViewMode
│       ├── data/
│       │   └── mock-items.ts     # Mock dataset for Phase 1
│       ├── components/
│       │   ├── ItemList.tsx
│       │   ├── ItemCard.tsx
│       │   ├── ItemForm.tsx       # Single form for add + edit
│       │   ├── SortControl.tsx
│       │   ├── CategoryFilter.tsx
│       │   └── SearchBar.tsx
│       ├── hooks/
│       │   └── useItems.ts       # CRUD + localStorage persistence
│       └── utils/
│           └── dates.ts          # Expiry status, date formatting
├── server/                       # Phase 2
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── lib/
│       │   ├── database.ts
│       │   └── init-db.ts
│       └── routes/
│           └── items.ts
└── .env                          # Phase 2 — DB credentials (not committed)
```

## Development Commands

```bash
# Install dependencies
cd client && pnpm install

# Run client dev server
cd client && pnpm dev
# Runs on http://localhost:5173

# Type-check
cd client && pnpm tsc --noEmit
```

## Coding Conventions

-   TypeScript strict mode
-   React function components with hooks
-   No class components
-   Use `fetch` for API calls (Phase 2) — no extra HTTP libraries
-   Keep components focused and small
-   Single `ItemForm` component for both add and edit
-   `useItems` hook is the data access abstraction — components never touch storage directly
-   All dates as ISO 8601 strings (YYYY-MM-DD) in both frontend and API responses
-   IDs are auto-increment integers (`number`) in both Phase 1 and Phase 2 (MySQL `INT AUTO_INCREMENT`)
-   CSS custom properties for color palette
-   System font stack, no CSS framework
-   Semantic HTML (`<main>`, `<nav>`, `<header>`) with basic ARIA attributes

## Explicit Non-Goals (Do NOT Build)

-   User authentication / multi-user support
-   Multiple freezer support
-   Barcode scanning
-   Meal planning / recipe integration
-   Shopping list generation
-   Push notifications / email alerts
-   Data export / import
-   Dark mode
-   Undo/redo history (confirmation dialogs are sufficient)
-   Toast notification system
-   Charting libraries
-   Quick-add shortcut form (one form is enough)
-   Batch select / bulk operations

## Agent Team Guidelines

This project uses `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` for coordinated multi-agent development.

### Team Structure

| Role     | Name       | Type            | Responsibility                                                            |
| -------- | ---------- | --------------- | ------------------------------------------------------------------------- |
| Lead     | `lead`     | general-purpose | Coordinates tasks, reviews integration, updates CLAUDE.md                 |
| Frontend | `frontend` | general-purpose | All work inside `client/` — components, hooks, styling, mock data         |
| Backend  | `backend`  | general-purpose | All work inside `server/` — Express routes, database, API logic (Phase 2) |

### Team Rules

1. **Ownership boundaries** — `frontend` only modifies files under `client/`. `backend` only modifies files under `server/`. Shared files (`CLAUDE.md`) are modified only by `lead`.
2. **Task list is the source of truth** — All work must be tracked as tasks. Agents check `TaskList` after completing each task.
3. **No overlapping work** — Agents must claim a task via `TaskUpdate` before starting.
4. **Shared types** — `FreezerItem` in `client/src/types/index.ts` is the canonical data model. Changes coordinated by `lead`.
5. **Communication** — Use `SendMessage` for all inter-agent communication.
6. **Verify before completing** — Run `pnpm tsc --noEmit` before marking a task done.

### Phase 1 Note

The `backend` agent is **not needed** in Phase 1. Only `lead` and `frontend` participate.

## Decisions Log

| Date       | Decision                                                 | Rationale                                                                 |
| ---------- | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| 2026-02-12 | Use `mysql2` connection pool instead of Prisma           | Match existing project patterns, keep things simple                       |
| 2026-02-12 | Phase 1 frontend-only with mock data                     | Validate UI/UX before building backend                                    |
| 2026-02-12 | pnpm as package manager                                  | User preference                                                           |
| 2026-02-12 | No router in Phase 1; use `ViewMode` discriminated union | App has 2-3 views, router is overkill; use pushState for back button      |
| 2026-02-12 | localStorage persistence in Phase 1                      | Without it the app resets on refresh — unusable                           |
| 2026-02-12 | Single `ItemForm` for add + edit                         | Forms are identical except pre-fill; avoids duplication                   |
| 2026-02-12 | Skip `frozenDate` field                                  | `dateAdded` is sufficient; user can manually adjust date                  |
| 2026-02-12 | Dashboard deferred to Phase 1D                           | Item list with expiry colors answers core use cases; dashboard is stretch |
| 2026-02-12 | Skip batch operations, toast+undo, quick-add             | Over-engineering for a 10-30 item home freezer app                        |
| 2026-02-12 | Props over Context for Phase 1                           | Shallow component tree; revisit if drilling gets painful                  |
| 2026-02-12 | ~~UUID IDs in both phases~~ → Auto-increment `number` IDs | Simpler; MySQL AUTO_INCREMENT in Phase 2, in-memory counter in Phase 1    |
| 2026-02-12 | All dates as ISO 8601 (YYYY-MM-DD) strings               | Contract for frontend-backend compatibility in Phase 2                    |
| 2026-02-12 | `dateAdded` is optional (empty string if unknown)        | Many existing freezer items have unknown add dates                        |
| 2026-02-12 | Auto-select expiry date from category shelf life (max)   | Reduces friction; user picks category → expiry pre-filled                 |
| 2026-02-12 | Show freezer shelf life reference table in UI            | Helps users understand recommended storage times                          |

## Planning Documents

Full planning analysis available in `.planning/`:

-   `.planning/ux-design.md` — UX flows, component hierarchy, layout recommendations
-   `.planning/tech-architecture.md` — Data model, state management, TypeScript patterns
-   `.planning/devils-advocate.md` — Risks, cuts, simplifications
