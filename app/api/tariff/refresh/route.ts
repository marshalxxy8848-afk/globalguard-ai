import { NextResponse } from 'next/server';
import { refreshTariffData, loadCacheIntoEngine } from '@/lib/tariff-updater';
import { getAuthUser } from '@/lib/auth';

export async function POST() {
  try {
    // Require authentication
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const result = await refreshTariffData();
    const loaded = loadCacheIntoEngine();

    return NextResponse.json({
      success: result.success,
      updated: result.updated,
      loadedIntoEngine: loaded,
      errors: result.errors,
      source: result.source,
    });
  } catch (error) {
    console.error('[tariff-refresh]', error);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
