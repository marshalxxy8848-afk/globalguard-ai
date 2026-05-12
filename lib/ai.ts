export interface AIVisionResult {
  productName: string;
  material: string;
  usage: string;
  suggestedHsCodes: { code: string; reason: string; confidence: number }[];
  demoMode: boolean;
  demoReason?: string;
  hsDescription?: string;
  suggestedDeclaration?: string;
}

const SYSTEM_PROMPT = `You are a GlobalGuard AI customs classification specialist for Chinese cross-border e-commerce.
Analyze the product image and return a JSON object with ALL text fields in Chinese:
- productName: product name in Chinese (e.g. "无线蓝牙耳机")
- material: primary material(s) in Chinese (e.g. "塑料、金属、电子元件")
- usage: primary function/use in Chinese (e.g. "音频输出与通讯")
- hsDescription: brief HS code description in Chinese
- suggestedDeclaration: suggested customs declaration description in Chinese (max 120 chars)
- suggestedHsCodes: array of 3 possible 6-digit HS codes with reason (in Chinese) and confidence (0-1)
Use the Harmonized System (HS) classification rules.

Return ONLY valid JSON, no markdown.`;

const MOCK_RESPONSE: AIVisionResult = {
  productName: '无线蓝牙耳机',
  material: '塑料、金属、电子元件',
  usage: '音频输出与通讯',
  hsDescription: '耳机及耳塞，包括蓝牙耳机、头戴式耳机',
  suggestedDeclaration: '无线蓝牙耳机，由塑料、金属和电子元件制成，用于音频输出与通讯',
  suggestedHsCodes: [
    { code: '851830', reason: '耳机及耳塞', confidence: 0.85 },
    { code: '851762', reason: '蓝牙通讯设备', confidence: 0.65 },
    { code: '852692', reason: '无线电遥控设备', confidence: 0.3 },
  ],
  demoMode: true,
  demoReason: 'All AI API keys are empty — running in demo mode with mock data',
};

function parseAIResponse(text: string): { productName: string; material: string; usage: string; suggestedHsCodes: { code: string; reason: string; confidence: number }[] } | null {
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

// --- Provider-specific callers ---

async function callDeepSeek(imageBase64: string, productDescription?: string): Promise<AIVisionResult | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const descText = productDescription ? `\nAdditional product info: ${productDescription}` : '';
  const userText = `Classify this product for customs purposes.${descText}`;

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: userText },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      console.warn(`[DeepSeek] API error: ${res.status} ${await res.text()}`);
      return null;
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || '';
    const parsed = parseAIResponse(text);
    if (!parsed) {
      console.warn('[DeepSeek] Failed to parse response as JSON');
      return null;
    }
    return { ...parsed, demoMode: false };
  } catch (err) {
    console.warn('[DeepSeek] Request failed:', err);
    return null;
  }
}

async function callOpenAI(imageBase64: string, productDescription?: string): Promise<AIVisionResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const descText = productDescription ? `\nAdditional product info: ${productDescription}` : '';
  const userText = `Classify this product for customs purposes.${descText}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: userText },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      console.warn(`[OpenAI] API error: ${res.status} ${await res.text()}`);
      return null;
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || '';
    const parsed = parseAIResponse(text);
    if (!parsed) {
      console.warn('[OpenAI] Failed to parse response as JSON');
      return null;
    }
    return { ...parsed, demoMode: false };
  } catch (err) {
    console.warn('[OpenAI] Request failed:', err);
    return null;
  }
}

async function callAnthropic(imageBase64: string, productDescription?: string): Promise<AIVisionResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL;
  const useRelay = !!baseUrl;

  // In relay mode, the proxy handles auth — no API key needed
  if (!apiKey && !useRelay) return null;
  const model = process.env.AI_MODEL || 'claude-sonnet-4-20250514';

  try {
    let text: string;

    if (useRelay) {
      // OpenAI-compatible relay format (e.g. api.claudecode.net.cn for China users)
      const url = baseUrl.replace(/\/$/, '') + '/chat/completions';

      // Build text-only prompt with product description (relays rarely support vision)
      const desc = productDescription || 'general consumer product';
      const prompt = `Product description: "${desc}"

You MUST return a valid JSON object. No markdown, no code fences, no explanation. Only the JSON object.

{
  "productName": "Chinese product name based on description",
  "material": "likely materials in Chinese",
  "usage": "function/use in Chinese",
  "hsDescription": "HS code description in Chinese",
  "suggestedDeclaration": "customs declaration in Chinese (max 120 chars)",
  "suggestedHsCodes": [
    {"code": "6-digit HS code", "reason": "classification reason in Chinese", "confidence": 0.0}
  ]
}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify({
          model,
          max_tokens: 800,
          messages: [
            { role: 'system', content: 'You are a HS customs classification expert. Return ONLY valid JSON. No markdown. No explanation.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        console.warn(`[Anthropic/Relay] API error: ${res.status} ${await res.text()}`);
        return null;
      }
      const json = await res.json();
      text = json.choices?.[0]?.message?.content || '';
    } else {
      // Native Anthropic format
      const descTextNative = productDescription ? `\nAdditional product info: ${productDescription}` : '';
      const userTextNative = `Classify this product for customs purposes.${descTextNative}`;
      if (!apiKey) return null;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: [
            { type: 'text', text: userTextNative },
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          ] }],
        }),
      });
      if (!res.ok) {
        console.warn(`[Anthropic] API error: ${res.status} ${await res.text()}`);
        return null;
      }
      const json = await res.json();
      text = json.content?.[0]?.text || '';
    }

    const parsed = parseAIResponse(text);
    if (!parsed) {
      console.warn('[Anthropic] Failed to parse response as JSON');
      return null;
    }
    return { ...parsed, demoMode: false };
  } catch (err) {
    console.warn('[Anthropic] Request failed:', err);
    return null;
  }
}

// --- Main exported function ---

export async function analyzeImage(imageBase64: string, productDescription?: string): Promise<AIVisionResult> {
  // Priority chain: Anthropic → DeepSeek → OpenAI → Mock
  const result =
    (await callAnthropic(imageBase64, productDescription)) ??
    (await callDeepSeek(imageBase64, productDescription)) ??
    (await callOpenAI(imageBase64, productDescription));

  if (result) return result;

  // All providers failed or no keys configured — return mock with demo mode
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY || !!process.env.ANTHROPIC_BASE_URL;

  let reason: string;
  if (!hasAnthropic && !hasDeepSeek && !hasOpenAI) {
    reason = 'All AI API keys are empty — running in demo mode with mock data';
  } else if (hasAnthropic) {
    reason = 'Anthropic API call failed — degraded to demo mode with mock data';
  } else if (hasDeepSeek && !hasOpenAI) {
    reason = '已检测到 DeepSeek Key，但 DeepSeek 的模型不支持图片识别。请在 .env.local 中配置 ANTHROPIC_API_KEY 或 OPENAI_API_KEY。当前使用演示数据。';
  } else {
    reason = 'AI API calls failed — degraded to demo mode with mock data';
  }
  console.warn(`[GlobalGuard AI] ${reason}`);
  return { ...MOCK_RESPONSE, demoReason: reason };
}
