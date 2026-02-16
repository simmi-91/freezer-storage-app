import { useMemo, useEffect } from "react";
import { CATEGORIES, type Category, type FreezerItem } from "../types";

interface CategoryFilterProps {
  selected: Category | "All";
  onChange: (category: Category | "All") => void;
  allItems: FreezerItem[];
}

export function CategoryFilter({ selected, onChange, allItems }: CategoryFilterProps) {
  const activeCategories = useMemo(() => {
    const set = new Set(allItems.map((item) => item.category));
    return CATEGORIES.filter((cat) => set.has(cat));
  }, [allItems]);

  // Auto-switch to "All" if the selected category no longer has items
  useEffect(() => {
    if (selected !== "All" && !activeCategories.includes(selected)) {
      onChange("All");
    }
  }, [selected, activeCategories, onChange]);

  return (
    <div className="category-filter" role="group" aria-label="Filter by category">
      <button
        className={`category-pill${selected === "All" ? " active" : ""}`}
        aria-pressed={selected === "All"}
        onClick={() => onChange("All")}
      >
        All
      </button>
      {activeCategories.map((cat) => (
        <button
          key={cat}
          className={`category-pill${selected === cat ? " active" : ""}`}
          aria-pressed={selected === cat}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
