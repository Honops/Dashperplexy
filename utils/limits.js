// utils/limits.js
import { getUpcomingEvents, isEventDateConflict } from '../logic/eventLogic.js';
import { toDateOnlyString } from '../logic/menuLogic.js';

/**
 * Vérifie si on peut créer / modifier un plat événementiel pour une date donnée.
 *
 * Règles :
 * - pas plus de 4 événements futurs (y compris celui de cette date),
 * - un seul événement par jour (hors plat en cours d’édition).
 *
 * @param {object} supabaseClient - client Supabase
 * @param {string} targetDateYmd - date cible au format "YYYY-MM-DD"
 * @param {number|null} currentDishId - id du plat en cours d’édition (null si création)
 *
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export async function checkCanCreateEventForDate(
  supabaseClient,
  targetDateYmd,
  currentDishId = null
) {
  if (!targetDateYmd) {
    return { ok: false, message: 'Date de l’événement manquante.' };
  }

  try {
    // Récupérer tous les plats événementiels
    const { data, error } = await supabaseClient
      .from('menu_items')
      .select('*')
      .eq('menu_type', 'evenement');

    if (error) {
      console.error(error);
      return {
        ok: false,
        message: 'Erreur lors de la vérification des événements existants.',
      };
    }

    const events = Array.isArray(data) ? data : [];

    // 1) Conflit de date : un seul événement par jour
    const hasConflict = isEventDateConflict(events, targetDateYmd, currentDishId);
    if (hasConflict) {
      return {
        ok: false,
        message:
          'Il existe déjà un événement à cette date. Supprimez-le ou modifiez-le avant d’en créer un autre.',
      };
    }

    // 2) Maximum 4 événements programmés (futurs à partir d’aujourd’hui)
    const todayStr = toDateOnlyString(new Date());
    const upcoming = getUpcomingEvents(events, new Date(todayStr));

    // Si on édite un événement déjà futur, on doit exclure ce plat du comptage
    const filteredUpcoming = upcoming.filter((evt) => {
      if (currentDishId != null && evt.id === currentDishId) return false;
      return true;
    });

    if (filteredUpcoming.length >= 4) {
      return {
        ok: false,
        message:
          'Vous avez déjà 4 événements programmés. Supprimez-en un avant d’en ajouter un nouveau.',
      };
    }

    return { ok: true, message: '' };
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      message: 'Erreur inattendue lors de la vérification des limites.',
    };
  }
}
