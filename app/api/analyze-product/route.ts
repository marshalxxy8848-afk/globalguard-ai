import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/ai';
import { findByHsCode, searchWithFallback } from '@/lib/hs-codes';
import { generateAuditReport } from '@/lib/audit';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    let imageBase64: string;
    let productDescription: string | undefined;
    let declaredValue = 50;
    let originCountry = 'china';
    let euCountry: string | undefined;
    let shippingEstimate: number | undefined;
    let platform: string = 'none';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      imageBase64 = body.image;
      productDescription = body.productDescription || undefined;
      declaredValue = Math.max(1, Math.min(9999, Number(body.declaredValue) || 50));
      originCountry = body.originCountry || 'china';
      euCountry = body.euCountry || undefined;
      shippingEstimate = body.shippingEstimate ? Math.max(0, Math.min(999, Number(body.shippingEstimate))) : undefined;
      platform = body.platform || 'none';
    } else if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('image') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: `Image too large (max ${MAX_IMAGE_SIZE / 1024 / 1024}MB)` },
          { status: 413 },
        );
      }
      const bytes = await file.arrayBuffer();
      imageBase64 = Buffer.from(bytes).toString('base64');
      platform = (form.get('platform') as string) || 'none';
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const visionResult = await analyzeImage(imageBase64, productDescription);

    // Search local DB with external fallback (USITC API → web scrape → mock)
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
    );

    // Auto-save to audit history if user is logged in
    try {
      const user = await getAuthUser();
      if (user) {
        await prisma.auditRecord.create({
          data: {
            userId: user.userId,
            productName: audit.productName,
            hsCode: audit.selectedHsCode,
            riskLevel: audit.overallRisk,
            report: JSON.stringify(audit),
          },
        });
      }
    } catch (dbErr) {
      console.warn('[analyze-product] failed to save audit record:', dbErr);
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[analyze-product]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
