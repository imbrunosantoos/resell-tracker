import { eur } from "@/lib/calculos";

// Gráfico de linha do lucro acumulado, semana a semana. SVG desenhado à mão —
// sem bibliotecas. A série já vem com o acumulado calculado.
const L = 56, R = 14, T = 16, B = 28; // margens
const LARG = 720, ALT = 240;

export default function GraficoLucro({ serie }) {
  if (serie.length === 0) {
    return (
      <div className="grafico-wrap">
        <p className="grafico-vazio">Ainda não há vendas. Assim que marcares a primeira, a linha começa aqui.</p>
      </div>
    );
  }

  const valores = serie.map((p) => p.lucro);
  const max = Math.max(...valores, 0);
  const min = Math.min(...valores, 0);
  const amplitude = max - min || 1;

  const x = (i) =>
    serie.length === 1 ? (L + LARG - R) / 2 : L + (i / (serie.length - 1)) * (LARG - L - R);
  const y = (v) => T + (1 - (v - min) / amplitude) * (ALT - T - B);

  const linha = serie.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.lucro)}`).join(" ");
  const area = `${linha} L ${x(serie.length - 1)} ${y(min)} L ${x(0)} ${y(min)} Z`;
  const zero = y(0);

  // só mostramos rótulos de algumas semanas para não ficar amontoado
  const passo = Math.ceil(serie.length / 6);

  return (
    <div className="grafico-wrap">
      <svg viewBox={`0 0 ${LARG} ${ALT}`} role="img" aria-label="Lucro acumulado ao longo do tempo">
        {/* eixo do zero */}
        <line className="eixo" x1={L} y1={zero} x2={LARG - R} y2={zero} />
        <text className="eixo-txt" x={L - 8} y={zero + 3} textAnchor="end">€0</text>
        <text className="eixo-txt" x={L - 8} y={y(max) + 3} textAnchor="end">{eur(max)}</text>

        {serie.length > 1 && <path className="area-lucro" d={area} />}
        <path className="linha-lucro" d={linha} />

        {serie.map((p, i) => (
          <g key={p.semana}>
            <circle className="ponto-lucro" cx={x(i)} cy={y(p.lucro)} r={serie.length > 30 ? 1.5 : 3} />
            {i % passo === 0 && (
              <text className="eixo-txt" x={x(i)} y={ALT - 8} textAnchor="middle">
                {p.semana.slice(5)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
