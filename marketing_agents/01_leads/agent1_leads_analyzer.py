"""
Leads Analyzer Agent — 用 DeepSeek 分析抓取到的帖子，筛选真实跨境痛点。

读取同目录下的 cn_raw_leads.json 和 global_raw_leads.json，
调用 deepseek 判断每条内容是否包含真实痛点，
过滤广告/无关内容，提取核心需求并分类市场。
"""

import json
import os
import time
import sys
from typing import Optional

# === 配置 ===
# 自动从 .env.local 加载
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

SYSTEM_PROMPT = """你是一个拥有10年经验的跨境电商老手。你的任务是分析抓取到的帖子，判断发帖人是否真实存在【HS编码查询、报关归类、关税计算、清关受阻】的痛点。
如果是卖广告、毫无关系的帖子，直接剔除。
如果是真实痛点，请提取他的核心痛点（pain_point），并判断他的市场（region: 中国卖家/亚洲卖家/欧美卖家）。

请严格按照以下 JSON 格式回复，不要包含其他内容：
{"valid": true/false, "pain_point": "核心痛点描述", "region": "中国卖家/亚洲卖家/欧美卖家", "reason": "判断理由"}"""


def call_deepseek(title: str, content_preview: str) -> Optional[dict]:
    """调用 DeepSeek API 分析单条内容."""
    if not DEEPSEEK_API_KEY:
        print("  [WARN] DEEPSEEK_API_KEY 未设置，跳过 API 调用，使用模拟结果")
        return mock_analyze(title, content_preview)

    user_prompt = f"标题：{title}\n内容预览：{content_preview[:500]}"

    try:
        resp = requests.post(
            DEEPSEEK_BASE,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 300,
                "temperature": 0.3,
            },
            timeout=30,
        )
        if resp.status_code != 200:
            print(f"  [API Error] {resp.status_code}: {resp.text[:200]}")
            return None

        result = resp.json()
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        return parse_response(content, title)

    except Exception as e:
        print(f"  [Exception] {e}")
        return None


def parse_response(content: str, title: str) -> Optional[dict]:
    """从 API 回复中解析 JSON."""
    # 尝试直接解析
    try:
        return json.loads(content.strip())
    except json.JSONDecodeError:
        pass

    # 尝试提取 JSON 块
    import re
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    print(f"  [ParseError] 无法解析回复: {content[:100]}")
    return None


def mock_analyze(title: str, content_preview: str) -> dict:
    """无 API Key 时的模拟分析（基于关键词）."""
    text = f"{title} {content_preview}".lower()

    spam_keywords = ["广告", "合作", "推广", "加我", "扫码", "微信", "discount", "promotion",
                     "buy now", "cheap", "free shipping", "click here"]
    pain_keywords = ["hs编码", "关税", "报关", "清关", "归类", "tariff", "hs code",
                     "customs", "duty", "import tax", "清关受阻", "归类错误", "退税率"]

    # 检查是否广告
    if any(k in text for k in spam_keywords) and not any(k in text for k in pain_keywords):
        return {"valid": False, "pain_point": "", "region": "", "reason": "广告或推广内容"}

    # 检查是否有痛点
    matched_pain = [k for k in pain_keywords if k in text]
    if matched_pain:
        # 判断区域
        if any(k in text for k in ["中国", "人民币", "淘宝", "1688", "拼多多", "国内"]):
            region = "中国卖家"
        elif any(k in text for k in ["亚马逊", "amazon", "fba", "ebay", "shopify"]):
            region = "欧美卖家"
        else:
            region = "亚洲卖家"

        return {
            "valid": True,
            "pain_point": f"用户提及了 {', '.join(matched_pain)} 相关问题",
            "region": region,
            "reason": f"内容包含跨境核心关键词: {', '.join(matched_pain)}",
        }

    return {"valid": False, "pain_point": "", "region": "", "reason": "无相关痛点"}


def analyze_file(filepath: str) -> list:
    """分析单个 JSON 文件中的所有 leads."""
    print(f"\n[FILE] 正在分析: {filepath}")

    if not os.path.exists(filepath):
        print(f"  文件不存在，跳过")

        # # 创建示例数据
        # create_sample(filepath)
        return []

    with open(filepath, "r", encoding="utf-8") as f:
        leads = json.load(f)

    print(f"  共 {len(leads)} 条数据")

    results = []
    for i, lead in enumerate(leads):
        print(f"  [{i+1}/{len(leads)}] {lead.get('title', '无标题')[:40]}...")
        try:
            result = call_deepseek(lead.get("title", ""), lead.get("content_preview", ""))
        except:  # noqa: E722
            result = mock_analyze(lead.get("title", ""), lead.get("content_preview", ""))

        if result and result.get("valid"):
            results.append({
                "url": lead.get("url", ""),
                "author": lead.get("author", ""),
                "pain_point": result.get("pain_point", ""),
                "region": result.get("region", ""),
                "original_text": f"{lead.get('title', '')} {lead.get('content_preview', '')}".strip(),
                "platform": lead.get("platform", ""),
            })
            print(f"    [OK] 有效痛点 | {result.get('region', '')} | {result.get('pain_point', '')[:40]}")
        else:
            reason = result.get("reason", "无相关痛点") if result else "分析失败"
            print(f"    [X] 已过滤 | {reason}")

        # API 限流
        if DEEPSEEK_API_KEY and i < len(leads) - 1:
            time.sleep(0.5)

    print(f"  [OK] 有效: {len(results)}/{len(leads)}")
    return results


def create_sample(filepath: str):
    """为测试创建示例数据."""
    dir_name = os.path.dirname(filepath)
    cn_file = os.path.join(dir_name, "cn_raw_leads.json")
    global_file = os.path.join(dir_name, "global_raw_leads.json")

    cn_sample = [
        {
            "title": "HS编码查不准确怎么办？",
            "url": "https://zhihu.com/question/1",
            "author": "跨境小王",
            "content_preview": "最近发了一批货到美国，海关说我们HS编码归错了，要多交30%的关税。我们是做蓝牙耳机的，有没有靠谱的查编码方法？",
            "platform": "zhihu"
        },
        {
            "title": "Temu卖家交流群，欢迎加入",
            "url": "https://example.com/ad1",
            "author": "temu_official",
            "content_preview": "加入Temu卖家群，每天分享爆款选品方法，扫码立即加入",
            "platform": "wechat"
        },
        {
            "title": "欧盟关税怎么算？VAT和关税的区别",
            "url": "https://zhihu.com/question/2",
            "author": "外贸小张",
            "content_preview": "刚做欧洲站，搞不清楚欧盟的关税和VAT到底怎么算，有没有工具能一键算出来？",
            "platform": "zhihu"
        },
    ]

    global_sample = [
        {
            "title": "Import tariffs from China to US are killing my margins",
            "url": "https://reddit.com/r/ecommerce/post1",
            "author": "ecom_newbie",
            "content_preview": "I'm dropshipping from China and the 301 tariffs are destroying my profit margins. Is there any way to find the correct HS codes to minimize duties?",
            "platform": "reddit"
        },
        {
            "title": "Best HS code lookup tool?",
            "url": "https://reddit.com/r/FulfillmentByAmazon/post2",
            "author": "amz_seller_2024",
            "content_preview": "Moving from eBay to Amazon FBA and struggling with HS code classification for my products. What tools do you use?",
            "platform": "reddit"
        },
        {
            "title": " Hot deal: get 50% off on shipping",
            "url": "https://example.com/deal1",
            "author": "shipping_deals",
            "content_preview": "Limited time offer! 50% off on all shipping to US and EU. Use code SHIP50",
            "platform": "twitter"
        },
    ]

    with open(cn_file, "w", encoding="utf-8") as f:
        json.dump(cn_sample, f, ensure_ascii=False, indent=2)
    with open(global_file, "w", encoding="utf-8") as f:
        json.dump(global_sample, f, ensure_ascii=False, indent=2)
    print(f"  已创建示例数据: {cn_file}, {global_file}")


def save_results(results: list, output: str):
    """保存分析结果."""
    with open(output, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n[SAVE] 结果已保存: {output} ({len(results)} 条有效 leads)")


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    cn_file = os.path.join(script_dir, "cn_raw_leads.json")
    global_file = os.path.join(script_dir, "global_raw_leads.json")

    # 检查文件是否存在，如果都不存在则创建示例
    if not os.path.exists(cn_file) and not os.path.exists(global_file):
        print(" 未找到数据文件，创建示例数据...")
        create_sample(script_dir)

    # 分析中文 leads
    cn_results = analyze_file(cn_file)
    # 分析海外 leads
    global_results = analyze_file(global_file)

    # 合并结果
    all_results = cn_results + global_results
    output = os.path.join(script_dir, "high_quality_leads.json")
    save_results(all_results, output)

    # 打印汇总
    print("\n" + "=" * 50)
    print("[STATS] 分析汇总")
    print("=" * 50)
    regions = {}
    for r in all_results:
        regions[r["region"]] = regions.get(r["region"], 0) + 1
    for region, count in regions.items():
        print(f"  {region}: {count}")
    print(f"\n  总计有效 leads: {len(all_results)}")


if __name__ == "__main__":
    # 确保 requests 可用
    try:
        import requests
    except ImportError:
        print("[X] 需要安装 requests 库: pip install requests")
        sys.exit(1)

    main()
