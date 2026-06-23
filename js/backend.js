// ============================================================
//  INSTERMAS · Camada de dados
//  Usa Supabase (tempo real, multi-aparelho) se houver chave.
//  Sem chave -> MODO DEMO (localStorage, só este navegador).
//  Os dois implementam a MESMA interface: list / add / hide / subscribe.
// ============================================================

(function () {
  const cfg = window.INSTERMAS_CONFIG;
  const hasSupabase = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);

  // ---------- Supabase (produção) ----------
  function makeSupabaseBackend() {
    const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    return {
      mode: "supabase",
      async list() {
        const { data, error } = await client
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      },
      async add(post) {
        const { error } = await client.from("posts").insert(post);
        if (error) throw error;
      },
      async hide(id) {
        const { error } = await client.from("posts").update({ hidden: true }).eq("id", id);
        if (error) throw error;
      },
      async respond(id, text) {
        const { error } = await client
          .from("posts")
          .update({ response: text, responded_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      },
      subscribe(onChange) {
        client
          .channel("posts-stream")
          .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, onChange)
          .subscribe();
      },
    };
  }

  // ---------- Demo (localStorage) ----------
  function makeDemoBackend() {
    const KEY = "instermas_posts";
    const read = () => JSON.parse(localStorage.getItem(KEY) || "[]");
    const write = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));
    const listeners = [];
    const emit = () => listeners.forEach((f) => f());
    // mudanças em outras abas
    window.addEventListener("storage", (e) => { if (e.key === KEY) emit(); });
    return {
      mode: "demo",
      async list() {
        return read().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      },
      async add(post) {
        const arr = read();
        arr.push({
          ...post,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          hidden: false,
        });
        write(arr);
        emit();
      },
      async hide(id) {
        write(read().map((p) => (p.id === id ? { ...p, hidden: true } : p)));
        emit();
      },
      async respond(id, text) {
        write(read().map((p) =>
          p.id === id ? { ...p, response: text, responded_at: new Date().toISOString() } : p));
        emit();
      },
      subscribe(onChange) {
        listeners.push(onChange);
      },
    };
  }

  window.INSTERMAS_BACKEND = hasSupabase ? makeSupabaseBackend() : makeDemoBackend();
  window.INSTERMAS_MODE = window.INSTERMAS_BACKEND.mode;
})();
