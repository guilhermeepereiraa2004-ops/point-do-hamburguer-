"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { money } from "@/domain/menu";
import type { FinanceMonth } from "@/domain/reporting";
import "./finance-trend.css";

const metrics = {
  revenue: { label: "Faturamento", description: "Vendas contabilizadas na data em que o pedido foi concluído." },
  balance: { label: "Saldo", description: "Vendas e entradas manuais, menos as saídas do próprio mês." },
} as const;

export function FinanceTrend({ months }: { months: FinanceMonth[] }) {
  const [metric, setMetric] = useState<keyof typeof metrics>("revenue");
  const [period, setPeriod] = useState<"forward" | "history">("forward");
  const visible = months.filter(month => period === "history" ? month.status !== "upcoming" : month.status !== "closed");
  const values = visible.flatMap(month => {
    const value = month[metric];
    return value === null ? [] : [value];
  });
  const min = Math.min(0, ...values), max = Math.max(0, ...values);
  const range = max - min || 1;
  const zero = -min / range * 100;

  return <section className="finance-trend" aria-labelledby="finance-trend-title">
    <header className="finance-trend-header">
      <span className="finance-trend-icon"><TrendingUp size={22} aria-hidden="true"/></span>
      <div>
        <h2 id="finance-trend-title">Evolução mensal</h2>
        <p>{metrics[metric].description}</p>
      </div>
    </header>
    <div className="finance-trend-controls">
      <div className="finance-trend-switch" role="group" aria-label="Indicador financeiro">
        {(Object.keys(metrics) as (keyof typeof metrics)[]).map(key =>
          <button key={key} type="button" aria-pressed={metric === key} onClick={() => setMetric(key)}>{metrics[key].label}</button>
        )}
      </div>
      <select aria-label="Período da evolução mensal" value={period} onChange={event => setPeriod(event.target.value === "history" ? "history" : "forward")}>
        <option value="forward">Mês atual e próximos</option>
        <option value="history">Atual e 6 anteriores</option>
      </select>
    </div>
    <ul className="finance-trend-chart" aria-label={`${metrics[metric].label} por mês`}>
      {visible.map(month => {
        const value = month[metric];
        return <li key={month.start} className={`finance-trend-row is-${month.status}`}>
          <span className="finance-trend-month">{month.label}{month.status === "current" && <small>Em andamento</small>}</span>
          <span className="finance-trend-track" aria-hidden="true">
            {value !== null && <>
              {min < 0 && max > 0 && <i className="finance-trend-zero" style={{ left: `${zero}%` }}/>}
              {value !== 0 && <i className={value < 0 ? "finance-trend-bar is-negative" : "finance-trend-bar"} style={{ left: `${(Math.min(0, value) - min) / range * 100}%`, width: `${Math.abs(value) / range * 100}%` }}/>}
            </>}
          </span>
          <span className={`finance-trend-value${value !== null && value < 0 ? " is-negative" : ""}`}>{value === null ? "Ainda não iniciado" : money(value)}</span>
        </li>;
      })}
    </ul>
    <p className="finance-trend-note">Horário da Bahia · Os valores do mês em andamento são parciais.</p>
  </section>;
}
