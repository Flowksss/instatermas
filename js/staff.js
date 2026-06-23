// ============================================================
//  INSTERMAS · Painel interno (staff)
//  Mostra o mural, filtra reclamações, e AVISA (som + título)
//  quando chega reclamação nova. Som precisa de 1 clique
//  ("Ativar monitoramento") porque o navegador bloqueia áudio.
// ============================================================

(function () {
  const backend = window.INSTERMAS_BACKEND;
  const $ = (s) => document.querySelector(s);

  const feedList = $("#staff-feed");
  const filterBtns = document.querySelectorAll("[data-filter]");
  const enableBtn = $("#enable-monitor");
  const statusEl = $("#monitor-status");

  let filter = "reclamacao"; // staff começa nas reclamações
  let soundOn = false;
  let audioCtx = null;
  const knownComplaints = new Set();
  let firstLoad = true;
  let editing = false; // segura o re-render enquanto staff digita uma resposta

  // ---------- beep (WebAudio, sem arquivo) ----------
  function beep() {
    if (!soundOn || !audioCtx) return;
    const t = audioCtx.currentTime;
    [0, 0.45].forEach((offset) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t + offset);
      g.gain.exponentialRampToValueAtTime(0.35, t + offset + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.35);
      o.start(t + offset);
      o.stop(t + offset + 0.36);
    });
  }

  enableBtn.addEventListener("click", () => {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume();
    soundOn = true;
    enableBtn.hidden = true;
    statusEl.innerHTML = '<span class="dot"></span>🔔 Monitorando · som ativo';
    statusEl.classList.add("on");
    beep(); // confirma que o som funciona
  });

  filterBtns.forEach((b) =>
    b.addEventListener("click", () => {
      filterBtns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      filter = b.dataset.filter;
      render();
    })
  );

  function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return Math.floor(diff / 60) + " min";
    if (diff < 86400) return Math.floor(diff / 3600) + " h";
    return new Date(iso).toLocaleDateString("pt-BR");
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function initialOf(name) {
    return esc(String(name || "?").trim().charAt(0).toUpperCase() || "?");
  }

  let titleTimer = null;
  function flashTitle() {
    clearInterval(titleTimer);
    let on = false, count = 0;
    titleTimer = setInterval(() => {
      document.title = (on = !on) ? "🔴 NOVA RECLAMAÇÃO" : "Instermas · Painel";
      if (++count > 10) { clearInterval(titleTimer); document.title = "Instermas · Painel"; }
    }, 700);
  }

  function responseHTML(p) {
    if (!p.response) return "";
    return `
          <div class="response">
            <span class="response-label">💬 Resposta · ${esc(p.sector)}</span>
            <p>${esc(p.response)}</p>
          </div>`;
  }

  function cardHTML(p) {
    return `
      <div class="post-row" data-id="${esc(p.id)}">
        <div class="swipe-action">
          <button class="reply-reveal">${p.response ? "✎ Editar" : "↩ Responder"}</button>
        </div>
        <article class="post ${esc(p.type)}">
          <header class="post-head">
            <span class="avatar ${esc(p.type)}">${initialOf(p.name)}</span>
            <div class="who">
              <strong>${esc(p.name)}</strong>
              <span class="meta">${esc(p.sector)} · ${timeAgo(p.created_at)}</span>
            </div>
            <span class="tag ${esc(p.type)}">${p.type === "reclamacao" ? "⚠ Reclamação" : "👍 Elogio"}</span>
            <button class="hide-btn" title="Ocultar mensagem">✕</button>
          </header>
          <p>${esc(p.message)}</p>
          ${responseHTML(p)}
          <button class="reply-open">${p.response ? "✎ Editar resposta" : "↩ Responder ao hóspede"}</button>
          <div class="reply-editor">
            <textarea class="reply-text" rows="2" placeholder="Escreva a resposta do setor...">${p.response ? esc(p.response) : ""}</textarea>
            <div class="reply-actions">
              <button class="reply-cancel">Cancelar</button>
              <button class="reply-send">Enviar resposta</button>
            </div>
          </div>
        </article>
      </div>`;
  }

  // ---- swipe pra revelar "Responder" (toque + mouse via Pointer Events) ----
  const OPEN_X = -120;
  function setupSwipe(row) {
    const post = row.querySelector(".post");
    let startX = 0, dx = 0, dragging = false, opened = false;
    const setX = (x) => { post.style.transform = `translateX(${x}px)`; };

    post.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, textarea, .reply-editor")) return;
      dragging = true; startX = e.clientX; post.style.transition = "none";
      try { post.setPointerCapture(e.pointerId); } catch (_) {}
    });
    post.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      dx = Math.max(OPEN_X, Math.min(0, e.clientX - startX + (opened ? OPEN_X : 0)));
      setX(dx);
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      post.style.transition = "transform .18s ease";
      opened = dx < OPEN_X / 2;
      setX(opened ? OPEN_X : 0);
    };
    post.addEventListener("pointerup", end);
    post.addEventListener("pointercancel", end);

    row.querySelector(".reply-reveal").addEventListener("click", () => {
      post.style.transition = "transform .18s ease"; setX(0); opened = false;
      openEditor(row);
    });
  }

  function openEditor(row) {
    editing = true;
    row.querySelector(".reply-editor").classList.add("open");
    const ta = row.querySelector(".reply-text");
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }
  function closeEditor() { editing = false; render(); }

  async function render() {
    if (editing) return; // não rebuildar enquanto staff digita uma resposta

    const all = await backend.list();
    const complaints = all.filter((p) => p.type === "reclamacao" && !p.hidden);

    // detectar reclamação nova -> alertar (não no 1º carregamento)
    if (!firstLoad) {
      const isNew = complaints.some((c) => !knownComplaints.has(c.id));
      if (isNew) { beep(); flashTitle(); }
    }
    complaints.forEach((c) => knownComplaints.add(c.id));
    firstLoad = false;

    let list = all.filter((p) => !p.hidden);
    if (filter === "reclamacao") list = list.filter((p) => p.type === "reclamacao");
    else if (filter === "elogio") list = list.filter((p) => p.type === "elogio");

    if (!list.length) {
      feedList.innerHTML = '<p class="empty">Nada por aqui no momento.</p>';
      return;
    }

    feedList.innerHTML = list.map(cardHTML).join("");

    feedList.querySelectorAll(".post-row").forEach((row) => {
      setupSwipe(row);
      row.querySelector(".reply-open").addEventListener("click", () => openEditor(row));
      row.querySelector(".hide-btn").addEventListener("click", async () => {
        if (confirm("Ocultar esta mensagem do mural?")) {
          await backend.hide(row.dataset.id);
          render();
        }
      });
      row.querySelector(".reply-cancel").addEventListener("click", closeEditor);
      row.querySelector(".reply-send").addEventListener("click", async (e) => {
        const text = row.querySelector(".reply-text").value.trim();
        if (!text) { row.querySelector(".reply-text").focus(); return; }
        e.target.disabled = true;
        try {
          await backend.respond(row.dataset.id, text);
          editing = false;
          render();
        } catch (err) {
          e.target.disabled = false;
          alert("Erro ao responder: " + (err.message || err));
        }
      });
    });
  }

  // dica de descoberta do gesto (inserida uma vez, antes do feed)
  const hint = document.createElement("p");
  hint.className = "swipe-hint";
  hint.textContent = "↔ Arraste um card para o lado para responder";
  feedList.before(hint);

  backend.subscribe(() => render());
  render();
})();
