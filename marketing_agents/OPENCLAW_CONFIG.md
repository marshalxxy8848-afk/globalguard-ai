# OpenClaw 配置说明

## 定时任务 1：每日营销流水线 + 导出到 Telegram（每天 9:00）

```yaml
name: GlobalGuard 每日流水线
schedule: "0 9 * * *"
command: |
  cd D:\globalguard-ai\marketing_agents
  python main_pipeline.py --no-email
  python export_to_telegram.py
output: 直接发送 export_to_telegram.py 的完整输出到 Telegram
notify: 发送全部输出到 Telegram（不要只发摘要，要发完整内容）
```

## 定时任务 2：抓取中文社区线索（每 6 小时）

```yaml
name: 抓取中文社区线索
schedule: "0 */6 * * *"
command: |
  cd D:\globalguard-ai\marketing_agents
  
  # 搜索关键词（复制到 OpenClaw 的抓取配置）
  平台: [雨果网, 知无不言, 创蓝论坛, 福步外贸论坛, AMZ123, 卖家之家]
  关键词: [HS编码, 报关归类, 关税计算, 清关受阻, 查编码工具]
  
  # 抓取结果保存到
  01_leads/cn_raw_leads.json
```

## 定时任务 3：抓取海外线索（每 6 小时）

```yaml
name: 抓取海外线索
schedule: "0 */6 * * *"
command: |
  平台: [Reddit(r/ecommerce, r/FulfillmentByAmazon), Facebook群组, Amazon Seller Forums]
  关键词: [HS code lookup, customs classification, tariff calculator, import duty]
  保存到: 01_leads/global_raw_leads.json
```

## 手动任务 1：提交工具到导航站

```yaml
name: 提交工具收录
频率: 一次性 + 每季度跟进
操作:
  - AMZ123: 联系客服提交工具到「海关HS编码查询」类目
  - 卖家之家: 提交到「海关编码查询」工具箱
  - 518导航: 提交到跨境工具目录
  - 跨境知道: 投稿工具介绍文章
```

## 手动任务 2：平台账号运营

```yaml
name: 平台账号回复
频率: 每天 10-15 条
操作:
  - 从 ready_to_send_replies.json 复制回复
  - 分别在对应平台粘贴发送
  - 注意: 每个账号每天不要超过 5 条，避免被封
```
