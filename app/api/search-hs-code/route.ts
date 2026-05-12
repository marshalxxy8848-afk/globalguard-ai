import { NextRequest, NextResponse } from 'next/server';
import { searchHsCodeExternal } from '@/lib/search-agent';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const product = searchParams.get('product') || '';
    const material = searchParams.get('material') || '';
    const usage = searchParams.get('usage') || '';

    if (!product) {
      return NextResponse.json({ error: 'product query param is required' }, { status: 400 });
    }

    const result = await searchHsCodeExternal(product, material, usage);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search agent error';
    console.error('[search-hs-code]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
