import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Název projektu je povinný'),
  type: z.string().min(1, 'Typ projektu je povinný'),
  location: z.string().optional().default(''),
  legalEntity: z.string().optional().default(''),
  legalForm: z.string().optional().default(''),
  status: z.string().optional().default('priprava'),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  constructionStartDate: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export const revenueUnitSchema = z.object({
  unitType: z.string().min(1),
  label: z.string().optional().default(''),
  area: z.number().nonnegative().optional(),
  pricePerM2: z.number().nonnegative().optional(),
  totalPrice: z.number().nonnegative().optional(),
  totalPriceBezDph: z.number().nonnegative().optional(),
  vatRate: z.number().nonnegative().optional(),
  taxExempt: z.boolean().optional(),
  plannedSaleMonth: z.number().int().nonnegative().optional(),
});

export const revenueExtraSchema = z.object({
  category: z.string().min(1),
  label: z.string().optional().default(''),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative().optional(),
  totalPriceBezDph: z.number().nonnegative().optional(),
  vatRate: z.number().nonnegative().optional(),
  taxExempt: z.boolean().optional(),
});

export const forecastCostSchema = z.object({
  category: z.string().min(1),
  label: z.string().optional().default(''),
  amount: z.number().nonnegative(),
  amountBezDph: z.number().nonnegative().optional(),
  vatRate: z.number().nonnegative().optional(),
  area: z.number().nonnegative().optional(),
  ratePerM2: z.number().nonnegative().optional(),
  notes: z.string().optional().default(''),
  sortOrder: z.number().int().optional().default(0),
});

export const financingSchema = z.object({
  equityAmount: z.number().nonnegative().default(0),
  bankLoanAmount: z.number().nonnegative().nullable().default(null),
  bankLoanRate: z.number().nonnegative().nullable().default(null),
  bankLoanDurationMonths: z.number().int().nonnegative().nullable().default(null),
  bankLoanFee: z.number().nonnegative().nullable().default(null),
  bankLoanStartDate: z.string().nullable().default(null),
  investorLoanAmount: z.number().nonnegative().nullable().default(null),
  investorLoanRate: z.number().nonnegative().nullable().default(null),
  investorLoanDurationMonths: z.number().int().nonnegative().nullable().default(null),
  investorLoanStartDate: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
});

export const taxConfigSchema = z.object({
  taxForm: z.string().min(1),
  vatPayer: z.boolean().default(true),
  vatRateRevenue: z.number().nonnegative().default(21),
  vatRateCosts: z.number().nonnegative().default(21),
  foOtherIncome: z.number().nonnegative().optional(),
  citRate: z.number().nonnegative().optional(),
  notes: z.string().optional().default(''),
});

export const actualCostSchema = z.object({
  category: z.string().min(1),
  supplier: z.string().optional().default(''),
  description: z.string().optional().default(''),
  invoiceNumber: z.string().optional().default(''),
  invoiceDate: z.string().optional().default(''),
  dueDate: z.string().optional().default(''),
  amount: z.number().nonnegative(),
  amountBezDph: z.number().nonnegative().optional(),
  vatRate: z.number().nonnegative().optional(),
  vatAmount: z.number().nonnegative().optional(),
  paymentStatus: z.string().default('neuhrazeno'),
  paymentDate: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export const saleSchema = z.object({
  unitId: z.string().optional(),
  buyerName: z.string().optional().default(''),
  status: z.string().default('rezervace'),
  reservationDate: z.string().optional().default(''),
  contractDate: z.string().optional().default(''),
  paymentDate: z.string().optional().default(''),
  agreedPrice: z.number().nonnegative().optional(),
  depositAmount: z.number().nonnegative().optional(),
  depositPaid: z.boolean().default(false),
  notes: z.string().optional().default(''),
});

export const overheadCostSchema = z.object({
  name: z.string().min(1, 'Název je povinný'),
  monthlyAmount: z.number().positive('Částka musí být kladná'),
  category: z.string().optional().default(''),
  isActive: z.boolean().default(true),
  validFrom: z.string().optional().default(''),
  validTo: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export const overheadAllocationSchema = z.object({
  projectId: z.string().min(1),
  allocationPercent: z.number().min(0).max(100),
  validFrom: z.string().optional().default(''),
  validTo: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});
