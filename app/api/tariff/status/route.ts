import { NextResponse } from 'next/server';
import { getTariffStatus } from '@/lib/tariff-updater';

export async function GET() {
  try {
    const status = getTariffStatus();
    return NextResponse.json({ status });
  } catch (error) {
    console.error('[tariff-status]', error);
    return NextResponse.json({ error: 'Failed to get tariff status' }, { status: 500 });
  }
}
