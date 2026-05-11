import { NextRequest, NextResponse } from 'next/server';
import { generateAuditReport } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, material, usage, hsCode, declaredValue, quantity } = body;

    if (!productName || !hsCode) {
      return NextResponse.json(
        { error: 'productName and hsCode are required' },
        { status: 400 },
      );
    }

    const report = generateAuditReport(
      productName,
      material || '',
      usage || '',
      hsCode,
      declaredValue || 50,
      quantity || 1,
    );

    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[audit]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
