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

  async function render() {
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

    feedList.innerHTML = list
      .map((p) => `
      <article class="post ${esc(p.type)}">
        <header class="post-head">
          <span class="avatar ${esc(p.type)}">${initialOf(p.name)}</span>
          <div class="who">
            <strong>${esc(p.name)}</strong>
            <span class="meta">${esc(p.sector)} · ${timeAgo(p.created_at)}</span>
          </div>
          <span class="tag ${esc(p.type)}">${p.type === "reclamacao" ? "⚠ Reclamação" : "👍 Elogio"}</span>
          <button class="hide-btn" data-id="${esc(p.id)}" title="Ocultar mensagem">✕</button>
        </header>
        <p>${esc(p.message)}</p>
      </article>`)
      .join("");

    feedList.querySelectorAll(".hide-btn").forEach((b) =>
      b.addEventListener("click", async () => {
        if (confirm("Ocultar esta mensagem do mural?")) {
          await backend.hide(b.dataset.id);
          render();
        }
      })
    );
  }

  backend.subscribe(() => render());
  render();
})();
