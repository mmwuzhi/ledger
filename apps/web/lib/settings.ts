// ── Settings keys (localStorage) ─────────────────────────────────────────────

export const SETTINGS_KEYS = {
  hideIncome: 'mb_hide_income',
  multiCurrency: 'mb_multi_currency',
  currencies: 'mb_currencies',        // JSON array of { code, symbol }
  defaultCurrency: 'mb_default_currency', // string, e.g. 'JPY'
  ocrAutoAttach: 'mb_ocr_auto_attach',
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getBool(key: string, defaultVal = false): boolean {
  if (typeof window === 'undefined') return defaultVal;
  const v = localStorage.getItem(key);
  return v === null ? defaultVal : v === 'true';
}

export function setBool(key: string, val: boolean): void {
  localStorage.setItem(key, String(val));
}
