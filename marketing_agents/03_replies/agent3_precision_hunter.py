"""
Precision Hunter Agent — 针对高潜线索生成拟人化回复，引出工具。

读取 ../01_leads/high_quality_leads.json 和同目录下 thread_context.json，
用 DeepSeek 生成自然、懂行的回复，保存到 ready_to_send_replies.json。
"""

import json
import os
import sys
import time

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
SYSTEM_PROMPT = """你是一个热心的跨境电商老手。你看到有人在网上求助HS编码/报关/关税的问题。
你的任务是写一条回复帮他解决，并顺带引出你正在用的一款工具。

绝对规则：
1. 禁止一上来就发链接！必须先针对他的具体问题给出专业建议（比如归类思路、清关注意点）。
2. 然后以"最近用了个神器"或"我现在都偷懒用AI查"的口吻，自然引出工具（部署在Vercel上的拍照查编码工具）。
3. 根据帖子语言（中文/英文）回复。英文要地道，别用机翻味。
4. 语气：同情、懂行、有点小得意（因为找到了捷径）。"""


def build_prompt(lead: dict, thread_context: str = "") -> str:
    """根据线索和上下文构造 prompts."""
    text = lead.get("original_text", "")
    pain = lead.get("pain_point", "")
    region = lead.get("region", "中国卖家")

    # 判断语言
    has_chinese = any('一' <= c <= '鿿' for c in text[:50])
    lang_note = "请用中文回复" if has_chinese else "Please reply in English"

    prompt = f"""帖子内容：{text[:600]}
核心痛点：{pain}
目标用户：{region}
{lang_note}

请按照以下结构回复：
1. 先针对他的问题给出专业建议（归类思路、清关注意点等）
2. 自然地引出你正在用的工具
3. 保持口语化、懂行的语气"""

    if thread_context:
        prompt += f"\n\n帖子上下文（其他回复）：\n{thread_context[:500]}"

    return prompt


def call_deepseek(prompt: str) -> str:
    """调用 DeepSeek API 生成回复."""
    if not DEEPSEEK_API_KEY:
        print("  [WARN] DEEPSEEK_API_KEY 未设置，使用模拟回复")
        return mock_reply(prompt)

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
                "max_tokens": 800,
                "temperature": 0.7,
            },
            timeout=60,
        )
        if resp.status_code != 200:
            print(f"  [API Error] {resp.status_code}")
            return mock_reply(prompt)

        result = resp.json()
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        return content.strip()

    except Exception as e:
        print(f"  [Exception] {e}")
        return mock_reply(prompt)


def mock_reply(prompt: str) -> str:
    """备用回复生成."""
    has_chinese = any('一' <= c <= '鿿' for c in prompt[:50])
    if "填错" in prompt or "被扣" in prompt or "准确" in prompt:
        reply_cn ="""HS编码这个事情真的头疼，我早几年也被扣过货，后来才搞明白。其实编码前6位全球统一，关键是后几位各国不一样。建议你先确定产品材质和功能，对照海关注释一步步来。

不过说实话我现在都偷懒了，用了一个AI工具，拍照1秒就出来编码+关税数据。不是我吹，用了半年再也没被扣过货。你可以试试：https://globalguard-ai.vercel.app"""
        reply_en ="""HS codes can be a nightmare. I learned it the hard way too - got a container held up for wrong classification. The first 6 digits are global, but the country-specific digits vary.

Honestly, I've been using an AI tool lately that identifies HS codes from a photo in seconds. Hasn't let me down in 6 months. You can try it: https://globalguard-ai.vercel.app"""
        return reply_cn if has_chinese else reply_en
    elif "关税" in prompt or "tariff" in prompt.lower():
        reply_cn ="""关税这个确实麻烦，美国有301附加税，欧盟有VAT，不同编码税率能差好几个点。建议你用排除法，先把产品归到大类，再一步步缩小。

我现在都直接用AI查了，拍个照连编码带关税全出来，省心很多：https://globalguard-ai.vercel.app"""
        reply_en ="""Tariffs are tricky. 301 tariffs on Chinese goods, VAT in EU, plus different rates for different codes. Best approach: identify the broad category first, then narrow down.

I use an AI tool that does this from a photo now - gives HS code + duties in seconds. Total game changer: https://globalguard-ai.vercel.app"""
        return reply_cn if has_chinese else reply_en
    else:
        reply_cn ="""这个我遇到过类似的。建议先确认产品的材质和功能，这两个是归类最关键的因素。不同材质归不同编码，税率可能差很多。

对了，我现在发现一个神器，拍产品照片1秒出编码，还有关税和退税数据，比以前半小时查资料省事多了：https://globalguard-ai.vercel.app"""
        reply_en ="""Ive dealt with similar situations. The key factors for HS classification are material and function - getting these right determines your tariff rate.

Lately I've been using a tool that identifies HS codes from photos in seconds. Super helpful: https://globalguard-ai.vercel.app"""
        return reply_cn if has_chinese else reply_en


def load_json(filepath: str, default: list | dict = None) -> list | dict:
    """安全加载 JSON 文件."""
    if default is None:
        default = []
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                print(f"  [WARN] JSON解析失败: {filepath}")
    return default


def create_sample_thread_context(dir_path: str):
    """创建示例 thread_context.json."""
    sample = {
        "https://reddit.com/r/ecommerce/1": {
            "title": "Import tariffs from China to US are killing my margins",
            "replies": [
                "Have you looked into the de minimis exemption? Under $800 can enter duty-free.",
                "Check if your products qualify for any exclusions or tariff classifications.",
            ]
        },
        "https://zhihu.com/question/1": {
            "title": "HS编码查不准确怎么办？",
            "replies": [
                "建议用海关官方的归类查询系统，虽然操作麻烦但最准确。",
                "找报关行帮忙归类，他们比较有经验。",
            ]
        }
    }
    filepath = os.path.join(dir_path, "thread_context.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(sample, f, ensure_ascii=False, indent=2)
    print(f"  [OK] 已创建示例: {filepath}")


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    leads_dir = os.path.join(script_dir, "..", "01_leads")

    # 读取 high_quality_leads.json
    leads_file = os.path.join(leads_dir, "high_quality_leads.json")
    leads = load_json(leads_file, [])
    if not leads:
        print("  [ERROR] 未找到 high_quality_leads.json，请先运行 leads_analyzer")
        # 创建示例 lead
        leads = [{
            "url": "https://zhihu.com/question/1",
            "author": "跨境小王",
            "pain_point": "HS编码查不准确导致多交关税",
            "region": "中国卖家",
            "original_text": "最近发了一批货到美国，海关说我们HS编码归错了，要多交30%的关税。我们是做蓝牙耳机的，有没有靠谱的查编码方法？",
            "platform": "zhihu"
        }]
        print("  [INFO] 使用默认示例数据")

    # 读取 thread_context.json
    context_file = os.path.join(script_dir, "thread_context.json")
    if not os.path.exists(context_file):
        create_sample_thread_context(script_dir)
    thread_contexts = load_json(context_file, {})

    print("\n" + "=" * 50)
    print("PRECISION HUNTER AGENT — 生成拟人化回复")
    print("=" * 50)

    results = []
    for i, lead in enumerate(leads):
        url = lead.get("url", "")
        print(f"\n  [{i+1}/{len(leads)}] {url[:50]}...")

        context = ""
        if url in thread_contexts:
            ctx = thread_contexts[url]
            replies = ctx.get("replies", [])
            if replies:
                context = json.dumps(replies[:3], ensure_ascii=False)

        prompt = build_prompt(lead, context)
        reply = call_deepseek(prompt)

        if reply:
            results.append({
                "target_url": url,
                "reply_content": reply,
                "region": lead.get("region", ""),
            })
            print(f"  [OK] 回复生成成功 ({len(reply)} 字)")
        else:
            print(f"  [X] 生成失败")

        if DEEPSEEK_API_KEY:
            time.sleep(0.5)

    # 保存结果
    output = os.path.join(script_dir, "ready_to_send_replies.json")
    with open(output, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n  [SAVE] {output} ({len(results)} 条回复)")
    print("=" * 50)


if __name__ == "__main__":
    try:
        import requests
    except ImportError:
        print("  [ERROR] 需要安装 requests: pip install requests")
        sys.exit(1)
    main()
