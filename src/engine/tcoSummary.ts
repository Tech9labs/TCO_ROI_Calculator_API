import { SolutionCosts, TcoSummary } from '../types/calculator';

export function buildTcoSummary(solA: SolutionCosts, solB: SolutionCosts): TcoSummary {
  const annualSavings = solA.totalByYear.map((a, i) => solB.totalByYear[i] - a);

  const cumulativeSavings = annualSavings.reduce<number[]>((acc, s) => {
    acc.push((acc[acc.length - 1] ?? 0) + s);
    return acc;
  }, []);

  return {
    solACapexByYear:   solA.capexByYear,
    solAOpexByYear:    solA.opexByYear,
    solATotalByYear:   solA.totalByYear,
    solBCapexByYear:   solB.capexByYear,
    solBOpexByYear:    solB.opexByYear,
    solBTotalByYear:   solB.totalByYear,
    annualSavings,
    cumulativeSavings,
    totalSolA:         solA.grandTotal,
    totalSolB:         solB.grandTotal,
    grossSavings:      solB.grandTotal - solA.grandTotal,
  };
}
