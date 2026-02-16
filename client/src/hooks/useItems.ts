import { useState, useMemo, useEffect } from "react";
import type { FreezerItem, Category, SortOption } from "../types";
import { mockItems } from "../data/mock-items";

const STORAGE_KEY = "freezer-items";

function loadItems(): FreezerItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Corrupted data — fall back to mock items
  }
  return mockItems;
}

function deriveNextId(items: FreezerItem[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((item) => item.id)) + 1;
}

let nextId = deriveNextId(loadItems());

export function useItems() {
  const [items, setItems] = useState<FreezerItem[]>(loadItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("expiryDate");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "dateAdded":
          // Newest first; items with empty dateAdded sort last
          if (!a.dateAdded && !b.dateAdded) return 0;
          if (!a.dateAdded) return 1;
          if (!b.dateAdded) return -1;
          return b.dateAdded.localeCompare(a.dateAdded);
        case "expiryDate":
          // Soonest first
          return a.expiryDate.localeCompare(b.expiryDate);
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
  }, [items, searchQuery, selectedCategory, sortBy]);

  function addItem(item: Omit<FreezerItem, "id">) {
    const newItem: FreezerItem = {
      ...item,
      id: nextId++,
    };
    setItems((prev) => [...prev, newItem]);
  }

  function addItems(newItems: Omit<FreezerItem, "id">[]) {
    const withIds = newItems.map((item) => ({ ...item, id: nextId++ }));
    setItems((prev) => [...prev, ...withIds]);
  }

  function updateItem(id: number, updates: Partial<Omit<FreezerItem, "id">>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }

  function deleteItem(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return {
    items: filteredItems,
    allItems: items,
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
  };
}
