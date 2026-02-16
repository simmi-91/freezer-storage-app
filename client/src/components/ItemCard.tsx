import type { FreezerItem } from "../types";
import { getExpiryStatus, formatDate } from "../utils/dates";

interface ItemCardProps {
  item: FreezerItem;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
}

const STATUS_TO_BADGE: Record<string, string> = {
  "expired": "badge-expired",
  "expiring-soon-7": "badge-expiring-soon",
  "expiring-soon-14": "badge-warning",
  "good": "badge-good",
};

export function ItemCard({ item, onEdit, onDelete, onUpdateQuantity }: ItemCardProps) {
  const expiry = getExpiryStatus(item.expiryDate);
  const badgeClass = STATUS_TO_BADGE[expiry.status] ?? "badge-good";

  function handleDelete() {
    if (window.confirm(`Remove "${item.name}" from the freezer?`)) {
      onDelete(item.id);
    }
  }

  function handleDecrease() {
    if (item.quantity <= 1) {
      if (window.confirm(`Remove "${item.name}" from the freezer?`)) {
        onDelete(item.id);
      }
    } else {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  }

  function handleIncrease() {
    onUpdateQuantity(item.id, item.quantity + 1);
  }

  return (
    <article className="card">
      <div className="item-card-header">
        <h3 className="item-card-name">{item.name}</h3>
        <span className="category-tag">{item.category}</span>
      </div>

      <div className="item-card-details">
        <div className="quantity-stepper">
          <button
            className="quantity-btn"
            onClick={handleDecrease}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="quantity-value">
            {item.quantity} {item.unit}
          </span>
          <button
            className="quantity-btn"
            onClick={handleIncrease}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <span>Added: {item.dateAdded ? formatDate(item.dateAdded) : "Unknown"}</span>
        {item.notes && <span className="item-card-notes">{item.notes}</span>}
      </div>

      <div className="item-card-footer">
        <span className={`badge ${badgeClass}`}>{expiry.label}</span>
        <div className="item-card-actions">
          <button
            className="btn btn-ghost"
            onClick={() => onEdit(item.id)}
            aria-label={`Edit ${item.name}`}
          >
            Edit
          </button>
          <button
            className="btn btn-ghost btn-ghost--danger"
            onClick={handleDelete}
            aria-label={`Delete ${item.name}`}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
