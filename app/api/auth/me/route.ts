import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const payload = await getAuthUser();
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    const user = await db.findUserById(payload.userId);

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
