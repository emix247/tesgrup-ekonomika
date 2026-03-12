import { NextRequest, NextResponse } from 'next/server';
import { getForecastCosts, createForecastCost, updateForecastCost, deleteForecastCost } from '@/lib/queries/costs';
import { forecastCostSchema } from '@/lib/utils/validation';

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const costs = getForecastCosts(projectId);
  return NextResponse.json(costs);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const body = await request.json();
  const parsed = forecastCostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const cost = createForecastCost(projectId, parsed.data);
  return NextResponse.json(cost, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });
  const updated = updateForecastCost(id, data);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });
  deleteForecastCost(id);
  return NextResponse.json({ success: true });
}
