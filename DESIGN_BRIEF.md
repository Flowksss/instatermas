# Instermas — Brief de redesign (para o Claude Design)

Anexe ao Claude Design: **a logo das Termas** + este arquivo + os 3 arquivos atuais
(`index.html`, `staff.html`, `css/styles.css`) como referência do que já existe.

---

## Prompt (cole no Claude Design)

> Redesenhe o **Instermas**, um mural interno de uma estância de **águas termais** (Termas).
> Hóspedes acessam pelo **celular** via QR code, entram **só com o nome** (sem login) e
> postam um **elogio/dica** ou uma **reclamação** ligada a um setor. Todos veem em **tempo
> real**. Existe também um **painel interno (staff)** que filtra reclamações e avisa quando
> chega uma nova, pra resolver enquanto o hóspede ainda está no local.
>
> Quero um design **original e memorável**, longe de cara de template genérico. Use a
> **logo em anexo** como âncora da identidade: extraia dela a paleta e o tom.
>
> O contexto de uso manda no design:
> - **Mobile-first**. Usado no celular, ao ar livre, sol forte, perto da piscina →
>   alto contraste, texto grande, áreas de toque generosas.
> - Clima de **relaxamento / água termal**, mas com **energia social** (é um mural,
>   tipo rede social interna do lugar).
> - **Rápido e leve**, sem exagero visual que pese no carregamento.
>
> **Telas e elementos:**
>
> 1. **Entrada (login):** logo + 1 campo "nome" + botão "Entrar no mural" + frase curta
>    "sem senha, só seu nome".
> 2. **Mural (cliente):**
>    - Topo: logo + "Olá, [nome]".
>    - Caixa de postar: textarea, seletor de **setor** (lista), escolha de **tipo** com
>      2 opções **bem distintas** — 👍 Elogio vs ⚠️ Reclamação — e botão "Postar no mural".
>    - Feed de cards. Cada card: inicial/avatar, nome, setor · tempo, etiqueta do tipo,
>      texto. **Elogio e Reclamação têm que ser distinguíveis num relance** (cor/borda/ícone).
>    - Estado vazio simpático.
> 3. **Painel staff (interno):**
>    - Topo: logo + selo "Painel interno" + botão "Ativar monitoramento" + status do som.
>    - Filtros: **Reclamações / Tudo / Elogios**.
>    - Feed igual, com botão **ocultar (✕)** em cada card. Reclamação em destaque forte.
>
> **Setores:** Automação, Comercial, Governança, Recepção, Parque, Terceiros,
> Central de Informações, Bilheteria.
>
> **Entregue:** HTML + CSS, tema coeso via **variáveis CSS**, paleta tirada da logo.
> Pode ser um arquivo de demonstração por tela.
>
> **Restrição técnica (importante):** isto vira código real que já tem JavaScript ligado.
> **Não mude os `id` listados abaixo** (o JS depende deles). O markup **interno dos cards**
> pode mudar à vontade. Se mexer em algum `id`, **avise explicitamente**.

---

## Hooks que o JS depende — NÃO renomear estes `id`

| Elemento | Hook | Função |
|----------|------|--------|
| Tela login | `#login-view` | seção mostrada/ocultada |
| Campo nome | `#name-input` | lê o nome |
| Botão entrar | `#enter-btn` | clique entra no mural |
| Tela mural | `#feed-view` | seção mostrada após entrar |
| Saudação | `#whoami` | injeta o nome |
| Texto do post | `#composer-text` | lê a mensagem |
| Setor | `#sector-select` | `<select>`, opções preenchidas pelo JS |
| Tipo | `input[name="ptype"]` com `value="elogio"` e `value="reclamacao"` | radios |
| Botão postar | `#post-btn` | clique posta |
| Lista do mural | `#feed-list` | cards injetados pelo JS |
| Lista do staff | `#staff-feed` | cards injetados pelo JS |
| Filtros | `button[data-filter="reclamacao"\|"todos"\|"elogio"]` | troca filtro |
| Ativar som | `#enable-monitor` | desbloqueia áudio (precisa de clique) |
| Status do som | `#monitor-status` | texto do estado |
| Ocultar | `.hide-btn` com `data-id` | staff oculta post |
| Banner demo | `#mode-banner` | aviso modo demo |

### Pode mudar livremente (eu reescrevo o template no JS)
Markup **interno** dos cards: hoje usa `article.post` / `.post.reclamacao`, `.avatar`,
`.who > strong`, `.meta`, `.tag` / `.tag.reclamacao`, `<p>`. O designer pode propor outra
estrutura de card — eu adapto `js/app.js` e `js/staff.js`.

---

## Fluxo depois que o design ficar pronto
1. Claude Design devolve HTML/CSS novo.
2. Eu porto pro projeto: novo `css/styles.css` + ajustes de markup, **mantendo os hooks**.
3. Testamos: postar + realtime + painel staff (igual já validamos).
4. Adiciono a logo em `assets/` e referencio.
