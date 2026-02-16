export interface ExpiryStatus {
  status: "expired" | "expiring-soon-7" | "expiring-soon-14" | "good";
  label: string;
  color: string;
}

/**
 * Number of days from today to the given ISO date string.
 * Negative if the date is in the past.
 */
export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns expiry status, display label, and color for a given expiry date.
 */
export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const days = daysUntil(expiryDate);

  if (days < 0) {
    return { status: "expired", label: "Expired", color: "#DC2626" };
  }
  if (days <= 7) {
    return {
      status: "expiring-soon-7",
      label: days === 0 ? "Expires today" : days === 1 ? "Expires in 1 day" : `Expires in ${days} days`,
      color: "#F59E0B",
    };
  }
  if (days <= 14) {
    return {
      status: "expiring-soon-14",
      label: `Expires in ${days} days`,
      color: "#EAB308",
    };
  }
  return {
    status: "good",
    label: `Good until ${formatDate(expiryDate)}`,
    color: "#22C55E",
  };
}

/**
 * Formats an ISO date string (YYYY-MM-DD) for display, e.g. "Feb 12, 2026".
 * Returns "Unknown" for empty or invalid input.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Returns an ISO date string (YYYY-MM-DD) for the given date plus N months.
 */
export function addMonths(date: Date, months: number): string {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  // Handle month overflow (e.g. Jan 31 + 1 month -> Feb 28, not Mar 3)
  if (result.getDate() < date.getDate()) {
    result.setDate(0); // last day of previous month
  }
  return result.toISOString().slice(0, 10);
}
