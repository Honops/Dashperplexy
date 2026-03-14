// ui/eventUI.js
import { getEventOptionsForSelect, resolveEventById } from '../logic/eventLogic.js';
import { formatDateYMD } from '../logic/dateUtils.js';

/**
 * Initialise le select des événements et la logique d’affichage
 * des champs date / nom custom.
 */
export function initEventUI() {
  const eventSelect = document.getElementById('eventSelect');
  const eventBlock = document.getElementById('eventBlock');

  if (!eventSelect || !eventBlock) return;

  // Injecter les options dans le select
  populateEventSelect(eventSelect);

  // Listener changement de type d’événement
  eventSelect.addEventListener('change', () => {
    updateEventFieldsVisibility();
  });

  // Premier état : en fonction du type de menu actuel
  applyEventVisibilityRules();
}

/**
 * Remplit le <select id="eventSelect"> avec les événements définis.
 */
function populateEventSelect(selectEl) {
  selectEl.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = 'Choisir un événement';
  selectEl.appendChild(placeholder);

  const options = getEventOptionsForSelect();
  options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    selectEl.appendChild(option);
  });
}

/**
 * Montre ou cache le bloc événement selon le type de menu sélectionné.
 * Si un plat est passé en paramètre (édition), on remplit les champs accordingly.
 *
 * @param {Object|null} dish - plat en cours d’édition (optionnel)
 */
export function applyEventVisibilityRules(dish = null) {
  const menuTypeSelect = document.getElementById('dishMenuType');
  const eventBlock = document.getElementById('eventBlock');
  const eventSelect = document.getElementById('eventSelect');
  const eventNameInput = document.getElementById('eventName');
  const eventDateInput = document.getElementById('eventDate');

  if (!menuTypeSelect || !eventBlock || !eventSelect) return;

  const menuType = menuTypeSelect.value;

  if (menuType === 'evenement') {
    eventBlock.style.display = 'block';

    if (dish && dish.menu_type === 'evenement') {
      // Si on édite un plat événementiel, on essaye de retrouver l’option correspondante
      // Si event_name correspond à un connu (Noël, Ramadan...), sinon "custom"
      const options = getEventOptionsForSelect();
      const matching = options.find((opt) => opt.label === dish.event_name);

      if (matching) {
        eventSelect.value = matching.value;
      } else {
        eventSelect.value = 'custom';
      }

      if (eventNameInput) {
        eventNameInput.value = dish.event_name || '';
      }
      if (eventDateInput && dish.event_date) {
        eventDateInput.value = dish.event_date;
      }
    } else {
      // Nouveau plat événementiel
      eventSelect.value = '';
      if (eventNameInput) eventNameInput.value = '';
      if (eventDateInput) eventDateInput.value = '';
    }

    updateEventFieldsVisibility();
  } else {
    eventBlock.style.display = 'none';
  }
}

/**
 * Gère l’affichage des champs date / nom custom selon le type d’événement choisi.
 */
function updateEventFieldsVisibility() {
  const eventSelect = document.getElementById('eventSelect');
  const eventDateGroup = document.getElementById('eventDateGroup');
  const eventNameGroup = document.getElementById('eventNameGroup');
  const eventDateInput = document.getElementById('eventDate');
  const eventNameInput = document.getElementById('eventName');

  if (!eventSelect || !eventDateGroup || !eventNameGroup) return;

  const selected = eventSelect.value;

  if (!selected) {
    eventDateGroup.style.display = 'none';
    eventNameGroup.style.display = 'none';
    return;
  }

  if (selected === 'custom') {
    // Custom : l’admin doit fournir nom + date
    eventNameGroup.style.display = 'block';
    eventDateGroup.style.display = 'block';
  } else {
    // Événement défini (fixed ou variable)
    const resolved = resolveEventById(selected, new Date());
    // Pour un événement défini, on calcule la date automatiquement
    if (eventDateInput && resolved.event_date) {
      eventDateInput.value = resolved.event_date;
    }
    if (eventNameInput) {
      eventNameInput.value = resolved.event_name || '';
    }

    // On montre juste la date (informative) et pas le nom custom
    eventDateGroup.style.display = 'block';
    eventNameGroup.style.display = 'none';
  }
}

/**
 * Lit les champs du formulaire pour un plat de type "evenement"
 * et renvoie { event_name, event_date, event_type }.
 */
export function getEventPayloadFromForm() {
  const eventSelect = document.getElementById('eventSelect');
  const eventDateInput = document.getElementById('eventDate');
  const eventNameInput = document.getElementById('eventName');

  if (!eventSelect || !eventDateInput || !eventNameInput) {
    return { event_name: null, event_date: null, event_type: null };
  }

  const selected = eventSelect.value;

  if (!selected) {
    return { event_name: null, event_date: null, event_type: null };
  }

  if (selected === 'custom') {
    const name = eventNameInput.value.trim();
    const dateVal = eventDateInput.value;
    if (!name || !dateVal) {
      return { event_name: null, event_date: null, event_type: 'custom' };
    }
    // On s’assure du format YYYY-MM-DD
    const dateStr = formatDateYMD(new Date(dateVal));
    return { event_name: name, event_date: dateStr, event_type: 'custom' };
  }

  // Événement connu
  const resolved = resolveEventById(selected, new Date());
  return {
    event_name: resolved.event_name,
    event_date: resolved.event_date,
    event_type: resolved.event_type,
  };
}
