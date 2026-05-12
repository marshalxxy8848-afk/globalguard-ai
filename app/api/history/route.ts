import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const records = await prisma.auditRecord.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        productName: true,
        hsCode: true,
        riskLevel: true,
        report: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('[history]', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
