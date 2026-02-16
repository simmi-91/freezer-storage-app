import type { FreezerItem, Category } from "../types";
import { getExpiryStatus, formatDate } from "../utils/dates";

interface DashboardProps {
  items: FreezerItem[];
  onNavigateToList: (options?: { category?: Category; sort?: "expiryDate" }) => void;
  onNavigateToAdd: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const MAX_EXPIRING_ROWS = 10;

export function Dashboard({
  items,
  onNavigateToList,
  onNavigateToAdd,
  onEdit,
  onDelete,
}: DashboardProps) {
  const expiredItems = items
    .filter((item) => getExpiryStatus(item.expiryDate).status === "expired")
    .sort((a, b) => b.expiryDate.localeCompare(a.expiryDate));

  const expiringSoonItems = items
    .filter((item) => {
      const s = getExpiryStatus(item.expiryDate).status;
      return s === "expiring-soon-7" || s === "expiring-soon-14";
    })
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  const expiredCount = expiredItems.length;
  const expiringSoonCount = expiringSoonItems.length;

  const categoryCounts: { category: Category; count: number }[] = [];
  const countMap = new Map<Category, number>();
  for (const item of items) {
    countMap.set(item.category, (countMap.get(item.category) || 0) + 1);
  }
  for (const [category, count] of countMap) {
    categoryCounts.push({ category, count });
  }
  categoryCounts.sort((a, b) => b.count - a.count);

  const allAttentionItems = [...expiredItems, ...expiringSoonItems];
  const totalAttention = allAttentionItems.length;
  const shownExpired = expiredItems.slice(0, MAX_EXPIRING_ROWS);
  const remainingSlots = MAX_EXPIRING_ROWS - shownExpired.length;
  const shownExpiring = expiringSoonItems.slice(0, Math.max(0, remainingSlots));

  return (
    <section aria-label="Dashboard">
      {/* Stats row */}
      <div className="dashboard-stats">
        <button
          className="stat-card"
          onClick={() => onNavigateToList()}
          aria-label={`${items.length} items in freezer, view all`}
        >
          <div className="stat-card-value stat-card-value--primary">
            {items.length}
          </div>
          <div className="stat-card-label">items in freezer</div>
        </button>

        <button
          className={`stat-card${expiringSoonCount > 0 ? " stat-card--warning" : ""}`}
          onClick={() => onNavigateToList({ sort: "expiryDate" })}
          aria-label={`${expiringSoonCount} items expiring soon, view details`}
        >
          <div className="stat-card-value">
            {expiringSoonCount}
          </div>
          <div className="stat-card-label">expiring within 14 days</div>
        </button>

        <button
          className={`stat-card${expiredCount > 0 ? " stat-card--danger" : ""}`}
          onClick={() => onNavigateToList({ sort: "expiryDate" })}
          aria-label={`${expiredCount} expired items, view details`}
        >
          <div className="stat-card-value">
            {expiredCount}
          </div>
          <div className="stat-card-label">past expiry</div>
        </button>
      </div>

      {/* Expiring soon / expired list */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">Needs Attention</h2>
          {totalAttention > MAX_EXPIRING_ROWS && (
            <button
              className="dashboard-section-link"
              onClick={() => onNavigateToList({ sort: "expiryDate" })}
            >
              View all {totalAttention} items
            </button>
          )}
        </div>

        {totalAttention === 0 ? (
          <p className="dashboard-all-clear">All clear -- nothing expiring soon</p>
        ) : (
          <ul className="expiring-list">
            {shownExpired.length > 0 && (
              <li className="expiring-section-header expiring-section-header--expired">
                Expired <span className="badge badge-expired">{expiredCount}</span>
              </li>
            )}
            {shownExpired.map((item) => (
              <ExpiringRow
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {shownExpiring.length > 0 && (
              <li className="expiring-section-header expiring-section-header--warning">
                Expiring Soon <span className="badge badge-expiring-soon">{expiringSoonCount}</span>
              </li>
            )}
            {shownExpiring.map((item) => (
              <ExpiringRow
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Category breakdown */}
      {categoryCounts.length > 0 && (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">By Category</h2>
            <button
              className="dashboard-section-link"
              onClick={() => onNavigateToList()}
            >
              View all items
            </button>
          </div>
          <div className="category-filter" role="group" aria-label="Category breakdown">
            {categoryCounts.map(({ category, count }) => (
              <button
                key={category}
                className="category-pill"
                onClick={() => onNavigateToList({ category })}
                aria-label={`${category}: ${count} item${count !== 1 ? "s" : ""}, view in list`}
              >
                {category}: {count}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="empty-state">
          <h2>Your freezer is empty</h2>
          <p>Add your first item to start tracking.</p>
          <button className="btn btn-primary" onClick={onNavigateToAdd}>
            + Add Item
          </button>
        </div>
      )}
    </section>
  );
}

/* --- Inline sub-components --- */

const STATUS_TO_BADGE: Record<string, string> = {
  expired: "badge-expired",
  "expiring-soon-7": "badge-expiring-soon",
  "expiring-soon-14": "badge-warning",
  good: "badge-good",
};

function ExpiringRow({
  item,
  onEdit,
  onDelete,
}: {
  item: FreezerItem;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const expiry = getExpiryStatus(item.expiryDate);
  const badgeClass = STATUS_TO_BADGE[expiry.status] ?? "badge-good";

  function handleDelete() {
    if (window.confirm(`Remove "${item.name}" from the freezer?`)) {
      onDelete(item.id);
    }
  }

  return (
    <li className="expiring-row">
      <span className="expiring-row-name">{item.name}</span>
      <span className="category-tag">{item.category}</span>
      <span className="expiring-row-qty">
        {item.quantity} {item.unit}
      </span>
      <span className={`badge ${badgeClass}`}>{expiry.label}</span>
      <div className="expiring-row-actions">
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
    </li>
  );
}
