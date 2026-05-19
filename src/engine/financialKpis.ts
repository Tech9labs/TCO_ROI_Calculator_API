import { Assumptions, FinancialKpis, PowerCoolingResult, TcoSummary } from '../types/calculator';

export function calcFinancialKpis(
  assumptions: Assumptions,
  tco: TcoSummary,
  pwr: PowerCoolingResult,
): FinancialKpis {
  const { discountRate, numberOfUsers, analysisPeriodYears: years } = assumptions;
  const { annualSavings, cumulativeSavings, grossSavings, totalSolA, totalSolB, solATotalByYear } = tco;

  const roiPercent = totalSolA > 0 ? (grossSavings / totalSolA) * 100 : 0;

  let npv = 0;
  for (let i = 0; i < annualSavings.length; i++) {
    npv += annualSavings[i] / Math.pow(1 + discountRate, i + 1);
  }

  const avgAnnualSaving = years > 0 ? grossSavings / years : 0;
  const simplePaybackYears = avgAnnualSaving > 0 ? solATotalByYear[0] / avgAnnualSaving : years + 1;

  let cumDiscounted = 0;
  let discountedPaybackYears = years + 1;
  for (let i = 0; i < annualSavings.length; i++) {
    cumDiscounted += annualSavings[i] / Math.pow(1 + discountRate, i + 1);
    if (cumDiscounted >= 0) {
      discountedPaybackYears = i + 1;
      break;
    }
  }

  const savingsPerUser = numberOfUsers > 0 ? grossSavings / numberOfUsers : 0;

  const yearByYear = annualSavings.map((saving, i) => ({
    year: i + 1,
    solACost: tco.solATotalByYear[i],
    solBCost: tco.solBTotalByYear[i],
    annualSaving: saving,
    cumulativeSaving: cumulativeSavings[i],
    savingPercent: tco.solBTotalByYear[i] > 0 ? (saving / tco.solBTotalByYear[i]) * 100 : 0,
  }));

  return {
    totalCostSolA: totalSolA,
    totalCostSolB: totalSolB,
    grossSavings,
    roiPercent,
    npv,
    simplePaybackYears,
    discountedPaybackYears,
    savingsPerUser,
    annualPowerCoolingSaving: pwr.annualSaving,
    yearByYear,
  };
}
