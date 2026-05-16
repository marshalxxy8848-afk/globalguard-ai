"""
Daily Brief - 每天只看你需要复制粘贴的内容，没有 JSON 括号。
OpenClaw 把这个输出发到你的 Telegram。
"""

import json
import sys
from pathlib import Path

BASE = Path(__file__).parent


def pr(text=""):
    """安全打印，去除 emoji 避免 Windows 报错."""
    cleaned = ''.join(c for c in str(text) if ord(c) <= 0xFFFF)
    sys.stdout.write(cleaned + "\n")
    sys.stdout.flush()


def main():
    # ===== 1. 今天要发的文案 =====
    pr("===== 今天要发的文案 =====")

    amz123 = BASE / "02_content" / "amz123_article.md"
    if amz123.exists():
        pr("\n--- AMZ123 / 卖家之家 ---")
        pr(amz123.read_text(encoding="utf-8"))

    xhs = BASE / "02_content" / "xiaohongshu_note.txt"
    if xhs.exists():
        pr("\n--- 小红书 ---")
        pr(xhs.read_text(encoding="utf-8"))

    fb = BASE / "02_content" / "facebook_group_post.txt"
    if fb.exists():
        pr("\n--- Facebook 群组 ---")
        pr(fb.read_text(encoding="utf-8"))

    # ===== 2. 今天要回复的帖子 =====
    replies_file = BASE / "03_replies" / "ready_to_send_replies.json"
    if replies_file.exists():
        replies = json.loads(replies_file.read_text(encoding="utf-8"))
        pr("\n\n===== 今天要回复的帖子 =====")
        for i, r in enumerate(replies, 1):
            pr(f"\n--- 回复 {i} ---")
            pr(f"目标帖子: {r.get('target_url', '')}")
            pr(f"回复内容:\n{r.get('reply_content', '')}")

    # ===== 3. 今天的高潜线索（只看有用的） =====
    leads_file = BASE / "01_leads" / "high_quality_leads.json"
    if leads_file.exists():
        leads = json.loads(leads_file.read_text(encoding="utf-8"))
        if leads:
            pr(f"\n\n===== 今天的线索 ({len(leads)} 条) =====")
            for l in leads:
                pr(f"\n- 作者: {l.get('author', '')}")
                pr(f"  平台: {l.get('platform', '')}")
                pr(f"  痛点: {l.get('pain_point', '')}")
                pr(f"  链接: {l.get('url', '')}")

    # ===== 4. 新用户引导话术 =====
    onboard_file = BASE / "04_onboarding" / "onboarding_messages.json"
    if onboard_file.exists():
        onboard = json.loads(onboard_file.read_text(encoding="utf-8"))
        if onboard:
            pr(f"\n\n===== 新用户引导话术 ({len(onboard)} 条) =====")
            for o in onboard:
                pr(f"\n--- 发给 {o.get('user_email', '')} ({o.get('type', '')}) ---")
                pr(o.get('message_content', ''))


if __name__ == "__main__":
    main()
