"""Leads Agent — find potential cross-border ecommerce sellers."""
import json

# Target: cross-border sellers on social media / forums
PLATFORMS = [
    {"name": "reddit", "subreddits": ["r/ecommerce", "r/FulfillmentByAmazon", "r/dropship", "r/smallbusiness"],
     "keywords": ["tariff", "HS code", "customs", "cross border", "import duty"]},
    {"name": "知乎", "topics": ["跨境电商", "亚马逊运营", "外贸soho", "HS编码"],
     "keywords": ["关税", "清关", "出口退税", "跨境物流"]},
    {"name": "twitter", "hashtags": ["#ecommerce", "#crossborder", "#importduty", "#AmazonFBA"],
     "keywords": ["tariff", "hs code", "customs clearance"]},
    {"name": "facebook_groups", "groups": ["Cross Border Ecommerce", "跨境电商卖家交流群"],
     "keywords": ["HS code lookup", "tariff calculator", "import fees"]},
]

# Outreach templates by channel
OUTREACH = {
    "reddit": "Hi! Saw your post about {pain_point}. We built a free tool that instantly analyzes HS codes + tariffs from a product photo — thought it might help: https://globalguard-ai.vercel.app",
    "zhihu": "你好！看到你在问{question}的问题。我们做了一个免费工具，拍照就能识别HS编码和关税，可以帮你省不少时间：https://globalguard-ai.vercel.app",
    "twitter": "Struggling with {pain_point}? Our tool does HS code + tariff analysis from a single product photo. Free to try: https://globalguard-ai.vercel.app",
}

def generate_report():
    print("=" * 50)
    print("LEADS AGENT — Weekly Lead Generation Report")
    print("=" * 50)
    print(f"\nTarget Platforms: {len(PLATFORMS)}")

    total_keywords = sum(len(p["keywords"]) for p in PLATFORMS)
    print(f"Keywords tracked: {total_keywords}")

    print("\n--- Sample Outreach Templates ---")
    for channel, template in OUTREACH.items():
        print(f"\n[{channel}]")
        print(f"  {template}")

    print("\n--- Next Steps ---")
    print("1. Search each platform for keywords")
    print("2. Save relevant posts/threads to leads.json")
    print("3. Send outreach (1-2 per platform per day)")
    print("4. Track responses")

if __name__ == "__main__":
    generate_report()
