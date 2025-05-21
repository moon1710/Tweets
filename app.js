// --- Simulación de Backend en Memoria ---
var currentUser = { id: 'user1', username: 'UsuarioActual', avatarInitial: 'U' };
var twists = [];
var nextTwistId = 1;
// --- Selectores del DOM ---
var newTwistForm = document.querySelector('#newTwistForm');
var twistContentInput = document.querySelector('#twistContent');
var charCounter = document.querySelector('#charCounter');
var twistsContainer = document.querySelector('#twistsContainer');
// --- Utilidades ---
var generateId = function () { return "twist-".concat(nextTwistId++); };
var formatDate = function (date) {
    return "".concat(date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }), " \u00B7 ") +
        date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};
var escapeHTML = function (str) {
    var p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
};
// --- Renderizado ---
function createTwistElement(twist, isReply) {
    var _a;
    if (isReply === void 0) { isReply = false; }
    var twistCard = document.createElement('article');
    twistCard.className = "twist-card ".concat(isReply ? 'reply-card' : '', " animate-fade-in");
    twistCard.dataset.twistId = twist.id;
    var user = currentUser;
    twistCard.innerHTML = "\n      <div class=\"twist-header\">\n        <div class=\"twist-avatar\">".concat(user.avatarInitial, "</div>\n        <div class=\"twist-userinfo\">\n          <span class=\"username\">").concat(user.username, "</span>\n          <span class=\"timestamp\">").concat(formatDate(twist.timestamp), "</span>\n        </div>\n      </div>\n      <p class=\"twist-content\">").concat(escapeHTML(twist.content), "</p>\n      <div class=\"twist-actions\">\n        <button class=\"btn btn-light btn-reply\" data-twist-id=\"").concat(twist.id, "\">Responder</button>\n      </div>\n      <div class=\"reply-form-container\"></div>\n      <div class=\"thread-container\" id=\"thread-for-").concat(twist.id, "\"></div>\n    ");
    // Event: responder
    (_a = twistCard.querySelector('.btn-reply')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () { return toggleReplyForm(twist.id, twistCard); });
    // Scroll suave al crear
    setTimeout(function () { return twistCard.scrollIntoView({ behavior: 'smooth' }); }, 100);
    return twistCard;
}
function renderTwists() {
    if (!twistsContainer)
        return;
    twistsContainer.innerHTML = '';
    var topLevel = twists.filter(function (t) { return !t.parentId; })
        .sort(function (a, b) { return b.timestamp.getTime() - a.timestamp.getTime(); });
    topLevel.forEach(function (twist) {
        var el = createTwistElement(twist);
        twistsContainer.append(el);
        renderReplies(twist, el);
    });
}
function renderReplies(parent, parentEl) {
    var container = parentEl.querySelector("#thread-for-".concat(parent.id));
    if (!container)
        return;
    container.innerHTML = '';
    var replies = twists
        .filter(function (t) { return t.parentId === parent.id; })
        .sort(function (a, b) { return a.timestamp.getTime() - b.timestamp.getTime(); });
    replies.forEach(function (reply) {
        var repEl = createTwistElement(reply, true);
        container.append(repEl);
        renderReplies(reply, repEl);
    });
}
// --- Lógica de Twists ---
function addTwist(content, parentId) {
    if (parentId === void 0) { parentId = null; }
    var text = content.trim();
    if (!text)
        return;
    var newTwist = { id: generateId(), userId: currentUser.id, content: text, timestamp: new Date(), parentId: parentId };
    twists.push(newTwist);
    if (parentId) {
        var parentCard = document.querySelector(".twist-card[data-twist-id=\"".concat(parentId, "\"]"));
        parentCard && renderReplies(twists.find(function (t) { return t.id === parentId; }), parentCard);
    }
    else {
        renderTwists();
        if (twistContentInput) {
            twistContentInput.value = '';
            updateCharCounter();
        }
    }
}
function toggleReplyForm(twistId, cardEl) {
    var container = cardEl.querySelector('.reply-form-container');
    if (!container)
        return;
    var open = container.classList.toggle('open-reply');
    if (open) {
        container.innerHTML = "\n        <form class=\"reply-form animate-fade-in\">\n          <textarea rows=\"3\" maxlength=\"280\" required placeholder=\"Escribe tu respuesta...\"></textarea>\n          <div class=\"twist-form-footer\">\n            <span class=\"char-counter-reply\">280</span>\n            <button type=\"submit\" class=\"btn btn-primary btn-sm\">Responder</button>\n          </div>\n        </form>\n      ";
        var form = container.querySelector('form');
        var textarea_1 = form.querySelector('textarea');
        var counter_1 = form.querySelector('.char-counter-reply');
        textarea_1.addEventListener('input', function () {
            var rem = 280 - textarea_1.value.length;
            counter_1.textContent = "${rem}";
            counter_1.style.color = rem < 20 ? (rem < 0 ? 'red' : 'orange') : '';
        });
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            addTwist(textarea_1.value, twistId);
            container.classList.remove('open-reply');
            container.innerHTML = '';
        });
        textarea_1.focus();
    }
    else {
        container.innerHTML = '';
    }
}
function updateCharCounter() {
    if (!twistContentInput || !charCounter)
        return;
    var rem = 280 - twistContentInput.value.length;
    charCounter.textContent = "".concat(rem);
    charCounter.style.color = rem < 20 ? (rem < 0 ? 'red' : 'orange') : '';
}
// --- Inicialización ---
document.addEventListener('DOMContentLoaded', function () {
    // Datos de ejemplo
    twists = [
        { id: generateId(), userId: 'user2', content: '¡Hola mundo!', timestamp: new Date(Date.now() - 3600000), parentId: null },
        { id: generateId(), userId: 'user3', content: 'Probando hilos...', timestamp: new Date(Date.now() - 1800000), parentId: null }
    ];
    // Ejemplo de respuesta
    var parent = twists[1];
    twists.push({ id: generateId(), userId: 'user1', content: '¡Aquí respondo!', timestamp: new Date(Date.now() - 1700000), parentId: parent.id });
    // Listeners form
    newTwistForm === null || newTwistForm === void 0 ? void 0 : newTwistForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (twistContentInput)
            addTwist(twistContentInput.value);
    });
    twistContentInput === null || twistContentInput === void 0 ? void 0 : twistContentInput.addEventListener('input', updateCharCounter);
    updateCharCounter();
    renderTwists();
});
