/**
 * Date & Timestamp formatting utilities for EXMA Frontend.
 * Converts UTC ISO dates and timestamps into clean local browser timezone strings.
 */

/**
 * Format timestamp into local browser date & time.
 * Example: "Sep 02, 2026 08:05 PM"
 */
export function formatDateTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Format ISO date into local browser date string.
 * Example: "Sep 02, 2026"
 */
export function formatDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Format ISO timestamp into local 12-hour time only.
 * Example: "08:05 PM"
 */
export function formatTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Format ISO interval into local time range string.
 * Example: "08:00 PM → 08:15 PM"
 */
export function formatIntervalRange(
  startInput: string | number | Date | null | undefined,
  endInput: string | number | Date | null | undefined
): string {
  if (!startInput || !endInput) return '—';
  return `${formatTime(startInput)} → ${formatTime(endInput)}`;
}

