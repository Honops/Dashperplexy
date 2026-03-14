// logic/dateUtils.js

/**
 * Retourne une Date normalisée à minuit (local).
 */
export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Ajoute un nombre de jours à une date.
 */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Formate une date en "YYYY-MM-DD".
 */
export function formatDateYMD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formate une date en français lisible, ex: "13 mars 2026".
 */
export function formatDateLongFr(date) {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return formatter.format(d);
}

/**
 * Compare deux dates au format "YYYY-MM-DD".
 * Retourne -1 si a<b, 0 si égal, 1 si a>b.
 */
export function compareYmd(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
