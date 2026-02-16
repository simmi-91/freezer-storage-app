# Technical Architecture: Freezer Storage Web App

## 1. Data Model Review & Improvements

### Current `FreezerItem` Interface

```ts
export interface FreezerItem {
  id: number;          // Auto-increment (in-memory counter Phase 1, MySQL AUTO_INCREMENT Phase 2)
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  dateAdded: string;   // ISO date string or "" if unknown
  expiryDate: string;
  notes: string;
}
```

### Recommended Changes for Phase 1

**Keep as-is (good decisions):**
- `id: number` — auto-increment integer. Simple, matches MySQL AUTO_INCREMENT in Phase 2. Phase 1 uses an in-memory counter.
- `quantity: number` + `unit: string` — sufficient for a home freezer app. Edge cases (fractional quantities, "half a bag") are handled naturally by `number`. Free-text `unit` is pragmatic; a strict enum would frustrate users who have unconventional units.
- `notes: string` — good catch-all field.
- `category: Category` — the `as const` + derived type pattern is already the best approach (see section 5).

**Recommended additions:**

```ts
export interface FreezerItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  dateAdded: string;       // ISO date string — when the item was logged
  frozenDate: string;      // ISO date string — when the item was actually frozen
  expiryDate: string;      // ISO date string
  notes: string;
}
```

- **`frozenDate`**: Distinct from `dateAdded`. A user might add a batch-cooked meal to the app a day after freezing it. The frozen date is what matters for food safety; `dateAdded` is bookkeeping. Make it optional in the form (default to `dateAdded` if omitted) but store both.

**Deferred to later / not recommended:**

- **Location/shelf/drawer**: Skip for Phase 1. Most home freezers have 1-3 compartments; this adds form complexity without much payoff for a single-user app. Can be added as an optional field later if users request it.
- **Image URL**: Skip. Adds significant UX complexity (upload flow, storage) for minimal benefit in a text-list app. A good name + notes is sufficient.
- **Priority/favorite flag**: Skip. A freezer tracker is not a task manager. Sorting by expiry date already surfaces "use soon" items. If needed later, a simple `starred: boolean` field is trivial to add.

### ID Strategy

**Phase 1**: In-memory auto-increment counter in `useItems.ts`. Starts at `max(existing IDs) + 1`.

**Phase 2**: MySQL `INT AUTO_INCREMENT` primary key. The frontend sends `Omit<FreezerItem, "id">` to the API, the server returns the created item with its assigned `id: number`.

**Decision**: Auto-increment integer IDs in both phases. Simpler than UUIDs, natural fit for MySQL, and numeric IDs are more readable in debugging.

### dateAdded is Optional

Many items already exist in the freezer with an unknown date of when they were added. `dateAdded` accepts `""` (empty string) to represent "unknown". The form should not require this field. Display should show "Unknown" or similar when `dateAdded` is empty.

### Expiry Auto-Select from Category

When the user selects a category in the form, the expiry date is automatically set to today + the max shelf life months for that category (from `CATEGORY_SHELF_LIFE`). The user can still manually override the date. This reduces friction significantly — the most common adjustment is "use the recommended max".

### Category Type

**Keep the current approach.** The `as const` array + derived union type is the idiomatic TypeScript pattern:

```ts
export const CATEGORIES = ["Meat", "Poultry", ...] as const;
export type Category = (typeof CATEGORIES)[number];
```

This gives us:
- A runtime array for rendering UI (filter buttons, dropdowns)
- A compile-time union type for type safety
- Single source of truth (no enum/array sync issues)

A separate enum would add nothing and lose the runtime iterable array.

---

## 2. State Management Strategy

### Recommendation: Keep `useState` in a Custom Hook (Current Approach)

**Why not useReducer?** The current state shape is flat: a list of items plus two filter values. There are no complex state transitions, no dependent updates, no action sequences. `useReducer` is warranted when state updates have complex logic or when you want to decouple dispatch from components — neither applies here.

**Why not React Context?** Context is for *sharing state across distant parts of the component tree without prop drilling*. This app has a shallow component tree: `App` -> `Dashboard`/`ItemList`/`Form`. Passing props down 1-2 levels is straightforward and more explicit. Context would add indirection without solving a real problem.

**When to reconsider**: If the app grows to have deeply nested components that all need item state (unlikely for Phase 1), lift to Context at that point. The refactor from hook-at-top to Context-provider is small.

### Review of `useItems.ts`

The existing hook is well-structured. Specific observations:

**Good:**
- `useMemo` on filtered items is correct — avoids recomputing on every render.
- CRUD functions use functional `setItems(prev => ...)` form, which is safe for concurrent updates.
- `Omit<FreezerItem, "id">` for `addItem` is the right signature.
- `Partial<Omit<FreezerItem, "id">>` for `updateItem` allows partial edits.

**Suggested improvements:**

1. **Expose `getItemById`**: Components displaying item detail or pre-filling an edit form will need this.

```ts
function getItemById(id: number): FreezerItem | undefined {
  return items.find((item) => item.id === id);
}
```

2. **Sort order**: Add a `sortBy` state or at minimum a default sort (e.g., by `expiryDate` ascending, so soon-to-expire items appear first). This is a natural expectation for a freezer tracker.

3. **Counts by category**: The Dashboard will need summary stats. Add a derived value:

```ts
const categoryCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }
  return counts;
}, [items]);
```

### Mock-to-API Transition (State Layer)

The current `useState(mockItems)` initialization is the key seam. In Phase 2, replace it with:

```ts
const [items, setItems] = useState<FreezerItem[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("/api/items").then(r => r.json()).then(data => {
    setItems(data);
    setLoading(false);
  });
}, []);
```

The CRUD functions change from local state mutations to `fetch` calls that then refresh state. The hook's *external API* (what it returns to components) stays identical. This is the main benefit of the hook pattern.

---

## 3. Routing

### Recommendation: No Router for Phase 1

**Rationale:**
- The app has 2-3 "views": item list (with filters), add/edit form, and optionally a dashboard summary. These are better modeled as UI *modes* within a single page than as separate routes.
- A single-page layout with conditional rendering (e.g., `viewMode` state) is simpler, has zero dependencies, and matches the app's complexity.
- react-router adds ~15KB gzipped, a dependency to maintain, and concepts (loaders, outlets, nested routes) that are overkill here.

**Implementation pattern:**

```ts
type ViewMode =
  | { kind: "list" }
  | { kind: "add" }
  | { kind: "edit"; itemId: number }
  | { kind: "detail"; itemId: number };

const [viewMode, setViewMode] = useState<ViewMode>({ kind: "list" });
```

This discriminated union (see section 5) gives type-safe navigation without a router.

**When to add a router**: If Phase 2 introduces features that genuinely benefit from URL-addressable pages (shareable links, back-button navigation between views), add react-router then. The refactor is straightforward since view modes map cleanly to routes.

---

## 4. Project Structure & File Organization

### Current Structure Assessment

The current structure is clean and appropriate for Phase 1. Specific notes:

```
client/src/
  components/     # UI components — good
  types/          # Shared types — good
  data/           # Mock data — good, easy to remove in Phase 2
  hooks/          # Custom hooks — good
```

### Recommended Additions

```
client/src/
  components/
    SearchBar.tsx
    CategoryFilter.tsx
    Dashboard.tsx        # (to be built)
    ItemList.tsx         # (to be built)
    ItemCard.tsx         # (to be built)
    AddItemForm.tsx      # (to be built)
    EditItemForm.tsx     # (to be built)
  types/
    index.ts
  data/
    mock-items.ts
  hooks/
    useItems.ts
  utils/                 # NEW — shared utility functions
    dates.ts             # Date formatting, expiry calculations
  App.tsx
  App.css
  main.tsx
```

**Key points:**
- **`utils/`** folder for pure helper functions (date formatting, expiry status calculation). These will be used by multiple components.
- **Do not create a `services/` or `api/` layer yet.** In Phase 1, all data access is in `useItems.ts`. When Phase 2 arrives, create `services/api.ts` with fetch wrappers and call those from the hook. Adding the abstraction now is premature.
- **Do not split components into subfolders** (e.g., `components/ItemList/index.tsx`). The app has ~7 components. Flat is fine.
- **Keep `AddItemForm` and `EditItemForm` as separate components** rather than a generic `ItemForm`. They will likely diverge (edit has delete button, pre-filled values, different validation). If they share logic, extract a `useItemForm` hook, not a shared component.

---

## 5. TypeScript Patterns

### Form State Types

When adding or editing an item, the form state differs from `FreezerItem`:
- No `id` yet (when adding)
- Fields may be empty/incomplete during editing
- Dates might be empty strings before the user fills them

**Recommended approach:**

```ts
/** Form state for creating or editing a freezer item. */
export type FreezerItemFormData = {
  name: string;
  category: Category;
  quantity: string;       // string in the form, parsed to number on submit
  unit: string;
  frozenDate: string;     // ISO date string or ""
  expiryDate: string;     // ISO date string or ""
  notes: string;
};
```

Key decisions:
- `quantity` is `string` in the form (HTML inputs produce strings) and converted to `number` on submission. This avoids `NaN` issues during typing.
- All fields are required in the type but may be empty strings. Validation happens on submit, not at the type level — keep the type simple.
- This type works for both add and edit forms. For edit, pre-populate from the existing item. For add, start with defaults.

**Default form state factory:**

```ts
export function emptyFormData(): FreezerItemFormData {
  return {
    name: "",
    category: "Other",
    quantity: "1",
    unit: "pcs",
    frozenDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    notes: "",
  };
}

export function formDataFromItem(item: FreezerItem): FreezerItemFormData {
  return {
    name: item.name,
    category: item.category,
    quantity: String(item.quantity),
    unit: item.unit,
    frozenDate: item.frozenDate,
    expiryDate: item.expiryDate,
    notes: item.notes,
  };
}
```

### Discriminated Unions for UI State

As shown in the routing section:

```ts
type ViewMode =
  | { kind: "list" }
  | { kind: "add" }
  | { kind: "edit"; itemId: number }
  | { kind: "detail"; itemId: number };
```

This pattern ensures that `itemId` is only accessible when the mode requires it, preventing bugs like accessing a nonexistent item ID in "add" mode.

### Strict Typing for Categories

Already well-handled by the existing `as const` pattern. No changes needed. The `Category` type is a union of string literals, which gives autocomplete and compile-time checking while remaining a plain string at runtime.

---

## 6. Mock-to-API Migration Path

### Recommendation: Keep It Simple Now, Refactor Minimally Later

**Do NOT create a data access abstraction layer for Phase 1.** Here's why:
- The only consumer of data is `useItems.ts`.
- An abstraction layer (interface + mock implementation + future API implementation) is classic over-engineering for an app with one hook and one data source.
- The migration cost without an abstraction is small: modify ~5 functions in one file.

### Migration Plan (Phase 1 -> Phase 2)

**What changes:**

1. `useItems.ts` — replace `useState(mockItems)` with `useState([])` + `useEffect` fetch. Replace local CRUD with fetch + state refresh.
2. Delete `data/mock-items.ts`.
3. Add `vite.config.ts` proxy for `/api` -> `http://localhost:3001`.
4. Optionally create `services/api.ts` with typed fetch wrappers if the fetch logic gets repetitive.

**What stays the same:**

- The hook's return type and public API.
- All components that consume the hook.
- All types in `types/index.ts` (server will use the same shape).

**Estimated migration effort**: Modify 2 files (`useItems.ts`, `vite.config.ts`), delete 1 file (`mock-items.ts`), optionally add 1 file (`services/api.ts`). This is roughly 30 minutes of work for a competent developer.

### The Hook Pattern IS the Abstraction

The key insight is that `useItems()` already serves as the data access abstraction. Components call `addItem()`, `deleteItem()`, etc. — they don't know or care whether those operations hit local state or a REST API. This is sufficient. An additional interface/implementation layer would be redundant.

---

## Summary of Key Recommendations

| Decision | Recommendation | Rationale |
|---|---|---|
| Data model additions | Add `frozenDate` only | Practical food-safety value; everything else is YAGNI |
| State management | Keep `useState` in `useItems` hook | Flat state, shallow tree, simplest solution that works |
| Routing | No router; discriminated union `ViewMode` | App has 2-3 views, no URL-addressable pages needed |
| Project structure | Add `utils/` folder; keep flat components | Minimal additions for Phase 1 needs |
| Form types | Separate `FreezerItemFormData` with string quantity | Clean separation of form state from domain model |
| API migration abstraction | None; `useItems` hook IS the abstraction | One file to change; abstraction layer would be premature |
| ID strategy | Auto-increment `number` in both phases | Simple, matches MySQL AUTO_INCREMENT |
| Categories | Keep `as const` array pattern | Already idiomatic; no changes needed |

---

## 7. Phase 1D — Dashboard Technical Specification

### Overview

The Dashboard is a stats-summary landing page that shows freezer contents at a glance: total items, expiring-soon alerts, and a category breakdown. The item list becomes a secondary view accessible via navigation. No charting libraries — all visualizations are built with plain HTML/CSS.

### ViewMode Updates

Add `"dashboard"` to the existing `ViewMode` discriminated union in `client/src/types/index.ts`:

```ts
export type ViewMode =
  | { kind: "dashboard" }
  | { kind: "list" }
  | { kind: "add" }
  | { kind: "edit"; itemId: number }
  | { kind: "photo" };
```

The default view changes from `{ kind: "list" }` to `{ kind: "dashboard" }`. Update the initial state in `App.tsx` and the `history.replaceState` call accordingly.

### New Components

#### `Dashboard.tsx`

A single component that receives items and navigation callbacks as props. No internal state beyond what's derived from props.

**Props:**

```ts
interface DashboardProps {
  items: FreezerItem[];
  onNavigateToList: () => void;
  onNavigateToAdd: () => void;
  onViewExpiring: () => void;
}
```

**Sections (top to bottom):**

1. **Summary stats row** — three stat cards displayed in a horizontal row:
   - Total items (count of `items`)
   - Expiring soon (count of items where `getExpiryStatus` returns `"expired"`, `"expiring-soon-7"`, or `"expiring-soon-14"`)
   - Categories in use (count of distinct `item.category` values)

2. **Expiring soon list** — a compact list of items expiring within 14 days or already expired, sorted by expiry date ascending (most urgent first). Each row shows: item name, category tag, expiry badge (reuse existing badge CSS classes), and quantity. Maximum 5 items shown with a "View all" link that navigates to the item list (optionally pre-filtered, but a simple navigation to list view is sufficient for Phase 1D). If no items are expiring, show a short "All items are fresh" message.

3. **Category breakdown** — a simple list/table showing each category that has items, with the item count per category. Sorted by count descending. Each row shows the category name and count. Use a simple horizontal bar (CSS `width` percentage of the max count) for a lightweight visual indicator — no charting library needed.

**Rendering logic is pure derivation from `items` prop — no `useMemo` needed unless profiling shows a bottleneck (unlikely with 10-30 items).**

#### `Navigation.tsx`

A navigation component that renders differently based on viewport:
- **Desktop (>768px):** A left sidebar with icon-less text links: "Dashboard", "Items", "Add Item". Fixed position, 200px wide. The main content area shifts right.
- **Mobile (<=768px):** A bottom tab bar with two tabs: "Dashboard" and "Items". Fixed to the bottom of the viewport. The "Add Item" button remains in the header.

**Props:**

```ts
interface NavigationProps {
  currentView: ViewMode["kind"];
  onNavigate: (mode: ViewMode) => void;
}
```

The active link/tab is highlighted using the existing `--color-primary` CSS custom property.

### Data Flow

No changes to `useItems` hook. The Dashboard derives all its data from `allItems` (the unfiltered items array already exposed by the hook). Computed values:

```ts
// In Dashboard component body (or inline in JSX):
const totalCount = items.length;

const expiringItems = items
  .filter((item) => {
    const status = getExpiryStatus(item.expiryDate);
    return status.status !== "good";
  })
  .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

const expiringCount = expiringItems.length;

const categoryCounts: { category: Category; count: number }[] = [];
const countMap = new Map<Category, number>();
for (const item of items) {
  countMap.set(item.category, (countMap.get(item.category) || 0) + 1);
}
for (const [category, count] of countMap) {
  categoryCounts.push({ category, count });
}
categoryCounts.sort((a, b) => b.count - a.count);
```

No new utility functions are needed — `getExpiryStatus` and `daysUntil` from `utils/dates.ts` already cover all expiry logic. The `formatDate` function is available for display.

### App.tsx Integration

The `App.tsx` component changes:

1. **Default view:** `useState<ViewMode>({ kind: "dashboard" })` instead of `{ kind: "list" }`.
2. **Navigation component:** Render `<Navigation>` outside the view-switching block so it's always visible.
3. **Dashboard rendering:** Add a `viewMode.kind === "dashboard"` branch that renders `<Dashboard>`.
4. **Layout wrapper:** The main content area needs a CSS class that accounts for the sidebar on desktop.
5. **History state:** Update `history.replaceState` to use `{ kind: "dashboard" }` as the initial state.

```tsx
// Simplified App.tsx structure:
return (
  <>
    <header className="app-header">
      <div className="app-container">
        <h1>Freezer Tracker</h1>
        {/* Add Item button visible on list and dashboard views */}
        {(viewMode.kind === "list" || viewMode.kind === "dashboard") && (
          <button className="btn btn-primary" onClick={() => navigate({ kind: "add" })}>
            + Add Item
          </button>
        )}
      </div>
    </header>

    <Navigation currentView={viewMode.kind} onNavigate={navigate} />

    <main className="app-main app-main--with-nav">
      <div className="app-container">
        {viewMode.kind === "dashboard" && (
          <Dashboard
            items={allItems}
            onNavigateToList={() => navigate({ kind: "list" })}
            onNavigateToAdd={() => navigate({ kind: "add" })}
            onViewExpiring={() => navigate({ kind: "list" })}
          />
        )}
        {viewMode.kind === "list" && (
          <>
            <ItemList ... />
            <ShelfLifeTable />
          </>
        )}
        {/* ...other views unchanged */}
      </div>
    </main>
  </>
);
```

### Navigation State Management

The existing `pushState`/`popstate` pattern continues to work. Each `navigate()` call pushes a history entry. The `handlePopState` listener already handles arbitrary `ViewMode` values from `event.state`, so no changes needed to the history management logic — it will automatically handle `{ kind: "dashboard" }` states.

One consideration: when navigating from Dashboard to List and pressing back, the user returns to Dashboard. This is the correct behavior.

### CSS Architecture

All new styles go in `App.css` (no new CSS files). New class names follow the existing BEM-like conventions.

#### Navigation styles

```css
/* --- Navigation --- */
.nav-sidebar {
  display: none;  /* Hidden on mobile by default */
}

.nav-bottom {
  display: none;  /* Hidden on desktop by default */
}

/* Desktop: sidebar */
@media (min-width: 769px) {
  .nav-sidebar {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 200px;
    padding-top: 72px;  /* Below header */
    background-color: var(--color-surface);
    border-right: 1px solid var(--color-border);
    z-index: 5;
  }

  .nav-link {
    display: block;
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
    text-decoration: none;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: background-color var(--transition-fast), color var(--transition-fast);
  }

  .nav-link:hover {
    background-color: var(--color-bg);
    color: var(--color-text);
  }

  .nav-link--active {
    color: var(--color-primary);
    background-color: var(--color-primary-light);
    font-weight: 600;
  }

  /* Shift main content right for sidebar */
  .app-header,
  .app-main--with-nav {
    margin-left: 200px;
  }
}

/* Mobile: bottom tabs */
@media (max-width: 768px) {
  .nav-bottom {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--color-surface);
    border-top: 1px solid var(--color-border);
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
    z-index: 10;
  }

  .nav-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-sm) 0;
    min-height: 52px;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
    background: none;
    border: none;
    cursor: pointer;
  }

  .nav-tab--active {
    color: var(--color-primary);
    font-weight: 600;
  }

  /* Add bottom padding to main content so it's not hidden behind tab bar */
  .app-main--with-nav {
    padding-bottom: 64px;
  }
}
```

#### Dashboard styles

```css
/* --- Dashboard --- */
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.stat-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  text-align: center;
}

.stat-card-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
}

.stat-card-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);
}

/* Highlight the "expiring soon" stat card when count > 0 */
.stat-card--warning .stat-card-value {
  color: var(--color-expiring-soon);
}

.dashboard-section {
  margin-bottom: var(--space-lg);
}

.dashboard-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.dashboard-section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.dashboard-section-link {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.dashboard-section-link:hover {
  text-decoration: underline;
}

/* Expiring soon list */
.expiring-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.expiring-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.expiring-row-name {
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expiring-row-qty {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* Category breakdown */
.category-breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.category-breakdown-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.category-breakdown-name {
  width: 120px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  flex-shrink: 0;
}

.category-breakdown-bar {
  flex: 1;
  height: 20px;
  background-color: var(--color-bg);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.category-breakdown-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: var(--radius-sm);
  transition: width var(--transition-base);
}

.category-breakdown-count {
  width: 32px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-align: right;
  flex-shrink: 0;
}

/* Dashboard responsive */
@media (max-width: 768px) {
  .dashboard-stats {
    grid-template-columns: 1fr;
  }

  .category-breakdown-name {
    width: 90px;
  }
}
```

### File Changes Summary

| File | Change |
|------|--------|
| `client/src/types/index.ts` | Add `{ kind: "dashboard" }` to `ViewMode` union |
| `client/src/components/Dashboard.tsx` | **New file** — Dashboard component |
| `client/src/components/Navigation.tsx` | **New file** — Sidebar/bottom-tab navigation |
| `client/src/App.tsx` | Default view to `dashboard`, render Navigation and Dashboard, add `app-main--with-nav` class |
| `client/src/App.css` | Add navigation and dashboard CSS classes |

### Accessibility

- Navigation uses `<nav>` element with `aria-label="Main navigation"`
- Active nav link/tab uses `aria-current="page"`
- Stat cards use semantic headings or `aria-label` for screen readers
- Expiring soon list uses `<ul>` with `<li>` elements
- Bottom tab bar buttons have descriptive `aria-label` attributes
- All interactive elements maintain existing focus-visible styles

### What NOT to Build

Per CLAUDE.md explicit non-goals, the Dashboard must NOT include:
- Charts or graphing (use simple CSS bars for category breakdown)
- Data export buttons
- Notification/alert system
- Batch operations from the dashboard
- Dark mode toggle in navigation
