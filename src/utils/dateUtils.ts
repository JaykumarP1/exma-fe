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
 * Format timestamp into "DD Mon YY" format.
 * Example: "06 Sep 26"
 */
export function formatDateDDMonYY(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
      const [y, m, d] = dateInput.trim().split('-').map(Number);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(d).padStart(2, '0');
      const month = monthNames[m - 1];
      const year = String(y).slice(-2);
      return `${day} ${month} ${year}`;
    }

    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()];
    const year = String(d.getFullYear()).slice(-2);

    return `${day} ${month} ${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Format timestamp into "HH:MM" (24-hour) local time format.
 * Example: "14:35", "08:05"
 * Returns empty string if the input has no time component (e.g. date-only "YYYY-MM-DD").
 */
export function formatTimeHHMM(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  try {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
      return '';
    }

    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '';
  }
}

/**
 * Split a datetime into { date: 'DD Mon YY', time: 'HH:MM' }
 */
export function formatDateTimeSplit(dateInput: string | number | Date | null | undefined): { date: string; time: string } {
  return {
    date: formatDateDDMonYY(dateInput),
    time: formatTimeHHMM(dateInput)
  };
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

