import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { runCalculator } from '../engine/calculator';

const router = Router();

const behaviourEnum = z.enum(['CAPEX_ONE_TIME', 'INFLATED_FROM_START', 'INFLATED_FROM_YEAR', 'RECURRING_FLAT']);

const lineItemInputSchema = z.object({
  name:                z.string(),
  rate:                z.number(),
  qty:                 z.number(),
  behaviour:           behaviourEnum,
  section:             z.enum(['capex', 'opex']),
  startYear:           z.number().int().optional(),
  manualYearOverrides: z.record(z.string(), z.number()).optional(),
  isAutoCalc:          z.boolean().optional(),
});

const assumptionsSchema = z.object({
  customerName:            z.string(),
  projectName:             z.string(),
  sellerName:              z.string(),
  currency:                z.string(),
  reportDate:              z.string(),
  analysisPeriodYears:     z.number().int().min(1).max(10),
  numberOfUsers:           z.number().int().min(1),
  discountRate:            z.number().min(0).max(1),
  annualOpexInflationRate: z.number().min(0).max(1),
  corporateTaxRate:        z.number().min(0).max(1),
  capexDepreciationYears:  z.number().int().min(1),
  ratedPowerSolAWatts:     z.number().min(0),
  powerTariffSolA:         z.number().min(0),
  pueCoolingFactorSolA:    z.number().min(1),
  ratedPowerSolBWatts:     z.number().min(0),
  powerTariffSolB:         z.number().min(0),
  pueCoolingFactorSolB:    z.number().min(1),
  solutionALabel:          z.string(),
  solutionBLabel:          z.string(),
});

const calculatorRequestSchema = z.object({
  assumptions: assumptionsSchema,
  lineItemsA:  z.array(lineItemInputSchema),
  lineItemsB:  z.array(lineItemInputSchema),
});

router.post('/calculate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = calculatorRequestSchema.parse(req.body);
    const result = runCalculator(parsed.assumptions, parsed.lineItemsA, parsed.lineItemsB);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/export', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Excel export not yet implemented' });
});

export default router;
