"""Content Agent — generate social media posts and ads.

Modes:
  - twitter: short punchy posts (280 chars)
  - linkedin: professional posts
  - zhihu: in-depth Chinese articles
  - ad: ad copy for Google/Facebook
"""

TEMPLATES = {
    "twitter": [
        "📸 Snap a product photo → get HS code + tariff + profit analysis in <10s.\nFree tool for cross-border sellers: {url}",
        "Stop guessing HS codes. One photo → instant classification + duty calculation.\nTry it free: {url}",
        "301 tariffs got you confused? Our AI does the math for you.\nPhoto → full landed cost in seconds: {url}",
    ],
    "linkedin": [
        "Cross-border compliance just got faster.\n\nWe built an AI tool that classifies HS codes and calculates duties from a single product photo. Used by sellers in 13+ languages.\n\nTry it free: {url}",
        "The problem: 4+ websites to get a single product's tariff.\nThe fix: one photo → HS code + US/EU duties + profit analysis.\n\n{url}",
    ],
    "zhihu": [
        "做跨境电商，最头疼的就是HS编码和关税计算。\n\n以前要查海关官网、USITC、退税率、汇率，至少开4-5个网页。现在我们做了一个工具，拍照就能全部算出来。\n\n包含：✅ HS编码自动识别 ✅ 美国关税+301附加税 ✅ 欧盟关税+VAT ✅ 出口退税率 ✅ 利润分析\n\n免费使用：{url}",
    ],
    "ad": [
        "From product photo to complete tariff analysis in under 10 seconds.\n\n• HS code classification\n• US + EU duty calculation\n• Profit margin analysis\n• 13 language support\n\nFree to start: {url}",
    ],
}

import random

def generate(channel: str, url: str = "https://globalguard-ai.vercel.app"):
    templates = TEMPLATES.get(channel, TEMPLATES["twitter"])
    return random.choice(templates).format(url=url)

if __name__ == "__main__":
    print("=== CONTENT AGENT ===\n")
    for ch in TEMPLATES:
        print(f"[{ch}]")
        print(generate(ch))
        print()
