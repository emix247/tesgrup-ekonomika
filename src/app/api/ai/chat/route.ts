import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { projects, revenueUnits, revenueExtras, forecastCosts, actualCosts, financing, sales, taxConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { grossToNet } from '@/lib/utils/vat';
import { formatCZK } from '@/lib/utils/format';
import { createRevenueUnit, updateRevenueUnit, deleteRevenueUnit, createRevenueExtra, updateRevenueExtra, deleteRevenueExtra } from '@/lib/queries/revenue';
import { createForecastCost, updateForecastCost } from '@/lib/queries/costs';

const anthropic = new Anthropic();

// ═══════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════

const tools: Anthropic.Tool[] = [
  {
    name: 'add_revenue_unit',
    description: 'Přidá novou prodejní jednotku (byt, dům, garáž, komerční prostor) do projektu. Cena (totalPrice) je vč. DPH.',
    input_schema: {
      type: 'object' as const,
      properties: {
        unitType: { type: 'string', enum: ['byt', 'dum', 'garaz', 'komercni_prostor'], description: 'Typ jednotky' },
        label: { type: 'string', description: 'Označení (např. SO 01, Byt 2+kk)' },
        area: { type: 'number', description: 'Plocha v m²' },
        pricePerM2: { type: 'number', description: 'Cena za m² (Kč)' },
        totalPrice: { type: 'number', description: 'Celková cena vč. DPH (Kč)' },
        vatRate: { type: 'number', enum: [0, 12, 21], description: 'Sazba DPH (%). Default 12 pro bytovou výstavbu.' },
        taxExempt: { type: 'boolean', description: 'Nedaněný příjem (nepodléhá DPPO)' },
      },
      required: ['unitType'],
    },
  },
  {
    name: 'add_revenue_extra',
    description: 'Přidá doplňkovou položku příjmu (garáž, sklep, terasa, parkovací stání, jiné) do projektu.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', enum: ['garaz', 'sklep', 'terasa', 'parkovani', 'jine'], description: 'Kategorie' },
        label: { type: 'string', description: 'Popis položky' },
        quantity: { type: 'number', description: 'Počet kusů' },
        unitPrice: { type: 'number', description: 'Cena za kus vč. DPH (Kč)' },
        vatRate: { type: 'number', enum: [0, 12, 21], description: 'Sazba DPH (%)' },
        taxExempt: { type: 'boolean', description: 'Nedaněný příjem' },
      },
      required: ['category', 'unitPrice'],
    },
  },
  {
    name: 'update_revenue_unit',
    description: 'Upraví existující prodejní jednotku. Zadej ID jednotky a pole k úpravě.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'ID jednotky k úpravě' },
        unitType: { type: 'string', enum: ['byt', 'dum', 'garaz', 'komercni_prostor'] },
        label: { type: 'string' },
        area: { type: 'number' },
        pricePerM2: { type: 'number' },
        totalPrice: { type: 'number' },
        vatRate: { type: 'number', enum: [0, 12, 21] },
        taxExempt: { type: 'boolean' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_revenue_unit',
    description: 'Smaže prodejní jednotku.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'ID jednotky ke smazání' },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_revenue_extra',
    description: 'Upraví existující doplňkovou položku příjmu.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'ID položky k úpravě' },
        category: { type: 'string', enum: ['garaz', 'sklep', 'terasa', 'parkovani', 'jine'] },
        label: { type: 'string' },
        quantity: { type: 'number' },
        unitPrice: { type: 'number' },
        vatRate: { type: 'number', enum: [0, 12, 21] },
        taxExempt: { type: 'boolean' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_revenue_extra',
    description: 'Smaže doplňkovou položku příjmu.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'ID položky ke smazání' },
      },
      required: ['id'],
    },
  },
  {
    name: 'add_forecast_cost',
    description: 'Přidá plánovaný náklad do projektu. Částka (amount) je vč. DPH.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          enum: ['pozemek', 'projektova_dokumentace', 'inzenyrska_cinnost', 'site_infrastruktura', 'priprava_stavby', 'stavba_hlavni', 'marketing', 'management', 'pravni_sluzby', 'kolaudace', 'rezerva'],
          description: 'Kategorie nákladu',
        },
        label: { type: 'string', description: 'Popis nákladu' },
        amount: { type: 'number', description: 'Částka vč. DPH (Kč)' },
        vatRate: { type: 'number', enum: [0, 12, 21], description: 'Sazba DPH. Default: 0 pro pozemek, 21 pro ostatní.' },
        area: { type: 'number', description: 'Plocha m² (volitelné)' },
        ratePerM2: { type: 'number', description: 'Sazba Kč/m² (volitelné)' },
        notes: { type: 'string', description: 'Poznámky' },
      },
      required: ['category', 'amount'],
    },
  },
  {
    name: 'update_forecast_cost',
    description: 'Upraví existující plánovaný náklad.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'ID nákladu k úpravě' },
        category: { type: 'string' },
        label: { type: 'string' },
        amount: { type: 'number' },
        vatRate: { type: 'number', enum: [0, 12, 21] },
        notes: { type: 'string' },
      },
      required: ['id'],
    },
  },
];

// ═══════════════════════════════════════════════════════════
// TOOL EXECUTION
// ═══════════════════════════════════════════════════════════

async function executeTool(name: string, input: Record<string, unknown>, projectId: string): Promise<string> {
  try {
    switch (name) {
      case 'add_revenue_unit': {
        const result = await createRevenueUnit(projectId, {
          unitType: input.unitType as string,
          label: input.label as string | undefined,
          area: input.area as number | undefined,
          pricePerM2: input.pricePerM2 as number | undefined,
          totalPrice: input.totalPrice as number | undefined,
          vatRate: input.vatRate as number | undefined,
          taxExempt: input.taxExempt as boolean | undefined,
        });
        return JSON.stringify({ success: true, message: `Přidána jednotka "${result.label || result.unitType}" (${formatCZK(result.totalPrice || 0)})`, data: result });
      }

      case 'add_revenue_extra': {
        const result = await createRevenueExtra(projectId, {
          category: input.category as string,
          label: input.label as string | undefined,
          quantity: input.quantity as number | undefined,
          unitPrice: input.unitPrice as number,
          vatRate: input.vatRate as number | undefined,
          taxExempt: input.taxExempt as boolean | undefined,
        });
        return JSON.stringify({ success: true, message: `Přidána položka "${result.category}" (${formatCZK(result.totalPrice || 0)})`, data: result });
      }

      case 'update_revenue_unit': {
        const { id, ...data } = input;
        const result = await updateRevenueUnit(id as string, data as Parameters<typeof updateRevenueUnit>[1]);
        return JSON.stringify({ success: true, message: `Jednotka "${result?.label || result?.unitType}" upravena`, data: result });
      }

      case 'delete_revenue_unit': {
        await deleteRevenueUnit(input.id as string);
        return JSON.stringify({ success: true, message: 'Jednotka smazána' });
      }

      case 'update_revenue_extra': {
        const { id, ...data } = input;
        const result = await updateRevenueExtra(id as string, data as Parameters<typeof updateRevenueExtra>[1]);
        return JSON.stringify({ success: true, message: `Položka "${result?.category}" upravena`, data: result });
      }

      case 'delete_revenue_extra': {
        await deleteRevenueExtra(input.id as string);
        return JSON.stringify({ success: true, message: 'Položka smazána' });
      }

      case 'add_forecast_cost': {
        const result = await createForecastCost(projectId, {
          category: input.category as string,
          label: input.label as string | undefined,
          amount: input.amount as number,
          vatRate: input.vatRate as number | undefined,
          area: input.area as number | undefined,
          ratePerM2: input.ratePerM2 as number | undefined,
          notes: input.notes as string | undefined,
        });
        return JSON.stringify({ success: true, message: `Přidán náklad "${result.label || result.category}" (${formatCZK(result.amount)})`, data: result });
      }

      case 'update_forecast_cost': {
        const { id, ...data } = input;
        const result = await updateForecastCost(id as string, data as Parameters<typeof updateForecastCost>[1]);
        return JSON.stringify({ success: true, message: `Náklad "${result?.label || result?.category}" upraven`, data: result });
      }

      default:
        return JSON.stringify({ success: false, message: `Neznámý nástroj: ${name}` });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Neznámá chyba';
    console.error(`[AI Tool] Error executing ${name}:`, msg);
    return JSON.stringify({ success: false, message: `Chyba: ${msg}` });
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { messages, projectId } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    let projectContext = '';
    if (projectId) {
      projectContext = await buildProjectContext(projectId);
    } else {
      projectContext = await buildPortfolioContext();
    }

    const systemPrompt = `Jsi AI finanční asistent pro aplikaci Tesgrup Development — Ekonomika projektů. Pomáháš s analýzou a správou developerských projektů.

PRAVIDLA:
- Odpovídej VŽDY česky
- Buď stručný a konkrétní, používej čísla z dat
- Formátuj částky v Kč (např. 1 500 000 Kč)
- Pokud nemáš dostatek dat, řekni to
- Používej markdown (nadpisy, seznamy, tučné)

NÁSTROJE:
- Máš k dispozici nástroje pro přidávání, úpravu a mazání dat (jednotky, extras, náklady)
- Pokud uživatel chce přidat/upravit/smazat data, POUŽIJ příslušný nástroj
- Ceny zadávej vč. DPH (to je konvence v DB)
- Pro bytovou výstavbu je DPH 12%, pro ostatní náklady 21%, pro pozemek 0%
- Po provedení akce informuj uživatele co se stalo a uveď částky
- Pokud uživatel nespecifikuje cenu nebo jiný povinný údaj, ZEPTEJ SE místo hádání
- ${projectId ? `Aktuální projekt ID: ${projectId}` : 'Žádný konkrétní projekt není vybrán — pro úpravy dat musí uživatel být na stránce projektu'}

AKTUÁLNÍ DATA:
${projectContext}`;

    // Build API messages — handle tool_result content blocks
    const apiMessages: Anthropic.MessageParam[] = messages.map((m: { role: string; content: string | object[] }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const encoder = new TextEncoder();
    let toolActions: string[] = [];

    const readable = new ReadableStream({
      async start(controller) {
        try {
          let currentMessages = apiMessages;
          let iterations = 0;
          const maxIterations = 5; // Prevent infinite tool loops

          while (iterations < maxIterations) {
            iterations++;

            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 2048,
              system: systemPrompt,
              messages: currentMessages,
              tools: projectId ? tools : [], // Only provide tools when on a project page
            });

            // Check if we need to handle tool use
            const toolUseBlocks = response.content.filter(
              (block): block is Anthropic.ContentBlock & { type: 'tool_use' } => block.type === 'tool_use'
            );

            if (toolUseBlocks.length > 0 && projectId) {
              // Execute all tool calls
              const toolResults: Anthropic.ToolResultBlockParam[] = [];

              for (const toolBlock of toolUseBlocks) {
                const result = await executeTool(toolBlock.name, toolBlock.input as Record<string, unknown>, projectId);
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolBlock.id,
                  content: result,
                });

                // Parse and collect action descriptions
                try {
                  const parsed = JSON.parse(result);
                  if (parsed.success) {
                    toolActions.push(parsed.message);
                  }
                } catch { /* ignore */ }
              }

              // Send action notifications to client
              for (const action of toolActions) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ action })}\n\n`));
              }
              toolActions = [];

              // Continue conversation with tool results
              currentMessages = [
                ...currentMessages,
                { role: 'assistant' as const, content: response.content },
                { role: 'user' as const, content: toolResults },
              ];

              // Loop back to get Claude's final response after tool execution
              continue;
            }

            // No tool use — stream the text response
            const textBlocks = response.content.filter(
              (block): block is Anthropic.TextBlock => block.type === 'text'
            );

            for (const block of textBlocks) {
              // Send in small chunks for streaming effect
              const words = block.text.split(' ');
              let buffer = '';
              for (const word of words) {
                buffer += (buffer ? ' ' : '') + word;
                if (buffer.length > 20) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: buffer })}\n\n`));
                  buffer = '';
                  // Small delay for streaming effect
                  await new Promise(r => setTimeout(r, 15));
                }
              }
              if (buffer) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: buffer })}\n\n`));
              }
            }

            break; // Done — no more tool calls
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('[AI Chat] Stream error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Chyba při zpracování' })}\n\n`));
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

// ═══════════════════════════════════════════════════════════
// CONTEXT BUILDERS
// ═══════════════════════════════════════════════════════════

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

  const taxExemptTotal = units.filter(u => u.taxExempt).reduce((s, u) => s + (u.totalPrice || 0), 0);

  const lines = [
    `PROJEKT: ${project.name} (ID: ${projectId})`,
    `Typ: ${project.type}, Lokalita: ${project.location || 'neuvedena'}`,
    `Stav: ${project.status}, Právní forma: ${taxForm}, Plátce DPH: ${isVatPayer ? 'ano' : 'ne'}`,
    `Zahájení: ${project.startDate || '—'}, Konec: ${project.endDate || '—'}`,
    '',
    `PŘÍJMY (vč. DPH / bez DPH):`,
    `  Jednotky: ${units.length} ks, celkem ${formatCZK(unitsTotal)} / ${formatCZK(unitsBezDph)}`,
  ];

  units.forEach(u => {
    lines.push(`    - [ID: ${u.id}] ${u.unitType} "${u.label || '—'}": ${formatCZK(u.totalPrice || 0)} (${u.area ? u.area + ' m²' : '—'}${u.pricePerM2 ? ', ' + formatCZK(u.pricePerM2) + '/m²' : ''}, DPH ${u.vatRate ?? 12}%${u.taxExempt ? ', NEDANĚNO' : ''})`);
  });

  lines.push(`  Extras: ${extras.length} ks, celkem ${formatCZK(extrasTotal)} / ${formatCZK(extrasBezDph)}`);
  extras.forEach(e => {
    lines.push(`    - [ID: ${e.id}] ${e.category} "${e.label || '—'}": ${e.quantity}× ${formatCZK(e.unitPrice)} = ${formatCZK(e.totalPrice || 0)} (DPH ${e.vatRate ?? 12}%)`);
  });

  if (taxExemptTotal > 0) lines.push(`  Nedaněné příjmy: ${formatCZK(taxExemptTotal)}`);

  lines.push('', `PRODEJE:`);
  lines.push(`  Celkem: ${units.length}, Prodáno: ${activeSales.length}, Smlouvy: ${contracted.length}, Zaplaceno: ${paid.length}`);
  sal.forEach(s => {
    const unit = units.find(u => u.id === s.unitId);
    lines.push(`    - ${unit?.label || unit?.unitType || '?'}: ${s.status}, ${s.buyerName || '—'}, ${formatCZK(s.agreedPrice || unit?.totalPrice || 0)}`);
  });

  lines.push('', `PLÁNOVANÉ NÁKLADY: ${formatCZK(forecastTotal)} / ${formatCZK(forecastBezDph)} bez DPH`);
  forecast.forEach(c => {
    lines.push(`    - [ID: ${c.id}] ${c.category} "${c.label || '—'}": ${formatCZK(c.amount)} (DPH ${c.vatRate ?? 21}%)`);
  });

  lines.push('', `SKUTEČNÉ NÁKLADY: ${formatCZK(actualTotal)} / ${formatCZK(actualBezDph)} bez DPH`);
  actual.forEach(c => {
    lines.push(`    - [ID: ${c.id}] ${c.category} ${c.supplier || c.description || '—'}: ${formatCZK(c.amount)} (${c.paymentStatus})`);
  });

  if (fin[0]) {
    const f = fin[0];
    lines.push('', `FINANCOVÁNÍ:`);
    lines.push(`  VK: ${formatCZK(f.equityAmount)}`);
    if (f.bankLoanAmount) lines.push(`  Banka: ${formatCZK(f.bankLoanAmount)}, ${f.bankLoanRate}% p.a., ${f.bankLoanDurationMonths} měs.`);
    if (f.investorLoanAmount) lines.push(`  Investor: ${formatCZK(f.investorLoanAmount)}, ${f.investorLoanRate}% p.a.`);
  }

  const revenue = isVatPayer ? (unitsBezDph + extrasBezDph) : (unitsTotal + extrasTotal);
  const costs = isVatPayer ? forecastBezDph : forecastTotal;
  const profit = revenue - costs;
  const margin = revenue > 0 ? (profit / revenue * 100) : 0;

  lines.push('', `KALKULACE (${isVatPayer ? 'bez DPH' : 'vč. DPH'}):`);
  lines.push(`  Příjmy: ${formatCZK(revenue)}, Náklady: ${formatCZK(costs)}, Zisk: ${formatCZK(profit)} (marže ${margin.toFixed(1)}%)`);

  return lines.join('\n');
}

async function buildPortfolioContext(): Promise<string> {
  const allProjects = await db.select().from(projects);
  const lines = [`PORTFOLIO: ${allProjects.length} projektů\n`];

  for (const p of allProjects.filter(p => p.status !== 'archivovano')) {
    const units = await db.select().from(revenueUnits).where(eq(revenueUnits.projectId, p.id));
    const forecast = await db.select().from(forecastCosts).where(eq(forecastCosts.projectId, p.id));
    const revenue = units.reduce((s, u) => s + (u.totalPrice || 0), 0);
    const costs = forecast.reduce((s, c) => s + c.amount, 0);
    lines.push(`${p.name} (${p.status}): příjmy ${formatCZK(revenue)}, náklady ${formatCZK(costs)}, zisk ${formatCZK(revenue - costs)}`);
  }

  return lines.join('\n');
}
