import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { nanoid } from 'nanoid';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const now = new Date().toISOString();

async function seed() {
  // Clear existing data (order matters for FK constraints)
  await db.delete(schema.overheadAllocations);
  await db.delete(schema.overheadCosts);
  await db.delete(schema.milestones);
  await db.delete(schema.loanDrawdowns);
  await db.delete(schema.sales);
  await db.delete(schema.actualCosts);
  await db.delete(schema.taxConfig);
  await db.delete(schema.financing);
  await db.delete(schema.forecastCosts);
  await db.delete(schema.revenueExtras);
  await db.delete(schema.revenueUnits);
  await db.delete(schema.projects);

  // ── Project 1: 19x RD Dubňany ──
  const p1 = nanoid();
  await db.insert(schema.projects).values({
    id: p1, name: '19x RD Dubňany', type: 'rodinne_domy',
    location: 'Dubňany, okres Hodonín', legalEntity: 'Tesgrup Development s.r.o.', legalForm: 'sro',
    status: 'realizace', startDate: '2025-03-01', endDate: '2027-06-30',
    notes: 'Výstavba 19 rodinných domů v lokalitě Dubňany-Jih', createdAt: now, updatedAt: now,
  });

  const p1Units: string[] = [];
  for (let i = 1; i <= 19; i++) {
    const uid = nanoid(); p1Units.push(uid);
    const area = 110 + Math.floor(Math.random() * 40);
    const pricePerM2 = 52000 + Math.floor(Math.random() * 8000);
    await db.insert(schema.revenueUnits).values({
      id: uid, projectId: p1, unitType: 'dum', label: `RD č. ${i}`,
      area, pricePerM2, totalPrice: area * pricePerM2, plannedSaleMonth: 6 + Math.floor(i / 3),
    });
  }

  await db.insert(schema.revenueExtras).values({ id: nanoid(), projectId: p1, category: 'garaz', label: 'Garážové stání', quantity: 12, unitPrice: 350000, totalPrice: 4200000 });
  await db.insert(schema.revenueExtras).values({ id: nanoid(), projectId: p1, category: 'parkovani', label: 'Venkovní parkovací stání', quantity: 19, unitPrice: 120000, totalPrice: 2280000 });

  for (const c of [
    { category: 'pozemek', label: 'Nákup pozemků', amount: 18500000 },
    { category: 'projektova_dokumentace', label: 'DUR + DSP + DPS', amount: 2800000 },
    { category: 'inzenyrska_cinnost', label: 'Stavební povolení a inženýring', amount: 950000 },
    { category: 'site_infrastruktura', label: 'Přípojky voda/plyn/elektro', amount: 4200000 },
    { category: 'priprava_stavby', label: 'Příprava staveniště', amount: 1500000 },
    { category: 'stavba_hlavni', label: 'Výstavba 19x RD', amount: 62000000 },
    { category: 'marketing', label: 'Marketing a realitní služby', amount: 2200000 },
    { category: 'management', label: 'TDI + PM', amount: 3100000 },
    { category: 'pravni_sluzby', label: 'Právní a notářské služby', amount: 650000 },
    { category: 'kolaudace', label: 'Kolaudace', amount: 380000 },
    { category: 'rezerva', label: 'Contingency 5%', amount: 4800000 },
  ]) {
    await db.insert(schema.forecastCosts).values({ id: nanoid(), projectId: p1, category: c.category, label: c.label, amount: c.amount, area: null, ratePerM2: null, notes: null, sortOrder: 0 });
  }

  await db.insert(schema.financing).values({ id: nanoid(), projectId: p1, equityAmount: 25000000, bankLoanAmount: 55000000, bankLoanRate: 5.9, bankLoanDurationMonths: 24, bankLoanFee: 550000, investorLoanAmount: 15000000, investorLoanRate: 8, investorLoanDurationMonths: 24, notes: 'KB developerský úvěr' });
  await db.insert(schema.taxConfig).values({ id: nanoid(), projectId: p1, taxForm: 'sro', vatPayer: true, vatRateRevenue: 12, vatRateCosts: 21, foOtherIncome: null, citRate: null, notes: null });

  for (const a of [
    { category: 'pozemek', supplier: 'Město Dubňany', amount: 18500000, status: 'uhrazeno', date: '2025-03-15' },
    { category: 'projektova_dokumentace', supplier: 'Atelier XY s.r.o.', amount: 1400000, status: 'uhrazeno', date: '2025-04-20' },
    { category: 'inzenyrska_cinnost', supplier: 'ING Pavel Novák', amount: 480000, status: 'uhrazeno', date: '2025-06-10' },
    { category: 'site_infrastruktura', supplier: 'E.ON', amount: 1200000, status: 'uhrazeno', date: '2025-07-15' },
    { category: 'priprava_stavby', supplier: 'Strabag a.s.', amount: 1500000, status: 'uhrazeno', date: '2025-05-01' },
    { category: 'stavba_hlavni', supplier: 'Tesgrup Build s.r.o.', amount: 15000000, status: 'uhrazeno', date: '2025-09-15' },
    { category: 'stavba_hlavni', supplier: 'Tesgrup Build s.r.o.', amount: 12000000, status: 'uhrazeno', date: '2025-12-01' },
    { category: 'marketing', supplier: 'RE/MAX', amount: 450000, status: 'uhrazeno', date: '2025-06-01' },
  ]) {
    await db.insert(schema.actualCosts).values({ id: nanoid(), projectId: p1, category: a.category, supplier: a.supplier, description: null, invoiceNumber: `FA-2025-${Math.floor(Math.random() * 900 + 100)}`, invoiceDate: a.date, dueDate: a.date, amount: a.amount, vatAmount: a.amount * 0.21, paymentStatus: a.status, paymentDate: a.status === 'uhrazeno' ? a.date : null, notes: null, createdAt: now });
  }

  const saleStatuses = ['predano', 'zaplaceno', 'smlouva', 'smlouva', 'rezervace', 'rezervace'];
  for (let i = 0; i < 6; i++) {
    await db.insert(schema.sales).values({ id: nanoid(), projectId: p1, unitId: p1Units[i], buyerName: ['Novák', 'Svobodová', 'Dvořák', 'Černý', 'Procházka', 'Kučerová'][i], status: saleStatuses[i], reservationDate: '2025-07-01', contractDate: i < 4 ? '2025-08-15' : null, paymentDate: i < 2 ? '2025-09-30' : null, agreedPrice: 6500000 + Math.floor(Math.random() * 1500000), depositAmount: 200000, depositPaid: i < 4, notes: null, createdAt: now, updatedAt: now });
  }

  for (const d of [
    { type: 'bank', pDate: '2025-04-01', aDate: '2025-04-05', pAmt: 10000000, aAmt: 10000000, purpose: 'Nákup pozemku' },
    { type: 'bank', pDate: '2025-07-01', aDate: '2025-07-10', pAmt: 15000000, aAmt: 15000000, purpose: 'Stavba 1. etapa' },
    { type: 'bank', pDate: '2025-10-01', aDate: '2025-10-15', pAmt: 15000000, aAmt: 14000000, purpose: 'Stavba 2. etapa' },
    { type: 'bank', pDate: '2026-01-01', aDate: null, pAmt: 15000000, aAmt: null, purpose: 'Stavba 3. etapa' },
    { type: 'investor', pDate: '2025-05-01', aDate: '2025-05-01', pAmt: 15000000, aAmt: 15000000, purpose: 'Investorský vklad' },
  ]) {
    await db.insert(schema.loanDrawdowns).values({ id: nanoid(), projectId: p1, loanType: d.type, plannedDate: d.pDate, actualDate: d.aDate, plannedAmount: d.pAmt, actualAmount: d.aAmt, purpose: d.purpose, notes: null });
  }

  for (const m of [
    { name: 'Nákup pozemků', pDate: '2025-03-15', aDate: '2025-03-15', status: 'splneno', order: 1 },
    { name: 'Stavební povolení', pDate: '2025-06-01', aDate: '2025-06-20', status: 'splneno', order: 2 },
    { name: 'Zahájení výstavby', pDate: '2025-07-01', aDate: '2025-07-05', status: 'splneno', order: 3 },
    { name: 'Dokončení hrubé stavby', pDate: '2026-03-01', aDate: null, status: 'probiha', order: 4 },
    { name: 'Kolaudace 1. etapa', pDate: '2026-09-01', aDate: null, status: 'ceka', order: 5 },
    { name: 'Kolaudace 2. etapa', pDate: '2027-03-01', aDate: null, status: 'ceka', order: 6 },
    { name: 'Předání posledního domu', pDate: '2027-06-30', aDate: null, status: 'ceka', order: 7 },
  ]) {
    await db.insert(schema.milestones).values({ id: nanoid(), projectId: p1, name: m.name, plannedDate: m.pDate, actualDate: m.aDate, status: m.status, sortOrder: m.order });
  }

  // ── Project 2: BD Brno — Vídeňská ──
  const p2 = nanoid();
  await db.insert(schema.projects).values({
    id: p2, name: 'BD Brno — Vídeňská', type: 'bytovy_dum',
    location: 'Brno-střed, ul. Vídeňská', legalEntity: 'Tesgrup Brno s.r.o.', legalForm: 'sro_spv',
    status: 'priprava', startDate: '2025-09-01', endDate: '2028-06-30',
    notes: 'Bytový dům 42 bytů, 2 komerční prostory v přízemí', createdAt: now, updatedAt: now,
  });

  for (let i = 1; i <= 42; i++) {
    const area = 35 + Math.floor(Math.random() * 65);
    const pricePerM2 = 85000 + Math.floor(Math.random() * 15000);
    await db.insert(schema.revenueUnits).values({ id: nanoid(), projectId: p2, unitType: 'byt', label: `Byt ${Math.ceil(i / 7)}.${((i - 1) % 7) + 1}`, area, pricePerM2, totalPrice: area * pricePerM2, plannedSaleMonth: 12 + Math.floor(i / 5) });
  }
  for (let i = 1; i <= 2; i++) {
    await db.insert(schema.revenueUnits).values({ id: nanoid(), projectId: p2, unitType: 'komercni_prostor', label: `KP ${i}`, area: 80 + i * 20, pricePerM2: 65000, totalPrice: (80 + i * 20) * 65000, plannedSaleMonth: 20 });
  }

  await db.insert(schema.revenueExtras).values({ id: nanoid(), projectId: p2, category: 'sklep', label: 'Sklepní kóje', quantity: 42, unitPrice: 180000, totalPrice: 7560000 });
  await db.insert(schema.revenueExtras).values({ id: nanoid(), projectId: p2, category: 'garaz', label: 'Podzemní garážové stání', quantity: 30, unitPrice: 550000, totalPrice: 16500000 });
  await db.insert(schema.revenueExtras).values({ id: nanoid(), projectId: p2, category: 'terasa', label: 'Střešní terasy', quantity: 6, unitPrice: 280000, totalPrice: 1680000 });

  for (const c of [
    { category: 'pozemek', label: 'Nákup pozemku Vídeňská', amount: 35000000 },
    { category: 'projektova_dokumentace', label: 'Architektonická studie + DPS', amount: 8500000 },
    { category: 'inzenyrska_cinnost', label: 'Inženýring a povolení', amount: 2200000 },
    { category: 'site_infrastruktura', label: 'Přípojky a komunikace', amount: 6500000 },
    { category: 'priprava_stavby', label: 'Demolice + příprava', amount: 3500000 },
    { category: 'stavba_hlavni', label: 'Výstavba BD (7 NP)', amount: 145000000 },
    { category: 'marketing', label: 'Marketing a prodejní tým', amount: 5500000 },
    { category: 'management', label: 'Projektový management', amount: 7200000 },
    { category: 'pravni_sluzby', label: 'Právní náklady', amount: 1800000 },
    { category: 'kolaudace', label: 'Kolaudační řízení', amount: 650000 },
    { category: 'rezerva', label: 'Contingency 7%', amount: 15000000 },
  ]) {
    await db.insert(schema.forecastCosts).values({ id: nanoid(), projectId: p2, category: c.category, label: c.label, amount: c.amount, area: null, ratePerM2: null, notes: null, sortOrder: 0 });
  }

  await db.insert(schema.financing).values({ id: nanoid(), projectId: p2, equityAmount: 50000000, bankLoanAmount: 130000000, bankLoanRate: 5.5, bankLoanDurationMonths: 36, bankLoanFee: 1300000, investorLoanAmount: 30000000, investorLoanRate: 9, investorLoanDurationMonths: 36, notes: 'ČSOB projektové financování' });
  await db.insert(schema.taxConfig).values({ id: nanoid(), projectId: p2, taxForm: 'sro_spv', vatPayer: true, vatRateRevenue: 12, vatRateCosts: 21, foOtherIncome: null, citRate: null, notes: null });

  for (const m of [
    { name: 'Nákup pozemku', pDate: '2025-09-15', aDate: null, status: 'ceka', order: 1 },
    { name: 'Územní rozhodnutí', pDate: '2026-02-01', aDate: null, status: 'ceka', order: 2 },
    { name: 'Stavební povolení', pDate: '2026-06-01', aDate: null, status: 'ceka', order: 3 },
    { name: 'Zahájení výstavby', pDate: '2026-07-01', aDate: null, status: 'ceka', order: 4 },
    { name: 'Kolaudace', pDate: '2028-03-01', aDate: null, status: 'ceka', order: 5 },
  ]) {
    await db.insert(schema.milestones).values({ id: nanoid(), projectId: p2, name: m.name, plannedDate: m.pDate, actualDate: m.aDate, status: m.status, sortOrder: m.order });
  }

  // ── Project 3: Garáže Hodonín ──
  const p3 = nanoid();
  await db.insert(schema.projects).values({
    id: p3, name: 'Garáže Hodonín', type: 'garaze',
    location: 'Hodonín, Brandlova', legalEntity: 'Tesgrup Development s.r.o.', legalForm: 'fo',
    status: 'dokonceno', startDate: '2024-01-01', endDate: '2025-02-28',
    notes: 'Dokončený projekt 24 garážových stání', createdAt: now, updatedAt: now,
  });

  for (let i = 1; i <= 24; i++) {
    await db.insert(schema.revenueUnits).values({ id: nanoid(), projectId: p3, unitType: 'komercni_prostor', label: `Garáž č. ${i}`, area: 18, pricePerM2: 25000, totalPrice: 450000, plannedSaleMonth: 10 });
  }

  for (const c of [
    { category: 'pozemek', label: 'Pozemek', amount: 2800000 },
    { category: 'projektova_dokumentace', label: 'Projektová dokumentace', amount: 350000 },
    { category: 'stavba_hlavni', label: 'Výstavba garáží', amount: 5600000 },
    { category: 'inzenyrska_cinnost', label: 'Inženýring', amount: 150000 },
    { category: 'marketing', label: 'Inzerce', amount: 80000 },
    { category: 'rezerva', label: 'Rezerva', amount: 500000 },
  ]) {
    await db.insert(schema.forecastCosts).values({ id: nanoid(), projectId: p3, category: c.category, label: c.label, amount: c.amount, area: null, ratePerM2: null, notes: null, sortOrder: 0 });
  }

  await db.insert(schema.financing).values({ id: nanoid(), projectId: p3, equityAmount: 5000000, bankLoanAmount: 4500000, bankLoanRate: 6.2, bankLoanDurationMonths: 14, bankLoanFee: 45000, investorLoanAmount: 0, investorLoanRate: 0, investorLoanDurationMonths: 0, notes: null });
  await db.insert(schema.taxConfig).values({ id: nanoid(), projectId: p3, taxForm: 'fo', vatPayer: false, vatRateRevenue: 21, vatRateCosts: 21, foOtherIncome: 0, citRate: null, notes: null });

  for (const a of [
    { category: 'pozemek', supplier: 'Město Hodonín', amount: 2800000 },
    { category: 'projektova_dokumentace', supplier: 'Ing. arch. Krejčí', amount: 350000 },
    { category: 'stavba_hlavni', supplier: 'Stavby Slovácko s.r.o.', amount: 5600000 },
  ]) {
    await db.insert(schema.actualCosts).values({ id: nanoid(), projectId: p3, category: a.category, supplier: a.supplier, description: null, invoiceNumber: `FA-2024-${Math.floor(Math.random() * 900 + 100)}`, invoiceDate: '2024-04-01', dueDate: '2024-04-30', amount: a.amount, vatAmount: null, paymentStatus: 'uhrazeno', paymentDate: '2024-04-25', notes: null, createdAt: now });
  }

  // ── Overhead ──
  for (const o of [
    { name: 'Pronájem kanceláře', amount: 25000, category: 'kancelar' },
    { name: 'Účetnictví', amount: 15000, category: 'sluzby' },
    { name: 'Pojištění odpovědnosti', amount: 8000, category: 'pojisteni' },
    { name: 'Telefon + internet', amount: 3500, category: 'kancelar' },
    { name: 'Daňový poradce', amount: 5000, category: 'sluzby' },
    { name: 'Software (licence)', amount: 4500, category: 'kancelar' },
  ]) {
    await db.insert(schema.overheadCosts).values({ id: nanoid(), name: o.name, monthlyAmount: o.amount, category: o.category, isActive: true, validFrom: null, validTo: null, notes: null });
  }

  await db.insert(schema.overheadAllocations).values({ id: nanoid(), projectId: p1, allocationPercent: 50, validFrom: null, validTo: null, notes: null });
  await db.insert(schema.overheadAllocations).values({ id: nanoid(), projectId: p2, allocationPercent: 35, validFrom: null, validTo: null, notes: null });
  await db.insert(schema.overheadAllocations).values({ id: nanoid(), projectId: p3, allocationPercent: 15, validFrom: null, validTo: null, notes: null });

  console.log('Seed data inserted successfully!');
  console.log(`  Project 1: ${p1} (19x RD Dubňany)`);
  console.log(`  Project 2: ${p2} (BD Brno — Vídeňská)`);
  console.log(`  Project 3: ${p3} (Garáže Hodonín)`);
  console.log(`  Overhead: 6 cost items, 3 allocations`);
}

seed().catch(console.error);
