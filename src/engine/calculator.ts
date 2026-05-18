import { Assumptions, CalculatorResult } from '../types/calculator';
import { LineItemInput } from '../types/calculator';
import { calcPowerCooling } from './powerCooling';
import { buildSolutionCosts } from './solutionCosts';
import { buildTcoSummary } from './tcoSummary';
import { calcFinancialKpis } from './financialKpis';

export function runCalculator(
  assumptions: Assumptions,
  lineItemsA: LineItemInput[],
  lineItemsB: LineItemInput[],
): CalculatorResult {
  const powerCooling = calcPowerCooling(assumptions);

  const solutionA = buildSolutionCosts(
    assumptions.solutionALabel,
    lineItemsA,
    powerCooling.solA.totalAnnualCost,
    assumptions,
  );

  const solutionB = buildSolutionCosts(
    assumptions.solutionBLabel,
    lineItemsB,
    powerCooling.solB.totalAnnualCost,
    assumptions,
  );

  const tcoSummary    = buildTcoSummary(solutionA, solutionB);
  const financialKpis = calcFinancialKpis(assumptions, tcoSummary, powerCooling);

  return { assumptions, powerCooling, solutionA, solutionB, tcoSummary, financialKpis };
}
