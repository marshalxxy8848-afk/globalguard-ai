"""Onboarding Agent — guide new users through first-time experience."""

import json
from datetime import datetime

ONBOARDING_STEPS = {
    "step1": {
        "zh": "📸 拍照 — 点击「开始免费试用」，拍一张产品照片",
        "en": "📸 Take a photo — tap 'Start Free' and snap a product photo"
    },
    "step2": {
        "zh": "🤖 AI 分析 — 等待 AI 自动识别 HS 编码（约 5-10 秒）",
        "en": "🤖 AI analysis — wait for AI to classify HS codes (~5-10 sec)"
    },
    "step3": {
        "zh": "📊 查看报告 — 查看 HS 编码、关税、利润分析和合规检查",
        "en": "📊 View report — see HS codes, duties, profit analysis & compliance"
    },
    "step4": {
        "zh": "💾 保存记录 — 登录后可保存历史记录，方便以后查看",
        "en": "💾 Save — login to save audit history for future reference"
    },
    "tip1": {
        "zh": "💡 产品描述越详细，AI识别越准确。建议填写材质和用途。",
        "en": "💡 More detailed descriptions improve AI accuracy. Add materials and uses."
    },
    "tip2": {
        "zh": "💡 支持 Temu、TikTok Shop、Amazon FBA 等 11 个平台的费用计算。",
        "en": "💡 Supports 11 platforms including Temu, TikTok Shop, Amazon FBA."
    },
    "tip3": {
        "zh": "💡 数据来源为 USITC、EU TARIC、中国海关官方 API，实时更新。",
        "en": "💡 Data sourced from official USITC, EU TARIC, China Customs APIs."
    },
}

WELCOME_MESSAGE = {
    "zh": """欢迎使用 GlobalGuard AI！🎉

我是你的跨境合规助手。三步即可获得完整的 HS 编码和关税分析：

{steps}

{tip}

有什么问题随时问我。开始拍照吧！""",
    "en": """Welcome to GlobalGuard AI! 🎉

Your cross-border compliance assistant. Get a full HS code + tariff analysis in 3 steps:

{steps}

{tip}

Ask me anything anytime. Start with a photo!"""
}

def generate_welcome(lang: str = "zh") -> str:
    steps = "\n".join([f"  {i+1}. {ONBOARDING_STEPS[f'step{i+1}'][lang]}" for i in range(4)])
    tip = ONBOARDING_STEPS["tip1"][lang]
    return WELCOME_MESSAGE[lang].format(steps=steps, tip=tip)

def onboarding_reminder(step: int, lang: str = "zh") -> str:
    """Generate a reminder message for a specific onboarding step."""
    if step < 4:
        return f"👋 {ONBOARDING_STEPS[f'step{step+1}'][lang]}"
    return f"👋 {ONBOARDING_STEPS[f'tip{step-3}'][lang]}"

if __name__ == "__main__":
    print("=== ONBOARDING AGENT ===")
    print(generate_welcome("zh"))
    print("\n---")
    print(generate_welcome("en"))
