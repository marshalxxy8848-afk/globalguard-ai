import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/ai';
import { searchByKeywords } from '@/lib/hs-codes';
import { generateAuditReport } from '@/lib/audit';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    let imageBase64: string;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      imageBase64 = body.image;
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
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const visionResult = await analyzeImage(imageBase64);

    const keywords = [
      visionResult.productName,
      visionResult.material,
      visionResult.usage,
      ...visionResult.suggestedHsCodes.map((h) => h.code),
    ];
    const matchedItems = searchByKeywords(keywords);

    const enriched = visionResult.suggestedHsCodes.map((suggestion) => {
      const dbMatch = matchedItems.find((m) => m.hs_code === suggestion.code);
      return dbMatch
        ? { ...suggestion, tariffUs: dbMatch.base_tariff_us, tariffEu: dbMatch.base_tariff_eu, restricted: dbMatch.restricted }
        : suggestion;
    });

    // Generate compliance audit for top HS code
    const topCode = enriched[0]?.code || '847130';
    const audit = generateAuditReport(
      visionResult.productName,
      visionResult.material,
      visionResult.usage,
      topCode,
    );

    return NextResponse.json({
      productName: visionResult.productName,
      material: visionResult.material,
      usage: visionResult.usage,
      suggestedHsCodes: enriched,
      localMatches: matchedItems.slice(0, 5),
      audit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[analyze-product]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
