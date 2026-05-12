export interface SensitiveCheck {
  isSensitive: boolean;
  type: 'prohibited' | 'restricted' | 'caution';
  category: string;
  label: string;
}

type KeywordRule = {
  keywords: string[];
  type: SensitiveCheck['type'];
  category: string;
  label: string;
};

const RULES: KeywordRule[] = [
  { keywords: ['液体', 'liqui', '水状', '油状'], type: 'restricted', category: '液体', label: '液体商品 — 运输受限，需走特货物流渠道' },
  { keywords: ['粉末', 'powder', 'dust', '粉状'], type: 'restricted', category: '粉末', label: '粉末商品 — 运输受限，需走特货物流渠道' },
  { keywords: ['电池', '充电宝', 'power bank', 'battery', '18650', '锂'], type: 'restricted', category: '电池', label: '含电池 — 需 UN38.3 测试，IATA 运输限制' },
  { keywords: ['食品', '零食', 'food', '保健品', 'health', '维生素', 'vitamin'], type: 'restricted', category: '食品', label: '食品/保健品 — 需 FDA 注册，进口检验检疫' },
  { keywords: ['药品', 'drug', 'medicine', 'medication', '药片', '胶囊', '处方'], type: 'prohibited', category: '药品', label: '药品 — 需进口药品许可证，个人寄递限制' },
  { keywords: ['医疗器械', 'medical', 'syringe', '注射器', '口罩', 'mask', 'test kit', '试剂'], type: 'restricted', category: '医疗器械', label: '医疗器械 — 需医疗器械注册证' },
  { keywords: ['化妆品', 'cosmetic', '护肤', 'skincare', '化妆', 'makeup', '口红', 'lipstick', '粉底'], type: 'restricted', category: '化妆品', label: '化妆品 — 需 FDA 注册（美国）或 CPNP 通报（欧盟）' },
  { keywords: ['nike', 'adidas', 'gucci', 'lv', 'louis vuitton', 'chanel', 'hermes', 'rolex', 'supreme', 'prada', 'dior', 'fendi', 'versace', 'armani', 'cartier', 'tiffany', 'balenciaga', 'off-white', 'moncler', 'burberry'], type: 'caution', category: '品牌侵权', label: '涉及知名品牌 — 侵权风险高，需确认品牌授权' },
  { keywords: ['magsafe', 'apple watch', 'iphone', 'airpods', 'samsung', 'xiaomi', 'huawei'], type: 'caution', category: '品牌兼容', label: '涉及品牌名 — 如为兼容配件，需在描述中注明"兼容/compatible"，避免侵权纠纷' },
  { keywords: ['管制刀具', 'knife', 'weapon', 'gun', 'toy gun', '仿真枪', '弹弓', '弩'], type: 'prohibited', category: '管制物品', label: '管制物品 — 禁止跨境邮寄' },
  { keywords: ['酒精', 'alcohol', '易燃', 'flammable', '打火机', 'lighter', 'gas', '喷雾', 'aerosol'], type: 'prohibited', category: '危险品', label: '易燃易爆品 — 禁止跨境邮寄' },
  { keywords: ['种子', 'seed', '土壤', 'soil', '植物', 'plant', '花卉'], type: 'restricted', category: '植物/种子', label: '植物/种子 — 需检验检疫证明，部分国家禁止入境' },
  { keywords: ['肉类', 'meat', 'animal', '宠物食品', 'pet food', '羽毛', 'feather', '象牙', 'ivory'], type: 'prohibited', category: '动物制品', label: '动物制品 — 需检验检疫，部分濒危物种禁止贸易' },
  { keywords: ['钱', 'money', 'currency', '现金', 'coin', '硬币', '邮票', 'stamp'], type: 'prohibited', category: '货币/邮票', label: '货币/邮票 — 禁止或限制跨境邮寄' },
];

export function checkSensitiveItem(name: string, material: string, usage: string, description?: string): SensitiveCheck | null {
  const combined = [name, material, usage, description || '']
    .join(' ')
    .toLowerCase()
    .replace(/[^\w一-鿿]/g, ' ');

  for (const rule of RULES) {
    const matched = rule.keywords.some((kw) => combined.includes(kw.toLowerCase()));
    if (matched) {
      return { isSensitive: true, type: rule.type, category: rule.category, label: rule.label };
    }
  }

  return null;
}
