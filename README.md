# ReSell — tracker de revenda

Aplicação web para gerir uma operação de revenda. Organiza tudo por **pedido** e, dentro de cada um, pelos **itens** que compraste, e calcula automaticamente o que interessa: custo real, margem, lucro e quanto tempo demoraste a vender.

Começou como uma página estática em JavaScript puro e está agora em **Next.js + SQLite**, com login próprio para cada pessoa, dados partilhados e sincronizados entre dispositivos e instalável no telemóvel como app (PWA).

## O que calcula

Para cada item:

- **Custo real** — o que pagaste pela peça + a taxa de PayPal diluída pelos itens do pedido + o saco
- **Margem** em euros e em percentagem
- **Dias até vender** — da data de chegada da mercadoria até à data da venda
- **Preço mínimo de venda** — para a margem mínima que definires (ex: 20%), mostra "não vendas abaixo de €X"

E ao nível do negócio:

- Resumo global: investido, stock por vender, receita, lucro das vendas, despesas fixas e **lucro real** (depois de tudo)
- **Lucro por categoria**, com barras, **sell-through** (% já vendido) e dias médios por categoria
- **Gráfico de lucro acumulado** semana a semana
- **Relatório mensal** — lucro e nº de vendas deste mês vs. o anterior
- **Lucro por sócio** — cada pedido feito com um sócio divide o lucro a meias; os pedidos a solo são 100% teus

## Funcionalidades

- Pedidos com data de compra, data de chegada, taxa de PayPal e custo de saco
- **Sócio por pedido** — escolhes com quem foi feito (ou sozinho); o lucro reparte-se a meias automaticamente
- Itens com categoria livre, **foto** (qualquer formato) e **notas**
- **Tabela ordenável** — clica num cabeçalho (margem, dias, custo…) para ordenar os itens
- **Seleção múltipla** — escolhe vários itens e muda a categoria de todos de uma vez
- **Pesquisa e filtros** — por texto, por estado (em stock / vendido) e por categoria
- **Marcar como vendido** num clique — modal pequeno com preço + data (sugere já o preço mínimo e a data de hoje)
- **Alerta de stock parado** — itens por vender há mais de X dias (configurável) ficam destacados com um badge
- **Despesas fixas** recorrentes (chip, domínio, embalagens…) que saem do lucro real — as mensais contam por cada mês ativo, as únicas uma vez
- **Cofre de contas** — guarda logins/passwords por plataforma e por sócio; as passwords ficam **cifradas (AES-256)** no servidor
- **Exportar** backup em **JSON** ou em **CSV** (uma linha por item, com as colunas já calculadas — abre direto no Excel/Sheets) e importar de volta
- **Vários utilizadores**, cada um com o seu login, a partilhar os mesmos dados do negócio
- **PWA** — instalável no telemóvel sem loja nenhuma

## Como correr

Precisas do Node.js 22 ou superior (a app usa o módulo `node:sqlite`, nativo).

```bash
npm install
npm run dev
# abre http://localhost:3000
```

Na primeira vez, cria a tua conta no ecrã de login. A partir daí o teu sócio pode criar a conta dele e ambos trabalham sobre os mesmos dados.

Para produção:

```bash
npm run build
npm start
```

### Aceder do telemóvel (rede local)

Para usares a app no telemóvel sem domínio nem HTTPS, na mesma rede Wi-Fi:

1. Copia `.env.example` para `.env.local` e põe `COOKIE_INSEGURO=1` (sem isto, em produção o browser recusa o cookie de sessão por HTTP e o login não funciona).
2. Arranca o servidor a ouvir em toda a rede:
   ```bash
   npm run build
   npx next start -H 0.0.0.0
   ```
3. Descobre o IP do PC (ex: `ipconfig getifaddr en0` no Mac) e no telemóvel abre `http://<ip-do-pc>:3000`.

No telemóvel podes ainda usar "Adicionar ao ecrã principal" para instalar como app (PWA).

> Quando passares para um domínio com HTTPS, volta a pôr `COOKIE_INSEGURO=0` — é mais seguro.

## Onde ficam os dados

Tudo dentro da pasta `data/` (criada no primeiro arranque, fora do git):

- `data/resell.db` — a base de dados SQLite (pedidos, itens, sócios, despesas, contas)
- `data/uploads/` — as fotos das peças
- `data/.chave` — a chave que cifra as passwords das contas (**não a percas nem a partilhes**)

Faz uma cópia da pasta `data/` para teres backup completo. O botão **Exportar JSON** guarda os dados do negócio (pedidos, itens, sócios, despesas), mas **não** as passwords das contas — essas só com a cópia da BD + chave.

## Stack

- **Next.js** (App Router) — páginas, API e renderização no servidor
- **SQLite** via `node:sqlite` — sem dependências nativas para compilar; vem com o Node
- **bcryptjs** — passwords de login cifradas; **AES-256-GCM** (`node:crypto`) para as passwords das contas
- Sem bibliotecas de UI nem de gráficos: o tema (dark premium, acento esmeralda) é CSS à mão e os gráficos são barras em CSS no próprio componente

## Páginas

A app está organizada por abas no topo, cada uma na sua página:

- **Início** (`/`) — resumo: cartões (investido, stock, lucro real, o teu lucro…), "Este mês" e atalhos.
- **Pedidos** (`/pedidos`) — criar pedido, filtrar/pesquisar e lista compacta. Clicas num pedido → **detalhe** (`/pedidos/[id]`) com os itens em cartões, **fotos grandes** (clique para ampliar), marcar vendido, etc.
- **Lucro** (`/lucro`) — gráfico mês a mês (lucro / recebido vs investido), lucro por sócio, lucro por categoria e despesas fixas.
- **Contas** (`/contas`) — logins e passwords por plataforma/sócio (cifradas).
- **Definições** (`/definicoes`) — margem mínima, alerta de dias, exportar/importar backup e terminar sessão.

## Estrutura

```
resell-tracker/
├── app/
│   ├── layout.jsx            raiz (html, fontes, PWA)
│   ├── login/                ecrã de entrada / criar conta
│   ├── (app)/                páginas autenticadas (partilham o AppShell)
│   │   ├── layout.jsx        garante a sessão + entrega o estado ao AppShell
│   │   ├── page.jsx          Início
│   │   ├── pedidos/          lista + [id] (detalhe)
│   │   ├── lucro/  contas/  definicoes/
│   ├── api/                  endpoints (estado, pedidos, itens, despesas, config, exportar…)
│   ├── components/           AppShell (estado), TopNav, páginas e blocos de UI
│   └── globals.css           tema dark premium + acento esmeralda
├── lib/
│   ├── db.js                 ligação ao SQLite + migrações
│   ├── repo.js               leituras/escritas (snake_case ↔ camelCase)
│   ├── calculos.js           custo real, margem, dias, resumos, lucro por sócio, dados mensais
│   ├── auth.js               sessões e passwords de login
│   ├── cripto.js             cifra das passwords das contas (AES-256)
│   ├── fotos.js              guardar/servir as fotos das peças
│   └── cores.js              cor estável por categoria
├── middleware.js             protege as rotas (sem sessão → /login)
├── public/                   manifest, service worker e ícone (PWA)
└── data/                     base de dados, fotos e chave (gerados localmente)
```

O estado do negócio vive num único sítio no cliente (`app/components/AppShell.jsx`, fornecido por
contexto), que se mantém vivo ao navegar entre abas — com edição otimista e sincronização por *polling*.

## Notas

- As **despesas mensais** são contadas por cada mês que a operação leva ativa (desde a data mais antiga); as **únicas** contam uma só vez.
- As **despesas não se dividem** pelos sócios — são overhead teu; a divisão a meias aplica-se só ao lucro das vendas de cada pedido.
- A sincronização entre dispositivos é por *polling*: a app recarrega o estado de tempos a tempos e sempre que gravas algo, por isso o que o teu sócio mete aparece-te pouco depois.

## Ideias para o futuro

- Plataforma de venda por item (Vinted, OLX…) com taxas próprias
- Metas mensais com barra de progresso
- Sincronização em tempo real (websockets) em vez de polling

## Licença

MIT — usa, modifica e partilha à vontade.
