import { Assumptions, PowerCoolingResult } from '../types/calculator';

export function calcPowerCooling(a: Assumptions): PowerCoolingResult {
  const calc = (watts: number, tariff: number, pue: number) => {
    const consumptionKwh = (watts / 1000) * 8760;
    const powerCost = consumptionKwh * tariff;
    const coolingCost = (pue - 1) * powerCost;
    return {
      annualConsumptionKwh: consumptionKwh,
      annualPowerCost: powerCost,
      annualCoolingCost: coolingCost,
      totalAnnualCost: powerCost + coolingCost,
    };
  };

  const solA = calc(a.ratedPowerSolAWatts, a.powerTariffSolA, a.pueCoolingFactorSolA);
  const solB = calc(a.ratedPowerSolBWatts, a.powerTariffSolB, a.pueCoolingFactorSolB);

  return { solA, solB, annualSaving: solB.totalAnnualCost - solA.totalAnnualCost };
}
