import { SelectOption } from '../components/ui/Select';

export const DEFAULT_EXPENSE_CATEGORIES = [
  'General',
  'Software',
  'Travel',
  'Equipment',
  'Meals',
  'Marketing'
];

const LOCAL_STORAGE_KEY = 'exma_saved_expense_categories';

export function getStoredCategories(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((c) => (typeof c === 'string' ? c.trim() : ''))
        .filter((c) => c.length > 0);
    }
  } catch (e) {
    console.warn('Failed to load categories from localStorage', e);
  }
  return [];
}

export function saveCategory(newCat: string): string[] {
  const trimmed = newCat.trim();
  if (!trimmed) return getAllCategories();

  const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  const stored = getStoredCategories();

  const existsInDefaults = DEFAULT_EXPENSE_CATEGORIES.some(
    (c) => c.toLowerCase() === formatted.toLowerCase()
  );
  const existsInStored = stored.some(
    (c) => c.toLowerCase() === formatted.toLowerCase()
  );

  if (!existsInDefaults && !existsInStored) {
    const updated = [...stored, formatted];
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save category to localStorage', e);
    }
  }

  return getAllCategories();
}

export function getAllCategories(additional: string[] = []): string[] {
  const stored = getStoredCategories();
  const set = new Set<string>();

  // Ensure default categories are present
  DEFAULT_EXPENSE_CATEGORIES.forEach((c) => set.add(c));
  // Add saved custom categories
  stored.forEach((c) => set.add(c));
  // Add any additional (e.g. from current statement rows or database)
  additional.forEach((c) => {
    if (c && typeof c === 'string' && c.trim().length > 0) {
      const formatted = c.trim().charAt(0).toUpperCase() + c.trim().slice(1);
      set.add(formatted);
    }
  });

  return Array.from(set);
}

export function getCategorySelectOptions(additional: string[] = []): SelectOption[] {
  return getAllCategories(additional).map((cat) => ({
    value: cat,
    label: cat
  }));
}

