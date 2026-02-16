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
