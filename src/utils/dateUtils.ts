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

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Parse date string or timestamp into "Month Year" format (e.g. "September 2026").
 * Supports ISO (YYYY-MM-DD), DMY (DD-MM-YYYY, DD/MM/YYYY), word formats ("Sep 2026", "22-Sep-2026"), etc.
 */
export function parseDateToMonthYear(val: string | null | undefined): string | null {
  if (!val || typeof val !== 'string') return null;
  const s = val.trim();
  if (!s) return null;

  // 1. ISO format: YYYY-MM-DD or YYYY-MM
  const iso = s.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?/);
  if (iso) {
    const y = parseInt(iso[1], 10);
    const m = parseInt(iso[2], 10) - 1;
    if (m >= 0 && m < 12 && y >= 2000 && y <= 2099) {
      return `${FULL_MONTH_NAMES[m]} ${y}`;
    }
  }

  // 2. DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmy) {
    const m = parseInt(dmy[2], 10) - 1;
    const y = parseInt(dmy[3], 10);
    if (m >= 0 && m < 12 && y >= 2000 && y <= 2099) {
      return `${FULL_MONTH_NAMES[m]} ${y}`;
    }
  }

  // 3. Month Name + Year e.g. "Sep 2026", "September 2026", "22-Sep-2026", "Aug2026"
  const wordMatch = s.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s_-]*(\d{4})/i);
  if (wordMatch) {
    const mStr = wordMatch[1].slice(0, 3).toLowerCase();
    const idx = SHORT_MONTH_NAMES.findIndex((m) => m.toLowerCase() === mStr);
    if (idx !== -1) {
      return `${FULL_MONTH_NAMES[idx]} ${wordMatch[2]}`;
    }
  }

  // 4. Standard Date fallback
  const d = new Date(s);
  if (!isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2099) {
    return `${FULL_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }

  return null;
}

/**
 * Extract Month Year from filename if present (e.g. "xxxx_22-09-2026.pdf", "Aug2026.pdf", "22092026.pdf")
 */
export function parseFilenameToMonthYear(filename: string | null | undefined): string | null {
  if (!filename || typeof filename !== 'string') return null;
  const s = filename.trim();
  if (!s) return null;

  // 1. Month name + Year (e.g. Aug2026, August_2026, Sep-2026)
  const monthWord = s.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[-_]?(\d{4})/i);
  if (monthWord) {
    const mStr = monthWord[1].slice(0, 3).toLowerCase();
    const idx = SHORT_MONTH_NAMES.findIndex((m) => m.toLowerCase() === mStr);
    if (idx !== -1) {
      return `${FULL_MONTH_NAMES[idx]} ${monthWord[2]}`;
    }
  }

  // 2. DD-MM-YYYY or DD_MM_YYYY
  const dmy = s.match(/(?:^|[^0-9])(\d{2})[-_.](\d{2})[-_.](\d{4})(?:[^0-9]|$)/);
  if (dmy) {
    const m = parseInt(dmy[2], 10) - 1;
    const y = parseInt(dmy[3], 10);
    if (m >= 0 && m < 12 && y >= 2000 && y <= 2099) {
      return `${FULL_MONTH_NAMES[m]} ${y}`;
    }
  }

  // 3. DDMMYYYY (e.g. 22092026 as in IDFC statement: 20000000682860_22092026_114240890.pdf)
  const ddmmyyyy = s.match(/(?:^|[^0-9])(\d{2})(\d{2})(20\d{2})(?:[^0-9]|$)/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const m = parseInt(ddmmyyyy[2], 10) - 1;
    const y = parseInt(ddmmyyyy[3], 10);
    if (day >= 1 && day <= 31 && m >= 0 && m < 12) {
      return `${FULL_MONTH_NAMES[m]} ${y}`;
    }
  }

  return null;
}

/**
 * Returns formatted "Month Year" for a statement if statement_date or filename has a date,
 * otherwise returns null so caller can fallback to filename as the OR condition.
 */
export function getStatementMonthYear(
  statementDate?: string | null,
  filename?: string | null
): string | null {
  // 1. Try statement_date first
  if (statementDate) {
    const fromDate = parseDateToMonthYear(statementDate);
    if (fromDate) return fromDate;
  }

  // 2. Try filename second
  if (filename) {
    const fromFilename = parseFilenameToMonthYear(filename);
    if (fromFilename) return fromFilename;
  }

  return null;
}


