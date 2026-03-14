// js/dashboardInit.js
import { supabaseClient } from './supabaseClient.js';
// Ces imports pointeront vers les fichiers que l’on va créer ensuite
import { setupAddDishForm } from './addDish.js';
import { loadAndRenderDishes } from './ui/dashboardUI.js';
import { initEventUI } from './ui/eventUI.js';

document.addEventListener('DOMContentLoaded', () => {
  initTodayHeader();
  initFilters();
  initFormReset();

  // Initialiser UI des événements (options, affichage dynamique)
  initEventUI();

  // Initialiser la logique du formulaire d’ajout / édition
  setupAddDishForm();

  // Charger les plats existants et les afficher dans le tableau
  loadAndRenderDishes();
});

/**
 * Affiche la date du jour dans le header ("Aujourd’hui", "13 mars 2026")
 */
function initTodayHeader() {
  const todayDateEl = document.getElementById('todayDate');
  if (!todayDateEl) return;

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  todayDateEl.textContent = formatter.format(now);
}

/**
 * Initialise les filtres (menu_type, catégorie).
 * Pour l’instant, on se contente juste d’écouter les changements
 * et de rappeler loadAndRenderDishes(). La logique détaillée sera dans dashboardUI.js.
 */
function initFilters() {
  const filterMenuType = document.getElementById('filterMenuType');
  const filterCategory = document.getElementById('filterCategory');

  if (filterMenuType) {
    filterMenuType.addEventListener('change', () => {
      loadAndRenderDishes();
    });
  }

  if (filterCategory) {
    filterCategory.addEventListener('change', () => {
      loadAndRenderDishes();
    });
  }
}

/**
 * Bouton "Réinitialiser" du formulaire :
 * on nettoie les champs, enlève l’id de plat en cours d’édition, remet le bouton en mode "Ajouter".
 */
function initFormReset() {
  const resetBtn = document.getElementById('resetDishBtn');
  const dishForm = document.getElementById('dishForm');
  const dishIdInput = document.getElementById('dishId');
  const submitBtn = document.getElementById('submitDishBtn');
  const formMessage = document.getElementById('formMessage');

  if (!resetBtn || !dishForm) return;

  resetBtn.addEventListener('click', () => {
    dishForm.reset();
    if (dishIdInput) dishIdInput.value = '';
    if (submitBtn) submitBtn.textContent = 'Ajouter le plat';
    if (formMessage) {
      formMessage.textContent = '';
      formMessage.className = 'form-message';
    }

    // Masquer le bloc événement si visible
    const eventBlock = document.getElementById('eventBlock');
    if (eventBlock) eventBlock.style.display = 'none';
  });
}
