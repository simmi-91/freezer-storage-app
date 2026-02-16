import { useState } from "react";
import { CATEGORIES, CATEGORY_SHELF_LIFE } from "../types";

export function ShelfLifeTable() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="shelf-life-table">
      <button
        className="shelf-life-toggle"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls="shelf-life-content"
      >
        <span>Freezer Storage Guide</span>
        <span className="shelf-life-chevron" aria-hidden="true">
          {expanded ? "\u25B2" : "\u25BC"}
        </span>
      </button>
      {expanded && (
        <div id="shelf-life-content" role="region" aria-label="Freezer storage guide">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Shelf Life</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => {
                const { min, max } = CATEGORY_SHELF_LIFE[cat];
                const label = min === max ? `${max} months` : `${min}\u2013${max} months`;
                return (
                  <tr key={cat}>
                    <td>{cat}</td>
                    <td>{label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
