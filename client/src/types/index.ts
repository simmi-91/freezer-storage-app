export const CATEGORIES = [
  "Meat",
  "Poultry",
  "Seafood",
  "Vegetables",
  "Fruit",
  "Bread & Bakery",
  "Prepared Meals",
  "Dairy",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Max freezer shelf life in months per category (used for auto-selecting expiry date) */
export const CATEGORY_SHELF_LIFE: Record<Category, { min: number; max: number }> = {
  "Meat":            { min: 6,  max: 12 },
  "Poultry":         { min: 9,  max: 12 },
  "Seafood":         { min: 2,  max: 6 },
  "Vegetables":      { min: 8,  max: 12 },
  "Fruit":           { min: 6,  max: 12 },
  "Bread & Bakery":  { min: 2,  max: 3 },
  "Prepared Meals":  { min: 2,  max: 3 },
  "Dairy":           { min: 3,  max: 6 },
  "Other":           { min: 3,  max: 6 },
};

export type SortOption = "name" | "dateAdded" | "expiryDate" | "category";

export type ViewMode =
  | { kind: "dashboard" }
  | { kind: "list" }
  | { kind: "add" }
  | { kind: "edit"; itemId: number }
  | { kind: "photo" };

export interface FreezerItem {
  id: number;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  dateAdded: string;  // ISO date string or "" if unknown
  expiryDate: string;
  notes: string;
}

export type FreezerItemFormData = {
  name: string;
  category: Category;
  quantity: string;
  unit: string;
  dateAdded: string;
  expiryDate: string;
  notes: string;
};
