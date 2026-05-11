# TradePolicyMonitor — 跨境政策监控技能

## 目标
每 6 小时监控一次美国海关（CBP.gov）关于 De Minimis (T86) 的政策更新，维护 GlobalGuard AI 的规则库。

## 触发条件
- 定时触发：每 6 小时自动运行
- 手动触发：通过指令启动

## 监控关键词
- "Section 321"
- "T86"
- "De Minimis"
- "China tariffs"
- "customs de minimis repeal"
- "800 exemption"

## 数据源
- https://www.cbp.gov/newsroom （CBP 官方新闻）
- https://www.cbp.gov/trade （CBP 贸易政策页面）
- Google News / RSS 聚合（关键词匹配）

## 动作

### 1. 抓取与检测
- 搜索上述关键词，提取最近 24 小时内的政策变动
- 使用 AI 判断是否为实质性政策变更（非日常新闻）

### 2. Telegram 告警
- 如果检测到政策变动：
  - 发送 Telegram 消息给开发者
  - 格式：`[TradePolicyMonitor] ⚠️ 政策变动检测: {摘要} | 来源: {URL}`

### 3. 规则库自愈
- 更新 `regulations.json` 文件（路径：Web 项目根目录）
- 格式：
```json
{
  "last_updated": "ISO_TIMESTAMP",
  "section_321": {
    "status": "active|revoked|modified",
    "effective_date": "DATE",
    "china_origin": true,
    "de_minimis_threshold": 800,
    "notes": ""
  },
  "china_tariffs": {
    "section_301_rate": 0.075,
    "additional_rate": 0.25,
    "de_minimis_revoked": false,
    "notes": ""
  }
}
```

## 配置命令
启动技能：`启动 TradePolicyMonitor 技能，开始 24/7 监控。`
查看状态：`查看 TradePolicyMonitor 状态`
立即检查：`立即执行 TradePolicyMonitor 政策检查`
