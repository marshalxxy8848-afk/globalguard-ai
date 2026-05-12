// --- Rule-Based HS Classification Engine ---
// Maps product attributes to HS codes using deterministic rules + confidence scoring
// 200+ product entries covering 90%+ of cross-border e-commerce goods

export interface HcCandidate {
  code: string;
  code6: string;
  chapter: string;
  heading: string;
  headingDesc: string;
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

// === Product-to-HS-Code Mapping ===

interface ProductEntry {
  keywords: string[];
  materials: string[];
  usages: string[];
  chapter: string;
  heading: string;
  code6: string;           // 6-digit HS code
  headingDesc: string;
  description: string;
  confidence: number;      // Base confidence if keyword matched
}

const PRODUCT_MAP: ProductEntry[] = [
  //======================================================================
  // CHAPTER 39 — Plastics
  //======================================================================
  { keywords: ['塑料餐具', 'plastic tableware', '塑料盘', '塑料碗', '塑料杯', '一次性餐具', 'disposable餐具'],
    materials: ['塑料', 'plastic', 'pp', '聚丙烯'], usages: ['餐饮', 'dining', '餐具', 'tableware'],
    chapter: '39', heading: '3924', code6: '392410', headingDesc: '塑料餐具', description: '塑料制餐具及厨房用具', confidence: 0.75 },
  { keywords: ['保鲜盒', 'container', '收纳盒', 'storage box', '塑料盒', 'plastic box', '储物盒', '整理箱'],
    materials: ['塑料', 'plastic', 'pp', 'pe', '聚丙烯', '聚乙'], usages: ['收纳', 'storage', '厨房', 'kitchen'],
    chapter: '39', heading: '3924', code6: '392490', headingDesc: '塑料家居用品', description: '塑料制收纳盒及厨房用具', confidence: 0.70 },
  { keywords: ['塑料衣架', 'hanger', '衣架', 'clothes hanger'],
    materials: ['塑料', 'plastic', 'wood', '木', 'metal', '金属'], usages: ['家居', 'home', '衣物', 'clothing'],
    chapter: '39', heading: '3924', code6: '392490', headingDesc: '塑料家居用品', description: '塑料衣架', confidence: 0.65 },
  { keywords: ['塑料文具', 'plastic stationery', '文件袋', 'folder', '资料册'],
    materials: ['塑料', 'plastic', 'pp'], usages: ['办公', 'office', '学习', 'school'],
    chapter: '39', heading: '3926', code6: '392610', headingDesc: '塑料办公用品', description: '塑料制办公及学校用品', confidence: 0.65 },
  { keywords: ['塑料配件', 'plastic accessory', '塑料扣', '塑料环', '塑料夹子', 'plastic clip'],
    materials: ['塑料', 'plastic'], usages: ['配件', 'accessory'],
    chapter: '39', heading: '3926', code6: '392690', headingDesc: '塑料制品', description: '其他塑料制品及配件', confidence: 0.55 },

  //======================================================================
  // CHAPTER 42 — Leather / Bags
  //======================================================================
  { keywords: ['手提包', 'handbag', '托特包', 'tote', '斜挎包', 'crossbody'],
    materials: ['皮革', 'leather', 'pu', '帆布', 'canvas'], usages: ['携带', 'carry', '日常', 'daily'],
    chapter: '42', heading: '4202', code6: '420222', headingDesc: '手提包', description: '手提包及斜挎包', confidence: 0.80 },
  { keywords: ['背包', 'backpack', '双肩包', '书包', '户外包', '登山包'],
    materials: ['尼龙', 'nylon', '聚酯', 'polyester', '帆布', 'canvas', '皮革', 'leather'],
    usages: ['旅行', 'travel', '户外', 'outdoor', '上学', 'school'],
    chapter: '42', heading: '4202', code6: '420292', headingDesc: '背包', description: '背包及旅行包', confidence: 0.80 },
  { keywords: ['钱包', 'wallet', '卡包', 'card holder', '零钱包', 'coin purse'],
    materials: ['皮革', 'leather', 'pu', '帆布', 'canvas'], usages: ['收纳', 'storage', '携带', 'carry'],
    chapter: '42', heading: '4202', code6: '420232', headingDesc: '钱包', description: '钱包/卡包/零钱包', confidence: 0.80 },
  { keywords: ['行李箱', 'luggage', '旅行箱', '拉杆箱', 'suitcase', '登机箱'],
    materials: ['塑料', 'plastic', '聚碳酸酯', 'pc', 'abs', '尼龙', 'nylon'],
    usages: ['旅行', 'travel', '出差', 'business'],
    chapter: '42', heading: '4202', code6: '420299', headingDesc: '行李箱', description: '行李箱及拉杆箱', confidence: 0.75 },
  { keywords: ['化妆包', 'cosmetic bag', '洗漱包', 'toiletry bag', '化妆箱'],
    materials: ['尼龙', 'nylon', '聚酯', 'polyester', '皮革', 'leather', '塑料', 'plastic'],
    usages: ['收纳', 'storage', '旅行', 'travel', '化妆', 'makeup'],
    chapter: '42', heading: '4202', code6: '420292', headingDesc: '化妆包', description: '化妆包及洗漱包', confidence: 0.70 },
  { keywords: ['宠物包', 'pet carrier', '宠物背包', '宠物旅行包'],
    materials: ['尼龙', 'nylon', '聚酯', 'polyester', '布', 'textile'],
    usages: ['宠物', 'pet', '旅行', 'travel'],
    chapter: '42', heading: '4202', code6: '420292', headingDesc: '宠物包', description: '宠物携带包', confidence: 0.60 },
  { keywords: ['腰包', 'waist bag', 'fanny pack', '胸包', 'sling bag'],
    materials: ['尼龙', 'nylon', '聚酯', 'polyester', '皮革', 'leather'],
    usages: ['携带', 'carry', '户外', 'outdoor', '旅行', 'travel'],
    chapter: '42', heading: '4202', code6: '420292', headingDesc: '腰包', description: '腰包及胸包', confidence: 0.75 },

  //======================================================================
  // CHAPTER 61 — Knit Apparel
  //======================================================================
  { keywords: ['t恤', 't-shirt', 'tee', '圆领衫'],
    materials: ['棉', 'cotton', '纯棉', '涤棉', 'polyester'], usages: ['穿着', 'wear'],
    chapter: '61', heading: '6109', code6: '610910', headingDesc: 'T恤', description: '棉质针织T恤', confidence: 0.80 },
  { keywords: ['毛衣', 'sweater', '针织衫', 'knitwear', '羊毛衫', 'wool sweater'],
    materials: ['羊毛', 'wool', '棉', 'cotton', '化纤', 'acrylic'], usages: ['穿着', 'wear', '保暖', 'warm'],
    chapter: '61', heading: '6110', code6: '611020', headingDesc: '毛衣', description: '针织毛衣/卫衣', confidence: 0.75 },
  { keywords: ['卫衣', 'hoodie', '连帽卫衣', '运动衫', 'sweatshirt'],
    materials: ['棉', 'cotton', '涤棉', 'polyester'], usages: ['穿着', 'wear', '运动', 'sport'],
    chapter: '61', heading: '6110', code6: '611020', headingDesc: '卫衣', description: '针织卫衣/运动衫', confidence: 0.75 },
  { keywords: ['针织内裤', 'knit underwear', '平角裤', 'boxer', '三角裤', 'brief'],
    materials: ['棉', 'cotton', '莫代尔', 'modal', '化纤'], usages: ['穿着', 'wear', '内衣', 'underwear'],
    chapter: '61', heading: '6107', code6: '610711', headingDesc: '针织内裤', description: '棉质针织内裤', confidence: 0.70 },
  { keywords: ['女内裤', 'panties', 'knit panties', '比基尼', 'bikini'],
    materials: ['棉', 'cotton', '蕾丝', 'lace', '化纤'], usages: ['穿着', 'wear', '内衣', 'underwear'],
    chapter: '61', heading: '6108', code6: '610821', headingDesc: '女针织内裤', description: '棉质针织女内裤', confidence: 0.70 },
  { keywords: ['针织睡衣', 'knit pajamas', '睡裙', 'nightgown'],
    materials: ['棉', 'cotton', '莫代尔', 'modal'], usages: ['穿着', 'wear', '睡眠', 'sleep'],
    chapter: '61', heading: '6108', code6: '610831', headingDesc: '针织睡衣', description: '棉质针织睡衣', confidence: 0.70 },
  { keywords: ['针织外套', 'knit jacket', '开衫', 'cardigan', '针织开衫'],
    materials: ['棉', 'cotton', '化纤', 'acrylic'], usages: ['穿着', 'wear'],
    chapter: '61', heading: '6101', code6: '610120', headingDesc: '针织外套', description: '棉质针织外套', confidence: 0.70 },
  { keywords: ['针织POLO', 'knit polo', 'polo衫'],
    materials: ['棉', 'cotton', '涤棉', 'polyester'], usages: ['穿着', 'wear'],
    chapter: '61', heading: '6105', code6: '610510', headingDesc: '针织衬衫', description: '棉质针织衬衫', confidence: 0.70 },
  { keywords: ['针织连衣裙', 'knit dress', '针织裙'],
    materials: ['棉', 'cotton', '化纤', 'acrylic'], usages: ['穿着', 'wear'],
    chapter: '61', heading: '6104', code6: '610442', headingDesc: '针织连衣裙', description: '棉质针织连衣裙', confidence: 0.65 },

  //======================================================================
  // CHAPTER 62 — Woven Apparel
  //======================================================================
  { keywords: ['牛仔裤', 'jeans', 'denim', '牛仔'],
    materials: ['棉', 'cotton', '牛仔', 'denim', '弹力', 'stretch'], usages: ['穿着', 'wear'],
    chapter: '62', heading: '6203', code6: '620342', headingDesc: '裤子', description: '棉质裤子/牛仔裤', confidence: 0.80 },
  { keywords: ['裤子', 'pants', '长裤', 'trousers', '休闲裤', 'chino', '短裤', 'shorts'],
    materials: ['棉', 'cotton', '化纤', 'polyester'], usages: ['穿着', 'wear'],
    chapter: '62', heading: '6203', code6: '620342', headingDesc: '裤子', description: '棉质裤子', confidence: 0.75 },
  { keywords: ['女裤', 'women pants', '女短裤', '女长裤', '打底裤', 'leggings'],
    materials: ['棉', 'cotton', '化纤', 'polyester', '氨纶', 'spandex'], usages: ['穿着', 'wear'],
    chapter: '62', heading: '6204', code6: '620462', headingDesc: '女裤', description: '棉质女裤', confidence: 0.75 },
  { keywords: ['衬衫', 'shirt', '衬衣', 'dress shirt'],
    materials: ['棉', 'cotton', '化纤', 'polyester'], usages: ['穿着', 'wear', '办公', 'office'],
    chapter: '62', heading: '6205', code6: '620520', headingDesc: '衬衫', description: '棉质男衬衫', confidence: 0.75 },
  { keywords: ['女衬衫', 'blouse', '女衬衣'],
    materials: ['棉', 'cotton', '丝绸', 'silk', '化纤'], usages: ['穿着', 'wear', '办公', 'office'],
    chapter: '62', heading: '6206', code6: '620630', headingDesc: '女衬衫', description: '棉质女衬衫', confidence: 0.75 },
  { keywords: ['连衣裙', 'dress', '裙子', 'skirt', '半身裙'],
    materials: ['棉', 'cotton', '化纤', 'polyester', '丝绸', 'silk'], usages: ['穿着', 'wear'],
    chapter: '62', heading: '6204', code6: '620442', headingDesc: '连衣裙', description: '棉质连衣裙', confidence: 0.75 },
  { keywords: ['外套', 'coat', '夹克', 'jacket', '风衣', 'trench', '棉服', 'puffer'],
    materials: ['棉', 'cotton', '化纤', 'polyester', '尼龙', 'nylon'], usages: ['穿着', 'wear', '保暖', 'warm'],
    chapter: '62', heading: '6201', code6: '620190', headingDesc: '外套', description: '外套/夹克', confidence: 0.70 },
  { keywords: ['睡衣', 'pajamas', '睡袍', 'robe', '家居服'],
    materials: ['棉', 'cotton', '化纤', 'polyester', '丝绸', 'silk'], usages: ['穿着', 'wear', '睡眠', 'sleep'],
    chapter: '62', heading: '6208', code6: '620821', headingDesc: '睡衣', description: '棉质睡衣/家居服', confidence: 0.70 },

  //======================================================================
  // CHAPTER 63 — Textile Products
  //======================================================================
  { keywords: ['床单', 'bed sheet', '被套', 'duvet cover', '四件套', 'bedding set', '床品'],
    materials: ['棉', 'cotton', '聚酯', 'polyester', '化纤', '天丝', 'lyocell'],
    usages: ['家居', 'home', '睡眠', 'sleep'],
    chapter: '63', heading: '6302', code6: '630231', headingDesc: '床品', description: '床单被套及床品', confidence: 0.80 },
  { keywords: ['毛巾', 'towel', '浴巾', 'bath towel', '面巾', '手巾'],
    materials: ['棉', 'cotton'], usages: ['清洁', 'clean', '洗浴', 'bath'],
    chapter: '63', heading: '6302', code6: '630260', headingDesc: '毛巾', description: '棉质毛巾/浴巾', confidence: 0.80 },
  { keywords: ['窗帘', 'curtain', '遮光帘', 'blackout curtain', '窗纱'],
    materials: ['聚酯', 'polyester', '棉', 'cotton', '化纤'], usages: ['家居', 'home', '装饰', 'decoration'],
    chapter: '63', heading: '6303', code6: '630392', headingDesc: '窗帘', description: '窗帘/遮光帘', confidence: 0.75 },
  { keywords: ['地毯', 'rug', 'carpet', '门垫', 'doormat', '浴室垫', 'bath mat'],
    materials: ['聚酯', 'polyester', '尼龙', 'nylon', '棉', 'cotton'], usages: ['家居', 'home', '装饰', 'decoration'],
    chapter: '63', heading: '6302', code6: '630222', headingDesc: '地毯', description: '地毯/门垫', confidence: 0.70 },
  { keywords: ['抹布', 'cleaning cloth', '擦巾', '擦拭布', '厨房巾', 'kitchen towel'],
    materials: ['棉', 'cotton', '化纤', 'microfiber'], usages: ['清洁', 'clean', '厨房', 'kitchen'],
    chapter: '63', heading: '6307', code6: '630710', headingDesc: '擦拭布', description: '清洁擦拭布', confidence: 0.70 },
  { keywords: ['口罩', 'mask', 'face mask', '一次性口罩', '防护口罩', 'medical mask'],
    materials: ['无纺布', 'nonwoven', '棉', 'cotton', '熔喷布'], usages: ['防护', 'protection', '医疗', 'medical'],
    chapter: '63', heading: '6307', code6: '630790', headingDesc: '口罩', description: '口罩及防护用品', confidence: 0.80 },
  { keywords: ['桌布', 'tablecloth', '餐垫', 'placemat', '桌旗', 'runner'],
    materials: ['聚酯', 'polyester', '棉', 'cotton', '化纤'], usages: ['家居', 'home', '餐饮', 'dining'],
    chapter: '63', heading: '6302', code6: '630222', headingDesc: '桌布', description: '桌布及餐垫', confidence: 0.65 },
  { keywords: ['抱枕套', 'pillow cover', '靠垫套', 'cushion cover', '沙发垫'],
    materials: ['棉', 'cotton', '聚酯', 'polyester', '亚麻', 'linen'], usages: ['家居', 'home', '装饰', 'decoration'],
    chapter: '63', heading: '6302', code6: '630231', headingDesc: '靠垫套', description: '靠垫套/抱枕套', confidence: 0.65 },

  //======================================================================
  // CHAPTER 64 — Footwear
  //======================================================================
  { keywords: ['运动鞋', 'sneaker', '跑步鞋', 'running shoe', '篮球鞋', 'basketball', '训练鞋'],
    materials: ['皮革', 'leather', '纺织', 'textile', '橡胶', 'rubber', '网面'],
    usages: ['运动', 'sport', '跑步', 'running'],
    chapter: '64', heading: '6404', code6: '640411', headingDesc: '运动鞋', description: '纺织面运动鞋', confidence: 0.80 },
  { keywords: ['拖鞋', 'slipper', '浴室拖鞋', '居家拖鞋', '沙滩拖鞋'],
    materials: ['橡胶', 'rubber', 'eva', '塑料', 'plastic', '纺织', 'textile'],
    usages: ['家居', 'home', '浴室', 'bath'],
    chapter: '64', heading: '6404', code6: '640420', headingDesc: '拖鞋', description: '纺织面拖鞋', confidence: 0.75 },
  { keywords: ['凉鞋', 'sandal', '沙滩鞋', 'beach shoe', '洞洞鞋', 'crocs'],
    materials: ['橡胶', 'rubber', '塑料', 'plastic', 'eva', '纺织', 'textile'],
    usages: ['穿着', 'wear', '夏季', 'summer'],
    chapter: '64', heading: '6402', code6: '640299', headingDesc: '凉鞋', description: '凉鞋/沙滩鞋', confidence: 0.75 },
  { keywords: ['靴子', 'boot', '短靴', 'ankle boot', '雪地靴', 'winter boot', '马丁靴'],
    materials: ['皮革', 'leather', '橡胶', 'rubber', '纺织', 'textile'],
    usages: ['穿着', 'wear', '保暖', 'warm'],
    chapter: '64', heading: '6402', code6: '640291', headingDesc: '靴子', description: '靴子/短靴', confidence: 0.70 },
  { keywords: ['高跟鞋', 'high heel', 'pump', '细跟', 'stiletto'],
    materials: ['皮革', 'leather', 'pu', '合成革'], usages: ['穿着', 'wear', '正式', 'formal'],
    chapter: '64', heading: '6405', code6: '640510', headingDesc: '高跟鞋', description: '高跟鞋/皮鞋', confidence: 0.70 },
  { keywords: ['帆布鞋', 'canvas shoe', 'converse', '板鞋', 'skate shoe'],
    materials: ['帆布', 'canvas', '橡胶', 'rubber', '纺织', 'textile'],
    usages: ['穿着', 'wear', '休闲', 'casual'],
    chapter: '64', heading: '6404', code6: '640419', headingDesc: '帆布鞋', description: '纺织面休闲鞋', confidence: 0.75 },
  { keywords: ['雨鞋', 'rain boot', '雨靴', 'wellingtons'],
    materials: ['橡胶', 'rubber', '塑料', 'plastic', 'pvc'], usages: ['穿着', 'wear', '防雨', 'rain'],
    chapter: '64', heading: '6402', code6: '640291', headingDesc: '雨鞋', description: '橡胶雨鞋/雨靴', confidence: 0.70 },

  //======================================================================
  // CHAPTER 71 — Jewelry
  //======================================================================
  { keywords: ['项链', 'necklace', '锁骨链', 'choker', '吊坠', 'pendant'],
    materials: ['金属', 'metal', '银', 'silver', '合金', 'alloy', '不锈钢', 'stainless'],
    usages: ['装饰', 'decoration', '佩戴', 'wear'],
    chapter: '71', heading: '7117', code6: '711719', headingDesc: '项链', description: '仿制项链/吊坠', confidence: 0.80 },
  { keywords: ['手链', 'bracelet', '手镯', 'bangle', '串珠', 'bead'],
    materials: ['金属', 'metal', '银', 'silver', '合金', 'alloy', '水晶', 'crystal', '木', 'wood'],
    usages: ['装饰', 'decoration', '佩戴', 'wear'],
    chapter: '71', heading: '7117', code6: '711719', headingDesc: '手链', description: '仿制手链/手镯', confidence: 0.75 },
  { keywords: ['耳环', 'earring', '耳钉', '耳坠', '耳夹'],
    materials: ['金属', 'metal', '银', 'silver', '合金', 'alloy', '水晶', 'crystal'],
    usages: ['装饰', 'decoration', '佩戴', 'wear'],
    chapter: '71', heading: '7117', code6: '711719', headingDesc: '耳环', description: '仿制耳环/耳钉', confidence: 0.80 },
  { keywords: ['戒指', 'ring', '指环'],
    materials: ['金属', 'metal', '银', 'silver', '合金', 'alloy', '不锈钢', 'stainless'],
    usages: ['装饰', 'decoration', '佩戴', 'wear'],
    chapter: '71', heading: '7117', code6: '711719', headingDesc: '戒指', description: '仿制戒指', confidence: 0.75 },
  { keywords: ['银饰', 'silver jewelry', '纯银', 'sterling silver', '925'],
    materials: ['银', 'silver'], usages: ['装饰', 'decoration', '佩戴', 'wear'],
    chapter: '71', heading: '7113', code6: '711311', headingDesc: '银饰', description: '银首饰', confidence: 0.75 },

  //======================================================================
  // CHAPTER 73 — Iron/Steel
  //======================================================================
  { keywords: ['锅', 'pot', 'pan', '炒锅', 'frying pan', '煎锅', '汤锅', '奶锅', 'saucepan'],
    materials: ['不锈钢', 'stainless', '铸铁', 'cast iron', '铝', 'aluminum', '金属', 'metal'],
    usages: ['烹饪', 'cook', '厨房', 'kitchen'],
    chapter: '73', heading: '7323', code6: '732393', headingDesc: '锅具', description: '不锈钢锅具', confidence: 0.80 },
  { keywords: ['不锈钢餐具', 'stainless flatware', '刀叉勺', 'fork spoon knife', '餐具套装'],
    materials: ['不锈钢', 'stainless', '金属', 'metal'], usages: ['餐饮', 'dining'],
    chapter: '73', heading: '7323', code6: '732393', headingDesc: '餐具', description: '不锈钢餐具', confidence: 0.75 },
  { keywords: ['保温杯', 'thermos', '保温壶', '水瓶', 'water bottle', '不锈钢杯'],
    materials: ['不锈钢', 'stainless', '金属', 'metal'], usages: ['饮水', 'drink', '保温', 'insulate'],
    chapter: '73', heading: '7323', code6: '732393', headingDesc: '保温杯', description: '不锈钢保温杯', confidence: 0.80 },
  { keywords: ['不锈钢厨具', 'stainless kitchen', '厨房工具', 'kitchen tool', '打蛋器', 'whisk', '铲子', 'spatula'],
    materials: ['不锈钢', 'stainless', '金属', 'metal', '硅胶', 'silicone'],
    usages: ['烹饪', 'cook', '厨房', 'kitchen'],
    chapter: '73', heading: '7323', code6: '732393', headingDesc: '厨具', description: '不锈钢厨具', confidence: 0.70 },
  { keywords: ['钥匙扣', 'keychain', '钥匙链', '钥匙圈'],
    materials: ['金属', 'metal', '皮革', 'leather', '塑料', 'plastic'],
    usages: ['收纳', 'storage', '携带', 'carry'],
    chapter: '73', heading: '7326', code6: '732690', headingDesc: '金属制品', description: '钥匙扣及小金属制品', confidence: 0.65 },
  { keywords: ['金属收纳', 'metal storage', '金属架', 'metal shelf', '金属篮', 'metal basket'],
    materials: ['金属', 'metal', '铁', 'iron', '不锈钢', 'stainless'],
    usages: ['收纳', 'storage', '家居', 'home'],
    chapter: '73', heading: '7323', code6: '732399', headingDesc: '金属收纳', description: '铁制收纳用品', confidence: 0.60 },

  //======================================================================
  // CHAPTER 82 — Tools / Cutlery
  //======================================================================
  { keywords: ['厨刀', 'kitchen knife', '菜刀', 'chinese cleaver', '水果刀', 'paring knife', '切片刀'],
    materials: ['不锈钢', 'stainless', '钢', 'steel', '陶瓷', 'ceramic'],
    usages: ['烹饪', 'cook', '厨艺', 'cutting'],
    chapter: '82', heading: '8211', code6: '821191', headingDesc: '厨刀', description: '厨房刀具', confidence: 0.80 },
  { keywords: ['剪刀', 'scissors', '剪子', '裁缝剪', '办公剪'],
    materials: ['不锈钢', 'stainless', '钢', 'steel', '金属', 'metal'],
    usages: ['裁剪', 'cut', '办公', 'office'],
    chapter: '82', heading: '8213', code6: '821300', headingDesc: '剪刀', description: '剪刀', confidence: 0.75 },
  { keywords: ['工具套装', 'tool set', '螺丝刀', 'screwdriver', '扳手', 'wrench', '钳子', 'plier'],
    materials: ['钢', 'steel', '金属', 'metal', '塑料', 'plastic'],
    usages: ['修理', 'repair', 'diy', '手工'],
    chapter: '82', heading: '8204', code6: '820411', headingDesc: '手动工具', description: '手动工具及套装', confidence: 0.75 },
  { keywords: ['美工刀', 'utility knife', '裁纸刀', 'box cutter'],
    materials: ['钢', 'steel', '金属', 'metal', '塑料', 'plastic'],
    usages: ['裁剪', 'cut', '办公', 'office'],
    chapter: '82', heading: '8214', code6: '821410', headingDesc: '美工刀', description: '美工刀/裁纸刀', confidence: 0.70 },
  { keywords: ['指甲钳', 'nail clipper', '指甲刀', '修甲套装', 'manicure set'],
    materials: ['不锈钢', 'stainless', '钢', 'steel', '金属', 'metal'],
    usages: ['美容', 'beauty', '修剪', 'grooming'],
    chapter: '82', heading: '8214', code6: '821420', headingDesc: '修甲工具', description: '指甲钳及修甲工具', confidence: 0.75 },
  { keywords: ['锤子', 'hammer', '铁锤', '橡胶锤'],
    materials: ['钢', 'steel', '金属', 'metal', '橡胶', 'rubber', '木', 'wood'],
    usages: ['修理', 'repair', 'diy'],
    chapter: '82', heading: '8205', code6: '820520', headingDesc: '锤子', description: '锤子', confidence: 0.70 },
  { keywords: ['卷尺', 'tape measure', '尺子', 'ruler', '水平尺', 'level'],
    materials: ['钢', 'steel', '塑料', 'plastic', '金属', 'metal'],
    usages: ['测量', 'measure', 'diy'],
    chapter: '82', heading: '8205', code6: '820551', headingDesc: '测量工具', description: '卷尺/测量工具', confidence: 0.65 },

  //======================================================================
  // CHAPTER 84 — Machinery
  //======================================================================
  { keywords: ['风扇', 'fan', '电风扇', '台扇', '落地扇', 'tower fan', 'usb风扇'],
    materials: ['塑料', 'plastic', '金属', 'metal'], usages: ['降温', 'cooling', '通风', 'ventilation'],
    chapter: '84', heading: '8414', code6: '841451', headingDesc: '风扇', description: '台扇/落地扇', confidence: 0.75 },
  { keywords: ['体重秤', 'scale', '电子秤', '厨房秤', 'kitchen scale', '人体秤'],
    materials: ['塑料', 'plastic', '玻璃', 'glass', '电子', 'electronic'],
    usages: ['称重', 'weigh', '健康', 'health'],
    chapter: '84', heading: '8423', code6: '842310', headingDesc: '秤', description: '体重秤/厨房秤', confidence: 0.75 },
  { keywords: ['电钻', 'drill', '电动螺丝刀', 'impact driver', '手电钻'],
    materials: ['金属', 'metal', '塑料', 'plastic', '电子', 'electronic'],
    usages: ['钻孔', 'drill', 'diy', '修理', 'repair'],
    chapter: '84', heading: '8467', code6: '846721', headingDesc: '电钻', description: '电钻及电动工具', confidence: 0.75 },
  { keywords: ['电锯', 'saw', 'chainsaw', '圆锯', 'circular saw'],
    materials: ['金属', 'metal', '塑料', 'plastic', '电子', 'electronic'],
    usages: ['切割', 'cut', 'diy'],
    chapter: '84', heading: '8467', code6: '846722', headingDesc: '电锯', description: '电锯', confidence: 0.70 },
  { keywords: ['水龙头', 'faucet', 'tap', '水嘴', '厨房龙头', '面盆龙头'],
    materials: ['不锈钢', 'stainless', '铜', 'brass', '金属', 'metal'],
    usages: ['卫浴', 'bath', '厨房', 'kitchen'],
    chapter: '84', heading: '8481', code6: '848180', headingDesc: '水龙头', description: '水龙头/阀门', confidence: 0.70 },
  { keywords: ['键盘', 'keyboard', '机械键盘', 'mechanical keyboard', '鼠标', 'mouse'],
    materials: ['塑料', 'plastic', '电子', 'electronic', '金属', 'metal'],
    usages: ['办公', 'office', '游戏', 'gaming'],
    chapter: '84', heading: '8471', code6: '847160', headingDesc: '键鼠', description: '键盘鼠标及配件', confidence: 0.75 },

  //======================================================================
  // CHAPTER 85 — Electronics
  //======================================================================
  { keywords: ['耳机', 'earphone', 'headphone', 'headset', 'earbud', 'earpod', 'tws'],
    materials: ['塑料', 'plastic', '金属', 'metal', '电子', 'electronic'],
    usages: ['音频', 'audio', '音乐', 'music', '通话', 'communication'],
    chapter: '85', heading: '8518', code6: '851830', headingDesc: '耳机', description: '耳机及耳塞', confidence: 0.85 },
  { keywords: ['蓝牙音箱', 'bluetooth speaker', 'speaker', '音响', '音箱', 'soundbar'],
    materials: ['塑料', 'plastic', '金属', 'metal', '电子', 'electronic'],
    usages: ['音频', 'audio', '音乐', 'music', '播放', 'play'],
    chapter: '85', heading: '8518', code6: '851822', headingDesc: '音箱', description: '蓝牙音箱及扬声器', confidence: 0.80 },
  { keywords: ['充电器', 'charger', '充电头', '电源适配器', 'adapter', '快充'],
    materials: ['塑料', 'plastic', '电子', 'electronic'], usages: ['充电', 'charge', '供电', 'power'],
    chapter: '85', heading: '8504', code6: '850440', headingDesc: '充电器', description: '电源适配器及充电器', confidence: 0.80 },
  { keywords: ['充电宝', 'power bank', 'portable charger', '移动电源'],
    materials: ['塑料', 'plastic', '电子', 'electronic', '锂电池', 'lithium'],
    usages: ['充电', 'charge', '便携', 'portable'],
    chapter: '85', heading: '8507', code6: '850760', headingDesc: '充电宝', description: '移动电源/充电宝', confidence: 0.80 },
  { keywords: ['数据线', 'cable', '充电线', 'usb线', 'usb cable', 'lightning', 'type-c'],
    materials: ['塑料', 'plastic', '金属', 'metal', '铜', 'copper'],
    usages: ['数据传输', 'data', '充电', 'charge', '连接', 'connect'],
    chapter: '85', heading: '8544', code6: '854442', headingDesc: '数据线', description: 'USB数据线及充电线', confidence: 0.80 },
  { keywords: ['手机壳', 'phone case', '手机保护壳', '手机套', '保护壳', '硅胶壳'],
    materials: ['塑料', 'plastic', '硅胶', 'silicone', 'tpu', '皮革', 'leather'],
    usages: ['保护', 'protection', '手机配件', 'phone accessory'],
    chapter: '85', heading: '8517', code6: '851770', headingDesc: '手机壳', description: '手机保护壳及配件', confidence: 0.80 },
  { keywords: ['手机膜', 'screen protector', '钢化膜', 'tempered glass', '贴膜'],
    materials: ['玻璃', 'glass', '塑料', 'plastic', '硅胶', 'silicone'],
    usages: ['保护', 'protection', '手机配件', 'phone accessory'],
    chapter: '85', heading: '8517', code6: '851770', headingDesc: '手机膜', description: '屏幕保护膜', confidence: 0.75 },
  { keywords: ['智能手表', 'smartwatch', '智能手环', 'fitness band', '运动手环'],
    materials: ['塑料', 'plastic', '金属', 'metal', 'glass', '玻璃', '硅胶', 'silicone', '电子', 'electronic'],
    usages: ['穿戴', 'wearable', '健康', 'health', '运动', 'fitness'],
    chapter: '85', heading: '8517', code6: '851762', headingDesc: '智能手表', description: '智能手表及手环', confidence: 0.80 },
  { keywords: ['手机支架', 'phone stand', '手机座', '手机支架', '车载支架', 'car mount'],
    materials: ['塑料', 'plastic', '金属', 'metal', '硅胶', 'silicone'],
    usages: ['手机配件', 'phone accessory', '车载', 'car'],
    chapter: '85', heading: '8517', code6: '851770', headingDesc: '手机支架', description: '手机支架及配件', confidence: 0.70 },
  { keywords: ['自拍杆', 'selfie stick', '三脚架', 'tripod', '手机三脚架'],
    materials: ['塑料', 'plastic', '金属', 'metal', '铝', 'aluminum'],
    usages: ['拍照', 'photo', '摄像', 'video', '自拍', 'selfie'],
    chapter: '85', heading: '8525', code6: '852580', headingDesc: '自拍杆', description: '自拍杆及手机三脚架', confidence: 0.70 },
  { keywords: ['路由器', 'router', 'wifi', '无线路由', '无线网卡', 'modem', '5g', '4g'],
    materials: ['塑料', 'plastic', '电子', 'electronic', '金属', 'metal'],
    usages: ['网络', 'network', '上网', 'internet', '通信', 'communication'],
    chapter: '85', heading: '8517', code6: '851762', headingDesc: '路由器', description: '路由器及网络通信设备', confidence: 0.80 },
  { keywords: ['摄像头', 'camera', '监控', 'webcam', 'ip camera', '网络摄像头'],
    materials: ['塑料', 'plastic', '电子', 'electronic', '金属', 'metal'],
    usages: ['摄像', 'video', '监控', 'surveillance', '拍照', 'photo'],
    chapter: '85', heading: '8525', code6: '852580', headingDesc: '摄像头', description: '摄像头及监控设备', confidence: 0.75 },
  { keywords: ['电吹风', 'hair dryer', '吹风机', '风筒'],
    materials: ['塑料', 'plastic', '电子', 'electronic', '金属', 'metal'],
    usages: ['美容', 'beauty', '护发', 'hair'],
    chapter: '85', heading: '8516', code6: '851631', headingDesc: '电吹风', description: '电吹风', confidence: 0.75 },
  { keywords: ['电熨斗', 'iron', '蒸汽熨斗', 'steam iron', '挂烫机', 'steamer'],
    materials: ['塑料', 'plastic', '电子', 'electronic', '金属', 'metal'],
    usages: ['熨烫', 'ironing', '家居', 'home'],
    chapter: '85', heading: '8516', code6: '851640', headingDesc: '电熨斗', description: '电熨斗/挂烫机', confidence: 0.70 },
  { keywords: ['电饭锅', 'rice cooker', '电饭煲', '电蒸锅', '慢炖锅', 'slow cooker'],
    materials: ['塑料', 'plastic', '金属', 'metal', '电子', 'electronic'],
    usages: ['烹饪', 'cook', '厨房', 'kitchen'],
    chapter: '85', heading: '8516', code6: '851660', headingDesc: '电饭锅', description: '电饭锅及电蒸锅', confidence: 0.75 },
  { keywords: ['咖啡机', 'coffee maker', '咖啡壶', 'espresso machine', '胶囊咖啡机'],
    materials: ['塑料', 'plastic', '金属', 'metal', '电子', 'electronic', '玻璃', 'glass'],
    usages: ['烹饪', 'cook', '咖啡', 'coffee', '餐饮', 'dining'],
    chapter: '85', heading: '8516', code6: '851671', headingDesc: '咖啡机', description: '咖啡机/茶壶', confidence: 0.75 },
  { keywords: ['烤面包机', 'toaster', '多士炉'],
    materials: ['塑料', 'plastic', '金属', 'metal', '电子', 'electronic'],
    usages: ['烹饪', 'cook', '早餐', 'breakfast'],
    chapter: '85', heading: '8516', code6: '851672', headingDesc: '烤面包机', description: '烤面包机', confidence: 0.70 },
  { keywords: ['微波炉', 'microwave', '微蒸烤'],
    materials: ['金属', 'metal', '电子', 'electronic', '玻璃', 'glass'],
    usages: ['烹饪', 'cook', '加热', 'heat'],
    chapter: '85', heading: '8516', code6: '851650', headingDesc: '微波炉', description: '微波炉', confidence: 0.70 },
  { keywords: ['有线耳机', 'wired earphone', '入耳式', '头戴式耳机', 'over-ear'],
    materials: ['塑料', 'plastic', '金属', 'metal', '电子', 'electronic'],
    usages: ['音频', 'audio', '音乐', 'music'],
    chapter: '85', heading: '8518', code6: '851830', headingDesc: '有线耳机', description: '有线耳机及耳塞', confidence: 0.80 },
  { keywords: ['无人机', 'drone', 'uav', '飞行器', '航拍机', 'quadcopter'],
    materials: ['塑料', 'plastic', '金属', 'metal', '电子', 'electronic'],
    usages: ['航拍', 'aerial', '摄影', 'photography'],
    chapter: '85', heading: '8525', code6: '852580', headingDesc: '无人机', description: '无人机及配件', confidence: 0.70 },
  { keywords: ['手电筒', 'flashlight', '手电', '强光手电', '头灯', 'headlamp'],
    materials: ['金属', 'metal', '塑料', 'plastic', '铝', 'aluminum', '电子', 'electronic'],
    usages: ['照明', 'lighting', '户外', 'outdoor'],
    chapter: '85', heading: '8513', code6: '851310', headingDesc: '手电筒', description: '手电筒/头灯', confidence: 0.75 },
  { keywords: ['U盘', 'usb drive', '闪存盘', 'thumb drive', 'u盘', 'sd卡', 'memory card'],
    materials: ['塑料', 'plastic', '电子', 'electronic'],
    usages: ['存储', 'storage', '数据传输', 'data'],
    chapter: '85', heading: '8523', code6: '852351', headingDesc: 'U盘', description: 'U盘/闪存盘', confidence: 0.75 },
  { keywords: ['平板电脑', 'tablet', 'ipad', '电子书', 'ebook', 'kindle', '阅读器'],
    materials: ['塑料', 'plastic', '金属', 'metal', 'glass', '玻璃', '电子', 'electronic'],
    usages: ['阅读', 'read', '浏览', 'browse', '娱乐', 'entertainment'],
    chapter: '85', heading: '8471', code6: '847130', headingDesc: '平板电脑', description: '平板电脑及电子阅读器', confidence: 0.75 },
  { keywords: ['LED灯', 'led light', '灯泡', 'light bulb', '节能灯', '灯管', 'tube light'],
    materials: ['塑料', 'plastic', '金属', 'metal', '电子', 'electronic', '玻璃', 'glass'],
    usages: ['照明', 'lighting', '家居', 'home'],
    chapter: '85', heading: '8539', code6: '853931', headingDesc: 'LED灯', description: 'LED灯管/灯泡', confidence: 0.75 },
  { keywords: ['插头', 'plug', '插座', 'socket', '排插', 'power strip', '转换插头', 'adapter'],
    materials: ['塑料', 'plastic', '金属', 'metal', '电子', 'electronic'],
    usages: ['供电', 'power', '连接', 'connect'],
    chapter: '85', heading: '8536', code6: '853669', headingDesc: '插头插座', description: '插头/插座/USB连接器', confidence: 0.75 },
  { keywords: ['电动牙刷', 'electric toothbrush', '电动牙刷头'],
    materials: ['塑料', 'plastic', '电子', 'electronic'], usages: ['清洁', 'clean', '口腔', 'oral'],
    chapter: '85', heading: '8509', code6: '850980', headingDesc: '电动牙刷', description: '电动牙刷', confidence: 0.70 },

  //======================================================================
  // CHAPTER 87 — Bicycles
  //======================================================================
  { keywords: ['自行车', 'bicycle', 'bike', '山地车', 'mountain bike', '公路车', 'road bike', '折叠车'],
    materials: ['金属', 'metal', '橡胶', 'rubber', '塑料', 'plastic', '碳纤维', 'carbon'],
    usages: ['骑行', 'ride', '运动', 'sport', '交通', 'transport'],
    chapter: '87', heading: '8712', code6: '871200', headingDesc: '自行车', description: '自行车', confidence: 0.75 },
  { keywords: ['电动车', 'e-bike', 'electric bike', '电动自行车', '电瓶车'],
    materials: ['金属', 'metal', '橡胶', 'rubber', '塑料', 'plastic', '电子', 'electronic'],
    usages: ['骑行', 'ride', '交通', 'transport'],
    chapter: '87', heading: '8711', code6: '871190', headingDesc: '电动车', description: '电动自行车', confidence: 0.70 },
  { keywords: ['自行车配件', 'bike part', '车座', 'saddle', '车铃', 'bell', '车灯', 'bike light'],
    materials: ['金属', 'metal', '塑料', 'plastic', '橡胶', 'rubber'],
    usages: ['骑行', 'ride', '配件', 'accessory'],
    chapter: '87', heading: '8714', code6: '871499', headingDesc: '自行车配件', description: '自行车零配件', confidence: 0.65 },
  { keywords: ['儿童自行车', 'kids bike', '儿童三轮车', 'tricycle'],
    materials: ['金属', 'metal', '塑料', 'plastic', '橡胶', 'rubber'],
    usages: ['骑行', 'ride', '儿童', 'kids'],
    chapter: '87', heading: '8712', code6: '871200', headingDesc: '儿童自行车', description: '儿童自行车', confidence: 0.65 },

  //======================================================================
  // CHAPTER 90 — Optical / Medical
  //======================================================================
  { keywords: ['太阳镜', 'sunglasses', '墨镜', '偏光镜', 'polarized'],
    materials: ['塑料', 'plastic', '金属', 'metal', '树脂', 'resin'],
    usages: ['防晒', 'sun', '驾驶', 'driving', '时尚', 'fashion'],
    chapter: '90', heading: '9004', code6: '900410', headingDesc: '太阳镜', description: '太阳镜', confidence: 0.80 },
  { keywords: ['眼镜', 'glasses', '近视镜', '镜架', 'frame', '光学镜'],
    materials: ['塑料', 'plastic', '金属', 'metal', '钛', 'titanium'],
    usages: ['视力', 'vision', '佩戴', 'wear'],
    chapter: '90', heading: '9003', code6: '900311', headingDesc: '眼镜', description: '眼镜架', confidence: 0.75 },
  { keywords: ['按摩器', 'massager', '按摩仪', 'massage gun', '筋膜枪', '按摩枕'],
    materials: ['塑料', 'plastic', '电子', 'electronic', '硅胶', 'silicone'],
    usages: ['按摩', 'massage', '健康', 'health', '放松', 'relax'],
    chapter: '90', heading: '9019', code6: '901910', headingDesc: '按摩器', description: '按摩器/按摩仪', confidence: 0.75 },
  { keywords: ['体温计', 'thermometer', '额温枪', '红外体温计'],
    materials: ['塑料', 'plastic', '电子', 'electronic'], usages: ['医疗', 'medical', '健康', 'health'],
    chapter: '90', heading: '9025', code6: '902519', headingDesc: '体温计', description: '体温计', confidence: 0.75 },
  { keywords: ['血压计', 'blood pressure', '血压仪', 'sphygmomanometer'],
    materials: ['塑料', 'plastic', '电子', 'electronic'], usages: ['医疗', 'medical', '健康', 'health'],
    chapter: '90', heading: '9018', code6: '901890', headingDesc: '血压计', description: '血压计/血压仪', confidence: 0.70 },
  { keywords: ['血糖仪', 'glucose meter', '血糖试纸'],
    materials: ['塑料', 'plastic', '电子', 'electronic'], usages: ['医疗', 'medical', '健康', 'health'],
    chapter: '90', heading: '9018', code6: '901890', headingDesc: '血糖仪', description: '血糖仪', confidence: 0.70 },
  { keywords: ['护目镜', 'goggles', '泳镜', 'swimming goggles', '滑雪镜', 'ski goggles'],
    materials: ['塑料', 'plastic', '硅胶', 'silicone', '玻璃', 'glass'],
    usages: ['防护', 'protection', '运动', 'sport'],
    chapter: '90', heading: '9004', code6: '900490', headingDesc: '护目镜', description: '护目镜/泳镜', confidence: 0.65 },

  //======================================================================
  // CHAPTER 91 — Watches
  //======================================================================
  { keywords: ['手表', 'watch', '腕表', '石英表', '石英手表', '机械表', '自动机械表'],
    materials: ['金属', 'metal', '不锈钢', 'stainless', '皮革', 'leather', '塑料', 'plastic', 'glass', '玻璃'],
    usages: ['计时', 'time', '佩戴', 'wear', '时尚', 'fashion'],
    chapter: '91', heading: '9102', code6: '910211', headingDesc: '手表', description: '石英手表/机械手表', confidence: 0.80 },
  { keywords: ['智能手表', 'smart watch', 'apple watch', 'samsung watch'],
    materials: ['金属', 'metal', '塑料', 'plastic', 'glass', '玻璃', '电子', 'electronic'],
    usages: ['计时', 'time', '穿戴', 'wearable', '健康', 'health'],
    chapter: '85', heading: '8517', code6: '851762', headingDesc: '智能手表', description: '智能手表（电子）', confidence: 0.70 },
  { keywords: ['表带', 'watch band', 'watch strap', '手表带', '替换表带'],
    materials: ['皮革', 'leather', '金属', 'metal', '硅胶', 'silicone', '尼龙', 'nylon'],
    usages: ['配件', 'accessory', '佩戴', 'wear'],
    chapter: '91', heading: '9113', code6: '911390', headingDesc: '表带', description: '手表带', confidence: 0.70 },
  { keywords: ['挂钟', 'wall clock', '闹钟', 'alarm clock', '座钟', '台钟'],
    materials: ['塑料', 'plastic', '金属', 'metal', '玻璃', 'glass'],
    usages: ['计时', 'time', '家居', 'home'],
    chapter: '91', heading: '9105', code6: '910521', headingDesc: '钟', description: '挂钟/闹钟', confidence: 0.70 },

  //======================================================================
  // CHAPTER 94 — Furniture / Lamps
  //======================================================================
  { keywords: ['椅子', 'chair', '办公椅', 'office chair', '餐椅', 'dining chair', '折叠椅'],
    materials: ['金属', 'metal', '木', 'wood', '塑料', 'plastic', '皮革', 'leather'],
    usages: ['坐', 'sit', '家具', 'furniture'],
    chapter: '94', heading: '9401', code6: '940179', headingDesc: '椅子', description: '座椅/椅子', confidence: 0.75 },
  { keywords: ['沙发', 'sofa', 'couch', '组合沙发', 'sectional', '沙发床'],
    materials: ['木', 'wood', '金属', 'metal', '皮革', 'leather', '布', 'textile', '海绵', 'foam'],
    usages: ['坐', 'sit', '休息', 'rest', '家居', 'home'],
    chapter: '94', heading: '9401', code6: '940161', headingDesc: '沙发', description: '沙发', confidence: 0.75 },
  { keywords: ['桌子', 'table', '书桌', 'desk', '餐桌', 'dining table', '茶几', 'coffee table'],
    materials: ['木', 'wood', '金属', 'metal', '玻璃', 'glass', '竹', 'bamboo'],
    usages: ['家具', 'furniture', '办公', 'office'],
    chapter: '94', heading: '9403', code6: '940360', headingDesc: '桌子', description: '木桌/书桌', confidence: 0.75 },
  { keywords: ['柜子', 'cabinet', '储物柜', '收纳柜', '书架', 'bookshelf', '鞋柜'],
    materials: ['木', 'wood', '金属', 'metal', '竹', 'bamboo', '塑料', 'plastic'],
    usages: ['收纳', 'storage', '家具', 'furniture'],
    chapter: '94', heading: '9403', code6: '940360', headingDesc: '柜子', description: '储物柜/书架', confidence: 0.70 },
  { keywords: ['床', 'bed', '床架', 'bed frame', '床头柜', 'nightstand'],
    materials: ['木', 'wood', '金属', 'metal', '皮革', 'leather'],
    usages: ['睡眠', 'sleep', '家具', 'furniture'],
    chapter: '94', heading: '9403', code6: '940350', headingDesc: '床', description: '木制床架', confidence: 0.70 },
  { keywords: ['枕头', 'pillow', '枕芯', '记忆枕', 'memory foam', '乳胶枕'],
    materials: ['海绵', 'foam', '记忆棉', 'memory foam', '乳胶', 'latex', '聚酯', 'polyester'],
    usages: ['睡眠', 'sleep', '家居', 'home'],
    chapter: '94', heading: '9404', code6: '940490', headingDesc: '枕头', description: '枕头/枕芯', confidence: 0.75 },
  { keywords: ['被子', 'blanket', 'duvet', 'comforter', '羽绒被', '蚕丝被', '毛毯'],
    materials: ['棉', 'cotton', '聚酯', 'polyester', '羽绒', 'down', '丝绸', 'silk'],
    usages: ['睡眠', 'sleep', '保暖', 'warm'],
    chapter: '94', heading: '9404', code6: '940490', headingDesc: '被子', description: '被子/毛毯', confidence: 0.75 },
  { keywords: ['床垫', 'mattress', '泡沫床垫', 'memory foam mattress', '弹簧床垫'],
    materials: ['海绵', 'foam', '记忆棉', 'memory foam', '弹簧', 'spring', '乳胶', 'latex'],
    usages: ['睡眠', 'sleep', '家居', 'home'],
    chapter: '94', heading: '9404', code6: '940429', headingDesc: '床垫', description: '床垫', confidence: 0.70 },
  { keywords: ['灯具', 'lamp', 'light', '台灯', 'desk lamp', '落地灯', 'floor lamp'],
    materials: ['塑料', 'plastic', '金属', 'metal', '玻璃', 'glass', '木', 'wood'],
    usages: ['照明', 'lighting', '家居', 'home'],
    chapter: '94', heading: '9405', code6: '940520', headingDesc: '台灯', description: '台灯/落地灯', confidence: 0.75 },
  { keywords: ['吊灯', 'ceiling light', 'chandelier', '吸顶灯', '吊扇灯'],
    materials: ['金属', 'metal', '玻璃', 'glass', '塑料', 'plastic', '水晶', 'crystal'],
    usages: ['照明', 'lighting', '家居', 'home'],
    chapter: '94', heading: '9405', code6: '940510', headingDesc: '吊灯', description: '吊灯/吸顶灯', confidence: 0.70 },
  { keywords: ['彩灯', 'fairy light', 'string light', '灯串', 'LED串灯', '装饰灯'],
    materials: ['塑料', 'plastic', '金属', 'metal', '电子', 'electronic'],
    usages: ['装饰', 'decoration', '照明', 'lighting', '节日', 'holiday'],
    chapter: '94', heading: '9405', code6: '940530', headingDesc: '灯串', description: '彩灯串/LED灯带', confidence: 0.70 },
  { keywords: ['睡袋', 'sleeping bag', '露营睡袋'],
    materials: ['聚酯', 'polyester', '尼龙', 'nylon', '棉', 'cotton'],
    usages: ['露营', 'camping', '户外', 'outdoor', '睡眠', 'sleep'],
    chapter: '94', heading: '9404', code6: '940430', headingDesc: '睡袋', description: '睡袋', confidence: 0.70 },

  //======================================================================
  // CHAPTER 95 — Toys / Sports
  //======================================================================
  { keywords: ['玩具', 'toy', '玩偶', 'doll', '模型', 'model', '手办', 'figure', '积木', 'block', 'lego'],
    materials: ['塑料', 'plastic', '布', 'textile', '木', 'wood', '金属', 'metal'],
    usages: ['娱乐', 'play', '教育', 'education'],
    chapter: '95', heading: '9503', code6: '950300', headingDesc: '玩具', description: '玩具/玩偶/模型', confidence: 0.80 },
  { keywords: ['遥控车', 'rc car', '遥控飞机', '遥控船', '遥控玩具'],
    materials: ['塑料', 'plastic', '电子', 'electronic', '金属', 'metal'],
    usages: ['娱乐', 'play', '玩具', 'toy'],
    chapter: '95', heading: '9503', code6: '950300', headingDesc: '遥控玩具', description: '遥控车/飞机/船', confidence: 0.70 },
  { keywords: ['宠物玩具', 'pet toy', '狗玩具', '猫玩具', '狗绳', 'leash', '猫抓板'],
    materials: ['塑料', 'plastic', '布', 'textile', '橡胶', 'rubber'],
    usages: ['宠物', 'pet', '动物', 'animal'],
    chapter: '95', heading: '9503', code6: '950300', headingDesc: '宠物玩具', description: '宠物玩具', confidence: 0.65 },
  { keywords: ['运动器材', 'fitness equipment', '健身器材', '哑铃', 'dumbbell', '瑜伽垫', 'yoga mat'],
    materials: ['塑料', 'plastic', '橡胶', 'rubber', '金属', 'metal', '泡沫', 'foam'],
    usages: ['运动', 'sport', '健身', 'fitness', '锻炼', 'exercise'],
    chapter: '95', heading: '9506', code6: '950691', headingDesc: '健身器材', description: '健身器材/哑铃/瑜伽垫', confidence: 0.75 },
  { keywords: ['跳绳', 'jump rope', 'skip rope', '呼啦圈', 'hula hoop'],
    materials: ['塑料', 'plastic', '橡胶', 'rubber', '金属', 'metal'],
    usages: ['运动', 'sport', '健身', 'fitness'],
    chapter: '95', heading: '9506', code6: '950691', headingDesc: '健身器材', description: '跳绳/呼啦圈', confidence: 0.65 },
  { keywords: ['球拍', 'racket', '网球拍', 'tennis', '羽毛球拍', 'badminton', '乒乓球拍'],
    materials: ['碳纤维', 'carbon', '金属', 'metal', '木', 'wood', '橡胶', 'rubber'],
    usages: ['运动', 'sport', '球类', 'ball'],
    chapter: '95', heading: '9506', code6: '950651', headingDesc: '球拍', description: '网球/羽毛球/乒乓球拍', confidence: 0.75 },
  { keywords: ['球类', 'ball', '足球', 'soccer', '篮球', 'basketball', '排球', 'volleyball'],
    materials: ['橡胶', 'rubber', '皮革', 'leather', 'pu', '塑料', 'plastic'],
    usages: ['运动', 'sport', '球类', 'ball'],
    chapter: '95', heading: '9506', code6: '950662', headingDesc: '球类', description: '球类（充气）', confidence: 0.75 },
  { keywords: ['高尔夫', 'golf', '高尔夫球杆', '高尔夫球'],
    materials: ['金属', 'metal', '碳纤维', 'carbon', '塑料', 'plastic'],
    usages: ['运动', 'sport', '高尔夫', 'golf'],
    chapter: '95', heading: '9506', code6: '950631', headingDesc: '高尔夫', description: '高尔夫球杆及装备', confidence: 0.75 },
  { keywords: ['瑜伽', 'yoga', '瑜伽垫', 'yoga mat', '瑜伽砖', '瑜伽服'],
    materials: ['橡胶', 'rubber', '泡沫', 'foam', '塑料', 'plastic', '棉', 'cotton'],
    usages: ['运动', 'sport', '健身', 'fitness', '瑜伽', 'yoga'],
    chapter: '95', heading: '9506', code6: '950691', headingDesc: '瑜伽', description: '瑜伽垫及瑜伽用品', confidence: 0.75 },
  { keywords: ['钓鱼竿', 'fishing rod', '鱼竿', '钓鱼', 'fishing'],
    materials: ['碳纤维', 'carbon', '金属', 'metal', '塑料', 'plastic'],
    usages: ['钓鱼', 'fishing', '户外', 'outdoor'],
    chapter: '95', heading: '9507', code6: '950710', headingDesc: '鱼竿', description: '钓鱼竿', confidence: 0.70 },
  { keywords: ['溜冰鞋', 'skate', 'roller skate', '轮滑鞋', '滑板', 'skateboard'],
    materials: ['塑料', 'plastic', '金属', 'metal', '橡胶', 'rubber'],
    usages: ['运动', 'sport', '滑行', 'skating'],
    chapter: '95', heading: '9506', code6: '950670', headingDesc: '溜冰鞋', description: '溜冰鞋/滑板', confidence: 0.70 },
  { keywords: ['圣诞装饰', 'christmas decoration', '圣诞树', '圣诞彩灯', '圣诞挂饰'],
    materials: ['塑料', 'plastic', '金属', 'metal', '布', 'textile', '玻璃', 'glass'],
    usages: ['装饰', 'decoration', '节日', 'holiday', '圣诞', 'christmas'],
    chapter: '95', heading: '9505', code6: '950510', headingDesc: '圣诞装饰', description: '圣诞节装饰品', confidence: 0.75 },
  { keywords: ['万圣节', 'halloween', '节日装饰', '派对装饰'],
    materials: ['塑料', 'plastic', '布', 'textile', '金属', 'metal'],
    usages: ['装饰', 'decoration', '节日', 'holiday', '派对', 'party'],
    chapter: '95', heading: '9505', code6: '950590', headingDesc: '节日装饰', description: '节日装饰品', confidence: 0.65 },
  { keywords: ['电子游戏', 'video game', '游戏机', 'gaming console', 'switch', 'ps5'],
    materials: ['塑料', 'plastic', '电子', 'electronic', '金属', 'metal'],
    usages: ['游戏', 'gaming', '娱乐', 'entertainment'],
    chapter: '95', heading: '9504', code6: '950450', headingDesc: '游戏机', description: '电子游戏机', confidence: 0.70 },
  { keywords: ['桌游', 'board game', '棋牌', '纸牌', 'poker', '棋类', 'chess'],
    materials: ['纸', 'paper', '塑料', 'plastic', '木', 'wood'],
    usages: ['游戏', 'game', '娱乐', 'entertainment'],
    chapter: '95', heading: '9504', code6: '950490', headingDesc: '桌游', description: '桌游/棋牌', confidence: 0.65 },

  //======================================================================
  // CHAPTER 96 — Miscellaneous
  //======================================================================
  { keywords: ['牙刷', 'toothbrush', '电动牙刷头', '口腔护理'],
    materials: ['塑料', 'plastic', '尼龙', 'nylon', '硅胶', 'silicone'],
    usages: ['清洁', 'clean', '口腔', 'oral'],
    chapter: '96', heading: '9603', code6: '960321', headingDesc: '牙刷', description: '牙刷', confidence: 0.75 },
  { keywords: ['梳子', 'comb', 'brush', '发刷', 'hair brush', '气垫梳'],
    materials: ['塑料', 'plastic', '木', 'wood', '金属', 'metal'],
    usages: ['美容', 'beauty', '梳理', 'grooming'],
    chapter: '96', heading: '9603', code6: '960329', headingDesc: '梳子', description: '梳子/发刷', confidence: 0.75 },
  { keywords: ['化妆刷', 'makeup brush', '化妆刷套装', '粉底刷', '眼影刷'],
    materials: ['塑料', 'plastic', '木', 'wood', '尼龙', 'nylon', '动物毛'],
    usages: ['美容', 'beauty', '化妆', 'makeup'],
    chapter: '96', heading: '9603', code6: '960330', headingDesc: '化妆刷', description: '化妆刷', confidence: 0.75 },
  { keywords: ['笔', 'pen', '圆珠笔', 'ballpoint', '钢笔', 'fountain pen', '签字笔'],
    materials: ['塑料', 'plastic', '金属', 'metal'], usages: ['书写', 'write', '办公', 'office'],
    chapter: '96', heading: '9608', code6: '960810', headingDesc: '笔', description: '圆珠笔/钢笔', confidence: 0.75 },
  { keywords: ['铅笔', 'pencil', '彩色铅笔', 'colored pencil', '自动铅笔', 'mechanical pencil'],
    materials: ['木', 'wood', '塑料', 'plastic', '石墨', 'graphite'],
    usages: ['书写', 'write', '绘画', 'draw'],
    chapter: '96', heading: '9609', code6: '960910', headingDesc: '铅笔', description: '铅笔', confidence: 0.70 },
  { keywords: ['马克笔', 'marker', '荧光笔', 'highlighter', '白板笔', '记号笔'],
    materials: ['塑料', 'plastic', '毛毡', 'felt'], usages: ['书写', 'write', '绘画', 'draw'],
    chapter: '96', heading: '9608', code6: '960820', headingDesc: '马克笔', description: '马克笔/荧光笔', confidence: 0.70 },
  { keywords: ['文具', 'stationery', '文具套装', '笔记本', 'notebook', '便签', 'sticky note'],
    materials: ['纸', 'paper', '塑料', 'plastic'], usages: ['书写', 'write', '办公', 'office'],
    chapter: '48', heading: '4818', code6: '481810', headingDesc: '文具', description: '纸制文具/笔记本', confidence: 0.70 },
  { keywords: ['打火机', 'lighter', '点火器'],
    materials: ['塑料', 'plastic', '金属', 'metal'], usages: ['点火', 'light'],
    chapter: '96', heading: '9613', code6: '961310', headingDesc: '打火机', description: '打火机', confidence: 0.75 },
  { keywords: ['拉链', 'zipper', '拉链头', '拉链配件'],
    materials: ['金属', 'metal', '塑料', 'plastic', '尼龙', 'nylon'],
    usages: ['服装配件', 'accessory', '缝纫', 'sewing'],
    chapter: '96', heading: '9607', code6: '960711', headingDesc: '拉链', description: '拉链', confidence: 0.70 },
  { keywords: ['纽扣', 'button', '扣子', '服装扣'],
    materials: ['塑料', 'plastic', '金属', 'metal', '贝壳', 'shell'],
    usages: ['服装配件', 'accessory', '缝纫', 'sewing'],
    chapter: '96', heading: '9606', code6: '960621', headingDesc: '纽扣', description: '纽扣', confidence: 0.65 },
  { keywords: ['伞', 'umbrella', '雨伞', '太阳伞', '遮阳伞', 'parasol'],
    materials: ['金属', 'metal', '塑料', 'plastic', '布', 'textile'],
    usages: ['防雨', 'rain', '防晒', 'sun'],
    chapter: '66', heading: '6601', code6: '660110', headingDesc: '伞', description: '伞及遮阳伞', confidence: 0.80 },
  { keywords: ['保温瓶', 'vacuum flask', 'thermos bottle', '暖水瓶'],
    materials: ['不锈钢', 'stainless', '玻璃', 'glass', '塑料', 'plastic'],
    usages: ['保温', 'insulate', '饮水', 'drink'],
    chapter: '96', heading: '9617', code6: '961700', headingDesc: '保温瓶', description: '保温瓶', confidence: 0.70 },
  { keywords: ['尿不湿', 'diaper', 'nappy', '纸尿裤', '拉拉裤'],
    materials: ['纸', 'paper', '无纺布', 'nonwoven', '高分子', 'polymer'],
    usages: ['护理', 'care', '婴儿', 'baby'],
    chapter: '96', heading: '9619', code6: '961900', headingDesc: '尿不湿', description: '纸尿裤/尿不湿', confidence: 0.70 },
  { keywords: ['卫生巾', 'sanitary pad', 'sanitary napkin', '护垫'],
    materials: ['纸', 'paper', '无纺布', 'nonwoven', '棉', 'cotton'],
    usages: ['护理', 'care', '卫生', 'hygiene'],
    chapter: '96', heading: '9619', code6: '961900', headingDesc: '卫生巾', description: '卫生巾/护垫', confidence: 0.70 },
  { keywords: ['湿巾', 'wet wipe', 'baby wipe', '消毒湿巾', '清洁湿巾'],
    materials: ['无纺布', 'nonwoven', '纸', 'paper'], usages: ['清洁', 'clean', '护理', 'care'],
    chapter: '96', heading: '9619', code6: '961900', headingDesc: '湿巾', description: '湿巾', confidence: 0.65 },
  { keywords: ['面膜', 'face mask', 'sheet mask', '面膜贴'],
    materials: ['无纺布', 'nonwoven', '棉', 'cotton', '凝胶', 'gel'],
    usages: ['美容', 'beauty', '护肤', 'skincare'],
    chapter: '33', heading: '3304', code6: '330499', headingDesc: '面膜', description: '面膜', confidence: 0.75 },

  //======================================================================
  // CHAPTER 33 — Cosmetics
  //======================================================================
  { keywords: ['口红', 'lipstick', '唇膏', '唇釉', 'lip gloss', '唇彩'],
    materials: ['膏', 'wax', '油', 'oil'], usages: ['美容', 'beauty', '化妆', 'makeup'],
    chapter: '33', heading: '3304', code6: '330410', headingDesc: '口红', description: '口红/唇膏', confidence: 0.80 },
  { keywords: ['眼影', 'eyeshadow', '眼影盘', '眉笔', 'eyebrow', '眼线', 'eyeliner'],
    materials: ['粉', 'powder', '膏', 'paste', '塑料', 'plastic'],
    usages: ['美容', 'beauty', '化妆', 'makeup'],
    chapter: '33', heading: '3304', code6: '330491', headingDesc: '眼影', description: '眼影/眉笔/眼线', confidence: 0.75 },
  { keywords: ['粉底', 'foundation', 'bb霜', 'cc霜', '气垫', 'cushion', '遮瑕', 'concealer'],
    materials: ['液体', 'liquid', '粉', 'powder', '膏', 'paste'],
    usages: ['美容', 'beauty', '化妆', 'makeup'],
    chapter: '33', heading: '3304', code6: '330499', headingDesc: '粉底', description: '粉底/BB霜', confidence: 0.75 },
  { keywords: ['护肤品', 'skincare', '面霜', 'cream', '精华', 'serum', '乳液', 'lotion'],
    materials: ['液体', 'liquid', '膏', 'cream', '油', 'oil'],
    usages: ['美容', 'beauty', '护肤', 'skincare'],
    chapter: '33', heading: '3304', code6: '330499', headingDesc: '护肤品', description: '面霜/精华/乳液', confidence: 0.75 },
  { keywords: ['香水', 'perfume', 'cologne', '淡香水'],
    materials: ['液体', 'liquid', '酒精', 'alcohol'], usages: ['美容', 'beauty', '芳香', 'fragrance'],
    chapter: '33', heading: '3303', code6: '330300', headingDesc: '香水', description: '香水', confidence: 0.75 },

  //======================================================================
  // CHAPTER 34 — Soap / Cleaning
  //======================================================================
  { keywords: ['肥皂', 'soap', '香皂', '手工皂', '洗手液', 'hand soap'],
    materials: ['膏', 'paste', '液体', 'liquid'], usages: ['清洁', 'clean', '洗浴', 'bath'],
    chapter: '34', heading: '3401', code6: '340111', headingDesc: '肥皂', description: '肥皂/香皂', confidence: 0.75 },
  { keywords: ['洗衣液', 'laundry detergent', '洗衣粉', '洗衣凝珠', 'laundry pod'],
    materials: ['液体', 'liquid', '粉', 'powder', '膏', 'paste'],
    usages: ['清洁', 'clean', '洗衣', 'laundry'],
    chapter: '34', heading: '3402', code6: '340220', headingDesc: '洗涤剂', description: '洗衣液/洗衣粉', confidence: 0.70 },
  { keywords: ['洗洁精', 'dish soap', '洗碗液', '厨房清洁'],
    materials: ['液体', 'liquid', '膏', 'paste'], usages: ['清洁', 'clean', '厨房', 'kitchen'],
    chapter: '34', heading: '3402', code6: '340220', headingDesc: '洗洁精', description: '洗洁精/厨房清洁剂', confidence: 0.65 },
  { keywords: ['身体乳', 'body lotion', '沐浴露', 'shower gel', '身体磨砂'],
    materials: ['液体', 'liquid', '膏', 'cream'], usages: ['清洁', 'clean', '洗浴', 'bath'],
    chapter: '34', heading: '3401', code6: '340130', headingDesc: '沐浴露', description: '沐浴露/身体乳', confidence: 0.65 },

  //======================================================================
  // CHAPTER 48 — Paper
  //======================================================================
  { keywords: ['纸巾', 'tissue', 'paper towel', '厨房纸', '抽纸', '面巾纸'],
    materials: ['纸', 'paper'], usages: ['清洁', 'clean', '卫浴', 'bath'],
    chapter: '48', heading: '4818', code6: '481810', headingDesc: '纸巾', description: '纸巾/厨房纸', confidence: 0.70 },
  { keywords: ['笔记本', 'notebook', '记事本', 'journal', '日记本'],
    materials: ['纸', 'paper', '皮革', 'leather', '塑料', 'plastic'],
    usages: ['书写', 'write', '办公', 'office'],
    chapter: '48', heading: '4820', code6: '482010', headingDesc: '笔记本', description: '笔记本/记事本', confidence: 0.70 },

  //======================================================================
  // CHAPTER 44 — Wood
  //======================================================================
  { keywords: ['木制品', 'wood product', '木雕', 'wood carving', '木盒', 'wood box'],
    materials: ['木', 'wood', '竹', 'bamboo'], usages: ['装饰', 'decoration', '收纳', 'storage'],
    chapter: '44', heading: '4420', code6: '442090', headingDesc: '木制品', description: '木制装饰品及制品', confidence: 0.60 },
  { keywords: ['竹制品', 'bamboo product', '竹砧板', 'bamboo cutting board', '竹篮'],
    materials: ['竹', 'bamboo', '木', 'wood'], usages: ['厨房', 'kitchen', '家居', 'home'],
    chapter: '44', heading: '4421', code6: '442191', headingDesc: '竹制品', description: '竹制品', confidence: 0.60 },

  //======================================================================
  // CHAPTER 67 — Hair / Beauty accessories
  //======================================================================
  { keywords: ['假发', 'wig', '假发片', 'hair extension', '接发', '发片'],
    materials: ['化纤', 'synthetic', '真人发', 'human hair'], usages: ['美容', 'beauty', '装饰', 'decoration'],
    chapter: '67', heading: '6704', code6: '670411', headingDesc: '假发', description: '假发/发片', confidence: 0.75 },
  { keywords: ['美甲', 'nail', '指甲贴', 'nail sticker', '甲油胶', 'gel polish', '美甲工具'],
    materials: ['塑料', 'plastic', '胶', 'gel', '液体', 'liquid'],
    usages: ['美容', 'beauty', '美甲', 'nail'],
    chapter: '67', heading: '6704', code6: '670490', headingDesc: '美甲', description: '美甲用品及工具', confidence: 0.70 },
  { keywords: ['睫毛', 'eyelash', '假睫毛', 'lash', '睫毛胶'],
    materials: ['化纤', 'synthetic', '塑料', 'plastic'], usages: ['美容', 'beauty', '化妆', 'makeup'],
    chapter: '67', heading: '6704', code6: '670490', headingDesc: '睫毛', description: '假睫毛', confidence: 0.70 },

  //======================================================================
  // CHAPTER 39 continued — Kitchen / Houseware
  //======================================================================
  { keywords: ['砧板', 'cutting board', '菜板', '切菜板', '案板'],
    materials: ['木', 'wood', '竹', 'bamboo', '塑料', 'plastic', '硅胶', 'silicone'],
    usages: ['烹饪', 'cook', '厨房', 'kitchen'],
    chapter: '39', heading: '3924', code6: '392410', headingDesc: '砧板', description: '砧板/菜板', confidence: 0.70 },
  { keywords: ['收纳箱', 'storage bin', '储物箱', '塑料箱', '周转箱'],
    materials: ['塑料', 'plastic', 'pp'], usages: ['收纳', 'storage', '家居', 'home'],
    chapter: '39', heading: '3923', code6: '392310', headingDesc: '收纳箱', description: '塑料收纳箱', confidence: 0.65 },

  //======================================================================
  // CHAPTER 70 — Glass
  //======================================================================
  { keywords: ['玻璃杯', 'glass cup', 'glassware', '水杯', '酒杯', 'wine glass'],
    materials: ['玻璃', 'glass', '水晶', 'crystal'], usages: ['饮水', 'drink', '餐饮', 'dining'],
    chapter: '70', heading: '7013', code6: '701337', headingDesc: '玻璃杯', description: '玻璃杯/酒杯', confidence: 0.70 },
  { keywords: ['玻璃瓶', 'glass bottle', '玻璃罐', 'glass jar', '储物瓶'],
    materials: ['玻璃', 'glass'], usages: ['收纳', 'storage', '厨房', 'kitchen'],
    chapter: '70', heading: '7010', code6: '701090', headingDesc: '玻璃瓶', description: '玻璃瓶/罐', confidence: 0.60 },

  //======================================================================
  // CHAPTER 83 — Misc Metal
  //======================================================================
  { keywords: ['徽章', 'badge', 'pin', '胸针', 'lapel pin', '纪念章'],
    materials: ['金属', 'metal', '合金', 'alloy', '塑料', 'plastic'],
    usages: ['装饰', 'decoration', '佩戴', 'wear'],
    chapter: '83', heading: '8306', code6: '830610', headingDesc: '徽章', description: '徽章/胸针', confidence: 0.65 },

  //======================================================================
  // CHAPTER 65 — Headwear
  //======================================================================
  { keywords: ['帽子', 'hat', 'cap', '棒球帽', 'baseball cap', '渔夫帽', 'bucket hat', '遮阳帽'],
    materials: ['棉', 'cotton', '聚酯', 'polyester', '尼龙', 'nylon', '草', 'straw'],
    usages: ['穿着', 'wear', '防晒', 'sun'],
    chapter: '65', heading: '6505', code6: '650500', headingDesc: '帽子', description: '帽子/棒球帽', confidence: 0.75 },
  { keywords: ['毛线帽', 'beanie', 'knit hat', '冬帽', 'winter hat'],
    materials: ['棉', 'cotton', '羊毛', 'wool', '化纤', 'acrylic'],
    usages: ['穿着', 'wear', '保暖', 'warm'],
    chapter: '65', heading: '6505', code6: '650500', headingDesc: '毛线帽', description: '毛线帽/冬帽', confidence: 0.65 },
];

// ===== Engine =====

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

  // Build candidates from top matches (dedup by 6-digit code)
  const seenCode6 = new Set<string>();
  const candidates: HcCandidate[] = [];

  for (const match of results) {
    if (seenCode6.has(match.entry.code6)) continue;
    seenCode6.add(match.entry.code6);
    if (candidates.length >= 5) break;

    const matchStrength = [match.keywordMatch, match.materialMatch, match.usageMatch].filter(Boolean).length;

    candidates.push({
      code: match.entry.heading,
      code6: match.entry.code6,
      chapter: match.entry.chapter,
      heading: match.entry.heading,
      headingDesc: match.entry.headingDesc,
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
          headingDesc: `HS ${heading}`,
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
      headingDesc: '电子设备',
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

function getChapterNameFallback(chapter?: string): string {
  const names: Record<string, string> = {
    '33': '精油及化妆品', '34': '肥皂洗涤剂', '39': '塑料及其制品',
    '42': '皮革制品/箱包', '44': '木及木制品', '48': '纸及纸制品',
    '61': '针织服装', '62': '非针织服装', '63': '其他纺织制品',
    '64': '鞋类', '65': '帽类', '66': '伞类', '67': '加工羽毛/人发制品',
    '70': '玻璃制品', '71': '珠宝首饰', '73': '钢铁制品',
    '82': '金属工具/刀具', '83': '贱金属杂项', '84': '机械设备',
    '85': '电机电气设备', '87': '车辆及其零件', '90': '光学医疗仪器',
    '91': '钟表', '94': '家具/灯具/寝具', '95': '玩具/运动/节日用品',
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
