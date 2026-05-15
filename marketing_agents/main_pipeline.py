"""
Main Pipeline — 每日营销自动化流水线。

流程：
1. 调用 OpenClaw API 启动抓取（可选）
2. 依次运行 agent1 → agent2 → agent3
3. 生成每日运营看板（HTML）
4. 通过 SMTP 发送报告到邮箱（可选）

用法：
  python main_pipeline.py                    # 跑完整流程
  python main_pipeline.py --no-email         # 跑流程但不发邮件
  python main_pipeline.py --web-only         # 只看板不发邮件不跑代理
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# === 配置 ===
PROJECT_ROOT = Path(__file__).parent.parent
AGENTS_DIR = Path(__file__).parent
REPORTS_DIR = AGENTS_DIR / "reports"

# SMTP 配置（从环境变量读取）
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SMTP_TO = os.environ.get("SMTP_TO", "")

# OpenClaw 配置
OPENCLAW_API_KEY = os.environ.get("OPENCLAW_API_KEY", "globalguard-openclaw-key-2026")
OPENCLAW_BASE = os.environ.get("OPENCLAW_BASE", "https://api.openclaw.ai/v1")


# ============================================================
#  1. 调用 OpenClaw 启动抓取
# ============================================================
def run_openclaw_scraper() -> dict:
    """调用 OpenClaw API 启动社媒抓取任务."""
    print("\n[1/4] OpenClaw 抓取任务...")

    if not OPENCLAW_API_KEY:
        print("  [SKIP] OPENCLAW_API_KEY 未设置，跳过")
        return {"status": "skipped", "message": "no api key"}

    try:
        import requests
        # 此处替换为 OpenClaw 实际的 API 端点
        resp = requests.post(
            f"{OPENCLAW_BASE}/scrape/start",
            headers={"Authorization": f"Bearer {OPENCLAW_API_KEY}"},
            json={
                "platforms": ["reddit", "zhihu", "twitter"],
                "keywords": ["HS code", "tariff", "关税", "HS编码", "清关"],
                "max_results": 50,
            },
            timeout=30,
        )
        if resp.status_code == 200:
            task_id = resp.json().get("task_id", "unknown")
            print(f"  [OK] 抓取任务已启动: {task_id}")
            return {"status": "started", "task_id": task_id}
        else:
            print(f"  [WARN] OpenClaw 返回 {resp.status_code}: {resp.text[:100]}")
            return {"status": "error", "message": resp.text[:100]}
    except Exception as e:
        print(f"  [WARN] OpenClaw 调用失败: {e}")
        return {"status": "error", "message": str(e)}


# ============================================================
#  2. 运行 Agent 脚本
# ============================================================
def run_agent(script_path: Path, timeout: int = 120) -> bool:
    """运行一个 agent 脚本."""
    name = script_path.stem
    print(f"\n[2/4] 运行 {name}...")

    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=script_path.parent,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode == 0:
            print(f"  [OK] {name} 完成")
            return True
        else:
            print(f"  [X] {name} 失败 (code {result.returncode})")
            if result.stderr:
                # 只打印最后的错误，避免刷屏
                lines = result.stderr.strip().split("\n")
                for line in lines[-3:]:
                    print(f"     {line.strip()}")
            return False
    except subprocess.TimeoutExpired:
        print(f"  [X] {name} 超时 (> {timeout}s)")
        return False
    except Exception as e:
        print(f"  [X] {name} 异常: {e}")
        return False


def run_all_agents() -> dict:
    """依次运行 agent1-agent4."""
    agents = [
        AGENTS_DIR / "01_leads" / "agent1_leads_analyzer.py",
        AGENTS_DIR / "02_content" / "agent2_content_creator.py",
        AGENTS_DIR / "03_replies" / "agent3_precision_hunter.py",
    ]

    results = {}
    for agent in agents:
        if agent.exists():
            ok = run_agent(agent)
            results[agent.stem] = "ok" if ok else "failed"
        else:
            print(f"  [SKIP] {agent.name} 不存在")
            results[agent.stem] = "not_found"

    return results


# ============================================================
#  3. 生成每日运营看板（HTML）
# ============================================================
def build_dashboard(agent_results: dict) -> str:
    """生成每日运营看板 HTML."""
    today = datetime.now().strftime("%Y-%m-%d %H:%M")
    reports_dir = REPORTS_DIR
    reports_dir.mkdir(parents=True, exist_ok=True)

    # 收集各 agent 输出
    leads_file = AGENTS_DIR / "01_leads" / "high_quality_leads.json"
    replies_file = AGENTS_DIR / "03_replies" / "ready_to_send_replies.json"
    content_files = {
        "amz123": AGENTS_DIR / "02_content" / "amz123_article.md",
        "facebook": AGENTS_DIR / "02_content" / "facebook_group_post.txt",
        "xiaohongshu": AGENTS_DIR / "02_content" / "xiaohongshu_note.txt",
    }

    leads = []
    if leads_file.exists():
        with open(leads_file, encoding="utf-8") as f:
            leads = json.load(f)

    replies = []
    if replies_file.exists():
        with open(replies_file, encoding="utf-8") as f:
            replies = json.load(f)

    # 统计
    total_leads = len(leads)
    total_replies = len(replies)
    regions = {}
    for l in leads:
        r = l.get("region", "未知")
        regions[r] = regions.get(r, 0) + 1
    region_stats = " | ".join(f"{k}: {v}" for k, v in regions.items())

    # 构建 HTML
    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GlobalGuard 每日运营看板 - {today}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0f; color: #e1e1e6; padding: 20px; }}
  .container {{ max-width: 800px; margin: 0 auto; }}
  h1 {{ font-size: 20px; color: #22d3ee; margin-bottom: 5px; }}
  .date {{ color: #666; font-size: 12px; margin-bottom: 20px; }}
  .summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px; }}
  .card {{ background: #12121a; border: 1px solid #2a2a3a; border-radius: 12px; padding: 16px; }}
  .card .num {{ font-size: 28px; font-weight: 700; color: #22d3ee; }}
  .card .label {{ font-size: 11px; color: #666; margin-top: 4px; }}
  h2 {{ font-size: 14px; color: #22d3ee; margin: 20px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #2a2a3a; }}
  .lead-item {{ background: #12121a; border: 1px solid #2a2a3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; }}
  .lead-item .url {{ color: #22d3ee; font-size: 11px; word-break: break-all; }}
  .lead-item .pain {{ color: #f59e0b; font-size: 12px; margin: 4px 0; }}
  .lead-item .region {{ display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; background: #1a3a5c; color: #60a5fa; }}
  .content-box {{ background: #12121a; border: 1px solid #2a2a3a; border-radius: 8px; padding: 12px; margin-bottom: 12px; white-space: pre-wrap; font-size: 12px; line-height: 1.6; color: #c0c0cc; }}
  .content-box .label {{ font-size: 10px; color: #22d3ee; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }}
  .reply-item {{ background: #12121a; border: 1px solid #2a2a3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; }}
  .reply-item .url {{ color: #22d3ee; font-size: 11px; }}
  .reply-item .text {{ font-size: 12px; color: #c0c0cc; margin-top: 6px; white-space: pre-wrap; }}
  .footer {{ text-align: center; font-size: 10px; color: #444; margin-top: 30px; padding: 20px; border-top: 1px solid #2a2a3a; }}
  .btn {{ display: inline-block; padding: 8px 16px; background: #22d3ee; color: #000; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; margin-top: 12px; }}
  .tag {{ display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px; }}
  .tag-ok {{ background: #065f46; color: #34d399; }}
  .tag-failed {{ background: #7f1d1d; color: #f87171; }}
</style>
</head>
<body>
<div class="container">
  <h1>GlobalGuard Daily Ops</h1>
  <p class="date">{today}</p>

  <!-- Agent 状态 -->
  <div class="summary">
    <div class="card">
      <div class="num">{total_leads}</div>
      <div class="label">新线索</div>
    </div>
    <div class="card">
      <div class="num">{len(replies)}</div>
      <div class="label">待回复</div>
    </div>
    <div class="card">
      <div class="num">{sum(1 for v in agent_results.values() if v == 'ok')}/{len(agent_results)}</div>
      <div class="label">Agent 成功</div>
    </div>
  </div>
  <p style="font-size:11px;color:#666;margin-bottom:16px;">{region_stats}</p>
"""

    # Agent 状态详情
    html += "<h2>Agent 状态</h2>"
    for name, status in agent_results.items():
        tag = f'<span class="tag tag-ok">{status}</span>' if status == "ok" else f'<span class="tag tag-failed">{status}</span>'
        html += f"<p style='font-size:12px;margin-bottom:4px;'>{name} {tag}</p>"

    # 线索列表
    if leads:
        html += "<h2>高潜线索</h2>"
        for l in leads[:10]:
            html += f'<div class="lead-item">'
            html += f'<div class="url">{l.get("url", "")}</div>'
            html += f'<div class="pain">{l.get("pain_point", "")}</div>'
            html += f'<span class="region">{l.get("region", "")}</span>'
            html += f'<span style="font-size:10px;color:#666;margin-left:8px;">{l.get("author", "")}</span>'
            html += f'</div>'

    # 生成的内容
    html += "<h2>本周推广文案</h2>"
    for name, filepath in content_files.items():
        if filepath.exists():
            with open(filepath, encoding="utf-8") as f:
                content = f.read()
            html += f'<div class="content-box"><div class="label">{name}</div>{content}</div>'

    # 待回复
    if replies:
        html += "<h2>待回复</h2>"
        for r in replies[:5]:
            html += f'<div class="reply-item">'
            html += f'<div class="url">{r.get("target_url", "")}</div>'
            html += f'<div class="text">{r.get("reply_content", "")}</div>'
            html += f'</div>'

    html += '<div class="footer">Generated by GlobalGuard AI Marketing Pipeline</div>'
    html += "</div></body></html>"

    # 保存
    output_path = reports_dir / f"daily_digest_{datetime.now().strftime('%Y%m%d')}.html"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"\n  [OK] 看板已生成: {output_path}")
    return str(output_path)


# ============================================================
#  4. 通过 SMTP 发送邮件
# ============================================================
def send_email(html_path: str):
    """发送每日报告到邮箱."""
    print("\n[4/4] 发送邮件...")

    if not all([SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_TO]):
        print("  [SKIP] SMTP 未配置（设置 SMTP_HOST/USER/PASS/TO 环境变量）")
        print("  看板文件保存在:", html_path)
        return

    try:
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        with open(html_path, encoding="utf-8") as f:
            html_content = f.read()

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"GlobalGuard 每日运营报告 - {datetime.now().strftime('%Y-%m-%d')}"
        msg["From"] = SMTP_USER
        msg["To"] = SMTP_TO
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, SMTP_TO, msg.as_string())

        print(f"  [OK] 邮件已发送到 {SMTP_TO}")

    except Exception as e:
        print(f"  [X] 发送失败: {e}")
        print(f"  看板文件保存在: {html_path}")


# ============================================================
#  5. 启动简易看板服务器
# ============================================================
def start_dashboard_server():
    """启动本地服务器查看看板."""
    import http.server
    import socketserver

    port = 8899
    reports_dir = REPORTS_DIR
    reports_dir.mkdir(parents=True, exist_ok=True)

    os.chdir(reports_dir)
    handler = http.server.SimpleHTTPRequestHandler
    print(f"\n  [OK] 看板服务器: http://localhost:{port}")
    print(f"      打开浏览器查看每日报告")
    with socketserver.TCPServer(("", port), handler) as httpd:
        httpd.serve_forever()


# ============================================================
#  Main
# ============================================================
def main():
    import argparse
    parser = argparse.ArgumentParser(description="GlobalGuard 每日营销流水线")
    parser.add_argument("--no-email", action="store_true", help="不发送邮件")
    parser.add_argument("--web-only", action="store_true", help="仅生成本地看板")
    parser.add_argument("--serve", action="store_true", help="启动看板服务器")
    args = parser.parse_args()

    print("=" * 50)
    print(f"  GlobalGuard Daily Pipeline")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 50)

    if args.serve:
        start_dashboard_server()
        return

    agent_results = {}

    if args.web_only:
        print("\n[INFO] 仅生成看板（跳过抓取和 agent）")
    else:
        # 1. OpenClaw
        run_openclaw_scraper()

        # 2. Agents
        agent_results = run_all_agents()

    # 3. 看板
    html_path = build_dashboard(agent_results)

    # 4. 邮件
    if not args.no_email and not args.web_only:
        send_email(html_path)

    print("\n" + "=" * 50)
    print("  Pipeline 完成！")
    print(f"  看板: {html_path}")
    print("=" * 50)


if __name__ == "__main__":
    main()
