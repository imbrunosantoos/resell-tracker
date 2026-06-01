// Gera, no browser (canvas), uma imagem-catálogo da encomenda: grelha de cartões
// com a foto de cada camisa e, por baixo, a legenda, o tamanho e a quantidade.
// As fotos vêm de /api/fotos/<foto> (mesma origem, sem CORS taint).

const COLS = 3;
const CELULA = 360; // lado da foto
const PAD = 28;
const TEXTO = 96; // espaço para o texto por baixo da foto
const TOPO = 96; // cabeçalho

function carregarImg(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// desenha img a "cover" dentro de um quadrado
function desenharCover(ctx, img, x, y, lado) {
  const escala = Math.max(lado / img.width, lado / img.height);
  const w = img.width * escala, h = img.height * escala;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, lado, lado);
  ctx.clip();
  ctx.drawImage(img, x + (lado - w) / 2, y + (lado - h) / 2, w, h);
  ctx.restore();
}

export async function gerarCatalogo(linhas, { titulo = "Encomenda" } = {}) {
  const n = linhas.length;
  const cols = Math.min(COLS, Math.max(1, n));
  const linhasGrelha = Math.ceil(n / cols);
  const cellW = CELULA + PAD;
  const cellH = CELULA + TEXTO + PAD;
  const W = PAD + cols * cellW;
  const H = TOPO + linhasGrelha * cellH + PAD;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // fundo
  ctx.fillStyle = "#0E1116";
  ctx.fillRect(0, 0, W, H);

  // cabeçalho
  const pecas = linhas.reduce((s, l) => s + Math.max(1, l.quantidade || 1), 0);
  ctx.fillStyle = "#ECEEF2";
  ctx.font = "700 40px Archivo, Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(`${titulo} · ${n} modelos · ${pecas} peças`, PAD, TOPO / 2);

  const fotos = await Promise.all(linhas.map((l) => (l.foto ? carregarImg(`/api/fotos/${l.foto}`) : null)));

  linhas.forEach((linha, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = PAD + col * cellW;
    const y = TOPO + row * cellH;

    // moldura do cartão
    ctx.fillStyle = "#161A22";
    arredondado(ctx, x - 6, y - 6, CELULA + 12, CELULA + TEXTO + 12, 18);
    ctx.fill();

    // foto (ou placeholder)
    if (fotos[i]) {
      desenharCover(ctx, fotos[i], x, y, CELULA);
    } else {
      ctx.fillStyle = "#1C212B";
      arredondado(ctx, x, y, CELULA, CELULA, 12);
      ctx.fill();
      ctx.fillStyle = "#5C6675";
      ctx.font = "600 28px Archivo, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("sem foto", x + CELULA / 2, y + CELULA / 2);
      ctx.textAlign = "left";
    }

    // texto: legenda + tamanho · ×qtd
    const ty = y + CELULA + 18;
    ctx.fillStyle = "#ECEEF2";
    ctx.font = "700 30px Archivo, Arial, sans-serif";
    ctx.fillText(cortar(ctx, linha.nome || "Sem nome", CELULA), x, ty + 12);
    ctx.fillStyle = "#34D399";
    ctx.font = "600 26px JetBrains Mono, monospace";
    const tam = linha.tamanho ? `Tam ${linha.tamanho} · ` : "";
    ctx.fillText(`${tam}×${Math.max(1, linha.quantidade || 1)}`, x, ty + 52);
  });

  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

// texto-resumo (para copiar / WhatsApp)
export function textoEncomenda(linhas, { titulo = "Encomenda" } = {}) {
  const pecas = linhas.reduce((s, l) => s + Math.max(1, l.quantidade || 1), 0);
  const linhasTxt = linhas.map((l) => {
    const tam = l.tamanho ? ` — ${l.tamanho}` : "";
    return `• ${l.nome || "Sem nome"}${tam} ×${Math.max(1, l.quantidade || 1)}`;
  });
  return `${titulo} (${pecas} peças)\n\n${linhasTxt.join("\n")}`;
}

function arredondado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cortar(ctx, texto, maxW) {
  if (ctx.measureText(texto).width <= maxW) return texto;
  let t = texto;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}
