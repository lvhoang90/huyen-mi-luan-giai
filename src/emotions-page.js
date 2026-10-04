import { createCharacter, EMOTIONS } from './character.js';
const crop = new URLSearchParams(location.search).has('crop');
const grid = document.getElementById('grid');
for (const [key, e] of Object.entries(EMOTIONS)) {
  const card = document.createElement('div'); card.className = 'card';
  const host = document.createElement('div'); host.className = 'host';
  card.append(host);
  card.insertAdjacentHTML('beforeend', `<b>${e.label}</b><span>${e.note}</span><code>[[${key}]]</code>`);
  grid.append(card);
  createCharacter(host, { crop }).setEmotion(key);
}
