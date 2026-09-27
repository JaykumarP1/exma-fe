export interface TagBadgeStyle {
  bg: string;
  text: string;
  border: string;
}

export const PRESET_BANK_TAGS: string[] = [
  'Banking',
  'CC',
  'Loan',
  'Savings',
  'Investment',
  'Salary',
  'Wallet',
  'Current',
  'Commercial'
];

export const getTagColor = (tag: string): TagBadgeStyle => {
  const t = (tag || '').trim().toLowerCase();

  if (t === 'banking' || t === 'bank') {
    return {
      bg: 'rgba(56, 189, 248, 0.12)',
      text: '#38bdf8',
      border: 'rgba(56, 189, 248, 0.32)'
    };
  }
  if (t === 'cc' || t === 'credit card' || t === 'credit cards' || t === 'credit') {
    return {
      bg: 'rgba(168, 85, 247, 0.14)',
      text: '#c084fc',
      border: 'rgba(168, 85, 247, 0.35)'
    };
  }
  if (t === 'loan' || t === 'loans' || t === 'emi' || t === 'mortgage') {
    return {
      bg: 'rgba(245, 158, 11, 0.14)',
      text: '#fbbf24',
      border: 'rgba(245, 158, 11, 0.35)'
    };
  }
  if (t === 'savings' || t === 'saving') {
    return {
      bg: 'rgba(16, 185, 129, 0.14)',
      text: '#34d399',
      border: 'rgba(16, 185, 129, 0.35)'
    };
  }
  if (t === 'investment' || t === 'investments' || t === 'demat' || t === 'stocks' || t === 'mutual funds') {
    return {
      bg: 'rgba(129, 140, 248, 0.14)',
      text: '#818cf8',
      border: 'rgba(129, 140, 248, 0.35)'
    };
  }
  if (t === 'salary' || t === 'payroll') {
    return {
      bg: 'rgba(20, 184, 166, 0.14)',
      text: '#2dd4bf',
      border: 'rgba(20, 184, 166, 0.35)'
    };
  }
  if (t === 'wallet' || t === 'wallets' || t === 'upi') {
    return {
      bg: 'rgba(244, 63, 94, 0.14)',
      text: '#fb7185',
      border: 'rgba(244, 63, 94, 0.35)'
    };
  }
  if (t === 'current' || t === 'checking') {
    return {
      bg: 'rgba(96, 165, 250, 0.14)',
      text: '#60a5fa',
      border: 'rgba(96, 165, 250, 0.35)'
    };
  }
  if (t === 'commercial' || t === 'corporate' || t === 'business') {
    return {
      bg: 'rgba(217, 70, 239, 0.14)',
      text: '#e879f9',
      border: 'rgba(217, 70, 239, 0.35)'
    };
  }

  // Fallback for custom tags
  return {
    bg: 'rgba(148, 163, 184, 0.12)',
    text: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.28)'
  };
};

export const parseBankTags = (tags?: string[], category?: string): string[] => {
  if (tags && Array.isArray(tags) && tags.length > 0) {
    return tags.map((t) => t.trim()).filter(Boolean);
  }
  if (category && category.trim()) {
    return category
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return ['Banking'];
};

