"""
Export Agent - 逐条输出各 Agent 内容，方便 OpenClaw 分条发送到 Telegram。
每条输出之间用 =====FILE_BREAK===== 分隔，OpenClaw 可据此分条发送。
"""

import json
from pathlib import Path

BASE = Path(__file__).parent

FILES = [
    ("high_quality_leads.json", BASE / "01_leads" / "high_quality_leads.json"),
    ("AMZ123评测.md", BASE / "02_content" / "amz123_article.md"),
    ("小红书笔记.md", BASE / "02_content" / "xiaohongshu_note.txt"),
    ("FB群组分享.txt", BASE / "02_content" / "facebook_group_post.txt"),
    ("ready_to_send_replies.json", BASE / "03_replies" / "ready_to_send_replies.json"),
    ("onboarding_messages.json", BASE / "04_onboarding" / "onboarding_messages.json"),
]


def main():
    for name, path in FILES:
        if not path.exists():
            continue

        content = path.read_text(encoding="utf-8")

        # 截断超长内容（每条消息不超过 4000 字符）
        if len(content) > 4000:
            content = content[:3900] + "\n\n...（内容较长，请查看本地文件）"

        print(f"[{name}]")
        print(content)
        print("\n=====FILE_BREAK=====\n")


if __name__ == "__main__":
    main()
