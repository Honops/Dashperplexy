// js/menuPublic.js - ULTRA LÉGER
import { supabaseClient } from './supabaseClient.js';
import { getDishesForPublicMenu, toDateOnlyString } from './logic/menuLogic.js';
import { formatDateLongFr } from './logic/dateUtils.js';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  document.getElementById('todayDate').textContent = formatDateLongFr(new Date());
  await loadMenu();
}

async function loadMenu() {
  const menuList = document.getElementById('menuList');
  menuList.innerHTML = '<div class="loading">Chargement...</div>';

  const { data, error } = await supabaseClient
    .from('menu_items')
    .select('*')
    .eq('is_visible', true)
    .order('category')
    .order('name');

  if (error) {
    menuList.innerHTML = '<div class="loading">Erreur chargement</div>';
    return;
  }

  const today = new Date();
  const plats = getDishesForPublicMenu(data, today);
  
  updateHeader(plats, toDateOnlyString(today));
  renderPlats(menuList, plats);
}

function updateHeader(plats, todayStr) {
  const events = plats.filter(p => p.menu_type === 'evenement');
  
  if (events.length) {
    document.getElementById('menuType').textContent = `🎉 ${events[0].event_name}`;
    document.getElementById('eventBanner').style.display = 'block';
    document.getElementById('eventTitle').textContent = events[0].event_name;
  } else {
    document.getElementById('menuType').textContent = getMenuLabel(new Date());
  }
}

function renderPlats(container, plats) {
  container.innerHTML = '';
  
  plats.forEach(plat => {
    const div = document.createElement('div');
    div.className = 'plat';
    
    // Layout 2 images + vidéo
    let mediaHtml = '';
    if (plat.media_url) {
      if (plat.media_type === 'video') {
        mediaHtml = `<video class="media-video" src="${plat.media_url}" muted playsinline></video>`;
      } else {
        // Simulation 2 images (1 seule dispo = dupliquée)
        mediaHtml = `
          <div class="media-row">
            <img src="${plat.media_url}" alt="${plat.name}">
            <img src="${plat.media_url}" alt="${plat.name}">
            ${plat.media_type === 'video' ? `<video class="media-video" src="${plat.media_url}" muted playsinline></video>` : ''}
          </div>
        `;
      }
    }
    
    div.innerHTML = `
      ${mediaHtml}
      <div class="nom">${plat.name}</div>
      <span class="categ">${getCateg(plat.category)}</span>
      ${plat.menu_type === 'evenement' ? `<div class="event-tag">${plat.event_name}</div>` : ''}
      <div class="prix">${Number(plat.price).toFixed(2)} €</div>
    `;
    
    container.appendChild(div);
  });
}

function getCateg(cat) {
  const map = {entree:'🍽️ Entrée', plat:'🍲 Plat', dessert:'🍰 Dessert', boisson:'🥤 Boisson', promo:'🔥 Promo'};
  return map[cat] || cat;
}

function getMenuLabel(date) {
  const day = date.getDay();
  return day === 0 || day === 6 ? '🍹 Menu Week-end' : '🍽️ Menu Semaine';
}
