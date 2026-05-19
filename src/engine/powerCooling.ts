import { Assumptions, PowerCoolingResult } from '../types/calculator';

export function calcPowerCooling(a: Assumptions): PowerCoolingResult {
  const calc = (watts: number, utilization: number, hoursPerDay: number, tariff: number, pue: number) => {
    const effectiveWatts = watts * (utilization / 100);
    const consumptionKwh = (effectiveWatts / 1000) * hoursPerDay * 365;
    const powerCost      = consumptionKwh * tariff;
    const coolingCost    = (pue - 1) * powerCost;
    return {
      annualConsumptionKwh: consumptionKwh,
      annualPowerCost:      powerCost,
      annualCoolingCost:    coolingCost,
      totalAnnualCost:      powerCost + coolingCost,
    };
  };

  const solA = calc(a.ratedPowerSolAWatts, a.powerUtilizationSolA ?? 100, a.hoursPerDaySolA ?? 24, a.powerTariffSolA, a.pueCoolingFactorSolA);
  const solB = calc(a.ratedPowerSolBWatts, a.powerUtilizationSolB ?? 100, a.hoursPerDaySolB ?? 24, a.powerTariffSolB, a.pueCoolingFactorSolB);

  return { solA, solB, annualSaving: solB.totalAnnualCost - solA.totalAnnualCost };
}
