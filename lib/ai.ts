export interface AIVisionResult {
  productName: string;
  material: string;
  usage: string;
  suggestedHsCodes: { code: string; reason: string; confidence: number }[];
}

const SYSTEM_PROMPT = `You are a GlobalGuard AI customs classification specialist.
Analyze the product image and return a JSON object with:
- productName: short product name in English
- material: primary material(s)
- usage: primary function/use
- suggestedHsCodes: array of 3 possible 6-digit HS codes with reason and confidence (0-1)
Use the Harmonized System (HS) classification rules.

Return ONLY valid JSON, no markdown.`;

function parseAIResponse(text: string): AIVisionResult | null {
  try {
    const cleaned = text.replace(/```(?:json)?\s*/gi, '').trim();
    return JSON.parse(cleaned);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function analyzeImage(
  imageBase64: string,
): Promise<AIVisionResult> {
  const apiKey = process.env.AI_API_KEY;
  const provider = process.env.AI_PROVIDER || 'openai';
  const model = process.env.AI_MODEL || 'gpt-4o';

  // Mock mode for development without API key
  if (!apiKey) {
    console.warn('[GlobalGuard AI] No AI_API_KEY set — using mock response');
    return {
      productName: 'Wireless Bluetooth Headphones',
      material: 'Plastic, Metal, Electronic Components',
      usage: 'Audio output and communication',
      suggestedHsCodes: [
        { code: '851830', reason: 'Headphones and earphones', confidence: 0.85 },
        { code: '851762', reason: 'Bluetooth communication devices', confidence: 0.65 },
        { code: '852692', reason: 'Radio remote control apparatus', confidence: 0.3 },
      ],
    };
  }

  const baseUrl =
    provider === 'deepseek'
      ? 'https://api.deepseek.com/v1'
      : provider === 'anthropic'
        ? 'https://api.anthropic.com/v1'
        : 'https://api.openai.com/v1';

  const data: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Classify this product for customs purposes.' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ],
    max_tokens: 500,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropis-version'] = '2023-06-01';
    data.system = SYSTEM_PROMPT;
    data.messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Classify this product for customs purposes.' },
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
        ],
      },
    ];
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`AI API error: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || '';
  const result = parseAIResponse(text);
  if (!result) {
    throw new Error('Failed to parse AI response as JSON');
  }
  return result;
}
