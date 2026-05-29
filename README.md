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
- Lucro real dividido pelo nº de sócios

## Funcionalidades

- Pedidos com data de compra, data de chegada, taxa de PayPal e custo de saco
- Itens com categoria livre, com sugestões
- **Tabela ordenável** — clica num cabeçalho (margem, dias, custo…) para ordenar os itens
- **Marcar como vendido** num clique — modal pequeno com preço + data (sugere já o preço mínimo e a data de hoje)
- **Alerta de stock parado** — itens por vender há mais de X dias (configurável) ficam destacados com um badge
- **Despesas fixas** recorrentes (chip, domínio, embalagens…) que saem do lucro real
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

## Onde ficam os dados

Numa base de dados SQLite em `data/resell.db` (criada no primeiro arranque, fora do git). Faz uma cópia desse ficheiro — ou usa o botão **Exportar JSON** — para teres backup.

## Stack

- **Next.js** (App Router) — páginas, API e renderização no servidor
- **SQLite** via `node:sqlite` — sem dependências nativas para compilar; vem com o Node
- **bcryptjs** — passwords cifradas
- Sem bibliotecas de UI nem de gráficos: o tema escuro é CSS à mão e o gráfico é SVG desenhado no próprio componente

## Estrutura

```
resell-tracker/
├── app/
│   ├── page.jsx              dashboard (Server Component, garante a sessão)
│   ├── login/                ecrã de entrada / criar conta
│   ├── api/                  endpoints (estado, pedidos, itens, despesas, config, exportar…)
│   ├── components/           Dashboard e os blocos de UI (cliente)
│   └── globals.css           tema escuro + acento azul
├── lib/
│   ├── db.js                 ligação ao SQLite + migrações
│   ├── repo.js               leituras/escritas (snake_case ↔ camelCase)
│   ├── calculos.js           custo real, margem, dias, resumos, série de lucro
│   ├── auth.js               sessões e passwords
│   └── cores.js              cor estável por categoria
├── middleware.js             protege as rotas (sem sessão → /login)
├── public/                   manifest, service worker e ícone (PWA)
└── data/resell.db            base de dados (gerada localmente)
```

## Notas

- As **despesas fixas** são subtraídas ao lucro como um total; o campo "período" (por mês / uma vez) é informativo, para te orientares.
- A sincronização entre dispositivos é por *polling*: a app recarrega o estado de tempos a tempos e sempre que gravas algo, por isso o que o teu sócio mete aparece-te pouco depois.

## Ideias para o futuro

- Notas/fotos por item
- Filtros e pesquisa global por categoria ou estado
- Relatório mensal (lucro do mês, comparação com o anterior)
- Sincronização em tempo real (websockets) em vez de polling

## Licença

MIT — usa, modifica e partilha à vontade.
