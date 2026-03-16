import { TAX_RATES } from '@/lib/utils/constants';
import { grossToNet, vatFromGross } from '@/lib/utils/vat';

export interface VatItem {
  amount: number;   // cena vč. DPH
  vatRate: number;  // DPH sazba (0, 12, 21)
}

export interface TaxInput {
  grossProfit: number;
  totalRevenue: number;    // P — prodejní cena (pro kupujícího)
  totalCosts: number;      // N + PZ — náklady výstavby + pozemek (vč. financování)
  vatRateRevenue: number;  // DPH sazba na příjmy (default 12 pro bytovou výstavbu) — fallback
  vatRateCosts: number;    // (zachováno pro kompatibilitu)
  isVatPayer: boolean;     // (zachováno pro kompatibilitu, entity typ určuje)
  foOtherIncome?: number;  // (zachováno pro kompatibilitu)
  /** Per-item revenue data for precise DPH calculation */
  revenueItems?: VatItem[];
  /** Per-item cost data for precise DPH calculation */
  costItems?: VatItem[];
}

export interface TaxResult {
  label: string;
  vatOnRevenue: number;     // DPH k odvodu z příjmů
  vatOnCosts: number;       // DPH na nákladech (info)
  netVat: number;           // Čistý DPH k odvodu
  revenueExVat: number;     // Příjmy bez DPH (základ)
  costsExVat: number;       // Náklady
  taxableBase: number;      // Základ daně
  incomeTax: number;        // Daň z příjmů (DPPO / DPFO)
  socialHealth: number;     // (vždy 0 — nepoužíváno)
  dividendTax: number;      // (vždy 0 — nepoužíváno)
  totalTaxBurden: number;   // Celková daňová zátěž
  netProfit: number;        // Čistý zisk
  effectiveTaxRate: number; // Efektivní daňová zátěž (daňová zátěž / P)
}

/**
 * 1. Tesgrup s.r.o. — plátce DPH
 *
 * P = cena pro kupujícího vč. DPH (12 %)
 * N = náklady výstavby bez DPH (plátce si nárokuje odpočet)
 * PZ = pozemek bez DPH
 *
 * DPH k odvodu  = P × 12 / 112
 * Základ daně   = (P / 1.12) − N − PZ
 * DPPO          = max(0, základ daně × 0.21)
 * Čistý zisk    = základ daně − DPPO
 * Daňová zátěž  = DPH k odvodu + DPPO
 */
export function calculateTaxSRO(input: TaxInput): TaxResult {
  let dphOdvod: number;
  let revenueExVat: number;
  let costsExVat: number;

  // Per-item DPH calculation when items are available
  if (input.revenueItems && input.revenueItems.length > 0) {
    dphOdvod = input.revenueItems.reduce((s, item) => s + vatFromGross(item.amount, item.vatRate), 0);
    revenueExVat = input.revenueItems.reduce((s, item) => s + grossToNet(item.amount, item.vatRate), 0);
  } else {
    // Fallback: single-rate calculation
    const vatRate = input.vatRateRevenue;
    dphOdvod = input.totalRevenue * vatRate / (100 + vatRate);
    revenueExVat = input.totalRevenue - dphOdvod;
  }

  // Náklady: plátce DPH si nárokuje odpočet → používáme ceny bez DPH
  if (input.costItems && input.costItems.length > 0) {
    costsExVat = input.costItems.reduce((s, item) => s + grossToNet(item.amount, item.vatRate), 0);
  } else {
    costsExVat = input.totalCosts;
  }

  const taxableBase = revenueExVat - costsExVat;
  const dppo = Math.max(0, taxableBase * TAX_RATES.CIT_RATE);

  const totalTaxBurden = dphOdvod + dppo;
  const netProfit = taxableBase - dppo;

  return {
    label: 'Tesgrup s.r.o.',
    vatOnRevenue: dphOdvod,
    vatOnCosts: 0,
    netVat: dphOdvod,
    revenueExVat,
    costsExVat,
    taxableBase,
    incomeTax: dppo,
    socialHealth: 0,
    dividendTax: 0,
    totalTaxBurden,
    netProfit,
    effectiveTaxRate: input.totalRevenue > 0 ? totalTaxBurden / input.totalRevenue : 0,
  };
}

/**
 * 2. SPV s.r.o. — neplátce DPH (1 SPV = 1 projekt)
 *
 * P = čistá prodejní cena (bez DPH)
 * N = náklady výstavby vč. DPH (DPH = součást nákladů)
 * PZ = pozemek bez DPH
 *
 * DPH k odvodu  = 0
 * Základ daně   = P − N − PZ
 * DPPO          = max(0, základ daně × 0.21)
 * Čistý zisk    = základ daně − DPPO
 * Daňová zátěž  = DPPO
 */
export function calculateTaxSPV(input: TaxInput): TaxResult {
  const taxableBase = input.totalRevenue - input.totalCosts;
  const dppo = Math.max(0, taxableBase * TAX_RATES.CIT_RATE);

  const totalTaxBurden = dppo;
  const netProfit = taxableBase - dppo;

  return {
    label: 'SPV s.r.o.',
    vatOnRevenue: 0,
    vatOnCosts: 0,
    netVat: 0,
    revenueExVat: input.totalRevenue,
    costsExVat: input.totalCosts,
    taxableBase,
    incomeTax: dppo,
    socialHealth: 0,
    dividendTax: 0,
    totalTaxBurden,
    netProfit,
    effectiveTaxRate: input.totalRevenue > 0 ? totalTaxBurden / input.totalRevenue : 0,
  };
}

/**
 * 3. Fyzická osoba — neplátce DPH
 *
 * P = čistá prodejní cena (bez DPH)
 * N = náklady výstavby vč. DPH (DPH = součást nákladů)
 * PZ = pozemek bez DPH
 *
 * DPH k odvodu  = 0
 * Základ daně   = P − N − PZ
 * Daň:
 *   ZD ≤ 2 100 000 Kč  →  ZD × 0.15
 *   ZD > 2 100 000 Kč  →  2 100 000 × 0.15 + (ZD − 2 100 000) × 0.23
 * Čistý zisk    = základ daně − daň
 * Daňová zátěž  = daň
 */
export function calculateTaxFO(input: TaxInput): TaxResult {
  const taxableBase = input.totalRevenue - input.totalCosts;

  let incomeTax: number;
  if (taxableBase <= 0) {
    incomeTax = 0;
  } else if (taxableBase <= TAX_RATES.PIT_THRESHOLD) {
    incomeTax = taxableBase * TAX_RATES.PIT_RATE_LOW;
  } else {
    incomeTax =
      TAX_RATES.PIT_THRESHOLD * TAX_RATES.PIT_RATE_LOW +
      (taxableBase - TAX_RATES.PIT_THRESHOLD) * TAX_RATES.PIT_RATE_HIGH;
  }

  const totalTaxBurden = incomeTax;
  const netProfit = taxableBase - incomeTax;

  return {
    label: 'Fyzická osoba',
    vatOnRevenue: 0,
    vatOnCosts: 0,
    netVat: 0,
    revenueExVat: input.totalRevenue,
    costsExVat: input.totalCosts,
    taxableBase,
    incomeTax,
    socialHealth: 0,
    dividendTax: 0,
    totalTaxBurden,
    netProfit,
    effectiveTaxRate: input.totalRevenue > 0 ? totalTaxBurden / input.totalRevenue : 0,
  };
}

/**
 * 4. Družstvo — neplátce DPH
 *
 * Daňově identické s SPV s.r.o.
 * P = čistá prodejní cena (bez DPH)
 * N = náklady výstavby vč. DPH (DPH = součást nákladů)
 * PZ = pozemek bez DPH
 *
 * DPPO = max(0, základ daně × 0.21)
 */
export function calculateTaxDruzstvo(input: TaxInput): TaxResult {
  const result = calculateTaxSPV(input);
  return { ...result, label: 'Družstvo' };
}

export function calculateAllTaxForms(input: TaxInput): TaxResult[] {
  return [
    calculateTaxSRO(input),
    calculateTaxSPV(input),
    calculateTaxFO(input),
    calculateTaxDruzstvo(input),
  ];
}
