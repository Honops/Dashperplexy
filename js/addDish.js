// js/addDish.js
import { supabaseClient } from './supabaseClient.js';
import { loadAndRenderDishes } from './ui/dashboardUI.js';
import { applyEventVisibilityRules, getEventPayloadFromForm } from './ui/eventUI.js';
import { checkCanCreateEventForDate } from './utils/limits.js';

export function setupAddDishForm() {
  const form = document.getElementById('dishForm');
  const menuTypeSelect = document.getElementById('dishMenuType');

  if (!form) return;

  // Affichage dynamique du bloc événement en fonction du type de menu
  if (menuTypeSelect) {
    menuTypeSelect.addEventListener('change', () => {
      applyEventVisibilityRules();
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSubmit();
  });
}

async function handleSubmit() {
  const dishId = document.getElementById('dishId')?.value || '';
  const name = document.getElementById('dishName')?.value?.trim();
  const price = parseFloat(document.getElementById('dishPrice')?.value || '0');
  const category = document.getElementById('dishCategory')?.value;
  const menuType = document.getElementById('dishMenuType')?.value;
  const mediaInput = document.getElementById('dishMedia');
  const formMessage = document.getElementById('formMessage');
  const submitBtn = document.getElementById('submitDishBtn');

  if (!name || !price || !category || !menuType) {
    showFormMessage('Veuillez remplir tous les champs obligatoires.', 'error');
    return;
  }

  // Gestion événement : vérifier limites et récupérer event_name / event_date
  let eventPayload = { event_name: null, event_date: null };

  if (menuType === 'evenement') {
    eventPayload = getEventPayloadFromForm(); // { event_name, event_date, eventType }
    if (!eventPayload.event_name || !eventPayload.event_date) {
      showFormMessage('Veuillez choisir un événement ou renseigner son nom et sa date.', 'error');
      return;
    }

    // Vérifier limites : pas plus de 4 events futurs + pas 2 events le même jour
    const canCreate = await checkCanCreateEventForDate(
      supabaseClient,
      eventPayload.event_date,
      dishId ? Number(dishId) : null
    );

    if (!canCreate.ok) {
      showFormMessage(canCreate.message, 'error');
      return;
    }
  }

  // Upload média si nécessaire
  let media_url = null;
  let media_type = null;

  if (mediaInput && mediaInput.files && mediaInput.files[0]) {
    try {
      const { uploadMedia } = await import('./utils/mediaUpload.js');
      const uploaded = await uploadMedia(mediaInput.files[0]);
      media_url = uploaded.media_url;
      media_type = uploaded.media_type;
    } catch (err) {
      console.error(err);
      showFormMessage('Erreur lors du téléchargement du média.', 'error');
      return;
    }
  }

  const payload = {
    name,
    price,
    category,
    menu_type: menuType,
    event_name: eventPayload.event_name,
    event_date: eventPayload.event_date,
    media_url,
    media_type,
    is_visible: true,
  };

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = dishId ? 'Mise à jour...' : 'Ajout...';
    }

    let error = null;

    if (dishId) {
      // UPDATE
      const { error: updateError } = await supabaseClient
        .from('menu_items')
        .update(payload)
        .eq('id', dishId);

      error = updateError;
    } else {
      // INSERT
      const { error: insertError } = await supabaseClient
        .from('menu_items')
        .insert([payload]);

      error = insertError;
    }

    if (error) {
      console.error(error);
      showFormMessage("Erreur lors de l'enregistrement du plat.", 'error');
    } else {
      showFormMessage(
        dishId ? 'Plat mis à jour avec succès.' : 'Plat ajouté avec succès.',
        'success'
      );
      resetFormKeepEventVisibility();
      await loadAndRenderDishes();
    }
  } catch (err) {
    console.error(err);
    showFormMessage("Erreur inattendue lors de l'enregistrement.", 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = dishId ? 'Mettre à jour le plat' : 'Ajouter le plat';
    }
  }
}

function showFormMessage(text, type) {
  const formMessage = document.getElementById('formMessage');
  if (!formMessage) return;
  formMessage.textContent = text;
  formMessage.className = 'form-message ' + (type === 'success' ? 'success' : 'error');
}

/**
 * Réinitialise le formulaire mais garde la logique d’affichage/masquage du bloc événement
 * en fonction du type de menu actuellement sélectionné.
 */
function resetFormKeepEventVisibility() {
  const form = document.getElementById('dishForm');
  const dishIdInput = document.getElementById('dishId');
  const submitBtn = document.getElementById('submitDishBtn');

  if (!form) return;
  form.reset();
  if (dishIdInput) dishIdInput.value = '';
  if (submitBtn) submitBtn.textContent = 'Ajouter le plat';

  // Réappliquer la logique d’UI pour le bloc événement
  applyEventVisibilityRules();

  const formMessage = document.getElementById('formMessage');
  if (formMessage) {
    // On garde le message si success, sinon on efface
    if (!formMessage.classList.contains('success')) {
      formMessage.textContent = '';
      formMessage.className = 'form-message';
    }
  }
}
