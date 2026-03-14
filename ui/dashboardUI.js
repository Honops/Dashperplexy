// ui/dashboardUI.js
import { supabaseClient } from '../supabaseClient.js';
import { getUpcomingEvents } from '../logic/eventLogic.js';
import { attachDishRowActions } from '../dishActions.js';

/**
 * Charge les plats depuis Supabase, applique les filtres,
 * rend le tableau + la liste des prochains événements.
 */
export async function loadAndRenderDishes() {
  const container = document.getElementById('menuDashboard');
  const upcomingList = document.getElementById('upcomingEventsList');

  if (!container) return;

  // Affichage temporaire
  container.innerHTML = '<p>Chargement...</p>';
  if (upcomingList) {
    upcomingList.innerHTML = '<li>Chargement...</li>';
  }

  // Fetch Supabase
  const { data, error } = await supabaseClient
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = '<p>Erreur lors du chargement des plats.</p>';
    if (upcomingList) {
      upcomingList.innerHTML = '<li>Erreur lors du chargement des événements.</li>';
    }
    return;
  }

  const allDishes = Array.isArray(data) ? data : [];

  // Appliquer filtres
  const filtered = applyFilters(allDishes);

  // Rendre tableau
  renderDishesTable(container, filtered);

  // Rendre prochains événements (max 4)
  if (upcomingList) {
    const upcoming = getUpcomingEvents(allDishes).slice(0, 4);
    renderUpcomingEvents(upcomingList, upcoming);
  }
}

/**
 * Applique les filtres de type de menu + catégorie.
 */
function applyFilters(allDishes) {
  const filterMenuType = document.getElementById('filterMenuType');
  const filterCategory = document.getElementById('filterCategory');

  let menuFilter = filterMenuType ? filterMenuType.value : 'all';
  let catFilter = filterCategory ? filterCategory.value : 'all';

  return allDishes.filter((dish) => {
    if (menuFilter !== 'all' && dish.menu_type !== menuFilter) return false;
    if (catFilter !== 'all' && dish.category !== catFilter) return false;
    return true;
  });
}

/**
 * Construit le tableau HTML des plats dans le container donné.
 */
function renderDishesTable(container, dishes) {
  if (!dishes.length) {
    container.innerHTML = '<p>Aucun plat trouvé pour ces filtres.</p>';
    return;
  }

  const table = document.createElement('table');

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Nom</th>
      <th>Prix</th>
      <th>Catégorie</th>
      <th>Type</th>
      <th>Événement</th>
      <th>Média</th>
      <th>Visible</th>
      <th>Actions</th>
    </tr>
  `;

  const tbody = document.createElement('tbody');

  dishes.forEach((dish) => {
    const tr = document.createElement('tr');

    // Nom
    const tdName = document.createElement('td');
    tdName.dataset.label = 'Nom';
    tdName.textContent = dish.name || '';
    tr.appendChild(tdName);

    // Prix
    const tdPrice = document.createElement('td');
    tdPrice.dataset.label = 'Prix';
    tdPrice.textContent =
      dish.price != null ? `${Number(dish.price).toFixed(2)} €` : '';
    tr.appendChild(tdPrice);

    // Catégorie
    const tdCategory = document.createElement('td');
    tdCategory.dataset.label = 'Catégorie';
    const catBadge = document.createElement('span');
    catBadge.className = 'badge category';
    catBadge.textContent = formatCategoryLabel(dish.category);
    tdCategory.appendChild(catBadge);
    tr.appendChild(tdCategory);

    // Type de menu
    const tdMenuType = document.createElement('td');
    tdMenuType.dataset.label = 'Type';
    const typeBadge = document.createElement('span');
    typeBadge.className = 'badge ' + getMenuBadgeClass(dish.menu_type);
    typeBadge.textContent = formatMenuTypeLabel(dish.menu_type);
    tdMenuType.appendChild(typeBadge);
    tr.appendChild(tdMenuType);

    // Événement (nom + date)
    const tdEvent = document.createElement('td');
    tdEvent.dataset.label = 'Événement';
    if (dish.menu_type === 'evenement') {
      const name = dish.event_name || 'Événement';
      const date = dish.event_date || '';
      tdEvent.textContent = date ? `${name} (${date})` : name;
    } else {
      tdEvent.textContent = '-';
    }
    tr.appendChild(tdEvent);

    // Média
    const tdMedia = document.createElement('td');
    tdMedia.dataset.label = 'Média';
    if (dish.media_url) {
      const link = document.createElement('a');
      link.href = dish.media_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = dish.media_type === 'video' ? 'Voir la vidéo' : 'Voir l’image';
      tdMedia.appendChild(link);
    } else {
      tdMedia.textContent = '—';
    }
    tr.appendChild(tdMedia);

    // Visible
    const tdVisible = document.createElement('td');
    tdVisible.dataset.label = 'Visible';
    tdVisible.textContent = dish.is_visible === false ? 'Non' : 'Oui';
    tr.appendChild(tdVisible);

    // Actions
    const tdActions = document.createElement('td');
    tdActions.dataset.label = 'Actions';
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'table-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.textContent = 'Éditer';
    editBtn.setAttribute('data-action', 'edit');

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'action-btn';
    toggleBtn.textContent = dish.is_visible === false ? 'Afficher' : 'Masquer';
    toggleBtn.setAttribute('data-action', 'toggle-visible');

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn danger';
    deleteBtn.textContent = 'Supprimer';
    deleteBtn.setAttribute('data-action', 'delete');

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(toggleBtn);
    actionsDiv.appendChild(deleteBtn);
    tdActions.appendChild(actionsDiv);
    tr.appendChild(tdActions);

    // Brancher les actions (édition, suppression...)
    attachDishRowActions(tr, dish);

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  container.innerHTML = '';
  container.appendChild(table);
}

/**
 * Remplit la liste des prochains événements.
 */
function renderUpcomingEvents(listEl, upcoming) {
  listEl.innerHTML = '';

  if (!upcoming.length) {
    listEl.innerHTML = '<li>Aucun événement programmé.</li>';
    return;
  }

  upcoming.forEach((evt) => {
    const li = document.createElement('li');
    const left = document.createElement('span');
    const right = document.createElement('span');

    left.textContent = evt.event_name || 'Événement';
    right.textContent = evt.event_date || '';

    li.appendChild(left);
    li.appendChild(right);
    listEl.appendChild(li);
  });
}

/**
 * Formatage lisible de la catégorie.
 */
function formatCategoryLabel(cat) {
  switch (cat) {
    case 'entree':
      return 'Entrée';
    case 'plat':
      return 'Plat';
    case 'dessert':
      return 'Dessert';
    case 'boisson':
      return 'Boisson';
    case 'promo':
      return 'Promo';
    default:
      return cat || '';
  }
}

/**
 * Formatage lisible du type de menu.
 */
function formatMenuTypeLabel(type) {
  switch (type) {
    case 'semaine':
      return 'Semaine';
    case 'weekend':
      return 'Week-end';
    case 'jour':
      return 'Menu du jour';
    case 'evenement':
      return 'Événement';
    default:
      return type || '';
  }
}

/**
 * Classe CSS du badge en fonction du type de menu.
 */
function getMenuBadgeClass(type) {
  switch (type) {
    case 'semaine':
      return 'menu-semaine';
    case 'weekend':
      return 'menu-weekend';
    case 'jour':
      return 'menu-jour';
    case 'evenement':
      return 'menu-evenement';
    default:
      return '';
  }
}
