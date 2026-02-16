import type { SortOption } from "../types";

interface SortControlProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name", label: "Name (A\u2013Z)" },
  { value: "dateAdded", label: "Date Added (newest)" },
  { value: "expiryDate", label: "Expiry Date (soonest)" },
  { value: "category", label: "Category" },
];

export function SortControl({ sortBy, onSortChange }: SortControlProps) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor="sort-select">
        Sort by
      </label>
      <select
        id="sort-select"
        className="form-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
