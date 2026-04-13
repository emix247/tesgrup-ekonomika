import { pgTable, text, integer, doublePrecision, boolean } from 'drizzle-orm/pg-core';

// ═══════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  location: text('location'),
  legalEntity: text('legal_entity'),
  legalForm: text('legal_form'),
  status: text('status').notNull().default('priprava'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  constructionStartDate: text('construction_start_date'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ═══════════════════════════════════════════════════════════
// REVENUE
// ═══════════════════════════════════════════════════════════

export const revenueUnits = pgTable('revenue_units', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  unitType: text('unit_type').notNull(),
  label: text('label'),
  area: doublePrecision('area'),
  pricePerM2: doublePrecision('price_per_m2'),
  totalPrice: doublePrecision('total_price'),
  vatRate: doublePrecision('vat_rate'),
  taxExempt: boolean('tax_exempt').default(false),
  plannedSaleMonth: integer('planned_sale_month'),
  version: integer('version').notNull().default(1),
});

export const revenueExtras = pgTable('revenue_extras', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  label: text('label'),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: doublePrecision('unit_price').notNull(),
  totalPrice: doublePrecision('total_price'),
  vatRate: doublePrecision('vat_rate'),
  taxExempt: boolean('tax_exempt').default(false),
  version: integer('version').notNull().default(1),
});

// ═══════════════════════════════════════════════════════════
// FORECAST COSTS
// ═══════════════════════════════════════════════════════════

export const forecastCosts = pgTable('forecast_costs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  label: text('label'),
  amount: doublePrecision('amount').notNull(),
  vatRate: doublePrecision('vat_rate'),
  area: doublePrecision('area'),
  ratePerM2: doublePrecision('rate_per_m2'),
  notes: text('notes'),
  sortOrder: integer('sort_order').default(0),
  version: integer('version').notNull().default(1),
});

// ═══════════════════════════════════════════════════════════
// FINANCING
// ═══════════════════════════════════════════════════════════

export const financing = pgTable('financing', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  equityAmount: doublePrecision('equity_amount').notNull().default(0),
  bankLoanAmount: doublePrecision('bank_loan_amount').default(0),
  bankLoanRate: doublePrecision('bank_loan_rate').default(0),
  bankLoanDurationMonths: integer('bank_loan_duration_months').default(0),
  bankLoanFee: doublePrecision('bank_loan_fee').default(0),
  bankLoanStartDate: text('bank_loan_start_date'),
  investorLoanAmount: doublePrecision('investor_loan_amount').default(0),
  investorLoanRate: doublePrecision('investor_loan_rate').default(0),
  investorLoanDurationMonths: integer('investor_loan_duration_months').default(0),
  investorLoanStartDate: text('investor_loan_start_date'),
  notes: text('notes'),
});

// ═══════════════════════════════════════════════════════════
// TAX CONFIG
// ═══════════════════════════════════════════════════════════

export const taxConfig = pgTable('tax_config', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  taxForm: text('tax_form').notNull(),
  vatPayer: boolean('vat_payer').default(true),
  vatRateRevenue: doublePrecision('vat_rate_revenue').default(21),
  vatRateCosts: doublePrecision('vat_rate_costs').default(21),
  foOtherIncome: doublePrecision('fo_other_income'),
  citRate: doublePrecision('cit_rate'),
  notes: text('notes'),
});

// ═══════════════════════════════════════════════════════════
// ACTUAL COSTS
// ═══════════════════════════════════════════════════════════

export const actualCosts = pgTable('actual_costs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  supplier: text('supplier'),
  description: text('description'),
  invoiceNumber: text('invoice_number'),
  invoiceDate: text('invoice_date'),
  dueDate: text('due_date'),
  amount: doublePrecision('amount').notNull(),
  vatRate: doublePrecision('vat_rate'),
  vatAmount: doublePrecision('vat_amount'),
  paymentStatus: text('payment_status').notNull().default('neuhrazeno'),
  paymentDate: text('payment_date'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  version: integer('version').notNull().default(1),
});

// ═══════════════════════════════════════════════════════════
// SALES PIPELINE
// ═══════════════════════════════════════════════════════════

export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  unitId: text('unit_id').references(() => revenueUnits.id),
  buyerName: text('buyer_name'),
  buyerEmail: text('buyer_email'),
  buyerPhone: text('buyer_phone'),
  status: text('status').notNull().default('rezervace'),
  reservationDate: text('reservation_date'),
  contractDate: text('contract_date'),
  paymentDate: text('payment_date'),
  agreedPrice: doublePrecision('agreed_price'),
  depositAmount: doublePrecision('deposit_amount'),
  depositPaid: boolean('deposit_paid').default(false),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ═══════════════════════════════════════════════════════════
// PAYMENTS (zálohy/platby ke smlouvám)
// ═══════════════════════════════════════════════════════════

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id),
  amount: integer('amount').notNull(),
  paymentDate: text('payment_date').notNull(),
  label: text('label'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ═══════════════════════════════════════════════════════════
// LOAN DRAWDOWNS
// ═══════════════════════════════════════════════════════════

export const loanDrawdowns = pgTable('loan_drawdowns', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  loanType: text('loan_type').notNull(),
  plannedDate: text('planned_date'),
  actualDate: text('actual_date'),
  plannedAmount: doublePrecision('planned_amount'),
  actualAmount: doublePrecision('actual_amount'),
  purpose: text('purpose'),
  notes: text('notes'),
});

// ═══════════════════════════════════════════════════════════
// MILESTONES
// ═══════════════════════════════════════════════════════════

export const milestones = pgTable('milestones', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  plannedDate: text('planned_date'),
  actualDate: text('actual_date'),
  status: text('status').notNull().default('ceka'),
  sortOrder: integer('sort_order').default(0),
});

// ═══════════════════════════════════════════════════════════
// OVERHEAD
// ═══════════════════════════════════════════════════════════

export const overheadCosts = pgTable('overhead_costs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  monthlyAmount: doublePrecision('monthly_amount').notNull(),
  category: text('category'),
  isActive: boolean('is_active').default(true),
  validFrom: text('valid_from'),
  validTo: text('valid_to'),
  notes: text('notes'),
});

export const overheadAllocations = pgTable('overhead_allocations', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  allocationPercent: doublePrecision('allocation_percent').notNull(),
  validFrom: text('valid_from'),
  validTo: text('valid_to'),
  notes: text('notes'),
});

// ═══════════════════════════════════════════════════════════
// CASHFLOW 13W
// ═══════════════════════════════════════════════════════════

export const cfProjects = pgTable('cf_projects', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
});

export const cfItems = pgTable('cf_items', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  type: text('type').notNull(),
  name: text('name').notNull(),
  projectId: integer('project_id').references(() => cfProjects.id),
  amount: doublePrecision('amount').notNull(),
  paymentDate: text('payment_date').notNull(),
  certainty: text('certainty').notNull(),
  category: text('category').notNull(),
  note: text('note'),
  counterparty: text('counterparty'),
  isPaid: boolean('is_paid').notNull().default(false),
  paidAt: text('paid_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const cfCashBalances = pgTable('cf_cash_balances', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  amount: doublePrecision('amount').notNull(),
  accountAmount: doublePrecision('account_amount').notNull().default(0),
  cashAmount: doublePrecision('cash_amount').notNull().default(0),
  date: text('date').notNull(),
  note: text('note'),
  createdAt: text('created_at').notNull(),
});

export const cfInvestorLoans = pgTable('cf_investor_loans', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  creditor: text('creditor').notNull(),
  amount: doublePrecision('amount').notNull(),
  startDate: text('start_date').notNull(),
  dueDate: text('due_date').notNull(),
  interestRate: doublePrecision('interest_rate'),
  collateral: text('collateral'),
  note: text('note'),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const cfParameters = pgTable('cf_parameters', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

export const cfWeeklySnapshots = pgTable('cf_weekly_snapshots', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  weekLabel: text('week_label').notNull(),
  note: text('note'),
  data: text('data').notNull(),
  createdAt: text('created_at').notNull(),
});
