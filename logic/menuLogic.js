// logic/menuLogic.js

/**
 * Détermine le type de menu "actif" pour une date donnée.
 * Priorité :
 * 1. S'il existe un événement ce jour-là => "evenement"
 * 2. Sinon, si c'est samedi ou dimanche => "weekend"
 * 3. Sinon, si tu as défini un "menu du jour" => "jour"
 * 4. Sinon => "semaine"
 *
 * @param {Date} dateObj - Date pour laquelle on veut le menu actif
 * @param {Array} eventsForDate - Liste des événements (plats) pour cette date
 * @param {boolean} hasDailyMenu - true si tu as au moins 1 plat de type "jour" pour cette date
 * @returns {string} "evenement" | "weekend" | "jour" | "semaine"
 */
export function getActiveMenuTypeForDate(dateObj, eventsForDate = [], hasDailyMenu = false) {
  if (eventsForDate && eventsForDate.length > 0) {
    return 'evenement';
  }

  if (isWeekend(dateObj)) {
    return 'weekend';
  }

  if (hasDailyMenu) {
    return 'jour';
  }

  return 'semaine';
}

/**
 * Retourne true si la date est un samedi ou dimanche.
 */
export function isWeekend(dateObj) {
  const day = dateObj.getDay(); // 0 = dimanche, 6 = samedi
  return day === 0 || day === 6;
}

/**
 * Filtre une liste complète de plats pour ne garder que ceux du menu "actif"
 * et visibles.
 *
 * @param {Array} allDishes - tous les plats de la BDD
 * @param {Date} dateObj - date du jour J
 * @returns {Array} plats filtrés
 */
export function getDishesForPublicMenu(allDishes, dateObj) {
  if (!Array.isArray(allDishes)) return [];

  // 1) récupérer tous les plats événementiels pour cette date
  const dateStr = toDateOnlyString(dateObj);
  const eventsForDate = allDishes.filter(
    (item) =>
      item.menu_type === 'evenement' &&
      item.event_date === dateStr &&
      item.is_visible !== false
  );

  // 2) vérifier si on a des "menu du jour" visibles
  const dailyDishes = allDishes.filter(
    (item) => item.menu_type === 'jour' && item.is_visible !== false
  );
  const hasDailyMenu = dailyDishes.length > 0;

  // 3) déterminer le type de menu actif
  const activeMenuType = getActiveMenuTypeForDate(dateObj, eventsForDate, hasDailyMenu);

  // 4) retourner les plats correspondants
  if (activeMenuType === 'evenement') {
    return eventsForDate;
  }

  if (activeMenuType === 'jour') {
    return dailyDishes;
  }

  if (activeMenuType === 'weekend') {
    return allDishes.filter(
      (item) => item.menu_type === 'weekend' && item.is_visible !== false
    );
  }

  // "semaine"
  return allDishes.filter(
    (item) => item.menu_type === 'semaine' && item.is_visible !== false
  );
}

/**
 * Convertit une Date en string "YYYY-MM-DD".
 */
export function toDateOnlyString(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
