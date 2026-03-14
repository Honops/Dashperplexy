// js/dishActions.js
import { supabaseClient } from './supabaseClient.js';
import { loadAndRenderDishes } from './ui/dashboardUI.js';
import { applyEventVisibilityRules } from './ui/eventUI.js';

/**
 * Prépare les listeners d’actions sur un plat individuel.
 * À appeler depuis dashboardUI.js après avoir généré les lignes du tableau.
 */
export function attachDishRowActions(rowElement, dish) {
  const editBtn = rowElement.querySelector('[data-action="edit"]');
  const deleteBtn = rowElement.querySelector('[data-action="delete"]');
  const toggleVisibleBtn = rowElement.querySelector('[data-action="toggle-visible"]');

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      fillFormForEdit(dish);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      await handleDeleteDish(dish.id);
    });
  }

  if (toggleVisibleBtn) {
    toggleVisibleBtn.addEventListener('click', async () => {
      await handleToggleVisible(dish);
    });
  }
}

/**
 * Remplit le formulaire pour passer en mode "édition".
 */
function fillFormForEdit(dish) {
  const dishIdInput = document.getElementById('dishId');
  const nameInput = document.getElementById('dishName');
  const priceInput = document.getElementById('dishPrice');
  const categorySelect = document.getElementById('dishCategory');
  const menuTypeSelect = document.getElementById('dishMenuType');
  const submitBtn = document.getElementById('submitDishBtn');
  const formMessage = document.getElementById('formMessage');

  if (!dishIdInput || !nameInput || !priceInput || !categorySelect || !menuTypeSelect) return;

  dishIdInput.value = dish.id;
  nameInput.value = dish.name || '';
  priceInput.value = dish.price != null ? dish.price : '';
  categorySelect.value = dish.category || '';
  menuTypeSelect.value = dish.menu_type || '';

  // Gérer l’UI événement
  applyEventVisibilityRules(dish);

  if (dish.menu_type === 'evenement') {
    const eventNameInput = document.getElementById('eventName');
    const eventDateInput = document.getElementById('eventDate');

    if (eventNameInput) eventNameInput.value = dish.event_name || '';
    if (eventDateInput && dish.event_date) {
      // event_date est en général une string 'YYYY-MM-DD'
      eventDateInput.value = dish.event_date;
    }
  }

  if (submitBtn) {
    submitBtn.textContent = 'Mettre à jour le plat';
  }

  if (formMessage) {
    formMessage.textContent = '';
    formMessage.className = 'form-message';
  }

  // Scroll vers le formulaire pour édition plus confortable
  document.getElementById('dishForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Supprime un plat.
 */
async function handleDeleteDish(dishId) {
  const confirmDelete = window.confirm('Voulez-vous vraiment supprimer ce plat ?');
  if (!confirmDelete) return;

  try {
    const { error } = await supabaseClient
      .from('menu_items')
      .delete()
      .eq('id', dishId);

    if (error) {
      console.error(error);
      alert('Erreur lors de la suppression du plat.');
      return;
    }

    await loadAndRenderDishes();
  } catch (err) {
    console.error(err);
    alert('Erreur inattendue lors de la suppression.');
  }
}

/**
 * Bascule la visibilité (is_visible) d’un plat.
 */
async function handleToggleVisible(dish) {
  try {
    const { error } = await supabaseClient
      .from('menu_items')
      .update({ is_visible: !dish.is_visible })
      .eq('id', dish.id);

    if (error) {
      console.error(error);
      alert('Erreur lors de la mise à jour de la visibilité.');
      return;
    }

    await loadAndRenderDishes();
  } catch (err) {
    console.error(err);
    alert('Erreur inattendue lors de la mise à jour.');
  }
}
