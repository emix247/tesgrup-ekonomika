import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { projects, revenueUnits, revenueExtras, forecastCosts, actualCosts, financing, sales, taxConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { grossToNet } from '@/lib/utils/vat';
import { formatCZK } from '@/lib/utils/format';

const anthropic = new Anthropic(); // Uses ANTHROPIC_API_KEY env var

export async function POST(req: NextRequest) {
  try {
    const { messages, projectId } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    // Fetch project context if projectId is provided
    let projectContext = '';
    if (projectId) {
      projectContext = await buildProjectContext(projectId);
    } else {
      projectContext = await buildPortfolioContext();
    }

    const systemPrompt = `Jsi AI finanční asistent pro aplikaci Tesgrup Development — Ekonomika projektů. Pomáháš s analýzou developerských projektů (bytová výstavba, rodinné domy).

PRAVIDLA:
- Odpovídej VŽDY česky
- Buď stručný a konkrétní, používej čísla z dat
- Formátuj částky v Kč (např. 1 500 000 Kč)
- Pokud nemáš dostatek dat, řekni to
- Můžeš doporučovat, upozorňovat na rizika, porovnávat s plánem
- Používej markdown pro přehlednost (nadpisy, seznamy, tučné)

AKTUÁLNÍ DATA:
${projectContext}`;

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    // Return streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[AI Chat] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function buildProjectContext(projectId: string): Promise<string> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) return 'Projekt nenalezen.';

  const units = await db.select().from(revenueUnits).where(eq(revenueUnits.projectId, projectId));
  const extras = await db.select().from(revenueExtras).where(eq(revenueExtras.projectId, projectId));
  const forecast = await db.select().from(forecastCosts).where(eq(forecastCosts.projectId, projectId));
  const actual = await db.select().from(actualCosts).where(eq(actualCosts.projectId, projectId));
  const fin = await db.select().from(financing).where(eq(financing.projectId, projectId));
  const sal = await db.select().from(sales).where(eq(sales.projectId, projectId));
  const tax = await db.select().from(taxConfig).where(eq(taxConfig.projectId, projectId));

  const taxForm = tax[0]?.taxForm || 'sro';
  const isVatPayer = taxForm === 'sro';

  const unitsTotal = units.reduce((s, u) => s + (u.totalPrice || 0), 0);
  const unitsBezDph = units.reduce((s, u) => s + Math.round(grossToNet(u.totalPrice || 0, u.vatRate ?? 12)), 0);
  const extrasTotal = extras.reduce((s, e) => s + (e.totalPrice || 0), 0);
  const extrasBezDph = extras.reduce((s, e) => s + Math.round(grossToNet(e.totalPrice || 0, e.vatRate ?? 12)), 0);
  const forecastTotal = forecast.reduce((s, c) => s + c.amount, 0);
  const forecastBezDph = forecast.reduce((s, c) => s + Math.round(grossToNet(c.amount, c.vatRate ?? 21)), 0);
  const actualTotal = actual.reduce((s, c) => s + c.amount, 0);
  const actualBezDph = actual.reduce((s, c) => s + Math.round(grossToNet(c.amount, c.vatRate ?? 21)), 0);

  const activeSales = sal.filter(s => s.status !== 'stornovano');
  const contracted = activeSales.filter(s => ['smlouva', 'zaplaceno', 'predano'].includes(s.status));
  const paid = activeSales.filter(s => ['zaplaceno', 'predano'].includes(s.status));

  const unitsSold = activeSales.length;
  const unitsContracted = contracted.length;
  const unitsPaid = paid.length;

  const taxExemptUnits = units.filter(u => u.taxExempt);
  const taxExemptTotal = taxExemptUnits.reduce((s, u) => s + (u.totalPrice || 0), 0);

  let lines = [
    `PROJEKT: ${project.name}`,
    `Typ: ${project.type}, Lokalita: ${project.location || 'neuvedena'}`,
    `Stav: ${project.status}`,
    `Právní forma: ${taxForm}, Plátce DPH: ${isVatPayer ? 'ano' : 'ne'}`,
    `Zahájení: ${project.startDate || '—'}, Konec: ${project.endDate || '—'}`,
    '',
    `PŘÍJMY (vč. DPH / bez DPH):`,
    `  Jednotky: ${units.length} ks, celkem ${formatCZK(unitsTotal)} / ${formatCZK(unitsBezDph)}`,
  ];

  // Unit details
  units.forEach(u => {
    lines.push(`    - ${u.unitType} ${u.label || ''}: ${formatCZK(u.totalPrice || 0)} (${u.area ? u.area + ' m²' : ''}${u.pricePerM2 ? ', ' + formatCZK(u.pricePerM2) + '/m²' : ''}, DPH ${u.vatRate ?? 12}%${u.taxExempt ? ', NEDANĚNO' : ''})`);
  });

  lines.push(`  Extras: ${extras.length} ks, celkem ${formatCZK(extrasTotal)} / ${formatCZK(extrasBezDph)}`);
  extras.forEach(e => {
    lines.push(`    - ${e.category} ${e.label || ''}: ${e.quantity}× ${formatCZK(e.unitPrice)} = ${formatCZK(e.totalPrice || 0)}`);
  });

  if (taxExemptTotal > 0) {
    lines.push(`  Nedaněné příjmy: ${formatCZK(taxExemptTotal)}`);
  }

  lines.push('');
  lines.push(`PRODEJE:`);
  lines.push(`  Celkem jednotek: ${units.length}, Prodáno/rezervováno: ${unitsSold}, Se smlouvou: ${unitsContracted}, Zaplaceno: ${unitsPaid}`);

  sal.forEach(s => {
    const unit = units.find(u => u.id === s.unitId);
    lines.push(`    - ${unit?.label || unit?.unitType || '?'}: stav=${s.status}, kupující=${s.buyerName || '—'}, cena=${formatCZK(s.agreedPrice || unit?.totalPrice || 0)}`);
  });

  lines.push('');
  lines.push(`PLÁNOVANÉ NÁKLADY (vč. DPH / bez DPH): ${formatCZK(forecastTotal)} / ${formatCZK(forecastBezDph)}`);
  forecast.forEach(c => {
    lines.push(`    - ${c.category} ${c.label || ''}: ${formatCZK(c.amount)} (DPH ${c.vatRate ?? 21}%)`);
  });

  lines.push('');
  lines.push(`SKUTEČNÉ NÁKLADY (vč. DPH / bez DPH): ${formatCZK(actualTotal)} / ${formatCZK(actualBezDph)}`);
  actual.forEach(c => {
    lines.push(`    - ${c.category} ${c.supplier || c.description || ''}: ${formatCZK(c.amount)} (${c.paymentStatus})`);
  });

  if (fin[0]) {
    const f = fin[0];
    lines.push('');
    lines.push(`FINANCOVÁNÍ:`);
    lines.push(`  Vlastní kapitál: ${formatCZK(f.equityAmount)}`);
    if (f.bankLoanAmount) lines.push(`  Bankovní úvěr: ${formatCZK(f.bankLoanAmount)}, ${f.bankLoanRate}% p.a., ${f.bankLoanDurationMonths} měs.`);
    if (f.investorLoanAmount) lines.push(`  Investorský úvěr: ${formatCZK(f.investorLoanAmount)}, ${f.investorLoanRate}% p.a.`);
  }

  // Computed metrics
  const revenue = isVatPayer ? (unitsBezDph + extrasBezDph) : (unitsTotal + extrasTotal);
  const costs = isVatPayer ? forecastBezDph : forecastTotal;
  const profit = revenue - costs;
  const margin = revenue > 0 ? (profit / revenue * 100) : 0;

  lines.push('');
  lines.push(`KALKULACE (${isVatPayer ? 'bez DPH' : 'vč. DPH'}):`);
  lines.push(`  Příjmy: ${formatCZK(revenue)}`);
  lines.push(`  Plánované náklady: ${formatCZK(costs)}`);
  lines.push(`  Hrubý zisk: ${formatCZK(profit)} (marže ${margin.toFixed(1)}%)`);

  return lines.join('\n');
}

async function buildPortfolioContext(): Promise<string> {
  const allProjects = await db.select().from(projects);
  let lines = [`PORTFOLIO: ${allProjects.length} projektů\n`];

  for (const p of allProjects.filter(p => p.status !== 'archivovano')) {
    const units = await db.select().from(revenueUnits).where(eq(revenueUnits.projectId, p.id));
    const forecast = await db.select().from(forecastCosts).where(eq(forecastCosts.projectId, p.id));
    const revenue = units.reduce((s, u) => s + (u.totalPrice || 0), 0);
    const costs = forecast.reduce((s, c) => s + c.amount, 0);
    lines.push(`${p.name} (${p.status}): příjmy ${formatCZK(revenue)}, náklady ${formatCZK(costs)}, zisk ${formatCZK(revenue - costs)}`);
  }

  return lines.join('\n');
}
