import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ═══════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  location: text('location'),
  legalEntity: text('legal_entity'),
  legalForm: text('legal_form'),
  status: text('status').notNull().default('priprava'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ═══════════════════════════════════════════════════════════
// REVENUE
// ═══════════════════════════════════════════════════════════

export const revenueUnits = sqliteTable('revenue_units', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  unitType: text('unit_type').notNull(),
  label: text('label'),
  area: real('area'),
  pricePerM2: real('price_per_m2'),
  totalPrice: real('total_price'),
  plannedSaleMonth: integer('planned_sale_month'),
});

export const revenueExtras = sqliteTable('revenue_extras', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  label: text('label'),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price'),
});

// ═══════════════════════════════════════════════════════════
// FORECAST COSTS
// ═══════════════════════════════════════════════════════════

export const forecastCosts = sqliteTable('forecast_costs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  label: text('label'),
  amount: real('amount').notNull(),
  area: real('area'),
  ratePerM2: real('rate_per_m2'),
  notes: text('notes'),
  sortOrder: integer('sort_order').default(0),
});

// ═══════════════════════════════════════════════════════════
// FINANCING
// ═══════════════════════════════════════════════════════════

export const financing = sqliteTable('financing', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  equityAmount: real('equity_amount').notNull().default(0),
  bankLoanAmount: real('bank_loan_amount').default(0),
  bankLoanRate: real('bank_loan_rate').default(0),
  bankLoanDurationMonths: integer('bank_loan_duration_months').default(0),
  bankLoanFee: real('bank_loan_fee').default(0),
  investorLoanAmount: real('investor_loan_amount').default(0),
  investorLoanRate: real('investor_loan_rate').default(0),
  investorLoanDurationMonths: integer('investor_loan_duration_months').default(0),
  notes: text('notes'),
});

// ═══════════════════════════════════════════════════════════
// TAX CONFIG
// ═══════════════════════════════════════════════════════════

export const taxConfig = sqliteTable('tax_config', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  taxForm: text('tax_form').notNull(),
  vatPayer: integer('vat_payer', { mode: 'boolean' }).default(true),
  vatRateRevenue: real('vat_rate_revenue').default(21),
  vatRateCosts: real('vat_rate_costs').default(21),
  foOtherIncome: real('fo_other_income'),
  citRate: real('cit_rate'),
  notes: text('notes'),
});

// ═══════════════════════════════════════════════════════════
// ACTUAL COSTS
// ═══════════════════════════════════════════════════════════

export const actualCosts = sqliteTable('actual_costs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  supplier: text('supplier'),
  description: text('description'),
  invoiceNumber: text('invoice_number'),
  invoiceDate: text('invoice_date'),
  dueDate: text('due_date'),
  amount: real('amount').notNull(),
  vatAmount: real('vat_amount'),
  paymentStatus: text('payment_status').notNull().default('neuhrazeno'),
  paymentDate: text('payment_date'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// ═══════════════════════════════════════════════════════════
// SALES PIPELINE
// ═══════════════════════════════════════════════════════════

export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  unitId: text('unit_id').references(() => revenueUnits.id),
  buyerName: text('buyer_name'),
  status: text('status').notNull().default('rezervace'),
  reservationDate: text('reservation_date'),
  contractDate: text('contract_date'),
  paymentDate: text('payment_date'),
  agreedPrice: real('agreed_price'),
  depositAmount: real('deposit_amount'),
  depositPaid: integer('deposit_paid', { mode: 'boolean' }).default(false),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ═══════════════════════════════════════════════════════════
// LOAN DRAWDOWNS
// ═══════════════════════════════════════════════════════════

export const loanDrawdowns = sqliteTable('loan_drawdowns', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  loanType: text('loan_type').notNull(),
  plannedDate: text('planned_date'),
  actualDate: text('actual_date'),
  plannedAmount: real('planned_amount'),
  actualAmount: real('actual_amount'),
  purpose: text('purpose'),
  notes: text('notes'),
});

// ═══════════════════════════════════════════════════════════
// MILESTONES
// ═══════════════════════════════════════════════════════════

export const milestones = sqliteTable('milestones', {
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

export const overheadCosts = sqliteTable('overhead_costs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  monthlyAmount: real('monthly_amount').notNull(),
  category: text('category'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  validFrom: text('valid_from'),
  validTo: text('valid_to'),
  notes: text('notes'),
});

export const overheadAllocations = sqliteTable('overhead_allocations', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  allocationPercent: real('allocation_percent').notNull(),
  validFrom: text('valid_from'),
  validTo: text('valid_to'),
  notes: text('notes'),
});
