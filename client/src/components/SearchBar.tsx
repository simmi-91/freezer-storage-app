interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <label className="form-label" htmlFor="search-items">
        Search
      </label>
      <input
        id="search-items"
        type="text"
        className="form-input"
        placeholder="Search items..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
