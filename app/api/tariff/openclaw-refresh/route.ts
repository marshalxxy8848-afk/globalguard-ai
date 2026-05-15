import { NextResponse } from 'next/server';
import { refreshTariffData, loadCacheIntoEngine } from '@/lib/tariff-updater';

// Simple API key for OpenClaw to authenticate
// Set OPENCLAW_API_KEY in Vercel env vars
const EXPECTED_KEY = process.env.OPENCLAW_API_KEY || 'globalguard-openclaw-key-2026';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (key !== EXPECTED_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await refreshTariffData();
    const loaded = loadCacheIntoEngine();

    return NextResponse.json({
      success: result.success,
      updated: result.updated,
      loadedIntoEngine: loaded,
      errors: result.errors,
      source: result.source,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[openclaw-refresh]', error);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
