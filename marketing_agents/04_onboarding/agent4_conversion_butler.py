"""
Conversion Butler Agent — 新用户注册时的 1V1 个性化引导话术生成器。

模拟 Webhook 接收，根据用户来源和行为生成差异化 onboarding 话术，
促使体验 Aha Moment 并引导裂变。
"""

import json
import os
import sys
import time
from datetime import datetime

# === 自动加载 .env.local ===
_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env.local')
if os.path.exists(_env_path):
    with open(_env_path, encoding='utf-8') as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith('#') and '=' in _line:
                _k, _v = _line.split('=', 1)
                if _k == 'DEEPSEEK_API_KEY':
                    os.environ.setdefault(_k, _v)

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = "deepseek-chat"
DEEPSEEK_BASE = "https://api.deepseek.com/v1/chat/completions"

# === System Prompt ===
SYSTEM_PROMPT = """你是这款AI查HS编码工具的专属客户成功经理。你的目标是让用户体验到"Aha Moment"（即拍照1秒出结果的爽感），并促使他们分享给同行。
如果他来自AMZ123，语气要专业懂行；如果来自FB群组，语气要轻松热情。
如果他注册后没上传照片，要给出明确指令（"试着拍一张你桌上产品的照片"）和诱惑（"新用户送3次高级查询"）。
如果他查过了，引导他裂变（"邀请同行各得5次额度"）。"""


def build_prompt(user_email: str, utm_source: str, is_uploaded_photo: bool) -> str:
    """根据用户来源和行为构造 prompts."""

    # 来源对应的语气和场景
    source_tone = {
        "amz123": "专业懂行，像资深同行在交流",
        "fb_group": "轻松热情，像群里的哥们儿在推荐",
        "reddit": "直接务实，像 Reddit 上的 helpful 老手",
        "xiaohongshu": "亲切种草，像姐妹在安利好东西",
        "zhihu": "专业有料，像认真分享经验的答主",
        "default": "友好专业，像专属客服在1对1服务",
    }
    tone = source_tone.get(utm_source, source_tone["default"])

    if is_uploaded_photo:
        # 已拍照 — 引导裂变
        message_type = "referral"
        instruction = f"""用户 {user_email} 已经上传过照片体验过功能了。
目标：引导他邀请同行使用，给出邀请奖励话术。
语气：{tone}
话术要点：
- 恭喜他解锁了高效工具
- 提醒他分享给同行，双方各得5次额外查询额度
- 给他一个复制邀请链接的明确行动点"""
    else:
        # 未拍照 — 引导拍照体验
        message_type = "activation"
        instruction = f"""用户 {user_email} 刚注册但还没上传照片。
目标：引导他完成首次拍照体验，触发 Aha Moment。
语气：{tone}
话术要点：
- 热情欢迎，简短介绍核心功能
- 明确指令：让他拍一张桌上的产品试试
- 诱惑：新用户额外赠送3次高级查询
- 强调"只需10秒"降低心理门槛"""

    prompt = f"""用户来源：{utm_source}
用户邮箱：{user_email}
是否已拍照：{'是' if is_uploaded_photo else '否'}
语气风格：{tone}
话术类型：{message_type}

{instruction}

请生成一段完整话术，不要超过300字，自然口语化，不要像模板。"""
    return prompt, message_type


def call_deepseek(prompt: str) -> str:
    """调用 DeepSeek API 生成话术."""
    if not DEEPSEEK_API_KEY:
        print("  [WARN] DEEPSEEK_API_KEY 未设置，使用模拟话术")
        return mock_message(prompt)

    try:
        resp = __import__('requests').post(
            DEEPSEEK_BASE,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 600,
                "temperature": 0.7,
            },
            timeout=60,
        )
        if resp.status_code != 200:
            print(f"  [API Error] {resp.status_code}")
            return mock_message(prompt)

        result = resp.json()
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        # 移除 emoji 兼容 Windows 终端
        content = ''.join(c for c in content if ord(c) <= 0xFFFF)
        return content.strip()

    except Exception as e:
        print(f"  [Exception] {e}")
        return mock_message(prompt)


def mock_message(prompt: str) -> str:
    """备用话术."""
    msg_type = "referral" if "referral" in prompt else "activation"

    if msg_type == "referral":
        return (
            "恭喜你用AI工具查到了HS编码！是不是比翻半天表格快多了？\n\n"
            "你的同行朋友可能也在为编码头疼。把下面链接发给TA，你们各得5次高级查询额度 \n"
            "https://globalguard-ai.vercel.app/?ref={email}\n\n"
            "多邀多得，上不封顶！"
        )
    else:
        return (
            "欢迎来到 GlobalGuard AI！\n\n"
            "这个工具的核心功能特别简单：拍一张产品照片，1秒出HS编码+关税+退税率。\n\n"
            "你现在就可以试一下：拿手边任意一个产品，拍张照上传。新用户专享3次高级查询 \n\n"
            "有任何问题随时回我！"
        )


def simulate_webhook(events: list[dict]) -> list[dict]:
    """模拟 Webhook 接收 — 处理一批注册事件."""
    results = []

    for event in events:
        email = event.get("user_email", "unknown@example.com")
        source = event.get("utm_source", "default")
        uploaded = event.get("is_uploaded_photo", False)

        print(f"\n  [EVENT] {email} | source={source} | photo={'yes' if uploaded else 'no'}")

        prompt, msg_type = build_prompt(email, source, uploaded)
        content = call_deepseek(prompt)

        results.append({
            "user_email": email,
            "message_content": content,
            "type": "activation" if not uploaded else "referral",
            "utm_source": source,
            "created_at": datetime.now().isoformat(),
        })

        if DEEPSEEK_API_KEY:
            time.sleep(0.5)

    return results


def save_results(results: list[dict], filepath: str):
    """保存话术到文件."""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n  [SAVE] {filepath} ({len(results)} 条话术)")


def print_report(results: list[dict]):
    """打印汇总报告."""
    print("\n" + "=" * 50)
    print("ONBOARDING REPORT")
    print("=" * 50)
    for r in results:
        t = r["type"]
        icon = "" if t == "activation" else ""
        email = r["user_email"]
        chars = len(r["message_content"])
        preview = r["message_content"][:60].replace("\n", " ")
        print(f"  {icon} [{t}] {email} ({chars}字)")
        print(f"     {preview}...")
    print(f"\n  总计: {len(results)} 条话术")


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # === 模拟 Webhook 事件 ===
    events = [
        {"user_email": "seller_zhang@example.com", "utm_source": "amz123", "is_uploaded_photo": False},
        {"user_email": "mike.seller@example.com", "utm_source": "reddit", "is_uploaded_photo": False},
        {"user_email": "xiao_hong@example.com", "utm_source": "fb_group", "is_uploaded_photo": True},
        {"user_email": "sarah.chen@example.com", "utm_source": "xiaohongshu", "is_uploaded_photo": True},
    ]

    print("=" * 50)
    print("CONVERSION BUTLER — 新用户引导话术生成")
    print("=" * 50)
    print(f"\n  待处理事件: {len(events)}")

    results = simulate_webhook(events)

    output = os.path.join(script_dir, "onboarding_messages.json")
    save_results(results, output)
    print_report(results)

    # 打印 Webhook 接入说明
    print("\n" + "=" * 50)
    print("WEBHOOK 接入说明")
    print("=" * 50)
    print("""
在 Vercel 注册成功后，POST 到本脚本即可：

  POST /api/onboarding-webhook
  {
    "user_email": "xxx@example.com",
    "utm_source": "amz123",
    "is_uploaded_photo": false
  }

返回 { "message": "话术内容", "type": "activation" }

对接到 Vercel 的 Webhook 配置即可自动触发。
""")


if __name__ == "__main__":
    try:
        import requests
    except ImportError:
        print("  [ERROR] 需要安装 requests: pip install requests")
        sys.exit(1)
    main()
