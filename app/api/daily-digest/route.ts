import { NextResponse } from 'next/server';

// Daily digest page — shows marketing pipeline results
// Access: GET /api/daily-digest

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const data = {
    date: today,
    leads: 0,
    replies: 0,
    content: { amz123: false, facebook: false, xiaohongshu: false },
    message: 'Run the marketing pipeline to generate today\'s digest.',
    snippet: `
To generate content:
  cd marketing_agents
  python main_pipeline.py --no-email

This will:
1. Scrape leads via OpenClaw
2. Analyze pain points (agent1)
3. Generate promotional copy (agent2)
4. Draft replies (agent3)
5. Save digest to reports/ directory
`,
  };

  return NextResponse.json(data);
}
