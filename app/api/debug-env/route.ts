import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({
    ANTHROPIC_API_KEY_exists: !!process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_API_KEY_len: process.env.ANTHROPIC_API_KEY?.length ?? 0,
    ANTHROPIC_API_KEY_prefix: (process.env.ANTHROPIC_API_KEY || '').slice(0, 15),
    DEEPSEEK_API_KEY_exists: !!process.env.DEEPSEEK_API_KEY,
    OPENAI_API_KEY_exists: !!process.env.OPENAI_API_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    all_env_keys: Object.keys(process.env).filter(k => k.includes('API') || k.includes('AI_') || k.includes('DATABASE')).sort(),
  });
}
