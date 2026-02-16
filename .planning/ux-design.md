# UX Design: Freezer Storage Web App

## 1. Screens & Views

The app uses a **single-page layout** with four logical views managed by React state (`ViewMode`). No routing library -- views switch via `ViewMode` discriminated union plus `history.pushState` for back-button support.

### 1.1 Dashboard (default landing view)

The landing screen. Shows at-a-glance stats and highlights items that need attention.

| Section                | Content                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **Total items**        | Count of all items currently tracked                                                |
| **Expiring soon**      | Items with expiry within 14 days, sorted soonest-first. Red badge count.            |
| **Expired**            | Items already past expiry date. Shown separately so the user can decide to discard. |
| **Category breakdown** | Simple pill list showing count per category (e.g. "Meat: 3, Seafood: 2")            |

### 1.2 Item List (browse / search view)

Full inventory view with search, filter, and sort controls.

-   **SearchBar** (already built) at the top
-   **CategoryFilter** (already built) as horizontal pill/tab bar below search
-   **Sort control**: dropdown to sort by name, date added, expiry date, category
-   **Item cards** displayed in a responsive grid (2-3 columns on desktop, 1 on mobile)
-   Each card shows: name, category tag, quantity + unit, expiry date with color indicator, and action buttons (edit, remove)

### 1.3 Add / Edit Item Form

A single form component used for both adding and editing.

-   **Fields**: name (text), category (select from CATEGORIES), quantity (number), unit (text with common suggestions: pcs, bags, kg), date added (date, defaults to today), expiry date (date), notes (textarea, optional)
-   Full-screen overlay on mobile, centered modal on desktop (already implemented)
-   Pre-filled when editing an existing item
-   "Save" and "Cancel" buttons at the bottom
-   Minimal required fields: name, category, quantity, unit, expiry date

### 1.4 Photo Capture (already implemented)

Scan food items via photo upload for AI-assisted identification.

---

## 2. User Flows

### 2.1 Adding a New Item (primary flow -- minimize friction)

1. User clicks the prominent **"+ Add Item"** button (visible in header on both dashboard and list views)
2. Form opens with sensible defaults:
    - Date added = today
    - Quantity = 1
    - Unit = "pcs"
3. User types name, selects category, adjusts quantity/unit if needed, sets expiry date
4. User clicks "Save" -- item appears in list, form closes

### 2.2 Finding an Item

1. User clicks "Items" in the sidebar (desktop) or bottom tab (mobile)
2. Types in SearchBar -- filters in real-time by name and notes (already implemented in useItems)
3. Optionally clicks a category pill to narrow results
4. Optionally changes sort order (e.g. "Expiry: soonest first" to find what to use next)

### 2.3 Editing an Item

1. User clicks "Edit" button on an item card (already implemented)
2. Same form opens, pre-populated with current values
3. User modifies fields (common: update quantity after partial use, extend expiry)
4. Clicks "Save" -- item updates in place

**Quick quantity update**: Each item card has a small "-" / "+" stepper on the quantity. Tapping "-" when quantity is 1 prompts "Remove item?" confirmation. (Already implemented)

### 2.4 Removing an Item

1. User clicks "Delete" button on an item card
2. Confirmation dialog: "Remove [item name] from the freezer?"
3. On confirm, item is deleted (already implemented)

### 2.5 Dashboard Interactions

1. User lands on Dashboard (default view)
2. **Expiring Soon stat card** -- clicking navigates to Item List sorted by expiry date (soonest first)
3. **Expired stat card** -- clicking navigates to Item List sorted by expiry date (soonest first)
4. **Category breakdown pill** -- clicking navigates to Item List filtered to that category
5. **Expiring-soon list row** -- clicking "Edit" opens the edit form for that item; clicking "Delete" removes with confirmation
6. **"View all items" link** -- navigates to Item List

---

## 3. Dashboard Design

### 3.1 Stats Summary (top row, 3 cards)

Displayed as a horizontal row of stat cards at the top of the dashboard. Each card uses the existing `.card` style with a large number and descriptive label.

| Stat              | Display                                          | Click action                              |
| ----------------- | ------------------------------------------------ | ----------------------------------------- |
| **Total items**   | Large number + "items in freezer"                | Navigate to Item List (no filter)         |
| **Expiring soon** | Count + orange/red badge, "within 14 days"       | Navigate to Item List, sort by expiryDate |
| **Expired**       | Count + red badge, "past expiry"                 | Navigate to Item List, sort by expiryDate |

Layout:
- Desktop: 3 cards in a single row, equal width (`grid-template-columns: repeat(3, 1fr)`)
- Mobile: 3 cards in a single row, compressed. Below 480px: stack vertically

Styling:
- Each stat card uses `background-color: var(--color-surface)` with `var(--shadow-sm)` and `var(--radius-md)`
- The large number is `font-size: 2rem; font-weight: 700`
- The label beneath is `font-size: var(--font-size-sm); color: var(--color-text-secondary)`
- Expiring soon card: number uses `color: var(--color-expiring-soon)` (#F59E0B)
- Expired card: number uses `color: var(--color-expired)` (#DC2626)
- Total items card: number uses `color: var(--color-primary)` (#2563EB)
- Cards are clickable -- `cursor: pointer` and hover shows `var(--shadow-md)`

### 3.2 Expiring Soon List

Displayed below the stat cards. Shows items expiring within 14 days AND items already expired, grouped into two sections.

**Section: "Expired" (shown only if expired items exist)**
- Red section header: "Expired" with count badge
- Each row: item name (bold), category tag, "Expired" badge (red), Edit button, Delete button
- Sorted by expiry date (most recently expired first)

**Section: "Expiring Soon" (shown only if expiring items exist)**
- Orange section header: "Expiring Soon" with count badge
- Each row: item name (bold), category tag, expiry badge (color-coded per existing scheme), Edit button, Delete button
- Sorted by expiry date (soonest first)

**Empty state**: If no expired or expiring-soon items, show: "All clear -- nothing expiring soon" with a green checkmark

Row layout:
```
+------------------------------------------------------------------+
| Chicken Breast    [Meat]     Expires in 3 days    [Edit] [Delete] |
+------------------------------------------------------------------+
```

- Desktop: single-line rows with item name, category tag, expiry badge, and action buttons aligned in a flex row
- Mobile: rows wrap -- name + category on first line, expiry badge + actions on second line
- Each row is a `.card`-style element with `padding: var(--space-sm) var(--space-md)`
- Rows have subtle bottom border (`var(--color-border)`) except the last one
- Maximum 10 items shown; if more, show "View all N items" link that navigates to the Item List sorted by expiry

### 3.3 Category Breakdown

Displayed below the expiring-soon list. Shows how many items are in each category.

Layout: horizontal row of category pills (reusing the existing `.category-pill` styling from CategoryFilter), each showing `Category: N` where N is the item count. Categories with 0 items are hidden.

- Clicking a category pill navigates to the Item List view filtered to that category
- Desktop: wrapping flex row
- Mobile: horizontal scroll (same as existing `.category-filter` mobile behavior)
- Section heading: "By Category" in `font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-secondary)`

### 3.4 Dashboard Empty State

When the freezer has zero items:

```
Your freezer is empty

Add your first item to start tracking.

[+ Add Item]
```

- Uses existing `.empty-state` styling
- The "Add Item" button uses `.btn-primary`
- Stat cards still render showing "0" for all values (not hidden)

---

## 4. Layout & Navigation

### 4.1 ViewMode Update

The `ViewMode` discriminated union needs a new `"dashboard"` kind:

```typescript
type ViewMode =
  | { kind: "dashboard" }
  | { kind: "list" }
  | { kind: "add" }
  | { kind: "edit"; itemId: number }
  | { kind: "photo" };
```

The default/initial ViewMode changes from `{ kind: "list" }` to `{ kind: "dashboard" }`.

### 4.2 Layout Structure (Desktop, >= 769px)

```
+---------------------------------------------+
|  Header: App title + "Add Item" button       |
+--------+------------------------------------+
|        |                                    |
| Sidebar|   Main content area                |
| (nav)  |   (Dashboard or Item List)         |
|        |                                    |
+--------+------------------------------------+
```

**Header**: Stays as the existing sticky top bar.
- Left: "Freezer Tracker" title
- Right: "Scan Food" button + "+ Add Item" button (shown on both dashboard and list views)

**Sidebar** (desktop only, >= 769px):
- Fixed to the left, below the header
- Width: 200px
- Background: `var(--color-surface)` with right border `var(--color-border)`
- Contains two nav items as a vertical list:
  1. "Dashboard" (icon: grid/home -- use text-only, no icon library)
  2. "Items" (icon: list -- use text-only, no icon library)
- Active nav item: `background-color: var(--color-primary-light); color: var(--color-primary); font-weight: 600`
- Inactive nav item: `color: var(--color-text-secondary)` with hover `background-color: var(--color-bg)`
- Each nav item is a `<button>` with `role="tab"` and `aria-selected` for accessibility
- Nav items have `padding: var(--space-sm) var(--space-md); border-radius: var(--radius-md)`
- Below the nav items, show item count: "N items total" in `font-size: var(--font-size-sm); color: var(--color-text-muted)`

**Main content**: Shifts right by 200px (sidebar width) on desktop. Uses `margin-left: 200px` or CSS Grid layout.

### 4.3 Layout Structure (Mobile, <= 768px)

```
+---------------------------------------------+
|  Header: App title + "Add Item" button       |
+---------------------------------------------+
|                                             |
|   Main content area                         |
|   (Dashboard or Item List)                  |
|                                             |
+---------------------------------------------+
|  [Dashboard]  [Items]                        |
+---------------------------------------------+
```

**Bottom Tab Bar** (mobile only, <= 768px):
- Fixed to the bottom of the viewport
- Height: 56px (comfortable touch target)
- Background: `var(--color-surface)` with top border `var(--color-border)` and `var(--shadow-sm)` (inverted, shadow goes up)
- Two tabs, evenly spaced: "Dashboard" and "Items"
- Each tab: vertically stacked label text, centered
- Active tab: `color: var(--color-primary); font-weight: 600`
- Inactive tab: `color: var(--color-text-secondary)`
- Tab buttons use `role="tab"` and `aria-selected` for accessibility
- `z-index: 20` to sit above content

**Main content**: Add `padding-bottom: 72px` (56px tab bar + 16px spacing) on mobile to prevent content from being hidden behind the tab bar.

**Header on mobile**: The "+ Add Item" and "Scan Food" buttons remain in the header (no floating action button -- keep it simple).

### 4.4 Responsive Breakpoints

| Breakpoint | Layout behavior                                             |
| ---------- | ----------------------------------------------------------- |
| >= 769px   | Sidebar nav (left) + main content (right), stat cards in row |
| <= 768px   | Bottom tab bar, no sidebar, stat cards in row (compressed)  |
| <= 480px   | Stat cards stack vertically, expiring list rows wrap         |

### 4.5 Navigation State & Back Button

- Navigation between Dashboard and Items is tracked via `ViewMode` and `history.pushState` (already implemented pattern)
- Pressing browser back button navigates between Dashboard <-> Items as expected
- The initial `history.replaceState` should set `{ kind: "dashboard" }` instead of `{ kind: "list" }`
- Add/Edit forms push a new history entry (already works)

---

## 5. Component Hierarchy

```
App
+-- Header
|   +-- AppTitle ("Freezer Tracker")
|   +-- ScanFoodButton (when on dashboard or list view)
|   +-- AddItemButton (when on dashboard or list view)
|
+-- Sidebar (desktop >= 769px)
|   +-- NavButton ("Dashboard", active state)
|   +-- NavButton ("Items", active state)
|   +-- ItemCountLabel ("N items total")
|
+-- BottomTabs (mobile <= 768px)
|   +-- TabButton ("Dashboard", active state)
|   +-- TabButton ("Items", active state)
|
+-- MainContent
|   +-- Dashboard (when viewMode.kind === "dashboard")
|   |   +-- StatsRow
|   |   |   +-- StatCard (total items)
|   |   |   +-- StatCard (expiring soon)
|   |   |   +-- StatCard (expired)
|   |   +-- ExpiringList
|   |   |   +-- SectionHeader ("Expired")
|   |   |   +-- ExpiringRow (per expired item)
|   |   |   +-- SectionHeader ("Expiring Soon")
|   |   |   +-- ExpiringRow (per expiring-soon item)
|   |   +-- CategoryBreakdown
|   |   |   +-- CategoryPill (per category with items)
|   |   +-- DashboardEmptyState (when 0 items)
|   |
|   +-- ItemList (when viewMode.kind === "list")
|   |   +-- SearchBar          (already built)
|   |   +-- CategoryFilter     (already built)
|   |   +-- SortControl        (already built)
|   |   +-- ItemGrid
|   |       +-- ItemCard (per item, already built)
|   |
|   +-- ItemForm (when viewMode.kind === "add" or "edit")
|   |
|   +-- PhotoCapture (when viewMode.kind === "photo")
```

### New Components for Phase 1D

| Component            | Location                              | Responsibility                                           |
| -------------------- | ------------------------------------- | -------------------------------------------------------- |
| `Dashboard`          | `client/src/components/Dashboard.tsx` | Main dashboard view; computes stats, renders sub-sections |
| `StatCard`           | Inline within `Dashboard.tsx`         | Single stat display (number + label), clickable           |
| `ExpiringList`       | Inline within `Dashboard.tsx`         | Lists expired and expiring-soon items with actions        |
| `CategoryBreakdown`  | Inline within `Dashboard.tsx`         | Category pills with counts, clickable                    |
| `Sidebar`            | `client/src/components/Sidebar.tsx`   | Desktop sidebar navigation                               |
| `BottomTabs`         | `client/src/components/BottomTabs.tsx`| Mobile bottom tab navigation                             |

**Note**: `StatCard`, `ExpiringList`, and `CategoryBreakdown` can be defined as local components within `Dashboard.tsx` rather than separate files, since they are only used there. Keep it simple.

### Data Flow

-   `useItems` hook lives at the `App` level and provides all state + CRUD functions (unchanged)
-   `App` passes `allItems` to `Dashboard` which derives stats internally
-   `Dashboard` receives callbacks for navigation: `onNavigateToList(category?: Category, sortBy?: SortOption)` and `onEdit(id: number)` and `onDelete(id: number)`
-   Active page (dashboard vs. items) is derived from `viewMode.kind`
-   Sidebar/BottomTabs receive active page and a callback to switch views
-   No global state library needed -- prop drilling is fine for this app size

---

## 6. UX Patterns for Freezer Management

### 6.1 Color-Coded Expiry Warnings

Applied to expiry dates on item cards, dashboard stat cards, and expiring-soon list rows:

| Condition                   | Color            | Label               |
| --------------------------- | ---------------- | ------------------- |
| Expired (past today)        | Red (#DC2626)    | "Expired"           |
| Expiring within 7 days      | Orange (#F59E0B) | "Expires in X days" |
| Expiring within 14 days     | Yellow (#EAB308) | "Expires in X days" |
| More than 14 days remaining | Green (#22C55E)  | "Good until [date]" |

These colors appear as a small badge/dot on item cards and in the expiry text. (Already implemented via `getExpiryStatus()` in `utils/dates.ts`)

### 6.2 Quantity Stepper on Cards

-   Small "- / +" buttons directly on item cards for adjusting quantity without opening the edit form (already implemented in `ItemCard.tsx`)
-   Tapping "-" at quantity 1 triggers a removal confirmation
-   Saves a round-trip to the edit form for the most common update

### 6.3 Smart Defaults

-   "Date added" defaults to today
-   "Quantity" defaults to 1
-   "Unit" defaults to "pcs"
-   Category auto-selects expiry date based on shelf life max
-   These reduce the number of fields the user has to actively fill (already implemented)

### 6.4 Empty States

-   **Dashboard, no items**: "Your freezer is empty" + "Add your first item to start tracking" + Add Item button
-   **Dashboard, no expiring items**: "All clear -- nothing expiring soon" with green accent
-   **Item List, no items**: "Your freezer is empty" + Add Item CTA (already implemented)
-   **Item List, no search results**: "No items match your search" with clear-filter button (already implemented)

### 6.5 Visual Design Notes

-   Clean, minimal aesthetic with plenty of whitespace
-   Use CSS custom properties for the color palette (already in place in `App.css`)
-   System font stack for performance
-   No CSS framework -- plain single stylesheet (`App.css`)
-   Card-based layout with subtle shadows and rounded corners
-   Category pills use the existing `.category-pill` / `.category-tag` styling
-   Dashboard sections separated by `margin-bottom: var(--space-xl)` for clear visual grouping

---

## 7. Accessibility

### 7.1 Navigation

- Sidebar nav items use `<nav>` landmark with `aria-label="Main navigation"`
- Nav items use `role="tab"` with `aria-selected="true|false"`
- The nav group uses `role="tablist"`
- Bottom tabs mirror the same ARIA pattern
- Active view is the "tabpanel" -- use `role="tabpanel"` on the main content area

### 7.2 Dashboard

- Stat cards are `<button>` elements (since they are clickable) with descriptive `aria-label` (e.g. "3 items expiring soon, view details")
- Expiring list uses `<ul>` with `<li>` for each item
- Section headings ("Expired", "Expiring Soon", "By Category") use `<h2>` within the dashboard
- Category breakdown pills are `<button>` elements with `aria-label` (e.g. "Meat: 3 items, view in list")

### 7.3 Focus Management

- When switching from Dashboard to Item List (or vice versa), focus moves to the main content area heading
- Existing focus indicator styles (`:focus-visible` with `outline: 2px solid var(--color-primary)`) apply to all new interactive elements

---

## Summary of Key Decisions

1. **Single-page with state-based views** -- no router in Phase 1
2. **Dashboard as landing page** -- expiry alerts front and center
3. **14-day threshold** for "expiring soon"
4. **3 stat cards** -- total items, expiring soon, expired (dropped "oldest item" and "categories used" to keep it focused)
5. **Clickable stat cards and category pills** navigate to filtered/sorted Item List
6. **Sidebar on desktop, bottom tabs on mobile** -- two nav destinations (Dashboard, Items)
7. **Sidebar width: 200px**, fixed, simple text labels (no icon library)
8. **Bottom tabs height: 56px**, fixed to bottom, two tabs
9. **No quick-add form** -- explicitly listed as a non-goal in CLAUDE.md
10. **No batch operations** -- explicitly listed as a non-goal in CLAUDE.md
11. **No toast notifications** -- explicitly listed as a non-goal in CLAUDE.md
12. **Color-coded expiry** (red/orange/yellow/green) throughout, reusing existing `getExpiryStatus()`
13. **Existing components** (SearchBar, CategoryFilter, SortControl, ItemCard, ItemForm, useItems) are reused without modification
14. **Dashboard component** computes all stats from `allItems` -- no new hooks or state needed
15. **Mobile-first responsive** -- same 768px breakpoint as existing code, with 480px added for stat card stacking

---

## 8. Phase 2 — Loading, Error, and Empty States

Phase 2 replaces localStorage with a MySQL database accessed via a REST API. This introduces asynchronous data fetching, which means the UI must handle three new states: loading, error, and server-driven empty.

### 8.1 Loading States

#### Initial Load (App Startup)

When the app first opens, it fetches all items from `GET /api/items`. During this fetch, the entire app shows a centered loading indicator.

**Visual design:**
- A simple CSS spinner (no third-party library) centered vertically and horizontally
- Below the spinner: "Loading your freezer..." in `color: var(--color-text-secondary)`
- The header renders normally (app title visible), but the main content area shows only the spinner
- No sidebar/bottom tabs during loading — they appear once data is ready

**Implementation:**
```tsx
// In App.tsx:
if (loading) {
  return (
    <>
      <header className="app-header">...</header>
      <main className="app-main">
        <div className="loading-container">
          <div className="spinner" aria-label="Loading" />
          <p className="loading-text">Loading your freezer...</p>
        </div>
      </main>
    </>
  );
}
```

**CSS for spinner:**
```css
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: var(--space-md);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
```

#### CRUD Operation Loading

Individual add/update/delete operations do NOT show a global loading spinner. Instead:
- **Add item**: The "Save" button in `ItemForm` shows "Saving..." and is disabled during the request. This prevents double-submission.
- **Update item**: Same pattern as add — the save button shows "Saving..." while the PUT request is in flight.
- **Delete item**: The delete confirmation dialog's "Delete" button shows "Deleting..." and is disabled during the request.
- **Quantity stepper**: The +/- buttons on `ItemCard` are disabled while the update request is in flight. No spinner — the button simply becomes unresponsive momentarily.

### 8.2 Error States

#### Connection Error (Initial Load Failure)

If the initial `GET /api/items` fails (server down, network error, database unreachable), the app shows a full-page error state instead of the item list.

**Visual design:**
- Centered message: "Could not connect to the server"
- Subtext: "Make sure the server is running on port 3001 and the database is accessible."
- A "Retry" button (`btn btn-primary`) that calls `fetchItems()` again
- Uses `role="alert"` for accessibility

```
+---------------------------------------------+
|  Header: Freezer Tracker                     |
+---------------------------------------------+
|                                              |
|        Could not connect to the server       |
|                                              |
|  Make sure the server is running on port     |
|  3001 and the database is accessible.        |
|                                              |
|              [ Retry ]                       |
|                                              |
+---------------------------------------------+
```

#### CRUD Operation Errors

When an individual add/update/delete operation fails after the initial load succeeded:

- **Add item fails**: The form stays open. An inline error message appears above the form buttons: "Failed to save item. Please try again." in red (`color: var(--color-expired)`). The user can retry by clicking Save again.
- **Update item fails**: Same pattern as add — form stays open with inline error.
- **Delete item fails**: The confirmation dialog stays open with an error message. The user can retry or cancel.
- **Quantity stepper fails**: A brief inline error message appears below the item card for 3 seconds, then fades. The local quantity reverts to the previous value.

**Error message styling:**
```css
.form-error {
  color: var(--color-expired);
  font-size: var(--font-size-sm);
  padding: var(--space-sm) 0;
}

.error-banner {
  background-color: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.error-banner p {
  color: var(--color-expired);
  font-size: var(--font-size-sm);
  margin: 0;
}
```

### 8.3 Empty State (Database Empty)

When the database has zero items (fresh install or all items deleted), the existing empty-state UI components already handle this correctly:

- **Dashboard**: Shows "Your freezer is empty" with "Add your first item to start tracking" and an Add Item button. Stat cards show "0" for all values.
- **Item List**: Shows "Your freezer is empty" with Add Item CTA.

No new empty state design is needed. The `items` array from `useItems` will simply be `[]` after a successful fetch, and existing empty state rendering handles it.

### 8.4 State Transitions

```
App Start
  |
  v
[Loading] --fetch ok--> [Ready: items loaded, normal UI]
  |                          |
  fetch fail                 CRUD operation
  |                          |
  v                     +----+----+
[Error: full page]      |         |
  |                  success    fail
  Retry click           |         |
  |                  update    show inline
  v                  local     error message
[Loading]            state
```

### 8.5 Accessibility for Loading/Error States

- The loading spinner has `aria-label="Loading"` and uses `role="status"` with `aria-live="polite"`
- Error messages use `role="alert"` so screen readers announce them immediately
- The Retry button receives focus automatically when an error state appears
- Disabled buttons during CRUD operations have `aria-disabled="true"` (not just the `disabled` attribute) for better screen reader support
- Error text has sufficient color contrast (red on white background meets WCAG AA)
