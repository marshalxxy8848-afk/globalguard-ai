"""Replies Agent — auto-reply to user inquiries and support requests."""

import json

SCENARIOS = {
    "how_to_use": {
        "zh": "使用方法很简单：点击「开始免费试用」→ 拍照或从相册选产品图 → AI自动识别HS编码 → 查看关税、利润分析。全程不到10秒。",
        "en": "It's simple: tap 'Start Free' → take a photo or pick from gallery → AI identifies HS codes → view duty & profit analysis. Takes <10 seconds."
    },
    "accuracy": {
        "zh": "我们的数据源是官方API（美国USITC、欧盟TARIC、中国海关），和海关官网实时同步，不是估算。置信度会在结果中标注。",
        "en": "We use official APIs (USITC, EU TARIC, China Customs) — same data as government websites, not estimates. Confidence scores are shown on every result."
    },
    "pricing": {
        "zh": "目前免费阶段，每天5次查询。正式定价还没出，会远低于Zonos（他们$500/月起），大概在¥39-69/月。",
        "en": "Currently free (5 queries/day). Pricing will be much lower than Zonos ($500+/mo) — likely $5-10/mo."
    },
    "samsung_issue": {
        "zh": "三星手机Chrome浏览器不支持直接打开相机，建议用三星自带浏览器或Firefox，也可以从相册选择已有图片。",
        "en": "Samsung Chrome doesn't support direct camera access. Use Samsung Internet Browser, Firefox, or choose from gallery instead."
    },
    "general": {
        "zh": "感谢使用GlobalGuard AI！有什么问题随时问我们。",
        "en": "Thanks for using GlobalGuard AI! Feel free to ask any questions."
    }
}

def get_reply(scenario: str, lang: str = "zh"):
    return SCENARIOS.get(scenario, SCENARIOS["general"]).get(lang, SCENARIOS["general"]["en"])

def classify_intent(message: str, lang: str = "zh") -> str:
    """Simple keyword-based intent classification."""
    msg = message.lower()
    if any(k in msg for k in ["怎么用", "how", "步骤", "使用"]):
        return "how_to_use"
    if any(k in msg for k in ["准确", "精准", "accuracy", "数据来源"]):
        return "accuracy"
    if any(k in msg for k in ["价格", "收费", "钱", "price", "cost", "pricing", "付费"]):
        return "pricing"
    if any(k in msg for k in ["三星", "samsung", "相机", "打不开"]):
        return "samsung_issue"
    return "general"

if __name__ == "__main__":
    print("=== REPLIES AGENT ===")
    print("Enter a user message to auto-classify and reply:")
    while True:
        msg = input("\n> ").strip()
        if not msg or msg == "quit":
            break
        intent = classify_intent(msg)
        reply = get_reply(intent)
        print(f"[Intent: {intent}]")
        print(f"Reply: {reply}")
