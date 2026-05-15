"""
Content Creator Agent — 用 DeepSeek 生成多平台种草文案。

读取同目录下的 trending_structures.json 作为爆款参考语料，
每周生成 3 篇不同渠道的推广内容。
"""

import json
import os
import sys
import time

# === 配置 ===
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
SYSTEM_PROMPT = """你是跨境圈顶级营销操盘手，深谙卖家心理。你要为【一款在Vercel部署的AI网页工具：拍照1秒出HS编码、退税率、关税数据】写推广文案。
绝对不能有AI味！不能像硬广！要以"同行避坑分享"或"神器评测"的口吻。
文案中必须植入痛点（填错编码被扣货、手动查编码太慢）、解决方案（AI拍照秒出）、以及行动呼吁（访问Vercel链接体验）。"""

CHANNEL_PROMPTS = {
    "amz123": """请生成一篇适合 AMZ123/卖家之家 的长文评测体文章（约800字）。
要求：
- 标题吸引眼球
- 以第一人称"我"的口吻，讲述自己踩坑经历
- 插入痛点：填错HS编码被海关扣货、多交关税、手动查编码耗时
- 引出解决方案：发现这个AI工具，拍照1秒出结果
- 多段式结构，每段有小标题
- 标注 [图片：xxx] 占位图位
- 结尾呼吁行动
- 整体语调：真诚分享，不要营销味""",

    "facebook": """请生成一条适合 Facebook 群组 / Reddit 的短文案（3-5句话）。
要求：
- 短平快，第一句话直接抛出痛点
- 带 2-3 个 emoji
- 用"我最近发现"或"兄弟们"开头
- 直击：查HS编码太费时间/总怕填错
- 给出解决方案：拍照1秒出
- 最后呼吁去体验
- 整体语调：群友交流感，不要官方""",

    "xiaohongshu": """请生成一篇小红书风格的种草笔记。
要求：
- 吸睛标题，带emoji
- 开头抓人：用"救命"或"家人们"开头
- 正文口语化，有表情包感
- 分享"我"的使用体验
- 干货感：列出这个工具的几个亮点
- 结尾带话题标签：#跨境电商 #HS编码 #关税 #出口退税 #神仙工具
- 整体调性：姐妹/兄弟安利感，不要硬广""",
}


def call_deepseek(channel: str, trending: str = "") -> str:
    """调用 DeepSeek API 生成指定渠道文案."""
    if not DEEPSEEK_API_KEY:
        print("  [WARN] DEEPSEEK_API_KEY 未设置，使用模拟文案")
        return mock_content(channel)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
    ]

    if trending:
        messages.append({
            "role": "user",
            "content": f"以下是一些近期爆款文案的参考结构，请借鉴其风格但不抄袭：\n{trending[:800]}\n\n---"
        })

    messages.append({"role": "user", "content": CHANNEL_PROMPTS[channel]})

    try:
        resp = __import__('requests').post(
            DEEPSEEK_BASE,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "messages": messages,
                "max_tokens": 2000,
                "temperature": 0.7,
            },
            timeout=60,
        )
        if resp.status_code != 200:
            print(f"  [API Error] {resp.status_code}: {resp.text[:200]}")
            return mock_content(channel)

        result = resp.json()
        return result.get("choices", [{}])[0].get("message", {}).get("content", "")

    except Exception as e:
        print(f"  [Exception] {e}")
        return mock_content(channel)


def mock_content(channel: str) -> str:
    """无 API Key 时的示例文案."""
    samples = {
        "amz123": """# 做了5年跨境，终于找到1秒查HS编码的方法，海关再也没扣过我货

## 被HS编码支配的恐惧

做跨境的应该都懂，每次发货前查HS编码是最头疼的。之前发一批蓝牙耳机到美国，编码填错了，整批货被海关扣住，多交了30%的关税，利润直接腰斩。

从那以后我每次都要花至少半小时去查编码：海关官网查一遍、USITC查一遍、再找人确认一遍...累不累？

## 偶然发现的神器

上周一个同行推荐了个工具，说拍照就能出HS编码。我一开始是不信的，直到自己试了一下——拍了张产品照，真的1秒就出来了。

不仅出编码，还连着退税率、美国关税、欧盟关税全部算好。以前半小时的活，现在10秒搞定。

## 几个让我惊喜的点

- **拍照识别**：不用打字描述，直接拍照就行
- **数据全**：美国关税、301附加税、欧盟VAT全都有
- **退税率**：中国出口退税率也一起显示
- **多语言**：支持13种语言，老外也能用

## 真心推荐

如果你也被HS编码折磨过，可以去试试：
https://globalguard-ai.vercel.app

反正现在免费，每天能查几次。早用早省心。""",

        "facebook": """兄弟们，你们查HS编码一般花多久？🤔

我之前每次至少半小时，还是怕填错。上周发现一个工具，拍照1秒就出HS编码+关税数据，连退税率都算好了...

试了一下确实准，关键是免费。分享给被编码折磨的兄弟们 👇
https://globalguard-ai.vercel.app""",

        "xiaohongshu": """标题：救命😭 这个AI工具是我做跨境以来用过最香的神器！！

家人们谁懂啊！之前发一批货到美国，HS编码填错了被海关扣了一个月，还多交了30%的关税💸

后来同行推荐了一个工具，拍照就能自动识别HS编码，1秒钟出结果！还有退税率、关税数据全部算好✅

✨ 亮点总结：
📸 拍照识别，不用打字
⚡ 1秒出结果
🌍 覆盖美国+欧盟关税
💰 退税率同步显示
🌐 13种语言支持

体感就是：以前半小时的活现在10秒搞定，再也不怕填错编码了🥹

👉 https://globalguard-ai.vercel.app

#跨境电商 #HS编码 #关税 #出口退税 #神仙工具""",
    }
    return samples.get(channel, "")


def load_trending(dir_path: str) -> str:
    """读取 trending_structures.json 作为参考语料."""
    filepath = os.path.join(dir_path, "trending_structures.json")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return json.dumps(data, ensure_ascii=False, indent=2)
    return ""


def create_sample_trending(dir_path: str):
    """创建示例趋势参考文件."""
    sample = {
        "amz123_example": {
            "title": "做了3年跨境，终于搞懂了FBA头程物流怎么省钱",
            "structure": "痛点描述 -> 踩坑经历 -> 发现方法 -> 实操步骤 -> 总结推荐",
            "hook": "以个人经历开头，引发共鸣",
        },
        "facebook_example": {
            "title": "兄弟们这个物流渠道真的省钱了",
            "structure": "痛点抛出 -> 解决方案 -> 行动呼吁",
            "hook": "第一句话直击痛点，带emoji",
        },
        "xiaohongshu_example": {
            "title": "救命😭 这个选品方法我真的会谢",
            "structure": "吸睛标题 -> 痛点 -> 解决方案 -> 亮点总结 -> Tag",
            "hook": "用'救命''家人们'开头，口语化",
        },
    }
    filepath = os.path.join(dir_path, "trending_structures.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(sample, f, ensure_ascii=False, indent=2)
    print(f"  [OK] 已创建示例: {filepath}")


def save_content(content: str, filepath: str):
    """保存生成的文案到文件."""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  [SAVE] {filepath}")


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # 检查 / 创建 trending 语料
    trending = load_trending(script_dir)
    if not trending:
        print("  [INFO] 未找到 trending_structures.json，创建示例...")
        create_sample_trending(script_dir)
        trending = load_trending(script_dir)

    print("\n" + "=" * 50)
    print("CONTENT CREATOR AGENT — 生成周度推广文案")
    print("=" * 50)

    channels = {
        "amz123": "amz123_article.md",
        "facebook": "facebook_group_post.txt",
        "xiaohongshu": "xiaohongshu_note.txt",
    }

    for channel, filename in channels.items():
        print(f"\n--- 生成 [{channel}] 文案 ---")
        content = call_deepseek(channel, trending)
        if not content:
            print(f"  [WARN] {channel} 生成失败，使用备用文案")
            content = mock_content(channel)

        filepath = os.path.join(script_dir, filename)
        save_content(content, filepath)

        # API限流
        if DEEPSEEK_API_KEY:
            time.sleep(1)

    print("\n" + "=" * 50)
    print("  全部完成！3篇文案已保存")
    print("=" * 50)


if __name__ == "__main__":
    try:
        import requests
    except ImportError:
        print("  [ERROR] 需要安装 requests: pip install requests")
        sys.exit(1)
    main()
