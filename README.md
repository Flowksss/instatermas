# Instermas

Mural interno das Termas. Cliente entra com o **nome** (sem login), posta **elogio**
ou **reclamação** ligado a um **setor**, e todo mundo vê em tempo real. O **painel do
staff** filtra reclamações e **apita** quando chega uma nova — pra resolver enquanto o
cliente ainda está aqui.

App estático (HTML/CSS/JS) + [Supabase](https://supabase.com) (banco + tempo real).
Sem build, sem servidor próprio. Hospeda em qualquer lugar estático.

---

## 1. Ver agora (modo demo)

Sem configurar nada, roda em **modo demo** (dados só neste navegador):

```bash
# na pasta do projeto
python -m http.server 8000
```

Abra:
- Cliente: <http://localhost:8000/index.html>
- Painel staff: <http://localhost:8000/staff.html>

> Demo é só pra ver a cara. Ele **não** sincroniza entre aparelhos — pra isso, ligue o
> Supabase (passo 2).

---

## 2. Ligar o tempo real (Supabase) — grátis

1. Crie conta em <https://supabase.com> → **New project** (guarde a senha do banco).
2. No projeto: **SQL Editor** → cole o conteúdo de [`supabase.sql`](supabase.sql) → **Run**.
3. Pegue as chaves em **Project Settings → API**:
   - `Project URL`
   - `anon public` key
4. Cole as duas em [`js/config.js`](js/config.js):
   ```js
   SUPABASE_URL: "https://xxxx.supabase.co",
   SUPABASE_ANON_KEY: "eyJ...",
   ```

Pronto — agora todos os aparelhos compartilham o mesmo mural.

### Testar de verdade
Abra o site em **dois aparelhos** (ou dois navegadores). Poste uma reclamação num;
no outro o feed atualiza em ~1s e o painel staff apita (depois de clicar
**Ativar monitoramento**).

---

## 3. Publicar (deploy grátis)

Qualquer host estático serve. Mais fácil: [Vercel](https://vercel.com) ou
[Netlify](https://netlify.com) → conecta este repositório → deploy. Gera uma URL
pública (ex: `https://instermas.vercel.app`).

---

## 4. QR codes

Gere QR codes apontando para a URL pública e espalhe pelas Termas. Qualquer gerador
grátis (ex: <https://www.qr-code-generator.com>). O staff usa `/staff.html`.

---

## Mudar os setores

Edite a lista `SETORES` em [`js/config.js`](js/config.js). É código — peça pro dev
ou faça com cuidado (mantenha as aspas e vírgulas).

---

## Limitações (de propósito, pra ficar simples)

- **Som do painel** só toca com o painel **aberto** numa tela ligada (ex: tablet na
  recepção). Navegador não avisa com a tela fechada / celular no bolso. Pra notificar
  celular do funcionário mesmo fechado, precisa de push real / WhatsApp — fica pra depois.
- **Sem moderação forte:** qualquer um com a URL posta o que quiser (aparece pra todos).
  O staff pode **ocultar** (✕) mensagens. Pra algo mais robusto (login do staff, palavrão
  bloqueado), dá pra evoluir.
- Setores ficam no código (`config.js`), não num painel de admin.
