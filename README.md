# ReSell — tracker de revenda

Aplicação web simples para gerir uma operação de revenda. Pensada para mostrar gastos e lucros de um negócio independente.

Organiza tudo por **pedido** e, dentro de cada um, pelos **itens** que compraste. Para cada item calcula automaticamente:

- **Custo real** — o que pagaste pela peça + a taxa de PayPal diluída pelos itens do pedido + o saco
- **Margem** em euros e em percentagem
- **Dias até vender** — da data de chegada da mercadoria até à data da venda

E mostra um resumo geral com investido, stock por vender, receita, lucro e o lucro já dividido pelos sócios, além de um *breakdown* de lucro por categoria.

## Funcionalidades

- Pedidos com data de compra, data de chegada, taxa de PayPal e custo de saco
- Itens com categoria livre ( podes adicionar os teus itens)
- Cálculo automático de custo real, margem, % e dias até vender
- Resumo por pedido e resumo global
- Lucro por categoria, com barras
- Lucro dividido por nº de sócios (configurável)
- Exportar / importar backup em JSON
- Guarda tudo localmente no browser (`localStorage`) — sem contas, sem servidor

## Como usar

Não precisa de instalação nem de servidor. Basta abrir o `index.html` no browser (duplo clique).

Se preferires servir localmente:

```bash
python3 -m http.server
# abre http://localhost:8000
```

## Stack

HTML, CSS e JavaScript puro. Sem frameworks, sem dependências, sem build. Os dados vivem no `localStorage` do browser; usa o botão **Exportar backup** para guardares uma cópia em `.json`.

## Estrutura

```
resell-tracker/
├── index.html   estrutura
├── styles.css   tema escuro + acento azul
├── app.js       estado, cálculos e render
└── README.md
```

## Ideias para o futuro

- Migrar para Next.js + SQLite para sincronizar entre dispositivos
- Gráficos de evolução de lucro ao longo do tempo
- Filtros e pesquisa por categoria
- Estatísticas: peça mais rentável, tempo médio de venda por categoria

## Licença

MIT — usa, modifica e partilha à vontade.
