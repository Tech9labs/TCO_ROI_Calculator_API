import { Assumptions, LineItem, SolutionCosts } from '../types/calculator';
import { LineItemInput } from '../types/calculator';
import { resolveYearValues } from './resolveYearValues';

export function buildSolutionCosts(
  label: string,
  lineItems: LineItemInput[],
  pwrCoolingAnnualCost: number,
  assumptions: Assumptions,
): SolutionCosts {
  const { analysisPeriodYears: years, annualOpexInflationRate: inflRate } = assumptions;

  const toLineItem = (inp: LineItemInput): LineItem => {
    let yearValues: number[];
    if (inp.isAutoCalc) {
      yearValues = new Array<number>(years).fill(pwrCoolingAnnualCost);
    } else {
      yearValues = resolveYearValues(
        inp.rate, inp.qty, inp.behaviour, years, inflRate,
        inp.startYear, inp.manualYearOverrides,
      );
    }
    return {
      name: inp.name,
      rate: inp.rate,
      qty: inp.qty,
      yearValues,
      total5Yr: yearValues.reduce((a, b) => a + b, 0),
      startYear: inp.startYear,
      inflated: inp.behaviour === 'INFLATED_FROM_START' || inp.behaviour === 'INFLATED_FROM_YEAR',
    };
  };

  const capexItems = lineItems.filter(r => r.section === 'capex').map(toLineItem);
  const opexItems  = lineItems.filter(r => r.section === 'opex').map(toLineItem);

  const sumByYear = (items: LineItem[]) =>
    Array.from({ length: years }, (_, i) => items.reduce((s, it) => s + it.yearValues[i], 0));

  const capexByYear = sumByYear(capexItems);
  const opexByYear  = sumByYear(opexItems);
  const totalByYear = capexByYear.map((c, i) => c + opexByYear[i]);

  return {
    label,
    capexItems,
    opexItems,
    capexByYear,
    opexByYear,
    totalByYear,
    grandTotal: totalByYear.reduce((a, b) => a + b, 0),
  };
}
