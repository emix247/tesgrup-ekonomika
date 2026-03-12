import { TAX_RATES } from '@/lib/utils/constants';

export interface TaxInput {
  grossProfit: number;
  totalRevenue: number;
  totalCosts: number;
  vatRateRevenue: number;
  vatRateCosts: number;
  isVatPayer: boolean;
  foOtherIncome?: number;
}

export interface TaxResult {
  label: string;
  vatOnRevenue: number;
  vatOnCosts: number;
  netVat: number;
  revenueExVat: number;
  costsExVat: number;
  taxableBase: number;
  incomeTax: number;
  socialHealth: number;
  dividendTax: number;
  totalTaxBurden: number;
  netProfit: number;
  effectiveTaxRate: number;
}

function calcVat(total: number, rate: number, isVatPayer: boolean) {
  if (!isVatPayer) return { vatAmount: 0, exVat: total };
  const vatAmount = total * (rate / (100 + rate));
  return { vatAmount, exVat: total - vatAmount };
}

export function calculateTaxFO(input: TaxInput): TaxResult {
  const rev = calcVat(input.totalRevenue, input.vatRateRevenue, input.isVatPayer);
  const cost = calcVat(input.totalCosts, input.vatRateCosts, input.isVatPayer);
  const netVat = rev.vatAmount - cost.vatAmount;
  const taxableBase = rev.exVat - cost.exVat;

  // Progressive PIT: 15% up to threshold, 23% above
  const totalIncome = taxableBase + (input.foOtherIncome || 0);
  let incomeTax: number;
  if (totalIncome <= TAX_RATES.PIT_THRESHOLD) {
    incomeTax = Math.max(0, taxableBase * TAX_RATES.PIT_RATE_LOW);
  } else {
    const excess = Math.max(0, totalIncome - TAX_RATES.PIT_THRESHOLD);
    const base = taxableBase - excess;
    incomeTax = Math.max(0, base * TAX_RATES.PIT_RATE_LOW + excess * TAX_RATES.PIT_RATE_HIGH);
  }

  // Social + health insurance: on 50% of profit
  const assessmentBase = Math.max(0, taxableBase * 0.5);
  const socialHealth = assessmentBase * (TAX_RATES.SOCIAL_INSURANCE + TAX_RATES.HEALTH_INSURANCE);

  const totalTaxBurden = netVat + incomeTax + socialHealth;
  const netProfit = input.grossProfit - totalTaxBurden;

  return {
    label: 'Fyzická osoba',
    vatOnRevenue: rev.vatAmount,
    vatOnCosts: cost.vatAmount,
    netVat,
    revenueExVat: rev.exVat,
    costsExVat: cost.exVat,
    taxableBase,
    incomeTax,
    socialHealth,
    dividendTax: 0,
    totalTaxBurden,
    netProfit,
    effectiveTaxRate: input.grossProfit > 0 ? totalTaxBurden / input.grossProfit : 0,
  };
}

export function calculateTaxSRO(input: TaxInput): TaxResult {
  const rev = calcVat(input.totalRevenue, input.vatRateRevenue, input.isVatPayer);
  const cost = calcVat(input.totalCosts, input.vatRateCosts, input.isVatPayer);
  const netVat = rev.vatAmount - cost.vatAmount;
  const taxableBase = rev.exVat - cost.exVat;

  const cit = Math.max(0, taxableBase * TAX_RATES.CIT_RATE);
  const afterCit = taxableBase - cit;
  const dividendTax = Math.max(0, afterCit * TAX_RATES.DIVIDEND_WITHHOLDING);

  const totalTaxBurden = netVat + cit + dividendTax;
  const netProfit = input.grossProfit - totalTaxBurden;

  return {
    label: 's.r.o.',
    vatOnRevenue: rev.vatAmount,
    vatOnCosts: cost.vatAmount,
    netVat,
    revenueExVat: rev.exVat,
    costsExVat: cost.exVat,
    taxableBase,
    incomeTax: cit,
    socialHealth: 0,
    dividendTax,
    totalTaxBurden,
    netProfit,
    effectiveTaxRate: input.grossProfit > 0 ? totalTaxBurden / input.grossProfit : 0,
  };
}

export function calculateTaxSPV(input: TaxInput): TaxResult {
  // SPV = same as s.r.o. but potentially with participation exemption
  // For now, same calculation — can be extended later
  const result = calculateTaxSRO(input);
  return { ...result, label: 's.r.o. jako SPV' };
}

export function calculateTaxDruzstvo(input: TaxInput): TaxResult {
  const rev = calcVat(input.totalRevenue, input.vatRateRevenue, input.isVatPayer);
  const cost = calcVat(input.totalCosts, input.vatRateCosts, input.isVatPayer);
  const netVat = rev.vatAmount - cost.vatAmount;
  const taxableBase = rev.exVat - cost.exVat;

  // CIT at 21%, distribution to members taxed at 15%
  const cit = Math.max(0, taxableBase * TAX_RATES.CIT_RATE);
  const afterCit = taxableBase - cit;
  const memberTax = Math.max(0, afterCit * TAX_RATES.DIVIDEND_WITHHOLDING);

  const totalTaxBurden = netVat + cit + memberTax;
  const netProfit = input.grossProfit - totalTaxBurden;

  return {
    label: 'Družstvo',
    vatOnRevenue: rev.vatAmount,
    vatOnCosts: cost.vatAmount,
    netVat,
    revenueExVat: rev.exVat,
    costsExVat: cost.exVat,
    taxableBase,
    incomeTax: cit,
    socialHealth: 0,
    dividendTax: memberTax,
    totalTaxBurden,
    netProfit,
    effectiveTaxRate: input.grossProfit > 0 ? totalTaxBurden / input.grossProfit : 0,
  };
}

export function calculateAllTaxForms(input: TaxInput): TaxResult[] {
  return [
    calculateTaxFO(input),
    calculateTaxSRO(input),
    calculateTaxSPV(input),
    calculateTaxDruzstvo(input),
  ];
}
