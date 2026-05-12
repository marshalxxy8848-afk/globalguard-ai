import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/ai';
import { findByHsCode, searchWithFallback } from '@/lib/hs-codes';
import { generateAuditReport } from '@/lib/audit';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const API_KEY_SECRET = process.env.PUBLIC_API_KEY || '';

function verifyApiKey(req: NextRequest): boolean {
  if (!API_KEY_SECRET) return true; // No key configured = open access
  const auth = req.headers.get('authorization') || '';
  const key = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return key === API_KEY_SECRET || key === req.nextUrl.searchParams.get('api_key') || false;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide API key via Authorization: Bearer <key> header or ?api_key=<key> query param.' },
      { status: 401, headers: corsHeaders() },
    );
  }

  try {
    let imageBase64: string;
    let productDescription: string | undefined;
    let declaredValue = 50;
    let originCountry = 'china';
    let euCountry: string | undefined;
    let shippingEstimate: number | undefined;
    let platform: string = 'none';
    let locale: string = 'zh-CN';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      imageBase64 = body.image;
      productDescription = body.productDescription || body.description || undefined;
      declaredValue = Math.max(1, Math.min(9999, Number(body.declaredValue) || 50));
      originCountry = body.originCountry || 'china';
      euCountry = body.euCountry || undefined;
      shippingEstimate = body.shippingEstimate ? Math.max(0, Math.min(999, Number(body.shippingEstimate))) : undefined;
      platform = body.platform || 'none';
      locale = body.locale || 'zh-CN';
    } else if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('image') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No image file provided' }, { status: 400, headers: corsHeaders() });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: `Image too large (max ${MAX_IMAGE_SIZE / 1024 / 1024}MB)` },
          { status: 413, headers: corsHeaders() },
        );
      }
      const bytes = await file.arrayBuffer();
      imageBase64 = Buffer.from(bytes).toString('base64');
      productDescription = (form.get('productDescription') as string) || (form.get('description') as string) || undefined;
      declaredValue = Math.max(1, Math.min(9999, Number(form.get('declaredValue')) || 50));
      originCountry = (form.get('originCountry') as string) || 'china';
      euCountry = (form.get('euCountry') as string) || undefined;
      shippingEstimate = form.get('shippingEstimate') ? Math.max(0, Math.min(999, Number(form.get('shippingEstimate')))) : undefined;
      platform = (form.get('platform') as string) || 'none';
    } else {
      return NextResponse.json({ error: 'Unsupported content type. Use application/json or multipart/form-data.' }, { status: 400, headers: corsHeaders() });
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400, headers: corsHeaders() });
    }

    const visionResult = await analyzeImage(imageBase64, productDescription);

    // Search local DB with external fallback
    const search = await searchWithFallback(
      visionResult.productName,
      visionResult.material,
      visionResult.usage,
      visionResult.suggestedHsCodes.map((h) => h.code),
    );

    const enriched = visionResult.suggestedHsCodes.map((suggestion) => {
      const dbMatch = findByHsCode(suggestion.code);
      return dbMatch
        ? { ...suggestion, tariffUs: dbMatch.base_tariff_us, tariffEu: dbMatch.base_tariff_eu, restricted: dbMatch.restricted }
        : suggestion;
    });

    const topCode = enriched[0]?.code || '847130';
    const audit = generateAuditReport(
      visionResult.productName,
      visionResult.material,
      visionResult.usage,
      topCode,
      visionResult.suggestedDeclaration,
      visionResult.hsDescription,
      declaredValue,
      1,
      originCountry,
      euCountry,
      shippingEstimate,
      platform,
      locale as any,
    );

    return NextResponse.json({
      success: true,
      version: 'v1',
      data: {
        productName: visionResult.productName,
        material: visionResult.material,
        usage: visionResult.usage,
        suggestedHsCodes: enriched,
        localMatches: search.local.slice(0, 5),
        externalMatches: search.external,
        usedExternalFallback: search.usedFallback,
        fallbackSource: search.source,
        demoMode: visionResult.demoMode,
        demoReason: visionResult.demoReason,
        audit,
      },
    }, { headers: corsHeaders() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[API/v1/classify]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500, headers: corsHeaders() });
  }
}
