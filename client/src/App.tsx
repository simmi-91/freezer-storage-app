import { useState, useEffect, useCallback } from "react";
import type { ViewMode, FreezerItem } from "./types";
import { useItems } from "./hooks/useItems";
import { ItemList } from "./components/ItemList";
import { ItemForm } from "./components/ItemForm";
import { PhotoCapture } from "./components/PhotoCapture";
import { ShelfLifeTable } from "./components/ShelfLifeTable";
import "./App.css";

function App() {
  const {
    items,
    allItems,
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

  const [viewMode, setViewMode] = useState<ViewMode>({ kind: "list" });

  const navigate = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    window.history.pushState({ viewMode: mode }, "");
  }, []);

  useEffect(() => {
    // Set initial history state
    window.history.replaceState({ viewMode: { kind: "list" } }, "");

    function handlePopState(event: PopStateEvent) {
      const state = event.state as { viewMode?: ViewMode } | null;
      if (state?.viewMode) {
        setViewMode(state.viewMode);
      } else {
        setViewMode({ kind: "list" });
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
    navigate({ kind: "list" });
  }

  const editItem =
    viewMode.kind === "edit"
      ? allItems.find((item) => item.id === viewMode.itemId)
      : undefined;

  return (
    <>
      <header className="app-header">
        <div className="app-container">
          <h1>Freezer Tracker</h1>
          {viewMode.kind === "list" && (
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

      <main className="app-main">
        <div className="app-container">
          {viewMode.kind === "list" && (
            <>
              <ItemList
                items={items}
                allItems={allItems}
                totalCount={allItems.length}
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
