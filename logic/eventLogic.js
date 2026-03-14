// logic/eventLogic.js

import { toDateOnlyString } from './menuLogic.js';

/**
 * Types d’événements supportés.
 *
 * - type "fixed" : date fixe chaque année (Noël, Nouvel An, Saint-Valentin…)
 * - type "variable" : nécessite un calcul ou configuration (Ramadan, Tabaski)
 * - type "custom" : défini par l’admin (nom + date saisis dans le dashboard)
 */
export const EVENT_DEFINITIONS = [
  // Événements à date fixe (exemple pour 2026, mais on peut utiliser l’année de la date cible)
  {
    id: 'noel',
    label: 'Noël',
    type: 'fixed',
    getDate: (year) => `${year}-12-25`,
  },
  {
    id: 'nouvel_an',
    label: 'Nouvel An',
    type: 'fixed',
    getDate: (year) => `${year}-01-01`,
  },
  {
    id: 'saint_valentin',
    label: 'Saint-Valentin',
    type: 'fixed',
    getDate: (year) => `${year}-02-14`,
  },

  // Événements à date variable : ici, on met des placeholders pour 2026.
  // Plus tard, tu pourras améliorer les calculs ou les rendre configurables.
  {
    id: 'ramadan',
    label: 'Ramadan',
    type: 'variable',
    // Exemple : date approximative pour 2026
    getDate: (year) => {
      if (year === 2026) return '2026-03-01';
      // fallback : 1er mars par défaut (à adapter)
      return `${year}-03-01`;
    },
  },
  {
    id: 'tabaski',
    label: 'Tabaski',
    type: 'variable',
    getDate: (year) => {
      if (year === 2026) return '2026-05-27';
      // fallback (à adapter selon les années)
      return `${year}-06-01`;
    },
  },

  // "custom" sera géré à part via un id spécial
];

/**
 * Retourne la liste des options d’événements pour le <select>.
 * On inclut une option "custom" à la fin.
 */
export function getEventOptionsForSelect() {
  const baseOptions = EVENT_DEFINITIONS.map((evt) => ({
    value: evt.id,
    label: evt.label,
    type: evt.type,
  }));

  baseOptions.push({
    value: 'custom',
    label: 'Événement personnalisé',
    type: 'custom',
  });

  return baseOptions;
}

/**
 * À partir d’un identifiant d’événement (noel, ramadan, custom, etc.)
 * et éventuellement d’un objet Date de référence, calcule:
 * - event_name (nom qui ira en base)
 * - event_date (string "YYYY-MM-DD")
 * - event_type ("fixed" | "variable" | "custom")
 *
 * Pour "custom", on ne calcule pas : ce sera le formulaire qui fournira
 * nom + date.
 *
 * @param {string} eventId
 * @param {Date} [referenceDate] - sert à déterminer l’année (par défaut: année en cours)
 * @returns {{event_name: string|null, event_date: string|null, event_type: string}}
 */
export function resolveEventById(eventId, referenceDate = new Date()) {
  if (!eventId) {
    return { event_name: null, event_date: null, event_type: null };
  }

  if (eventId === 'custom') {
    return { event_name: null, event_date: null, event_type: 'custom' };
  }

  const def = EVENT_DEFINITIONS.find((evt) => evt.id === eventId);
  if (!def) {
    return { event_name: null, event_date: null, event_type: null };
  }

  const year = referenceDate.getFullYear();
  const dateStr = def.getDate ? def.getDate(year) : null;

  return {
    event_name: def.label,
    event_date: dateStr,
    event_type: def.type,
  };
}

/**
 * Filtre une liste de plats pour ne garder que les événements futurs (ou à partir d’aujourd’hui),
 * triés par date croissante.
 *
 * @param {Array} dishes - tous les plats (dont certains événementiels)
 * @param {Date} [fromDate] - date de départ (par défaut: aujourd’hui)
 * @returns {Array} événements triés
 */
export function getUpcomingEvents(dishes, fromDate = new Date()) {
  if (!Array.isArray(dishes)) return [];

  const fromStr = toDateOnlyString(fromDate);

  const events = dishes.filter((item) => {
    if (item.menu_type !== 'evenement') return false;
    if (!item.event_date) return false;
    if (item.is_visible === false) return false;

    return item.event_date >= fromStr;
  });

  // Tri par date croissante
  events.sort((a, b) => {
    if (a.event_date < b.event_date) return -1;
    if (a.event_date > b.event_date) return 1;
    return 0;
  });

  return events;
}

/**
 * Vérifie si une date est déjà utilisée par au moins un événement différent (id différent).
 * Utilise une liste de plats événementiels (déjà filtrés depuis Supabase).
 *
 * @param {Array} events - plats événementiels
 * @param {string} targetDate - "YYYY-MM-DD"
 * @param {number|null} currentDishId - si on édite un plat, on exclut cet id
 * @returns {boolean} true si la date est déjà prise
 */
export function isEventDateConflict(events, targetDate, currentDishId = null) {
  return events.some((evt) => {
    if (evt.event_date !== targetDate) return false;
    if (currentDishId != null && evt.id === currentDishId) return false;
    return true;
  });
}
