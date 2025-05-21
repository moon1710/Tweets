
interface User {
  id: string;
  username: string;
  avatarInitial: string;
}

interface Twist {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  parentId?: string | null;
}

// --- Simulación de Backend en Memoria ---
let currentUser: User = { id: 'user1', username: 'UsuarioActual', avatarInitial: 'U' };
let twists: Twist[] = [];
let nextTwistId = 1;

// --- Selectores del DOM ---
const newTwistForm = document.querySelector<HTMLFormElement>('#newTwistForm');
const twistContentInput = document.querySelector<HTMLTextAreaElement>('#twistContent');
const charCounter = document.querySelector<HTMLSpanElement>('#charCounter');
const twistsContainer = document.querySelector<HTMLDivElement>('#twistsContainer');

// --- Utilidades ---
const generateId = (): string => `twist-${nextTwistId++}`;

const formatDate = (date: Date): string =>
  `${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} · ` +
  date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

const escapeHTML = (str: string): string => {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
};

// --- Renderizado ---

function createTwistElement(twist: Twist, isReply = false): HTMLElement {
  const twistCard = document.createElement('article');
  twistCard.className = `twist-card ${isReply ? 'reply-card' : ''} animate-fade-in`;
  twistCard.dataset.twistId = twist.id;

  const user = currentUser; 
  twistCard.innerHTML = `
      <div class="twist-header">
        <div class="twist-avatar">${user.avatarInitial}</div>
        <div class="twist-userinfo">
          <span class="username">${user.username}</span>
          <span class="timestamp">${formatDate(twist.timestamp)}</span>
        </div>
      </div>
      <p class="twist-content">${escapeHTML(twist.content)}</p>
      <div class="twist-actions">
        <button class="btn btn-light btn-reply" data-twist-id="${twist.id}">Responder</button>
      </div>
      <div class="reply-form-container"></div>
      <div class="thread-container" id="thread-for-${twist.id}"></div>
    `;

  // Event: responder
  twistCard.querySelector<HTMLButtonElement>('.btn-reply')
    ?.addEventListener('click', () => toggleReplyForm(twist.id, twistCard));

  // Scroll suave al crear
  setTimeout(() => twistCard.scrollIntoView({ behavior: 'smooth' }), 100);

  return twistCard;
}

function renderTwists(): void {
  if (!twistsContainer) return;
  twistsContainer.innerHTML = '';

  const topLevel = twists.filter(t => !t.parentId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  topLevel.forEach(twist => {
    const el = createTwistElement(twist);
    twistsContainer.append(el);
    renderReplies(twist, el);
  });
}

function renderReplies(parent: Twist, parentEl: HTMLElement): void {
  const container = parentEl.querySelector<HTMLDivElement>(`#thread-for-${parent.id}`);
  if (!container) return;
  container.innerHTML = '';

  const replies = twists
    .filter(t => t.parentId === parent.id)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  replies.forEach(reply => {
    const repEl = createTwistElement(reply, true);
    container.append(repEl);
    renderReplies(reply, repEl);
  });
}

// --- Lógica de Twists ---

function addTwist(content: string, parentId: string | null = null): void {
  const text = content.trim();
  if (!text) return;

  const newTwist: Twist = { id: generateId(), userId: currentUser.id, content: text, timestamp: new Date(), parentId };
  twists.push(newTwist);

  if (parentId) {
    const parentCard = document.querySelector<HTMLElement>(`.twist-card[data-twist-id="${parentId}"]`);
    parentCard && renderReplies(twists.find(t => t.id === parentId)!, parentCard);
  } else {
    renderTwists();
    if (twistContentInput) {
      twistContentInput.value = '';
      updateCharCounter();
    }
  }
}

function toggleReplyForm(twistId: string, cardEl: HTMLElement): void {
  const container = cardEl.querySelector<HTMLDivElement>('.reply-form-container');
  if (!container) return;

  const open = container.classList.toggle('open-reply');
  if (open) {
    container.innerHTML = `
        <form class="reply-form animate-fade-in">
          <textarea rows="3" maxlength="280" required placeholder="Escribe tu respuesta..."></textarea>
          <div class="twist-form-footer">
            <span class="char-counter-reply">280</span>
            <button type="submit" class="btn btn-primary btn-sm">Responder</button>
          </div>
        </form>
      `;
    const form = container.querySelector('form') as HTMLFormElement;
    const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
    const counter = form.querySelector<HTMLSpanElement>('.char-counter-reply')!;

    textarea.addEventListener('input', () => {
      const rem = 280 - textarea.value.length;
      counter.textContent = `\${rem}`;
      counter.style.color = rem < 20 ? (rem < 0 ? 'red' : 'orange') : '';
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      addTwist(textarea.value, twistId);
      container.classList.remove('open-reply');
      container.innerHTML = '';
    });

    textarea.focus();
  } else {
    container.innerHTML = '';
  }
}

function updateCharCounter(): void {
  if (!twistContentInput || !charCounter) return;
  const rem = 280 - twistContentInput.value.length;
  charCounter.textContent = `${rem}`;
  charCounter.style.color = rem < 20 ? (rem < 0 ? 'red' : 'orange') : '';
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
  // Datos de ejemplo
  twists = [
    { id: generateId(), userId: 'user2', content: '¡Hola mundo!', timestamp: new Date(Date.now() - 3600000), parentId: null },
    { id: generateId(), userId: 'user3', content: 'Probando hilos...', timestamp: new Date(Date.now() - 1800000), parentId: null }
  ];
  // Ejemplo de respuesta
  const parent = twists[1];
  twists.push({ id: generateId(), userId: 'user1', content: '¡Aquí respondo!', timestamp: new Date(Date.now() - 1700000), parentId: parent.id });

  // Listeners form
  newTwistForm?.addEventListener('submit', e => {
    e.preventDefault();
    if (twistContentInput) addTwist(twistContentInput.value);
  });
  twistContentInput?.addEventListener('input', updateCharCounter);
  updateCharCounter();

  renderTwists();
});
