import { NextRequest, NextResponse } from 'next/server';
import { getTaxConfig, upsertTaxConfig } from '@/lib/queries/tax';
import { taxConfigSchema } from '@/lib/utils/validation';

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const data = getTaxConfig(projectId);
  return NextResponse.json(data || {});
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const body = await request.json();
  const parsed = taxConfigSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const result = upsertTaxConfig(projectId, parsed.data);
  return NextResponse.json(result);
}
