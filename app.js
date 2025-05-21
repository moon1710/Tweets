// --- Datos en Memoria (Simulación de Backend) ---
var currentUser = {
    id: "user1",
    username: "UsuarioActual",
    avatarInitial: "U",
}; // Simulación de usuario logueado
var twists = [];
var nextTwistId = 1;
// --- Selectores del DOM ---
var newTwistForm = document.getElementById("newTwistForm");
var twistContentInput = document.getElementById("twistContent");
var charCounter = document.getElementById("charCounter");
var twistsContainer = document.getElementById("twistsContainer");
// --- Funciones ---
function generateId() {
    return "twist-".concat(nextTwistId++);
}
function formatDate(date) {
    return (
        date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) +
        " · " +
        date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
    );
}
function createTwistElement(twist, isReply) {
    if (isReply === void 0) {
        isReply = false;
    }
    var user = currentUser; 
    var twistCard = document.createElement("article");
    twistCard.classList.add("twist-card");
    twistCard.dataset.twistId = twist.id;
    if (isReply) {
        twistCard.style.marginLeft = "0"; 
    }
    twistCard.innerHTML =
        '\n        <div class="twist-header">\n            <div class="twist-avatar">'
            .concat(
                user.avatarInitial,
                '</div>\n            <div class="twist-userinfo">\n                <span class="username">'
            )
            .concat(
                user.username,
                '</span>\n                <span class="timestamp">'
            )
            .concat(
                formatDate(twist.timestamp),
                '</span>\n            </div>\n        </div>\n        <p class="twist-content">'
            )
            .concat(
                escapeHTML(twist.content),
                '</p>\n        <div class="twist-actions">\n            <button class="btn btn-light btn-reply" data-twist-id="'
            )
            .concat(
                twist.id,
                '">Responder</button>\n            </div>\n        <div class="reply-form-container" style="display: none;"></div>\n        <div class="thread-container" id="thread-for-'
            )
            .concat(twist.id, '"></div>\n    ');
    var replyButton = twistCard.querySelector(".btn-reply");
    replyButton.addEventListener("click", function () {
        return toggleReplyForm(twist.id, twistCard);
    });
    return twistCard;
}
function escapeHTML(str) {
    var p = document.createElement("p");
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}
function renderTwists() {
    if (!twistsContainer) return;
    twistsContainer.innerHTML = ""; 
    var topLevelTwists = twists.filter(function (t) {
        return !t.parentId;
    });
    topLevelTwists.sort(function (a, b) {
        return b.timestamp.getTime() - a.timestamp.getTime();
    }); // Más recientes primero
    topLevelTwists.forEach(function (twist) {
        var twistElement = createTwistElement(twist);
        twistsContainer.appendChild(twistElement);
        renderReplies(twist, twistElement);
    });
}
function renderReplies(parentTwist, parentElement) {
    var threadContainer = parentElement.querySelector(
        "#thread-for-".concat(parentTwist.id)
    );
    if (!threadContainer) return;
    threadContainer.innerHTML = ""; // Limpiar para re-renderizar
    // Encontrar las respuestas directas al parentTwist
    var replies = twists.filter(function (t) {
        return t.parentId === parentTwist.id;
    });
    replies.sort(function (a, b) {
        return a.timestamp.getTime() - b.timestamp.getTime();
    }); // Más antiguas primero en el hilo
    replies.forEach(function (reply) {
        var replyElement = createTwistElement(reply, true);
        threadContainer.appendChild(replyElement);
        // Recursivamente renderizar respuestas a esta respuesta
        renderReplies(reply, replyElement);
    });
}
function addTwist(content, parentId) {
    if (parentId === void 0) {
        parentId = null;
    }
    if (!content.trim()) return;
    var newTwist = {
        id: generateId(),
        userId: currentUser.id,
        content: content.trim(),
        timestamp: new Date(),
        replies: [], // Las respuestas se manejan buscando por parentId en el array general
        parentId: parentId,
    };
    twists.push(newTwist);
    if (parentId) {
        // Si es una respuesta, necesitamos re-renderizar el twist padre o toda la lista
        // para que se muestre correctamente anidado.
        // Por simplicidad, re-renderizamos todo. En apps más grandes, se optimizaría.
        var parentTwistElement = document.querySelector(
            '.twist-card[data-twist-id="'.concat(parentId, '"]')
        );
        if (parentTwistElement) {
            renderReplies(
                twists.find(function (t) {
                    return t.id === parentId;
                }),
                parentTwistElement
            );
            // Ocultar el formulario de respuesta después de enviar
            var replyFormContainer = parentTwistElement.querySelector(
                ".reply-form-container"
            );
            if (replyFormContainer) replyFormContainer.style.display = "none";
        } else {
            renderTwists(); // Fallback si no se encuentra el elemento padre (raro)
        }
    } else {
        // Si es un twist nuevo (no una respuesta), lo añadimos al principio
        // Para esto, renderTwists() ya ordena por fecha, así que está bien.
        renderTwists();
    }
    // Limpiar el input principal si es un nuevo twist (no una respuesta)
    if (!parentId && twistContentInput) {
        twistContentInput.value = "";
        updateCharCounter();
    }
}
function toggleReplyForm(twistId, twistCardElement) {
    var replyFormContainer = twistCardElement.querySelector(
        ".reply-form-container"
    );
    if (
        replyFormContainer.style.display === "none" ||
        !replyFormContainer.innerHTML
    ) {
        replyFormContainer.innerHTML =
            '\n            <form class="reply-form">\n                <textarea placeholder="Escribe tu respuesta..." rows="3" maxlength="280" required></textarea>\n                <div class="twist-form-footer">\n                    <span class="char-counter-reply">280</span>\n                    <button type="submit" class="btn btn-primary btn-sm">Responder</button>\n                </div>\n            </form>\n        ';
        replyFormContainer.style.display = "block";
        var replyForm = replyFormContainer.querySelector(".reply-form");
        var replyTextarea_1 = replyForm.querySelector("textarea");
        var replyCharCounter_1 = replyForm.querySelector(".char-counter-reply");
        replyTextarea_1.addEventListener("input", function () {
            var remaining = 280 - replyTextarea_1.value.length;
            replyCharCounter_1.textContent = remaining.toString();
            replyCharCounter_1.style.color =
                remaining < 20 ? (remaining < 1 ? "red" : "orange") : "#6c757d";
        });
        replyTextarea_1.focus();
        replyForm.addEventListener("submit", function (e) {
            e.preventDefault();
            var replyContent = replyTextarea_1.value;
            if (replyContent.trim()) {
                addTwist(replyContent, twistId);
                replyFormContainer.style.display = "none"; // Ocultar después de enviar
                replyFormContainer.innerHTML = ""; // Limpiar para la próxima vez
            }
        });
    } else {
        replyFormContainer.style.display = "none";
        replyFormContainer.innerHTML = ""; // Limpiar para la próxima vez
    }
}
function updateCharCounter() {
    if (twistContentInput && charCounter) {
        var remaining = 280 - twistContentInput.value.length;
        charCounter.textContent = remaining.toString();
        charCounter.style.color =
            remaining < 20 ? (remaining < 0 ? "red" : "orange") : "#6c757d";
    }
}
// --- Inicialización y Event Listeners ---
document.addEventListener("DOMContentLoaded", function () {
    // Cargar twists iniciales (simulación)
    twists = [
        {
            id: generateId(),
            userId: "user2",
            content: "¡Hola mundo! Este es mi primer twist en TwistSphere. ✨",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            replies: [],
            parentId: null,
        },
        {
            id: generateId(),
            userId: "user3",
            content: "Probando los hilos de conversación. ¿Alguien por aquí?",
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            replies: [],
            parentId: null,
        },
    ];
    // Añadir una respuesta de ejemplo
    var parentTwistForReply = twists.find(function (t) {
        return t.content.startsWith("Probando los hilos");
    });
    if (parentTwistForReply) {
        twists.push({
            id: generateId(),
            userId: "user1",
            content: "¡Sí! Aquí estoy. Me gusta la idea de los hilos.",
            timestamp: new Date(Date.now() - 1000 * 60 * 28),
            replies: [],
            parentId: parentTwistForReply.id,
        });
        twists.push({
            id: generateId(),
            userId: "user3",
            content: "¡Genial! Parece que funciona bien.",
            timestamp: new Date(Date.now() - 1000 * 60 * 25),
            replies: [],
            parentId: twists.find(function (t) {
                return t.content.startsWith("¡Sí! Aquí estoy");
            }).id, //Respuesta a la respuesta
        });
    }
    if (newTwistForm && twistContentInput) {
        newTwistForm.addEventListener("submit", function (e) {
            e.preventDefault();
            var content = twistContentInput.value;
            if (content.trim() && content.length <= 280) {
                addTwist(content);
            } else if (content.length > 280) {
                alert("El twist no puede exceder los 280 caracteres.");
            }
        });
        twistContentInput.addEventListener("input", updateCharCounter);
        updateCharCounter(); // Inicial
    }
    // Renderizar twists iniciales
    if (twistsContainer) {
        // Solo renderizar si estamos en la página principal
        renderTwists();
    }
    // Simulación de envío de login (solo para la página de login)
    var loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            window.location.href = "index.html"; // Descomentar para redirigir
        });
    }
});
