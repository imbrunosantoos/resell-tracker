# Notas para agentes (Claude) — LER ANTES DE MEXER

## 🚫 NUNCA apagar a pasta de dados

- **NUNCA** corras `rm -rf data`, `git clean -fdx`/`-fdX`, nem apagues/limpes a pasta `data/`
  deste repositório. Já houve **perda total de dados reais** por causa disto (um agente correu
  `rm -rf data` para "ter um estado limpo"). Não repitas.
- Os **dados reais** (base de dados, fotos e backups) **NÃO** vivem dentro do repositório. Vivem
  **fora**, em `~/ReSell-data/` (definido por `DATA_DIR` no `.env.local`). A `./data` dentro do
  projeto é descartável/órfã, mas mesmo assim **não a apagues**.
- Para testes/screenshots usa **sempre** uma instância isolada com um `DATA_DIR` em `/tmp`
  (ex.: `DATA_DIR=/tmp/resell-demo`). Nunca corras a app de teste contra a pasta de dados real,
  e nunca faças cleanup que toque em `data/` ou em `~/ReSell-data/`.

## Como correr a app

- Produção local: `npm run build` && `npx next start -H 0.0.0.0 -p 3000`. O `.env.local` define
  `DATA_DIR=~/ReSell-data` (dados fora do repo) e `COOKIE_INSEGURO=1` (login por HTTP em rede local).
- A app guarda **cópias automáticas** a cada alteração em `~/ReSell-data/backups/` (sobrevivem a um
  `rm -rf data` no projeto). Recomendado: **Time Machine** ligado como rede de segurança extra.

## Regras de trabalho (do dono, Bruno)

- Commits **em inglês**; **nunca** `Co-Authored-By: Claude`.
- Ao limpar dados de teste, apagar **só por id/nome exato, nunca em massa**.
