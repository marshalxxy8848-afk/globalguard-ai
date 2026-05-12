import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.createUser(email, passwordHash);

    const token = await signToken({ userId: user.id, email: user.email });
    await setAuthCookie(token);

    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('[register]', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
