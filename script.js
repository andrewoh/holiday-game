const participantGrid = document.getElementById('participantGrid');
const form = document.getElementById('addParticipant');
const resetButton = document.getElementById('resetEliminations');

const demoParticipants = [
  { name: 'Alex Rivers', photo: makePlaceholder('Alex Rivers', ['#0ea5e9', '#7c3aed']) },
  { name: 'Jessie Moore', photo: makePlaceholder('Jessie Moore', ['#22c55e', '#0ea5e9']) },
  { name: 'Priya Patel', photo: makePlaceholder('Priya Patel', ['#f97316', '#ef4444']) },
];

function makePlaceholder(name, colors = ['#7dd3fc', '#a855f7']) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk[0].toUpperCase())
    .slice(0, 3)
    .join('');

  const [from, to] = colors;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">`
    + `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient></defs>`
    + `<rect fill="url(#g)" width="320" height="220" rx="24"/>`
    + `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="64" font-weight="800" fill="rgba(255,255,255,0.9)">${initials}</text>`
    + `</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function createParticipantCard({ name, photo }) {
  const card = document.createElement('button');
  card.className = 'participant-card';
  card.type = 'button';
  card.setAttribute('aria-label', `${name} card (click to toggle eliminated)`);

  const img = document.createElement('img');
  img.alt = `${name}'s photo`;
  img.src = photo;

  const meta = document.createElement('div');
  meta.className = 'meta';

  const nameEl = document.createElement('p');
  nameEl.className = 'name';
  nameEl.textContent = name;

  const status = document.createElement('span');
  status.className = 'status-pill';
  status.textContent = 'In';

  meta.append(nameEl, status);
  card.append(img, meta);

  card.addEventListener('click', () => {
    card.classList.toggle('eliminated');
    status.textContent = card.classList.contains('eliminated') ? 'Out' : 'In';
  });

  return card;
}

function addParticipant(participant) {
  const card = createParticipantCard(participant);
  participantGrid.appendChild(card);
}

function handleForm(event) {
  event.preventDefault();
  const name = form.elements.name.value.trim();
  const photoFile = form.elements.photo.files[0];
  const photoUrl = form.elements.photoUrl.value.trim();

  if (!name) return;

  const resetForm = () => {
    form.reset();
    form.elements.name.focus();
  };

  if (photoFile) {
    const reader = new FileReader();
    reader.onload = (e) => {
      addParticipant({ name, photo: e.target.result });
      resetForm();
    };
    reader.readAsDataURL(photoFile);
    return;
  }

  if (photoUrl) {
    addParticipant({ name, photo: photoUrl });
    resetForm();
    return;
  }

  addParticipant({ name, photo: makePlaceholder(name) });
  resetForm();
}

function resetEliminations() {
  const cards = participantGrid.querySelectorAll('.participant-card');
  cards.forEach((card) => {
    card.classList.remove('eliminated');
    const status = card.querySelector('.status-pill');
    if (status) status.textContent = 'In';
  });
}

function bootstrapDemo() {
  demoParticipants.forEach(addParticipant);
}

form.addEventListener('submit', handleForm);
resetButton.addEventListener('click', resetEliminations);
bootstrapDemo();
