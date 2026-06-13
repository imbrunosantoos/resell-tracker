"use client";

// Skeleton loader reutilizável: barras a pulsar suavemente enquanto há dados a
// carregar (em vez de spinners). Usado onde há carregamento assíncrono real —
// ex.: as credenciais na aba Contas e a montagem do gráfico.
export default function Skeleton({ rows = 5, height = 38, gap = 8 }) {
  return (
    <div className="skeleton" aria-hidden="true" style={{ gap }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="sk-linha" key={i} style={{ height }} />
      ))}
    </div>
  );
}
