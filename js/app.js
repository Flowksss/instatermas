// ============================================================
//  INSTERMAS · App do cliente (mural)
// ============================================================

(function () {
  const backend = window.INSTERMAS_BACKEND;
  const cfg = window.INSTERMAS_CONFIG;
  const $ = (s) => document.querySelector(s);

  const loginView = $("#login-view");
  const feedView = $("#feed-view");
  const nameInput = $("#name-input");
  const enterBtn = $("#enter-btn");
  const whoami = $("#whoami");
  const composer = $("#composer-text");
  const sectorSelect = $("#sector-select");
  const postBtn = $("#post-btn");
  const feedList = $("#feed-list");
  const typeInputs = () => document.querySelectorAll('input[name="ptype"]');

  let userName = localStorage.getItem("instermas_name") || "";

  // popular setores no menu
  cfg.SETORES.forEach((s) => {
    const o = document.createElement("option");
    o.value = s;
    o.textContent = s;
    sectorSelect.appendChild(o);
  });

  function showFeed() {
    loginView.hidden = true;
    feedView.hidden = false;
    whoami.textContent = userName;
    render();
  }

  function enter() {
    const n = nameInput.value.trim();
    if (!n) { nameInput.focus(); return; }
    userName = n;
    localStorage.setItem("instermas_name", n);
    showFeed();
  }
  enterBtn.addEventListener("click", enter);
  nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") enter(); });

  async function post() {
    const message = composer.value.trim();
    const sector = sectorSelect.value;
    const type = [...typeInputs()].find((i) => i.checked)?.value || "elogio";
    if (!message) { composer.focus(); return; }
    postBtn.disabled = true;
    try {
      await backend.add({ name: userName, sector, type, message });
      composer.value = "";
      await render();
    } catch (e) {
      alert("Erro ao postar: " + (e.message || e));
    } finally {
      postBtn.disabled = false;
    }
  }
  postBtn.addEventListener("click", post);

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

  async function render() {
    const posts = (await backend.list()).filter((p) => !p.hidden);
    if (!posts.length) {
      feedList.innerHTML = '<p class="empty">Ainda sem mensagens. Seja o primeiro a postar! 🌊</p>';
      return;
    }
    feedList.innerHTML = posts
      .map((p) => `
      <article class="post ${esc(p.type)}">
        <header class="post-head">
          <span class="avatar ${esc(p.type)}">${initialOf(p.name)}</span>
          <div class="who">
            <strong>${esc(p.name)}</strong>
            <span class="meta">${esc(p.sector)} · ${timeAgo(p.created_at)}</span>
          </div>
          <span class="tag ${esc(p.type)}">${p.type === "reclamacao" ? "⚠ Reclamação" : "👍 Elogio"}</span>
        </header>
        <p>${esc(p.message)}</p>
        ${p.response ? `<div class="response"><span class="response-label">💬 Resposta · ${esc(p.sector)}</span><p>${esc(p.response)}</p></div>` : ""}
      </article>`)
      .join("");
  }

  backend.subscribe(() => render());

  // pré-preenche nome salvo
  if (userName) nameInput.value = userName;
})();
