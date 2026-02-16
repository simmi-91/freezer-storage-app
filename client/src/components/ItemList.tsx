import type { FreezerItem, Category, SortOption } from "../types";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { SortControl } from "./SortControl";
import { ItemCard } from "./ItemCard";

interface ItemListProps {
  items: FreezerItem[];
  allItems: FreezerItem[];
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: Category | "All";
  onCategoryChange: (category: Category | "All") => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onAdd: () => void;
}

export function ItemList({
  items,
  allItems,
  totalCount,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  onEdit,
  onDelete,
  onUpdateQuantity,
  onAdd,
}: ItemListProps) {
  const hasFilters = searchQuery !== "" || selectedCategory !== "All";

  function handleClearFilters() {
    onSearchChange("");
    onCategoryChange("All");
  }

  return (
    <section>
      <div className="toolbar">
        <SearchBar value={searchQuery} onChange={onSearchChange} />
        <SortControl sortBy={sortBy} onSortChange={onSortChange} />
      </div>
      <CategoryFilter selected={selectedCategory} onChange={onCategoryChange} allItems={allItems} />

      {items.length > 0 && (
        <p className="item-count">
          Showing {items.length} of {totalCount} items
        </p>
      )}

      {items.length === 0 ? (
        hasFilters ? (
          <div className="empty-state">
            <h2>No items match your search</h2>
            <p>Try adjusting your search or filter.</p>
            <button className="btn btn-ghost" onClick={handleClearFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <h2>Your freezer is empty</h2>
            <p>Add your first item to get started!</p>
            <button className="btn btn-primary" onClick={onAdd}>
              + Add Item
            </button>
          </div>
        )
      ) : (
        <div className="item-grid">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateQuantity={onUpdateQuantity}
            />
          ))}
        </div>
      )}
    </section>
  );
}
