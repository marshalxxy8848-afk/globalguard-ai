import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GlobalGuard 每日运营 - ${today}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#0a0a0f;color:#e1e1e6;padding:12px}
  .wrap{max-width:480px;margin:0 auto}
  h1{font-size:18px;color:#22d3ee;margin-bottom:2px}
  .date{font-size:11px;color:#666;margin-bottom:16px}

  .cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
  .card{background:#12121a;border:1px solid #2a2a3a;border-radius:10px;padding:14px}
  .card .n{font-size:26px;font-weight:700;color:#22d3ee}
  .card .l{font-size:10px;color:#666;margin-top:2px}

  .section-title{font-size:12px;color:#22d3ee;margin:0 0 8px;padding-bottom:4px;border-bottom:1px solid #2a2a3a}

  .step{background:#12121a;border:1px solid #2a2a3a;border-radius:10px;padding:14px;margin-bottom:8px}
  .step .num{display:inline-block;width:20px;height:20px;line-height:20px;border-radius:10px;background:#22d3ee20;color:#22d3ee;font-size:10px;text-align:center;font-weight:600;margin-right:8px}
  .step .name{font-size:13px;color:#e1e1e6;font-weight:500}
  .step .desc{font-size:11px;color:#666;margin-top:4px;margin-left:28px}
  .step .status{font-size:10px;color:#34d399;margin-left:28px;margin-top:4px}
  .step .cmd{font-size:10px;color:#22d3ee60;margin-left:28px;margin-top:4px;font-family:monospace}

  .quick{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
  .quick-btn{display:block;padding:12px;border-radius:10px;text-align:center;text-decoration:none;font-size:12px;font-weight:600}
  .quick-btn.primary{background:#22d3ee;color:#000}
  .quick-btn.secondary{background:#12121a;border:1px solid #2a2a3a;color:#e1e1e6}

  .footer{text-align:center;font-size:9px;color:#444;margin-top:24px;padding:16px}
</style>
</head>
<body>
<div class="wrap">

  <h1>GlobalGuard Ops</h1>
  <p class="date">${today}</p>

  <div class="cards">
    <div class="card">
      <div class="n">0</div>
      <div class="l">今日新线索</div>
    </div>
    <div class="card">
      <div class="n">0</div>
      <div class="l">待回复</div>
    </div>
  </div>

  <div class="section-title">今日待办</div>

  <div class="step">
    <span class="num">1</span><span class="name">采集线索</span>
    <div class="desc">在 Reddit / 知乎 / 小红书 搜索跨境痛点帖子</div>
    <div class="status">等待运行</div>
    <div class="cmd">cd marketing_agents && python 01_leads/agent1_leads_analyzer.py</div>
  </div>

  <div class="step">
    <span class="num">2</span><span class="name">生成文案</span>
    <div class="desc">生成 AMZ123 / FB / 小红书 三套推广内容</div>
    <div class="status">等待运行</div>
    <div class="cmd">cd marketing_agents && python 02_content/agent2_content_creator.py</div>
  </div>

  <div class="step">
    <span class="num">3</span><span class="name">草拟回复</span>
    <div class="desc">针对高潜线索生成拟人化回复话术</div>
    <div class="status">等待运行</div>
    <div class="cmd">cd marketing_agents && python 03_replies/agent3_precision_hunter.py</div>
  </div>

  <div class="step">
    <span class="num">4</span><span class="name">一键跑完</span>
    <div class="desc">一条命令执行全部流程，生成完整看板</div>
    <div class="status">推荐方式</div>
    <div class="cmd">cd marketing_agents && python main_pipeline.py --no-email</div>
  </div>

  <div class="quick">
    <a href="https://globalguard-ai.vercel.app/" class="quick-btn primary">打开工具</a>
    <a href="https://github.com/marshalxxy8848-afk/globalguard-ai" class="quick-btn secondary">GitHub</a>
  </div>

  <div class="footer">
    cd marketing_agents && python main_pipeline.py --no-email
  </div>

</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
