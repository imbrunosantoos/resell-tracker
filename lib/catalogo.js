// Gera, no browser, o que se manda ao fornecedor a partir do rascunho:
//  - gerarPdf(): um PDF com UMA camisa por página — frente e verso grandes,
//    os patches grandes por baixo, o nome e a repartição de tamanhos. Fácil de
//    enviar como 1 anexo no WhatsApp.
//  - textoEncomenda(): texto-resumo para copiar/WhatsApp, com os tamanhos.
// As fotos vêm de /api/fotos/<foto> (mesma origem, sem CORS taint).

// ---------- tamanhos ----------
function mapaTamanhos(l) {
  return l.tamanhos && typeof l.tamanhos === "object" ? l.tamanhos : {};
}
export function totalLinha(l) {
  const ent = Object.values(mapaTamanhos(l)).reduce((a, b) => a + (Number(b) || 0), 0);
  return ent > 0 ? ent : Math.max(1, Number(l.quantidade) || 1);
}
// "M×2 · L×1" (repartição) ou "×N" / "Tam ×N" (linha simples)
function resumoTamanhos(l) {
  const ent = Object.entries(mapaTamanhos(l)).filter(([, n]) => Number(n) > 0);
  if (ent.length) return ent.map(([k, n]) => `${k}×${n}`).join(" · ");
  const n = Math.max(1, Number(l.quantidade) || 1);
  return l.tamanho ? `${l.tamanho} ×${n}` : `×${n}`;
}

// ---------- imagens ----------
function carregarImg(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
// desenha a imagem "cover" num canvas do tamanho-alvo (mm→px a ~200dpi) e devolve JPEG dataURL
function coverDataUrl(img, wmm, hmm) {
  const DPI = 200;
  const pxW = Math.max(1, Math.round((wmm / 25.4) * DPI));
  const pxH = Math.max(1, Math.round((hmm / 25.4) * DPI));
  const c = document.createElement("canvas");
  c.width = pxW; c.height = pxH;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0E1116";
  ctx.fillRect(0, 0, pxW, pxH);
  const esc = Math.max(pxW / img.width, pxH / img.height);
  const w = img.width * esc, h = img.height * esc;
  ctx.drawImage(img, (pxW - w) / 2, (pxH - h) / 2, w, h);
  return c.toDataURL("image/jpeg", 0.85);
}
async function colocarImagem(doc, nome, x, y, w, h, label) {
  doc.setDrawColor(205); doc.setLineWidth(0.3);
  if (nome) {
    const img = await carregarImg(`/api/fotos/${nome}`);
    if (img) {
      doc.addImage(coverDataUrl(img, w, h), "JPEG", x, y, w, h);
      doc.rect(x, y, w, h);
      return;
    }
  }
  doc.setFillColor(240); doc.rect(x, y, w, h, "FD");
  doc.setTextColor(150); doc.setFontSize(11);
  doc.text(label || "—", x + w / 2, y + h / 2, { align: "center", baseline: "middle" });
  doc.setTextColor(0);
}

// ---------- PDF (uma camisa por página) ----------
export async function gerarPdf(linhas, { titulo = "Encomenda", labels = {} } = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = 210, M = 12, GAP = 8;
  const frente = labels.frente || "Front";
  const verso = labels.verso || "Back";

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    if (i > 0) doc.addPage();

    // cabeçalho
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(20);
    doc.text(doc.splitTextToSize(l.nome || "—", PW - 2 * M)[0], M, M + 6);
    doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor(90);
    doc.text(`${titulo}  ·  ${resumoTamanhos(l)}`, M, M + 14);
    doc.setTextColor(0);

    // frente + verso, grandes. só desenhamos as caixas que TÊM foto — uma
    // camisa sem verso não mostra um quadrado de "verso" vazio.
    const top = M + 22;
    const boxW = (PW - 2 * M - GAP) / 2;
    const boxH = boxW * 1.25;
    const fotos = [];
    if (l.foto) fotos.push({ nome: l.foto, label: frente });
    if (l.fotoVerso) fotos.push({ nome: l.fotoVerso, label: verso });

    if (fotos.length === 2) {
      await colocarImagem(doc, fotos[0].nome, M, top, boxW, boxH, fotos[0].label);
      await colocarImagem(doc, fotos[1].nome, M + boxW + GAP, top, boxW, boxH, fotos[1].label);
      doc.setFontSize(10); doc.setTextColor(110);
      doc.text(fotos[0].label, M, top + boxH + 5);
      doc.text(fotos[1].label, M + boxW + GAP, top + boxH + 5);
      doc.setTextColor(0);
    } else if (fotos.length === 1) {
      // só uma foto (normalmente só a frente) — centrada, sem caixa ao lado
      const x = (PW - boxW) / 2;
      await colocarImagem(doc, fotos[0].nome, x, top, boxW, boxH, fotos[0].label);
      doc.setFontSize(10); doc.setTextColor(110);
      doc.text(fotos[0].label, x, top + boxH + 5);
      doc.setTextColor(0);
    }

    // patches grandes, para o fornecedor ver
    const patches = l.patches || [];
    if (patches.length) {
      let py = top + boxH + 16;
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Patches", M, py);
      py += 5;
      const pSize = 40, step = pSize + 16;
      let px = M;
      for (const p of patches) {
        if (px + pSize > PW - M) { px = M; py += step + 6; }
        await colocarImagem(doc, p.foto, px, py, pSize, pSize, "");
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60);
        doc.text(doc.splitTextToSize(p.nome || "patch", pSize), px, py + pSize + 5);
        doc.setTextColor(0);
        px += step;
      }
    }
  }

  return doc.output("blob");
}

// ---------- texto-resumo (copiar / WhatsApp) ----------
export function textoEncomenda(linhas, { titulo = "Encomenda" } = {}) {
  const pecas = linhas.reduce((s, l) => s + totalLinha(l), 0);
  const linhasTxt = linhas.map((l) => {
    const nomesPatch = (l.patches || []).map((p) => p.nome).filter(Boolean);
    const patch = nomesPatch.length ? `\n   + patch: ${nomesPatch.join(", ")}` : "";
    return `• ${l.nome || "Sem nome"} — ${resumoTamanhos(l)}${patch}`;
  });
  return `${titulo} (${pecas} peças)\n\n${linhasTxt.join("\n")}`;
}
