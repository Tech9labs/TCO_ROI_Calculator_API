export type Behaviour = 'CAPEX_ONE_TIME' | 'INFLATED_FROM_START' | 'INFLATED_FROM_YEAR' | 'RECURRING_FLAT' | 'CUSTOM';

export interface LineItemInput {
  name: string;
  rate: number;
  qty: number;
  behaviour: Behaviour;
  section: 'capex' | 'opex';
  startYear?: number;
  manualYearOverrides?: Record<number, number>;
  isAutoCalc?: boolean;
}

export interface CalculatorRequest {
  assumptions: Assumptions;
  lineItemsA: LineItemInput[];
  lineItemsB: LineItemInput[];
}

/**
 * All user-editable inputs — maps 1:1 to the ASSUMPTIONS sheet yellow cells.
 */
export interface Assumptions {
  // Project details
  customerName: string;
  projectName: string;
  sellerName: string;
  currency: string;            // e.g. "INR"
  reportDate: string;          // e.g. "May-2026"
  analysisPeriodYears: number; // 3 or 5
  numberOfUsers: number;

  // Financial assumptions
  discountRate: number;            // WACC — decimal, e.g. 0.12
  annualOpexInflationRate: number; // e.g. 0.07
  corporateTaxRate: number;        // e.g. 0.30
  capexDepreciationYears: number;  // e.g. 3

  // Power & cooling — Solution A (Proposed)
  ratedPowerSolAWatts: number;
  powerUtilizationSolA: number;    // % of rated power actually used, e.g. 70
  hoursPerDaySolA: number;         // hours powered on per day, e.g. 24
  powerTariffSolA: number;         // per kWh
  pueCoolingFactorSolA: number;    // e.g. 1.15

  // Power & cooling — Solution B (Existing)
  ratedPowerSolBWatts: number;
  powerUtilizationSolB: number;
  hoursPerDaySolB: number;
  powerTariffSolB: number;
  pueCoolingFactorSolB: number;

  // Labels
  solutionALabel: string;
  solutionBLabel: string;
}

/**
 * A single cost line item with Rate × Qty and yearly breakdowns.
 * yearValues[0] = Year 1, yearValues[N-1] = Year N.
 */
export interface LineItem {
  name: string;
  rate: number;
  qty: number;
  yearValues: number[];  // length === analysisPeriodYears
  total5Yr: number;
  startYear?: number;    // 1-based; for items that kick in later (e.g. AMC starts Year 4)
  inflated?: boolean;    // true if OPEX row grows with annualOpexInflationRate each year
}

/**
 * Full cost build for one solution (mirrors SOL_A / SOL_B sheets).
 */
export interface SolutionCosts {
  label: string;
  capexItems: LineItem[];
  opexItems: LineItem[];
  capexByYear: number[];  // sum of all CAPEX line items per year
  opexByYear: number[];   // sum of all OPEX line items per year
  totalByYear: number[];  // capexByYear[i] + opexByYear[i]
  grandTotal: number;
}

/**
 * Power & Cooling sheet outputs.
 */
export interface PowerCoolingResult {
  solA: {
    annualConsumptionKwh: number;
    annualPowerCost: number;
    annualCoolingCost: number;
    totalAnnualCost: number;
  };
  solB: {
    annualConsumptionKwh: number;
    annualPowerCost: number;
    annualCoolingCost: number;
    totalAnnualCost: number;
  };
  annualSaving: number;
}

/**
 * TCO Summary — mirrors TCO_SUMMARY sheet row-by-row.
 */
export interface TcoSummary {
  solACapexByYear: number[];
  solAOpexByYear: number[];
  solATotalByYear: number[];
  solBCapexByYear: number[];
  solBOpexByYear: number[];
  solBTotalByYear: number[];
  annualSavings: number[];      // solBTotal[i] - solATotal[i]
  cumulativeSavings: number[];  // running total of annualSavings
  totalSolA: number;
  totalSolB: number;
  grossSavings: number;
}

/**
 * Financial KPIs — mirrors FINANCIAL_KPIs sheet.
 */
export interface FinancialKpis {
  totalCostSolA: number;
  totalCostSolB: number;
  grossSavings: number;
  roiPercent: number;            // grossSavings / totalCostSolA
  npv: number;                   // NPV of annual savings discounted at WACC
  simplePaybackYears: number;    // Year-1 SolA cost / avg annual savings
  discountedPaybackYears: number;
  savingsPerUser: number;        // grossSavings / numberOfUsers
  annualPowerCoolingSaving: number;
  yearByYear: Array<{
    year: number;
    solACost: number;
    solBCost: number;
    annualSaving: number;
    cumulativeSaving: number;
    savingPercent: number;
  }>;
}

/**
 * Full calculator output — everything the frontend and export layer need.
 */
export interface CalculatorResult {
  assumptions: Assumptions;
  powerCooling: PowerCoolingResult;
  solutionA: SolutionCosts;
  solutionB: SolutionCosts;
  tcoSummary: TcoSummary;
  financialKpis: FinancialKpis;
}
