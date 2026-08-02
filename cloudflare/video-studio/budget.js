export function normalizeBudget(input = {}) {
  const monthlyEur = Math.max(1, Number(input.monthlyEur ?? input.budget ?? 15) || 15);
  const maxPerVideoEur = Math.max(0.1, Number(input.maxPerVideoEur ?? input.maxPerVideo ?? 1.2) || 1.2);
  return {
    monthlyEur: Math.min(500, monthlyEur),
    maxPerVideoEur: Math.min(100, maxPerVideoEur)
  };
}

export function monthKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function assertWithinBudget({ estimateEur, spentMonthEur, budget }) {
  const estimate = Number(estimateEur || 0);
  const spent = Number(spentMonthEur || 0);
  const { monthlyEur, maxPerVideoEur } = normalizeBudget(budget);
  if (estimate > maxPerVideoEur + 1e-9) {
    return {
      ok: false,
      code: "max_per_video",
      message: `Geschätzte Kosten ${estimate.toFixed(2)} € liegen über dem Limit pro Video (${maxPerVideoEur.toFixed(2)} €).`
    };
  }
  if (spent + estimate > monthlyEur + 1e-9) {
    return {
      ok: false,
      code: "monthly_budget",
      message: `Monatsbudget erschöpft: ${spent.toFixed(2)} € verbraucht, Limit ${monthlyEur.toFixed(2)} €, Auftrag ca. ${estimate.toFixed(2)} €.`
    };
  }
  return { ok: true, estimateEur: estimate, remainingEur: Math.max(0, monthlyEur - spent) };
}
