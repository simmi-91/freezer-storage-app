import { useState, useEffect, useCallback } from "react";
import type { ViewMode, FreezerItem, Category } from "./types";
import { useItems } from "./hooks/useItems";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { ItemList } from "./components/ItemList";
import { ItemForm } from "./components/ItemForm";
import { PhotoCapture } from "./components/PhotoCapture";
import { ShelfLifeTable } from "./components/ShelfLifeTable";
import "./App.css";

function App() {
  const {
    items,
    allItems,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    addItem,
    addItems,
    updateItem,
    deleteItem,
  } = useItems();

  const [viewMode, setViewMode] = useState<ViewMode>({ kind: "dashboard" });

  const navigate = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    window.history.pushState({ viewMode: mode }, "");
  }, []);

  useEffect(() => {
    // Set initial history state
    window.history.replaceState({ viewMode: { kind: "dashboard" } }, "");

    function handlePopState(event: PopStateEvent) {
      const state = event.state as { viewMode?: ViewMode } | null;
      if (state?.viewMode) {
        setViewMode(state.viewMode);
      } else {
        setViewMode({ kind: "dashboard" });
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleEdit(id: number) {
    navigate({ kind: "edit", itemId: id });
  }

  function handleAddSave(data: Omit<FreezerItem, "id">) {
    addItem(data);
    navigate({ kind: "list" });
  }

  function handleEditSave(data: Omit<FreezerItem, "id">) {
    if (viewMode.kind === "edit") {
      updateItem(viewMode.itemId, data);
    }
    navigate({ kind: "list" });
  }

  function handleCancel() {
    window.history.back();
  }

  function handleNavigateToList(options?: { category?: Category; sort?: "expiryDate" }) {
    if (options?.category) {
      setSelectedCategory(options.category);
    } else {
      setSelectedCategory("All");
    }
    if (options?.sort) {
      setSortBy(options.sort);
    }
    navigate({ kind: "list" });
  }

  const editItem =
    viewMode.kind === "edit"
      ? allItems.find((item) => item.id === viewMode.itemId)
      : undefined;

  const showHeaderButtons = viewMode.kind === "list" || viewMode.kind === "dashboard";

  return (
    <>
      <header className="app-header">
        <div className="app-container">
          <h1>Freezer Tracker</h1>
          {showHeaderButtons && (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => navigate({ kind: "photo" })}
              >
                Scan Food
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate({ kind: "add" })}
              >
                + Add Item
              </button>
            </>
          )}
        </div>
      </header>

      <Navigation
        currentView={viewMode.kind}
        totalItems={allItems.length}
        onNavigate={navigate}
      />

      <main className="app-main app-main--with-nav" role="tabpanel">
        <div className="app-container">
          {viewMode.kind === "dashboard" && (
            <Dashboard
              items={allItems}
              loading={loading}
              error={error}
              onNavigateToList={handleNavigateToList}
              onNavigateToAdd={() => navigate({ kind: "add" })}
              onEdit={handleEdit}
              onDelete={deleteItem}
            />
          )}

          {viewMode.kind === "list" && (
            <>
              <ItemList
                items={items}
                allItems={allItems}
                totalCount={allItems.length}
                loading={loading}
                error={error}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onEdit={handleEdit}
                onDelete={deleteItem}
                onUpdateQuantity={(id, quantity) => updateItem(id, { quantity })}
                onAdd={() => navigate({ kind: "add" })}
              />
              <ShelfLifeTable />
            </>
          )}

          {viewMode.kind === "add" && (
            <ItemForm
              mode="add"
              existingItems={allItems}
              onSave={handleAddSave}
              onCancel={handleCancel}
              onEditExisting={(id) => navigate({ kind: "edit", itemId: id })}
            />
          )}

          {viewMode.kind === "edit" && editItem && (
            <ItemForm
              mode="edit"
              item={editItem}
              onSave={handleEditSave}
              onCancel={handleCancel}
            />
          )}

          {viewMode.kind === "photo" && (
            <PhotoCapture
              onAddItems={(newItems) => {
                addItems(newItems);
                navigate({ kind: "list" });
              }}
              onCancel={handleCancel}
            />
          )}
        </div>
      </main>
    </>
  );
}

export default App;
