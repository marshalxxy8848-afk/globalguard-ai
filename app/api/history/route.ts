import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const records = await db.findAuditsByUserId(payload.userId);

    return NextResponse.json({ records });
  } catch (error) {
    console.error('[history]', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
