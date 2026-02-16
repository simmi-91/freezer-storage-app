import { useState, useMemo, useEffect, useCallback } from "react";
import type { FreezerItem, Category, SortOption } from "../types";
import { API_BASE } from "../utils/api";

export function useItems() {
  const [items, setItems] = useState<FreezerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("expiryDate");

  useEffect(() => {
    fetch(`${API_BASE}/api/items`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load items (${res.status})`);
        return res.json();
      })
      .then((data: FreezerItem[]) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load items");
        setLoading(false);
      });
  }, []);

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

  const addItem = useCallback(async (item: Omit<FreezerItem, "id">) => {
    const res = await fetch(`${API_BASE}/api/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error(`Failed to add item (${res.status})`);
    const newItem: FreezerItem = await res.json();
    setItems((prev) => [...prev, newItem]);
  }, []);

  const addItems = useCallback(async (newItems: Omit<FreezerItem, "id">[]) => {
    const created: FreezerItem[] = [];
    for (const item of newItems) {
      const res = await fetch(`${API_BASE}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error(`Failed to add item (${res.status})`);
      const newItem: FreezerItem = await res.json();
      created.push(newItem);
    }
    setItems((prev) => [...prev, ...created]);
  }, []);

  const updateItem = useCallback(async (id: number, updates: Partial<Omit<FreezerItem, "id">>) => {
    const res = await fetch(`${API_BASE}/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Failed to update item (${res.status})`);
    const updated: FreezerItem = await res.json();
    setItems((prev) =>
      prev.map((item) => (item.id === id ? updated : item))
    );
  }, []);

  const deleteItem = useCallback(async (id: number) => {
    const res = await fetch(`${API_BASE}/api/items/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`Failed to delete item (${res.status})`);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    items: filteredItems,
    allItems: items,
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
  };
}
