// --- Rule-Based HS Classification Engine ---
// Maps product attributes to HS codes using deterministic rules + confidence scoring

export interface HcCandidate {
  code: string;
  code6: string;
  chapter: string;
  heading: string;
  description: string;
  confidence: number;
  reasons: string[];
  /** How many attribute dimensions matched (0-3: name, material, usage) */
  matchStrength: number;
}

export interface ClassificationResult {
  candidates: HcCandidate[];
  chapter: string;
  chapterName: string;
  bestMatch: HcCandidate | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
}

// === Product-to-Chapter Mapping ===
// Maps common e-commerce product types to HS chapters

interface ProductEntry {
  keywords: string[];
  materials: string[];
  usages: string[];
  chapter: string;
  heading: string;
  headingDesc: string;
  description: string;
  confidence: number;        // Base confidence if keyword matched
}

const PRODUCT_MAP: ProductEntry[] = [
  // === Chapter 85: Electrical/Electronics ===
  { keywords: ['耳机', 'earphone', 'headphone', 'headset', 'earbud', '蓝牙', 'bluetooth'], materials: ['塑料', 'plastic', '金属', 'metal', '电子'], usages: ['音频', 'audio', '音乐', 'music', '通话', 'communication', '通讯'], chapter: '85', heading: '8518', headingDesc: '耳机及耳塞', description: '耳机及耳塞', confidence: 0.80 },
  { keywords: ['充电器', 'charger', '充电宝', 'power bank', 'powerbank', '适配器', 'adapter', '电源', 'power supply'], materials: ['塑料', 'plastic', '电子', 'electronic'], usages: ['充电', 'charge', '供电', 'power'], chapter: '85', heading: '8504', headingDesc: '变压器/充电器', description: '电源适配器及充电器', confidence: 0.80 },
  { keywords: ['手机壳', 'phone case', '手机保护壳', '保护套', '手机套'], materials: ['塑料', 'plastic', '硅胶', 'silicone', '皮革', 'leather', '橡胶', 'rubber'], usages: ['保护', 'protection', '防护'], chapter: '85', heading: '8517', headingDesc: '手机配件', description: '手机保护壳及配件', confidence: 0.75 },
  { keywords: ['数据线', 'cable', '充电线', 'usb线', 'usb cable', 'lightning'], materials: ['塑料', 'plastic', '金属', 'metal', '铜', 'copper'], usages: ['数据传输', 'data', '充电', 'charge', '连接', 'connect'], chapter: '85', heading: '8544', headingDesc: '绝缘电线电缆', description: '数据线及充电线', confidence: 0.80 },
  { keywords: ['智能手表', 'smartwatch', 'watch', '手环', 'band', 'fitness tracker'], materials: ['塑料', 'plastic', '金属', 'metal', 'glass', '玻璃', '硅胶', 'silicone'], usages: ['穿戴', 'wearable', '健康', 'health', '运动', 'fitness', '计时', 'time'], chapter: '85', heading: '8517', headingDesc: '智能穿戴设备', description: '智能手表及手环', confidence: 0.75 },
  { keywords: ['蓝牙音箱', 'speaker', '音响', 'soundbar', '音箱'], materials: ['塑料', 'plastic', '金属', 'metal'], usages: ['音频', 'audio', '音乐', 'music', '播放', 'play'], chapter: '85', heading: '8518', headingDesc: '扬声器', description: '蓝牙音箱及扬声器', confidence: 0.80 },
  { keywords: ['摄像头', 'camera', '监控', 'webcam', 'ip camera'], materials: ['塑料', 'plastic', '电子', 'electronic', '金属', 'metal'], usages: ['摄像', 'video', '监控', 'surveillance', '拍照', 'photo'], chapter: '85', heading: '8525', headingDesc: '摄像设备', description: '摄像头及监控设备', confidence: 0.75 },
  { keywords: ['无人机', 'drone', 'uav', '飞行器'], materials: ['塑料', 'plastic', '金属', 'metal', '电子', 'electronic'], usages: ['航拍', 'aerial', '摄影', 'photography', '飞行'], chapter: '85', heading: '8525', headingDesc: '无人机', description: '无人机及配件', confidence: 0.70 },
  { keywords: ['路由器', 'router', 'wifi', 'wireless', '网卡', 'modem', '5g', '4g'], materials: ['塑料', 'plastic', '电子', 'electronic'], usages: ['网络', 'network', '通信', 'communication', '上网', 'internet'], chapter: '85', heading: '8517', headingDesc: '通信设备', description: '路由器和网络通信设备', confidence: 0.80 },
  { keywords: ['电子玩具', 'electronic toy', '遥控车', 'rc car', '遥控飞机'], materials: ['塑料', 'plastic', '电子', 'electronic', '金属', 'metal'], usages: ['玩具', 'toy', '娱乐', 'play'], chapter: '95', heading: '9503', headingDesc: '电动玩具', description: '电动遥控玩具', confidence: 0.70 },
  { keywords: ['平板', 'tablet', 'ipad', '电子书', 'ebook', 'kindle'], materials: ['塑料', 'plastic', '金属', 'metal', 'glass', '玻璃'], usages: ['阅读', 'read', '浏览', 'browse', '娱乐', 'entertainment'], chapter: '85', heading: '8517', headingDesc: '平板电脑', description: '平板电脑及电子阅读器', confidence: 0.75 },

  // === Wired headphones (Chapter 85/8518) ===
  { keywords: ['有线耳机', 'wired earphone', '入耳式', '头戴式'], materials: ['塑料', 'plastic', '金属', 'metal'], usages: ['音频', 'audio', '音乐', 'music'], chapter: '85', heading: '8518', headingDesc: '耳机', description: '有线耳机及耳塞', confidence: 0.80 },

  // === Chapter 95: Toys ===
  { keywords: ['玩具', 'toy', '玩偶', 'doll', '模型', 'model', '积木', 'block', 'lego'], materials: ['塑料', 'plastic', '布', 'textile', '木', 'wood'], usages: ['娱乐', 'play', '教育', 'education'], chapter: '95', heading: '9503', headingDesc: '玩具', description: '玩具及模型', confidence: 0.80 },
  { keywords: ['宠物玩具', 'pet toy', '狗玩具', '猫玩具', '狗绳', 'leash', '宠物用品', 'pet supply'], materials: ['塑料', 'plastic', '布', 'textile', '橡胶', 'rubber'], usages: ['宠物', 'pet', '动物', 'animal'], chapter: '95', heading: '9503', headingDesc: '宠物玩具', description: '宠物玩具及用品', confidence: 0.65 },
  { keywords: ['运动', 'sport', '健身', 'fitness', '瑜伽', 'yoga', '哑铃', 'dumbbell', '跳绳', 'jump rope'], materials: ['塑料', 'plastic', '橡胶', 'rubber', '金属', 'metal'], usages: ['运动', 'sport', '健身', 'exercise'], chapter: '95', heading: '9506', headingDesc: '体育用品', description: '运动及健身器材', confidence: 0.75 },
  { keywords: ['自行车', 'bicycle', 'bike', '电动自行车', 'e-bike', 'ebike'], materials: ['金属', 'metal', '橡胶', 'rubber', '塑料', 'plastic'], usages: ['骑行', 'ride', '交通', 'transport', '运动', 'sport'], chapter: '87', heading: '8712', headingDesc: '自行车', description: '自行车及电动自行车', confidence: 0.70 },

  // === Chapter 42: Leather goods/Bags ===
  { keywords: ['包', 'bag', '背包', 'backpack', '手提包', 'handbag', '钱包', 'wallet', '行李箱', 'luggage', '旅行箱'], materials: ['皮革', 'leather', '帆布', 'canvas', '尼龙', 'nylon', '聚酯', 'polyester', 'pu'], usages: ['收纳', 'storage', '携带', 'carry', '旅行', 'travel'], chapter: '42', heading: '4202', headingDesc: '箱包', description: '箱包及类似容器', confidence: 0.80 },

  // === Chapter 64: Footwear ===
  { keywords: ['鞋', 'shoes', 'sneaker', '运动鞋', 'boot', '靴', '拖鞋', 'slipper', '凉鞋', 'sandal', '高跟鞋'], materials: ['皮革', 'leather', '布', 'textile', '橡胶', 'rubber', '塑料', 'plastic'], usages: ['穿着', 'wear', '步行', 'walk', '运动', 'sport'], chapter: '64', heading: '6402', headingDesc: '鞋类', description: '鞋类', confidence: 0.80 },

  // === Chapter 61/62: Apparel ===
  { keywords: ['衣服', 'clothing', 't恤', 't-shirt', '衬衫', 'shirt', '裤子', 'pants', '裙子', 'skirt', '外套', 'jacket', '大衣', 'coat', '卫衣', 'hoodie', '内衣', 'underwear', '睡衣', 'pajamas'], materials: ['棉', 'cotton', '聚酯', 'polyester', '尼龙', 'nylon', '羊毛', 'wool', '丝绸', 'silk', '化纤'], usages: ['穿着', 'wear', '保暖', 'warm'], chapter: '62', heading: '6201', headingDesc: '服装', description: '服装（非针织）', confidence: 0.80 },
  { keywords: ['针织衫', 'sweater', '毛衣', 'knitwear', 't恤', 't-shirt', 'polo'], materials: ['棉', 'cotton', '羊毛', 'wool', '化纤'], usages: ['穿着', 'wear'], chapter: '61', heading: '6101', headingDesc: '针织服装', description: '针织服装', confidence: 0.80 },

  // === Chapter 63: Textile products ===
  { keywords: ['毛巾', 'towel', '床单', 'sheet', '被套', 'duvet', '枕套', 'pillowcase', '窗帘', 'curtain', '地毯', 'rug'], materials: ['棉', 'cotton', '聚酯', 'polyester', '化纤'], usages: ['家居', 'home', '装饰', 'decoration'], chapter: '63', heading: '6302', headingDesc: '家用纺织品', description: '家用纺织制品', confidence: 0.75 },

  // === Chapter 94: Furniture ===
  { keywords: ['家具', 'furniture', '椅子', 'chair', '桌子', 'table', '沙发', 'sofa', '床', 'bed', '柜子', 'cabinet', '书架', 'shelf'], materials: ['木', 'wood', '金属', 'metal', '竹', 'bamboo', '塑料', 'plastic', '玻璃', 'glass'], usages: ['家居', 'home', '办公', 'office', '收纳', 'storage'], chapter: '94', heading: '9401', headingDesc: '家具', description: '家具及配件', confidence: 0.80 },
  { keywords: ['灯', 'lamp', 'light', '台灯', 'desk lamp', '吊灯', 'ceiling light', 'led'], materials: ['塑料', 'plastic', '金属', 'metal', '玻璃', 'glass'], usages: ['照明', 'lighting', '装饰', 'decoration'], chapter: '94', heading: '9405', headingDesc: '灯具', description: '灯具及照明装置', confidence: 0.80 },
  { keywords: ['床垫', 'mattress', '枕头', 'pillow', '靠垫', 'cushion'], materials: ['海绵', 'foam', '棉', 'cotton', '聚酯', 'polyester'], usages: ['睡眠', 'sleep', '家居', 'home'], chapter: '94', heading: '9404', headingDesc: '床垫寝具', description: '床垫及寝具', confidence: 0.75 },

  // === Chapter 39: Plastics ===
  { keywords: ['塑料制品', 'plastic product', '塑料盒', 'plastic box', '塑料容器', 'plastic container', '塑料餐具', 'plastic tableware', '保鲜盒', 'container'], materials: ['塑料', 'plastic', 'pp', 'pe', 'abs', '硅胶', 'silicone'], usages: ['收纳', 'storage', '包装', 'packaging', '餐饮', 'dining'], chapter: '39', heading: '3924', headingDesc: '塑料制品', description: '塑料制餐具及厨房用具', confidence: 0.70 },

  // === Chapter 71: Jewelry ===
  { keywords: ['首饰', 'jewelry', '项链', 'necklace', '手链', 'bracelet', '耳环', 'earring', '戒指', 'ring', '吊坠', 'pendant'], materials: ['金属', 'metal', '银', 'silver', '金', 'gold', '合金', 'alloy', '不锈钢', 'stainless steel', '水晶', 'crystal', '珍珠', 'pearl'], usages: ['装饰', 'decoration', '佩戴', 'wear'], chapter: '71', heading: '7117', headingDesc: '仿首饰', description: '仿制首饰', confidence: 0.80 },

  // === Chapter 90: Watches ===
  { keywords: ['手表', 'watch', '腕表', '石英表', '石英手表', '机械表'], materials: ['金属', 'metal', '不锈钢', 'stainless', '皮革', 'leather', '塑料', 'plastic', 'glass', '玻璃'], usages: ['计时', 'time', '佩戴', 'wear'], chapter: '91', heading: '9101', headingDesc: '手表', description: '手表及表类', confidence: 0.75 },

  // === Chapter 33: Cosmetics ===
  { keywords: ['化妆品', 'cosmetic', '护肤品', 'skincare', '面霜', 'cream', '精华', 'serum', '口红', 'lipstick', '眼影', 'eyeshadow', '粉底', 'foundation', '面膜', 'mask'], materials: ['液体', 'liquid', '膏', 'paste', '粉', 'powder', '塑料', 'plastic'], usages: ['美容', 'beauty', '护肤', 'skincare', '化妆', 'makeup'], chapter: '33', heading: '3304', headingDesc: '美容化妆品', description: '美容化妆品及护肤品', confidence: 0.80 },

  // === Chapter 34: Soap/Cleaning ===
  { keywords: ['肥皂', 'soap', '洗手液', 'hand soap', '洗衣液', 'laundry', '清洁剂', 'cleaner', '洗洁精', 'detergent'], materials: ['液体', 'liquid', '膏', 'paste', '粉', 'powder'], usages: ['清洁', 'cleaning', '洗涤', 'wash'], chapter: '34', heading: '3401', headingDesc: '肥皂及洗涤剂', description: '肥皂及清洁用品', confidence: 0.80 },

  // === Chapter 48: Paper ===
  { keywords: ['纸', 'paper', '纸巾', 'tissue', '卫生纸', 'toilet paper', '厨房纸', 'paper towel', '笔记本', 'notebook', '便签', 'sticky note'], materials: ['纸', 'paper', '浆', 'pulp'], usages: ['书写', 'write', '清洁', 'clean', '包装', 'packaging'], chapter: '48', heading: '4818', headingDesc: '纸制品', description: '纸及纸制品', confidence: 0.75 },

  // === Chapter 96: Misc ===
  { keywords: ['笔', 'pen', '铅笔', 'pencil', '马克笔', 'marker', '文具', 'stationery'], materials: ['塑料', 'plastic', '金属', 'metal'], usages: ['书写', 'write', '绘画', 'draw'], chapter: '96', heading: '9608', headingDesc: '笔类', description: '笔类及文具', confidence: 0.75 },
  { keywords: ['伞', 'umbrella', '雨伞', '太阳伞', 'parasol'], materials: ['金属', 'metal', '塑料', 'plastic', '布', 'textile'], usages: ['防雨', 'rain', '防晒', 'sun'], chapter: '66', heading: '6601', headingDesc: '伞类', description: '伞及遮阳伞', confidence: 0.80 },
  { keywords: ['钥匙扣', 'keychain', '钥匙链', '钥匙圈'], materials: ['金属', 'metal', '塑料', 'plastic', '皮革', 'leather'], usages: ['收纳', 'storage', '携带', 'carry'], chapter: '73', heading: '7326', headingDesc: '金属小制品', description: '钥匙扣及小金属制品', confidence: 0.65 },
  { keywords: ['打火机', 'lighter'], materials: ['塑料', 'plastic', '金属', 'metal'], usages: ['点火', 'light'], chapter: '96', heading: '9613', headingDesc: '打火机', description: '打火机', confidence: 0.80 },
  { keywords: ['梳子', 'comb', 'brush', '发刷', 'hair brush', '镜子', 'mirror'], materials: ['塑料', 'plastic', '木', 'wood', '金属', 'metal'], usages: ['美容', 'beauty', '梳理', 'grooming'], chapter: '96', heading: '9615', headingDesc: '梳子发刷', description: '梳子、发刷及镜子', confidence: 0.75 },
  { keywords: ['拉链', 'zipper', '纽扣', 'button', '别针', 'pin', '缝纫', 'sewing'], materials: ['金属', 'metal', '塑料', 'plastic'], usages: ['缝纫', 'sewing', '服装配件'], chapter: '96', heading: '9607', headingDesc: '拉链纽扣', description: '拉链、纽扣及缝纫用品', confidence: 0.70 },

  // === Kitchen ===
  { keywords: ['厨具', 'kitchenware', '锅', 'pot', 'pan', '刀具', 'knife', '菜板', 'cutting board', '餐具', 'tableware', '厨刀'], materials: ['不锈钢', 'stainless', '金属', 'metal', '塑料', 'plastic', '木', 'wood'], usages: ['烹饪', 'cook', '厨房', 'kitchen', '餐饮', 'dining'], chapter: '82', heading: '8211', headingDesc: '厨具', description: '厨房用具及刀具', confidence: 0.75 },
  { keywords: ['保温杯', 'thermos', '水杯', 'bottle', '水壶', 'kettle', '杯子', 'cup', '水瓶', 'water bottle'], materials: ['不锈钢', 'stainless', '塑料', 'plastic', '玻璃', 'glass'], usages: ['饮水', 'drink', '保温', 'insulate'], chapter: '73', heading: '7323', headingDesc: '保温容器', description: '保温杯及饮水容器', confidence: 0.70 },

  // === Pet supplies (non-toy) ===
  { keywords: ['宠物窝', 'pet bed', '宠物笼', 'cage', '宠物碗', 'pet bowl', '猫砂', 'cat litter'], materials: ['塑料', 'plastic', '布', 'textile', '金属', 'metal'], usages: ['宠物', 'pet'], chapter: '42', heading: '4201', headingDesc: '宠物用品', description: '宠物用品', confidence: 0.60 },

  // === Beauty tools ===
  { keywords: ['美甲', 'nail', '指甲', '睫毛', 'eyelash', '假发', 'wig', 'hair extensions'], materials: ['塑料', 'plastic', '化纤', 'synthetic', '真人发', 'human hair'], usages: ['美容', 'beauty', '装饰', 'decoration'], chapter: '67', heading: '6704', headingDesc: '美发美甲', description: '假发、美甲及美容用品', confidence: 0.70 },

  // === Medical/Health ===
  { keywords: ['口罩', 'mask', 'face mask', '防护服', 'protective', '手套', 'glove', '手套', 'gloves'], materials: ['无纺布', 'nonwoven', '塑料', 'plastic', '橡胶', 'rubber'], usages: ['防护', 'protection', '医疗', 'medical'], chapter: '63', heading: '6307', headingDesc: '防护用品', description: '口罩及防护用品', confidence: 0.80 },
  { keywords: ['血糖仪', 'glucose', '血压计', 'blood pressure', '体温计', 'thermometer', '按摩器', 'massager'], materials: ['塑料', 'plastic', '电子', 'electronic'], usages: ['医疗', 'medical', '健康', 'health', '监测', 'monitor'], chapter: '90', heading: '9018', headingDesc: '医疗器械', description: '家用医疗设备', confidence: 0.75 },

  // === Bags (Chapter 42) continued ===
  { keywords: ['化妆包', 'cosmetic bag', '洗漱包', 'toiletry bag'], materials: ['尼龙', 'nylon', '聚酯', 'polyester', '皮革', 'leather', '塑料', 'plastic'], usages: ['收纳', 'storage', '旅行', 'travel'], chapter: '42', heading: '4202', headingDesc: '化妆包', description: '化妆包及洗漱包', confidence: 0.75 },

  // === Phone accessories ===
  { keywords: ['手机支架', 'phone stand', '手机座', '手机挂绳', 'phone strap', 'pop socket'], materials: ['塑料', 'plastic', '金属', 'metal', '硅胶', 'silicone'], usages: ['手机配件', 'phone accessory'], chapter: '85', heading: '8517', headingDesc: '手机配件', description: '手机支架及配件', confidence: 0.70 },
  { keywords: ['屏幕保护膜', 'screen protector', '钢化膜', 'tempered glass'], materials: ['玻璃', 'glass', '塑料', 'plastic', '硅胶', 'silicone'], usages: ['保护', 'protection'], chapter: '85', heading: '8517', headingDesc: '手机配件', description: '屏幕保护膜', confidence: 0.70 },
  { keywords: ['自拍杆', 'selfie stick', '三脚架', 'tripod', '手机夹'], materials: ['塑料', 'plastic', '金属', 'metal', '铝', 'aluminum'], usages: ['拍照', 'photo', '摄像', 'video'], chapter: '85', heading: '8525', headingDesc: '自拍杆', description: '自拍杆及手机三脚架', confidence: 0.70 },

  // === Christmas/Holiday ===
  { keywords: ['圣诞', 'christmas', '装饰', 'ornament', '彩灯', 'fairy light', '花环', 'wreath'], materials: ['塑料', 'plastic', '金属', 'metal', '布', 'textile', '玻璃', 'glass'], usages: ['装饰', 'decoration', '节日', 'holiday'], chapter: '95', heading: '9505', headingDesc: '节日装饰', description: '节日装饰品', confidence: 0.75 },
];

// === Engine ===

interface MatchResult {
  entry: ProductEntry;
  keywordMatch: boolean;
  materialMatch: boolean;
  usageMatch: boolean;
  score: number;
  reasons: string[];
}

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function matchesAny(text: string, keywords: string[]): boolean {
  const n = normalize(text);
  return keywords.some((k) => n.includes(normalize(k)));
}

function scoreProduct(
  entry: ProductEntry,
  productName: string,
  material: string,
  usage: string,
): MatchResult {
  const reasons: string[] = [];
  let score = 0;

  // Keyword match (product name)
  const keywordMatch = matchesAny(productName, entry.keywords);
  if (keywordMatch) {
    score += entry.confidence * 0.5;
    reasons.push(`产品名匹配: "${productName}"`);
  }

  // Material match
  const materialMatch = material ? matchesAny(material, entry.materials) : false;
  if (materialMatch) {
    score += 0.15;
    reasons.push(`材质匹配: "${material}"`);
  }

  // Usage match
  const usageMatch = usage ? matchesAny(usage, entry.usages) : false;
  if (usageMatch) {
    score += 0.15;
    reasons.push(`用途匹配: "${usage}"`);
  }

  return { entry, keywordMatch, materialMatch, usageMatch, score: Math.min(score, 1), reasons };
}

/**
 * Classify a product based on its attributes.
 * Returns ranked HS code candidates with confidence scores.
 */
export function classifyProduct(
  productName: string,
  material: string,
  usage: string,
  description?: string,
  /** Extra suggested HS codes from AI vision (used as hints) */
  suggestedCodes?: string[],
): ClassificationResult {
  const notes: string[] = [];

  // Score all product entries
  const results = PRODUCT_MAP
    .map((entry) => scoreProduct(entry, productName, material, usage))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  // Build candidates from top matches
  const seenHeadings = new Set<string>();
  const candidates: HcCandidate[] = [];

  for (const match of results) {
    const heading = match.entry.heading;
    if (seenHeadings.has(heading)) continue;
    seenHeadings.add(heading);
    if (candidates.length >= 5) break;

    const matchStrength = [match.keywordMatch, match.materialMatch, match.usageMatch].filter(Boolean).length;

    candidates.push({
      code: heading,
      code6: heading + '0',
      chapter: match.entry.chapter,
      heading,
      description: match.entry.description,
      confidence: Math.round(match.score * 100) / 100,
      reasons: match.reasons,
      matchStrength,
    });
  }

  // If no rule-based match, try suggested codes from AI as fallback
  if (candidates.length === 0 && suggestedCodes && suggestedCodes.length > 0) {
    for (const code of suggestedCodes) {
      const clean = code.replace(/\D/g, '').slice(0, 6);
      if (clean.length >= 4) {
        const chapter = clean.slice(0, 2);
        const heading = clean.slice(0, 4);
        candidates.push({
          code: heading,
          code6: clean.length === 6 ? clean : heading + '0',
          chapter,
          heading,
          description: `HS ${heading} 类别`,
          confidence: 0.3,
          reasons: [`AI 建议编码: ${clean}`],
          matchStrength: 1,
        });
      }
    }
    notes.push('规则引擎未匹配到产品，使用 AI 建议编码作为参考');
  }

  // Last resort: general fallback
  if (candidates.length === 0) {
    candidates.push({
      code: '85',
      code6: '851830',
      chapter: '85',
      heading: '8518',
      description: '通用电气电子设备',
      confidence: 0.15,
      reasons: ['无法确定具体分类 — 使用通用电子类'],
      matchStrength: 0,
    });
    notes.push('未匹配到具体产品规则，使用通用分类');
  }

  const best = candidates[0];
  const maxConfidence = best?.confidence ?? 0;

  // Overall confidence level
  let confidence: 'high' | 'medium' | 'low';
  if (maxConfidence >= 0.6) confidence = 'high';
  else if (maxConfidence >= 0.3) confidence = 'medium';
  else confidence = 'low';

  if (confidence === 'low') {
    notes.push('置信度较低 — 建议手动确认 HS 编码');
  }

  // Get chapter name
  const chapterName = getChapterNameFallback(best?.chapter);

  return {
    candidates,
    chapter: best?.chapter || '85',
    chapterName,
    bestMatch: best || null,
    confidence,
    notes,
  };
}

/** Chapter name fallback (doesn't depend on other modules) */
function getChapterNameFallback(chapter?: string): string {
  const names: Record<string, string> = {
    '39': '塑料及其制品',
    '42': '皮革制品/箱包',
    '48': '纸及纸制品',
    '61': '针织服装',
    '62': '非针织服装',
    '63': '其他纺织制品',
    '64': '鞋类',
    '66': '伞类',
    '67': '加工羽毛/人发制品',
    '71': '珠宝首饰',
    '73': '钢铁制品',
    '82': '金属工具/刀具',
    '85': '电机电气设备',
    '87': '车辆及其零件',
    '90': '光学医疗仪器',
    '91': '钟表',
    '94': '家具/灯具/寝具',
    '95': '玩具/运动/节日用品',
    '96': '杂项制品',
  };
  return chapter ? (names[chapter] || '其他商品') : '其他商品';
}

/**
 * Get detailed classification confidence explanation.
 * Useful for building trust — shows WHY a code was chosen.
 */
export function getClassificationExplanation(candidate: HcCandidate): string {
  const confidencePct = Math.round(candidate.confidence * 100);
  const level = confidencePct >= 60 ? '高' : confidencePct >= 30 ? '中' : '低';
  return `HS ${candidate.code6} (${candidate.description}) — 置信度 ${confidencePct}% (${level})。原因：${candidate.reasons.join('；')}`;
}
