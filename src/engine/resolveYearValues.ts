export type Behaviour = 'CAPEX_ONE_TIME' | 'INFLATED_FROM_START' | 'INFLATED_FROM_YEAR' | 'RECURRING_FLAT' | 'CUSTOM';

export function resolveYearValues(
  rate: number,
  qty: number,
  behaviour: Behaviour,
  years: number,
  inflationRate: number,
  startYear?: number,
  manualOverrides?: Record<number, number>,
): number[] {
  const vals = new Array<number>(years).fill(0);

  if (behaviour === 'CAPEX_ONE_TIME') {
    vals[0] = rate * qty;
    for (let y = 2; y <= years; y++) {
      vals[y - 1] = manualOverrides?.[y] ?? 0;
    }
  } else if (behaviour === 'INFLATED_FROM_START') {
    vals[0] = rate * qty;
    for (let y = 2; y <= years; y++) {
      vals[y - 1] = vals[y - 2] * (1 + inflationRate);
    }
  } else if (behaviour === 'RECURRING_FLAT') {
    const base = rate * qty;
    for (let y = 0; y < years; y++) vals[y] = base;
  } else if (behaviour === 'CUSTOM') {
    for (let y = 1; y <= years; y++) {
      vals[y - 1] = manualOverrides?.[y] ?? 0;
    }
  } else if (behaviour === 'INFLATED_FROM_YEAR') {
    const start = startYear ?? 1;
    for (let y = 1; y < start; y++) {
      vals[y - 1] = manualOverrides?.[y] ?? 0;
    }
    if (start <= years) {
      vals[start - 1] = rate * qty;
    }
    for (let y = start + 1; y <= years; y++) {
      vals[y - 1] = vals[y - 2] * (1 + inflationRate);
    }
  }

  return vals;
}
