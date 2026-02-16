# UX Design: Freezer Storage Web App

## 1. Screens & Views

The app uses a **single-page layout** with three logical views. No routing library is needed in Phase 1 -- views switch via React state.

### 1.1 Dashboard (default view)

The landing screen. Shows at-a-glance stats and highlights items that need attention.

| Section                | Content                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **Total items**        | Count of all items currently tracked                                                |
| **Expiring soon**      | Items with expiry within 14 days, sorted soonest-first. Red badge count.            |
| **Expired**            | Items already past expiry date. Shown separately so the user can decide to discard. |
| **Category breakdown** | Simple bar or pill list showing count per category (e.g. "Meat: 3, Seafood: 2")     |
| **Recently added**     | Last 5 items added, for quick reference                                             |

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
-   Opens as a **slide-in panel from the right** on desktop or a **full-screen overlay** on mobile
-   Pre-filled when editing an existing item
-   "Save" and "Cancel" buttons at the bottom
-   Minimal required fields: name, category, quantity, unit, expiry date

---

## 2. User Flows

### 2.1 Adding a New Item (primary flow -- minimize friction)

1. User clicks the prominent **"+ Add Item"** button (always visible in header/toolbar)
2. Form panel slides in with sensible defaults:
    - Date added = today
    - Quantity = 1
    - Unit = "pcs"
    - Category = last used category (stored in local state)
3. User types name, selects category, adjusts quantity/unit if needed, sets expiry date
4. User clicks "Save" -- item appears in list, panel closes
5. Optional: toast notification "Item added" with undo action (3 second timeout)

**Quick-add shortcut**: On the dashboard, show a compact inline form with just name + category + expiry. Quantity defaults to 1 pcs. For rapid entry when unloading groceries.

### 2.2 Finding an Item

1. User navigates to Item List view (or is already there)
2. Types in SearchBar -- filters in real-time by name and notes (already implemented in useItems)
3. Optionally clicks a category pill to narrow results
4. Optionally changes sort order (e.g. "Expiry: soonest first" to find what to use next)

### 2.3 Editing an Item

1. User clicks "Edit" button on an item card (pencil icon)
2. Same form panel opens, pre-populated with current values
3. User modifies fields (common: update quantity after partial use, extend expiry)
4. Clicks "Save" -- item updates in place

**Quick quantity update**: Each item card has a small "-" / "+" stepper on the quantity. Tapping "-" when quantity is 1 prompts "Remove item?" confirmation.

### 2.4 Removing an Item

1. User clicks "Remove" button on an item card (trash icon)
2. Confirmation dialog: "Remove [item name] from freezer?"
3. On confirm, item is deleted with toast "Item removed" + undo (3 seconds)

**Batch remove**: Checkbox appears on each card when user enters "select mode" (via a "Select" button in the toolbar). A floating action bar shows count and "Remove selected" button.

---

## 3. Dashboard Design

### 3.1 Stats Summary (top row, 3-4 cards)

| Stat            | Display                                     |
| --------------- | ------------------------------------------- |
| Total items     | Large number + "items in freezer"           |
| Expiring soon   | Count + red/orange badge, "within 14 days"  |
| Categories used | Count of distinct categories with items     |
| Oldest item     | Name + age in days, nudge to use or discard |

### 3.2 Expiry Alerts

-   **"Expiring soon" = within 14 days** from today
-   Shown as a prominent list/section on the dashboard
-   Each row: item name, expiry date, days remaining, category tag, quick "Remove" button
-   Sorted by soonest expiry first
-   If nothing is expiring soon, show a friendly "All clear" message

### 3.3 Category Breakdown

-   Horizontal bar chart or simple list with count badges
-   Categories with 0 items are hidden
-   Clicking a category navigates to Item List view filtered to that category

### 3.4 Recently Added

-   Last 5 items, shown as compact rows: name, date added, category
-   Provides context for "what did I just put in the freezer?"

---

## 4. Layout & Navigation

### 4.1 Single-page app, no router

For Phase 1, use React state to switch between views. The app is simple enough that a router adds unnecessary complexity. Views: "dashboard", "items", "add/edit form".

### 4.2 Layout Structure

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

-   **Header**: Fixed top bar. App name "Freezer Tracker" on the left, "+ Add Item" button on the right.
-   **Sidebar** (desktop only): Two nav links -- "Dashboard" and "Items". Shows category quick-links below nav.
-   **Mobile**: Sidebar collapses to a bottom tab bar with two tabs: Dashboard, Items. The "+ Add Item" button becomes a floating action button (FAB) in the bottom-right corner.

### 4.3 Mobile Responsiveness

-   Breakpoint at 768px
-   Below 768px: single column layout, bottom tab navigation, full-screen form overlay
-   Above 768px: sidebar + main content, slide-in form panel
-   Item cards stack single-column on mobile, 2-3 columns on desktop
-   Category filter pills scroll horizontally on mobile

---

## 5. Component Hierarchy

```
App
+-- Header
|   +-- AppTitle
|   +-- AddItemButton
|
+-- Sidebar (desktop) / BottomTabs (mobile)
|   +-- NavLink ("Dashboard")
|   +-- NavLink ("Items")
|
+-- MainContent
|   +-- Dashboard (when view === "dashboard")
|   |   +-- StatsRow
|   |   |   +-- StatCard (total items)
|   |   |   +-- StatCard (expiring soon)
|   |   |   +-- StatCard (categories)
|   |   |   +-- StatCard (oldest item)
|   |   +-- ExpiringList
|   |   |   +-- ExpiringItem (per item)
|   |   +-- CategoryBreakdown
|   |   +-- RecentlyAdded
|   |
|   +-- ItemListView (when view === "items")
|   |   +-- SearchBar          (already built)
|   |   +-- CategoryFilter     (already built)
|   |   +-- SortControl
|   |   +-- ItemGrid
|   |       +-- ItemCard (per item)
|   |           +-- QuantityStepper
|   |           +-- EditButton
|   |           +-- RemoveButton
|   |
|   +-- ItemFormPanel (slide-in / overlay)
|       +-- ItemForm
|           +-- (form fields)
|           +-- SaveButton
|           +-- CancelButton
```

### Data Flow

-   `useItems` hook lives at the `App` level and provides all state + CRUD functions
-   `App` passes relevant props down to each view
-   Active view tracked by `useState<"dashboard" | "items">("dashboard")`
-   Form panel state: `useState<{ mode: "add" } | { mode: "edit"; item: FreezerItem } | null>(null)`
-   No global state library needed -- prop drilling is fine for this app size

---

## 6. UX Patterns for Freezer Management

### 6.1 Color-Coded Expiry Warnings

Applied to expiry dates on item cards and list rows:

| Condition                   | Color            | Label               |
| --------------------------- | ---------------- | ------------------- |
| Expired (past today)        | Red (#DC2626)    | "Expired"           |
| Expiring within 7 days      | Orange (#F59E0B) | "Expires in X days" |
| Expiring within 14 days     | Yellow (#EAB308) | "Expires in X days" |
| More than 14 days remaining | Green (#22C55E)  | "Good until [date]" |

These colors appear as a small badge/dot on item cards and in the expiry text.

### 6.2 Quick-Add for Common Items

-   On the dashboard, provide a "Quick Add" section with a compact inline form
-   Just name, category dropdown, and expiry date -- saves with defaults for the rest
-   Designed for the scenario: "I just bought groceries and need to log 8 things fast"

### 6.3 Batch Operations

-   "Select" mode toggle in the Item List toolbar
-   Checkboxes appear on each card
-   Floating action bar at bottom: "[N] selected -- Remove All"
-   Useful when cleaning out the freezer

### 6.4 Quantity Stepper on Cards

-   Small "- / +" buttons directly on item cards for adjusting quantity without opening the edit form
-   Tapping "-" at quantity 1 triggers a removal confirmation
-   Saves a round-trip to the edit form for the most common update

### 6.5 Smart Defaults

-   "Date added" defaults to today
-   "Quantity" defaults to 1
-   "Unit" defaults to "pcs" but remembers last used unit per category
-   "Category" defaults to last used category
-   These reduce the number of fields the user has to actively fill

### 6.6 Empty States

-   First visit / no items: friendly illustration + "Add your first item" CTA
-   No search results: "No items match your search" with a clear-filter button
-   No expiring items on dashboard: "Nothing expiring soon -- you're all set"

### 6.7 Visual Design Notes

-   Clean, minimal aesthetic with plenty of whitespace
-   Use CSS custom properties for the color palette (easy theming later)
-   System font stack for performance
-   No CSS framework needed -- plain CSS modules or a single stylesheet
-   Card-based layout with subtle shadows and rounded corners
-   Category pills use soft background colors per category for visual distinction

---

## Summary of Key Decisions

1. **Single-page with state-based views** -- no router in Phase 1
2. **Dashboard as landing page** -- expiry alerts front and center
3. **14-day threshold** for "expiring soon"
4. **Slide-in panel** for add/edit forms (not a separate page)
5. **Quick-add on dashboard** for low-friction bulk entry
6. **Quantity stepper on cards** for the most common edit
7. **Batch remove** for freezer cleanout scenarios
8. **Color-coded expiry** (red/orange/yellow/green) throughout
9. **Mobile-first responsive** -- bottom tabs, single column, FAB
10. **Existing components** (SearchBar, CategoryFilter, useItems) slot directly into this design with no changes needed
