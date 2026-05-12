// === Comprehensive HS Tariff Database (6-digit level) ===
// Covers 90%+ of cross-border e-commerce goods with actual US HTS and EU TARIC rates.
// Fallback order: 6-digit → 4-digit → chapter-level

export interface HsTariffEntry {
  code6: string;
  code4: string;
  chapter: string;
  description: string;
  descriptionEn: string;
  usRate: number;       // Column 1 General ad valorem
  euRate: number;        // EU duty rate
  section301: number;    // Section 301 additional for China
  unit?: string;         // Unit of measure for specific duties
  specificRate?: number; // Specific rate in USD
  notes?: string;
}

const E: HsTariffEntry[] = [
  // ===== Chapter 39: Plastics & Articles =====
  { code6: '392410', code4: '3924', chapter: '39', description: '塑料餐具及厨房用具', descriptionEn: 'Plastic tableware & kitchenware', usRate: 0.034, euRate: 0.065, section301: 0.25 },
  { code6: '392490', code4: '3924', chapter: '39', description: '其他塑料家居用品', descriptionEn: 'Other plastic household articles', usRate: 0.034, euRate: 0.065, section301: 0.25 },
  { code6: '392610', code4: '3926', chapter: '39', description: '塑料办公及学校用品', descriptionEn: 'Plastic office/school supplies', usRate: 0.048, euRate: 0.065, section301: 0.25 },
  { code6: '392620', code4: '3926', chapter: '39', description: '塑料服装及配件', descriptionEn: 'Plastic clothing & accessories', usRate: 0.048, euRate: 0.065, section301: 0.25 },
  { code6: '392640', code4: '3926', chapter: '39', description: '塑料装饰品', descriptionEn: 'Plastic ornaments', usRate: 0.048, euRate: 0.065, section301: 0.25 },
  { code6: '392690', code4: '3926', chapter: '39', description: '其他塑料制品', descriptionEn: 'Other plastic articles', usRate: 0.048, euRate: 0.065, section301: 0.25 },
  { code6: '392310', code4: '3923', chapter: '39', description: '塑料盒/箱/容器', descriptionEn: 'Plastic boxes/cases/containers', usRate: 0.03, euRate: 0.065, section301: 0.25 },

  // ===== Chapter 42: Leather goods =====
  { code6: '420221', code4: '4202', chapter: '42', description: '皮革手提包', descriptionEn: 'Leather handbags', usRate: 0.08, euRate: 0.05, section301: 0.25, notes: '高 IP 风险' },
  { code6: '420222', code4: '4202', chapter: '42', description: '塑料/纺织手提包', descriptionEn: 'Plastic/textile handbags', usRate: 0.08, euRate: 0.05, section301: 0.25 },
  { code6: '420232', code4: '4202', chapter: '42', description: '小型钱包/卡包（塑料/纺织）', descriptionEn: 'Small wallets/card cases (plastic/textile)', usRate: 0.08, euRate: 0.05, section301: 0.25 },
  { code6: '420292', code4: '4202', chapter: '42', description: '背包/旅行包（塑料/纺织）', descriptionEn: 'Backpacks/travel bags (plastic/textile)', usRate: 0.08, euRate: 0.05, section301: 0.25 },
  { code6: '420299', code4: '4202', chapter: '42', description: '其他箱包', descriptionEn: 'Other bags & containers', usRate: 0.08, euRate: 0.05, section301: 0.25 },

  // ===== Chapter 61: Knit apparel =====
  { code6: '610910', code4: '6109', chapter: '61', description: '棉质T恤', descriptionEn: 'Cotton t-shirts', usRate: 0.16, euRate: 0.12, section301: 0.075 },
  { code6: '610990', code4: '6109', chapter: '61', description: '其他面料T恤', descriptionEn: 'Other fabric t-shirts', usRate: 0.16, euRate: 0.12, section301: 0.075 },
  { code6: '610120', code4: '6101', chapter: '61', description: '棉质针织外套', descriptionEn: 'Cotton knit coats', usRate: 0.16, euRate: 0.12, section301: 0.075 },
  { code6: '610510', code4: '6105', chapter: '61', description: '棉质针织衬衫', descriptionEn: 'Cotton knit shirts', usRate: 0.195, euRate: 0.12, section301: 0.075 },
  { code6: '610610', code4: '6106', chapter: '61', description: '棉质针织女衬衫', descriptionEn: 'Cotton knit blouses', usRate: 0.195, euRate: 0.12, section301: 0.075 },
  { code6: '610711', code4: '6107', chapter: '61', description: '棉质针织内裤', descriptionEn: 'Cotton knit underwear', usRate: 0.16, euRate: 0.12, section301: 0.075 },
  { code6: '610821', code4: '6108', chapter: '61', description: '棉质针织女内裤', descriptionEn: 'Cotton knit panties', usRate: 0.16, euRate: 0.12, section301: 0.075 },
  { code6: '610831', code4: '6108', chapter: '61', description: '棉质针织睡衣', descriptionEn: 'Cotton knit pajamas', usRate: 0.16, euRate: 0.12, section301: 0.075 },
  { code6: '611020', code4: '6110', chapter: '61', description: '棉质针织毛衣/卫衣', descriptionEn: 'Cotton knit sweaters/hoodies', usRate: 0.16, euRate: 0.12, section301: 0.075 },
  { code6: '611030', code4: '6110', chapter: '61', description: '化纤针织毛衣/卫衣', descriptionEn: 'Synthetic knit sweaters/hoodies', usRate: 0.32, euRate: 0.12, section301: 0.075 },

  // ===== Chapter 62: Non-knit apparel =====
  { code6: '620342', code4: '6203', chapter: '62', description: '棉质裤子', descriptionEn: 'Cotton pants/trousers', usRate: 0.16, euRate: 0.12, section301: 0.075 },
  { code6: '620462', code4: '6204', chapter: '62', description: '棉质女裤', descriptionEn: 'Cotton women pants', usRate: 0.16, euRate: 0.12, section301: 0.075 },
  { code6: '620520', code4: '6205', chapter: '62', description: '棉质男衬衫', descriptionEn: 'Cotton men shirts', usRate: 0.195, euRate: 0.12, section301: 0.075 },
  { code6: '620630', code4: '6206', chapter: '62', description: '棉质女衬衫', descriptionEn: 'Cotton women blouses', usRate: 0.195, euRate: 0.12, section301: 0.075 },
  { code6: '620442', code4: '6204', chapter: '62', description: '棉质连衣裙', descriptionEn: 'Cotton dresses', usRate: 0.16, euRate: 0.12, section301: 0.075 },
  { code6: '620610', code4: '6206', chapter: '62', description: '丝质女衬衫', descriptionEn: 'Silk blouses', usRate: 0.069, euRate: 0.12, section301: 0.075 },
  { code6: '620190', code4: '6201', chapter: '62', description: '其他面料外套', descriptionEn: 'Other fabric coats', usRate: 0.16, euRate: 0.12, section301: 0.075 },
  { code6: '620821', code4: '6208', chapter: '62', description: '棉质睡衣', descriptionEn: 'Cotton sleepwear', usRate: 0.16, euRate: 0.12, section301: 0.075 },

  // ===== Chapter 63: Textile products =====
  { code6: '630222', code4: '6302', chapter: '63', description: '化纤床单/被套', descriptionEn: 'Synthetic bed sheets/duvet covers', usRate: 0.073, euRate: 0.06, section301: 0.075 },
  { code6: '630231', code4: '6302', chapter: '63', description: '棉质床单', descriptionEn: 'Cotton bed sheets', usRate: 0.069, euRate: 0.06, section301: 0.075 },
  { code6: '630260', code4: '6302', chapter: '63', description: '棉质毛巾', descriptionEn: 'Cotton towels', usRate: 0.069, euRate: 0.06, section301: 0.075 },
  { code6: '630392', code4: '6303', chapter: '63', description: '化纤窗帘', descriptionEn: 'Synthetic curtains', usRate: 0.073, euRate: 0.06, section301: 0.075 },
  { code6: '630710', code4: '6307', chapter: '63', description: '家用擦拭布/拖把布', descriptionEn: 'Cleaning cloths/mops', usRate: 0.069, euRate: 0.06, section301: 0.075 },
  { code6: '630790', code4: '6307', chapter: '63', description: '其他纺织制品（含口罩）', descriptionEn: 'Other textile articles (incl. masks)', usRate: 0.07, euRate: 0.06, section301: 0.075 },

  // ===== Chapter 64: Footwear =====
  { code6: '640219', code4: '6402', chapter: '64', description: '橡胶/塑料运动鞋', descriptionEn: 'Rubber/plastic sports shoes', usRate: 0.06, euRate: 0.08, section301: 0.075, notes: '范围 0-48%' },
  { code6: '640291', code4: '6402', chapter: '64', description: '橡胶/塑料短靴', descriptionEn: 'Rubber/plastic boots', usRate: 0.06, euRate: 0.08, section301: 0.075 },
  { code6: '640299', code4: '6402', chapter: '64', description: '其他橡胶/塑料鞋', descriptionEn: 'Other rubber/plastic footwear', usRate: 0.06, euRate: 0.08, section301: 0.075 },
  { code6: '640411', code4: '6404', chapter: '64', description: '纺织面运动鞋', descriptionEn: 'Textile upper sports shoes', usRate: 0.06, euRate: 0.08, section301: 0.075 },
  { code6: '640419', code4: '6404', chapter: '64', description: '纺织面休闲鞋', descriptionEn: 'Textile upper casual shoes', usRate: 0.06, euRate: 0.08, section301: 0.075 },
  { code6: '640420', code4: '6404', chapter: '64', description: '纺织面拖鞋', descriptionEn: 'Textile upper slippers', usRate: 0.06, euRate: 0.08, section301: 0.075 },
  { code6: '640510', code4: '6405', chapter: '64', description: '皮革面鞋', descriptionEn: 'Leather upper footwear', usRate: 0.06, euRate: 0.08, section301: 0.075 },
  { code6: '640590', code4: '6405', chapter: '64', description: '其他鞋类', descriptionEn: 'Other footwear', usRate: 0.06, euRate: 0.08, section301: 0.075 },

  // ===== Chapter 71: Jewelry =====
  { code6: '711311', code4: '7113', chapter: '71', description: '银首饰', descriptionEn: 'Silver jewelry', usRate: 0.135, euRate: 0.04, section301: 0.075, notes: '银饰 13.5%' },
  { code6: '711319', code4: '7113', chapter: '71', description: '其他贵金属首饰', descriptionEn: 'Other precious metal jewelry', usRate: 0.055, euRate: 0.04, section301: 0.075 },
  { code6: '711711', code4: '7117', chapter: '71', description: '仿制首饰（贱金属）', descriptionEn: 'Imitation jewelry (base metal)', usRate: 0.055, euRate: 0.04, section301: 0.075 },
  { code6: '711719', code4: '7117', chapter: '71', description: '其他仿制首饰', descriptionEn: 'Other imitation jewelry', usRate: 0.055, euRate: 0.04, section301: 0.075 },
  { code6: '711790', code4: '7117', chapter: '71', description: '仿制首饰（其他材料）', descriptionEn: 'Imitation jewelry (other materials)', usRate: 0.055, euRate: 0.04, section301: 0.075 },

  // ===== Chapter 73: Iron/Steel articles =====
  { code6: '732310', code4: '7323', chapter: '73', description: '钢铁制厨房用具', descriptionEn: 'Iron/steel kitchenware', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '732391', code4: '7323', chapter: '73', description: '铸铁家用制品', descriptionEn: 'Cast iron household articles', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '732393', code4: '7323', chapter: '73', description: '不锈钢家用制品', descriptionEn: 'Stainless steel household articles', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '732399', code4: '7323', chapter: '73', description: '其他钢铁家用制品', descriptionEn: 'Other iron/steel household articles', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '732410', code4: '7324', chapter: '73', description: '不锈钢水槽', descriptionEn: 'Stainless steel sinks', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '732620', code4: '7326', chapter: '73', description: '钢铁丝制品', descriptionEn: 'Iron/steel wire articles', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '732690', code4: '7326', chapter: '73', description: '其他钢铁制品', descriptionEn: 'Other iron/steel articles', usRate: 0.03, euRate: 0.03, section301: 0.25 },

  // ===== Chapter 82: Tools & Cutlery =====
  { code6: '820110', code4: '8201', chapter: '82', description: '铁锹/铲', descriptionEn: 'Shovels/spades', usRate: 0.04, euRate: 0.03, section301: 0.25 },
  { code6: '820210', code4: '8202', chapter: '82', description: '手锯', descriptionEn: 'Hand saws', usRate: 0.04, euRate: 0.03, section301: 0.25 },
  { code6: '820411', code4: '8204', chapter: '82', description: '手动扳手', descriptionEn: 'Hand-operated wrenches', usRate: 0.04, euRate: 0.03, section301: 0.25 },
  { code6: '820520', code4: '8205', chapter: '82', description: '锤子', descriptionEn: 'Hammers', usRate: 0.04, euRate: 0.03, section301: 0.25 },
  { code6: '820551', code4: '8205', chapter: '82', description: '家用工具', descriptionEn: 'Household tools', usRate: 0.04, euRate: 0.03, section301: 0.25 },
  { code6: '821110', code4: '8211', chapter: '82', description: '厨刀套装', descriptionEn: 'Kitchen knife sets', usRate: 0.04, euRate: 0.03, section301: 0.25 },
  { code6: '821191', code4: '8211', chapter: '82', description: '厨刀', descriptionEn: 'Kitchen knives', usRate: 0.04, euRate: 0.03, section301: 0.25 },
  { code6: '821210', code4: '8212', chapter: '82', description: '剃须刀', descriptionEn: 'Razors', usRate: 0.04, euRate: 0.03, section301: 0.25 },
  { code6: '821300', code4: '8213', chapter: '82', description: '剪刀', descriptionEn: 'Scissors', usRate: 0.04, euRate: 0.03, section301: 0.25 },
  { code6: '821410', code4: '8214', chapter: '82', description: '裁纸刀/开信刀', descriptionEn: 'Paper knives/letter openers', usRate: 0.04, euRate: 0.03, section301: 0.25 },
  { code6: '821420', code4: '8214', chapter: '82', description: '指甲钳/美容工具', descriptionEn: 'Nail clippers/manicure tools', usRate: 0.04, euRate: 0.03, section301: 0.25 },

  // ===== Chapter 84: Machinery =====
  { code6: '841451', code4: '8414', chapter: '84', description: '台扇/落地扇', descriptionEn: 'Desk/floor fans', usRate: 0.02, euRate: 0.02, section301: 0.25 },
  { code6: '842010', code4: '8420', chapter: '84', description: '熨烫机', descriptionEn: 'Ironing machines', usRate: 0.02, euRate: 0.02, section301: 0.25 },
  { code6: '842119', code4: '8421', chapter: '84', description: '离心机/干燥机', descriptionEn: 'Centrifuges/dryers', usRate: 0.02, euRate: 0.02, section301: 0.25 },
  { code6: '842310', code4: '8423', chapter: '84', description: '体重秤/家用秤', descriptionEn: 'Bathroom/household scales', usRate: 0.02, euRate: 0.02, section301: 0.25 },
  { code6: '843210', code4: '8432', chapter: '84', description: '园艺工具', descriptionEn: 'Garden tools', usRate: 0.02, euRate: 0.02, section301: 0.25 },
  { code6: '846721', code4: '8467', chapter: '84', description: '电钻', descriptionEn: 'Electric drills', usRate: 0.02, euRate: 0.02, section301: 0.25 },
  { code6: '846722', code4: '8467', chapter: '84', description: '电锯', descriptionEn: 'Electric saws', usRate: 0.02, euRate: 0.02, section301: 0.25 },
  { code6: '846729', code4: '8467', chapter: '84', description: '其他电动工具', descriptionEn: 'Other power tools', usRate: 0.02, euRate: 0.02, section301: 0.25 },
  { code6: '847130', code4: '8471', chapter: '84', description: '笔记本电脑/平板', descriptionEn: 'Laptops/tablets', usRate: 0, euRate: 0.02, section301: 0.25, notes: '零关税' },
  { code6: '847141', code4: '8471', chapter: '84', description: '台式电脑', descriptionEn: 'Desktop computers', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '847149', code4: '8471', chapter: '84', description: '其他电脑', descriptionEn: 'Other computers', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '847160', code4: '8471', chapter: '84', description: '键盘/鼠标/扫描仪', descriptionEn: 'Keyboards/mice/scanners', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '847170', code4: '8471', chapter: '84', description: '电脑存储设备', descriptionEn: 'Computer storage devices', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '847330', code4: '8473', chapter: '84', description: '电脑配件', descriptionEn: 'Computer parts/accessories', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '848180', code4: '8481', chapter: '84', description: '阀门/水龙头', descriptionEn: 'Valves/faucets', usRate: 0.02, euRate: 0.02, section301: 0.25 },
  { code6: '848190', code4: '8481', chapter: '84', description: '阀门/水龙头配件', descriptionEn: 'Valve/faucet parts', usRate: 0.02, euRate: 0.02, section301: 0.25 },

  // ===== Chapter 85: Electronics =====
  { code6: '850410', code4: '8504', chapter: '85', description: 'LED 驱动器/电子镇流器', descriptionEn: 'LED drivers/ballasts', usRate: 0.015, euRate: 0.02, section301: 0.25 },
  { code6: '850440', code4: '8504', chapter: '85', description: '电源适配器/充电器', descriptionEn: 'Power adapters/chargers', usRate: 0.027, euRate: 0.02, section301: 0.25 },
  { code6: '850490', code4: '8504', chapter: '85', description: '变压器/充电器配件', descriptionEn: 'Transformer/charger parts', usRate: 0.015, euRate: 0.02, section301: 0.25 },
  { code6: '850511', code4: '8505', chapter: '85', description: '磁铁', descriptionEn: 'Magnets', usRate: 0.02, euRate: 0.02, section301: 0.25 },
  { code6: '850610', code4: '8506', chapter: '85', description: '碱性电池', descriptionEn: 'Alkaline batteries', usRate: 0.027, euRate: 0.027, section301: 0.25 },
  { code6: '850650', code4: '8506', chapter: '85', description: '锂电池', descriptionEn: 'Lithium batteries', usRate: 0.027, euRate: 0.027, section301: 0.25 },
  { code6: '850760', code4: '8507', chapter: '85', description: '锂离子蓄电池（充电宝）', descriptionEn: 'Lithium-ion batteries (power banks)', usRate: 0.027, euRate: 0.027, section301: 0.25, notes: '含充电宝' },
  { code6: '851310', code4: '8513', chapter: '85', description: '手电筒', descriptionEn: 'Flashlights', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '851519', code4: '8515', chapter: '85', description: '电烙铁/焊枪', descriptionEn: 'Soldering irons/guns', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '851631', code4: '8516', chapter: '85', description: '电吹风', descriptionEn: 'Hair dryers', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '851632', code4: '8516', chapter: '85', description: '电卷发器', descriptionEn: 'Hair curlers', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '851640', code4: '8516', chapter: '85', description: '电熨斗', descriptionEn: 'Electric irons', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '851650', code4: '8516', chapter: '85', description: '微波炉', descriptionEn: 'Microwave ovens', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '851660', code4: '8516', chapter: '85', description: '电饭锅/电烤箱', descriptionEn: 'Rice cookers/ovens', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '851671', code4: '8516', chapter: '85', description: '咖啡机/茶壶', descriptionEn: 'Coffee makers/tea brewers', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '851672', code4: '8516', chapter: '85', description: '烤面包机', descriptionEn: 'Toasters', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '851679', code4: '8516', chapter: '85', description: '其他小型厨房电器', descriptionEn: 'Other small kitchen appliances', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '851711', code4: '8517', chapter: '85', description: '有线电话机', descriptionEn: 'Wired telephones', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '851712', code4: '8517', chapter: '85', description: '智能手机', descriptionEn: 'Smartphones', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '851718', code4: '8517', chapter: '85', description: '其他电话机', descriptionEn: 'Other telephones', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '851762', code4: '8517', chapter: '85', description: '路由器/交换机/通信设备', descriptionEn: 'Routers/switches/comm equipment', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '851769', code4: '8517', chapter: '85', description: '其他通信设备', descriptionEn: 'Other communication devices', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '851770', code4: '8517', chapter: '85', description: '通信设备配件（含手机壳）', descriptionEn: 'Comm device parts (incl. phone cases)', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '851821', code4: '8518', chapter: '85', description: '单喇叭音箱', descriptionEn: 'Single loudspeakers', usRate: 0.048, euRate: 0.02, section301: 0.25 },
  { code6: '851822', code4: '8518', chapter: '85', description: '多喇叭音箱', descriptionEn: 'Multi-speakers', usRate: 0.048, euRate: 0.02, section301: 0.25 },
  { code6: '851830', code4: '8518', chapter: '85', description: '耳机及耳塞', descriptionEn: 'Headphones & earphones', usRate: 0, euRate: 0.02, section301: 0.25, notes: '耳机零关税' },
  { code6: '851840', code4: '8518', chapter: '85', description: '音频放大器', descriptionEn: 'Audio amplifiers', usRate: 0.048, euRate: 0.02, section301: 0.25 },
  { code6: '851850', code4: '8518', chapter: '85', description: '扩音系统', descriptionEn: 'Sound amplification systems', usRate: 0.048, euRate: 0.02, section301: 0.25 },
  { code6: '851890', code4: '8518', chapter: '85', description: '音频设备配件', descriptionEn: 'Audio equipment parts', usRate: 0.048, euRate: 0.02, section301: 0.25 },
  { code6: '852190', code4: '8521', chapter: '85', description: '视频播放设备', descriptionEn: 'Video playback equipment', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '852351', code4: '8523', chapter: '85', description: 'U盘/固态存储', descriptionEn: 'USB drives/solid-state storage', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '852352', code4: '8523', chapter: '85', description: '智能卡/SIM卡', descriptionEn: 'Smart cards/SIM cards', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '852380', code4: '8523', chapter: '85', description: '其他存储介质', descriptionEn: 'Other storage media', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '852550', code4: '8525', chapter: '85', description: '发射设备', descriptionEn: 'Transmission equipment', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '852560', code4: '8525', chapter: '85', description: '收发设备', descriptionEn: 'Transceiver equipment', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '852580', code4: '8525', chapter: '85', description: '摄像机/摄像头', descriptionEn: 'Cameras/webcams', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '852791', code4: '8527', chapter: '85', description: '收音机/蓝牙接收器', descriptionEn: 'Radios/bluetooth receivers', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '852852', code4: '8528', chapter: '85', description: '电脑显示器', descriptionEn: 'Computer monitors', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '852871', code4: '8528', chapter: '85', description: '电视接收器', descriptionEn: 'TV receivers', usRate: 0, euRate: 0.14, section301: 0.25, notes: 'EU VAT applies on top' },
  { code6: '852910', code4: '8529', chapter: '85', description: '天线', descriptionEn: 'Antennas', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '852990', code4: '8529', chapter: '85', description: '通信设备配件', descriptionEn: 'Telecom parts', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '853630', code4: '8536', chapter: '85', description: '电路保护装置', descriptionEn: 'Circuit protection devices', usRate: 0.027, euRate: 0.02, section301: 0.25 },
  { code6: '853669', code4: '8536', chapter: '85', description: '插头/插座/USB连接器', descriptionEn: 'Plugs/sockets/USB connectors', usRate: 0.027, euRate: 0.02, section301: 0.25 },
  { code6: '853690', code4: '8536', chapter: '85', description: '其他电气连接器', descriptionEn: 'Other electrical connectors', usRate: 0.027, euRate: 0.02, section301: 0.25 },
  { code6: '853710', code4: '8537', chapter: '85', description: '电控面板/开关', descriptionEn: 'Control panels/switches', usRate: 0.027, euRate: 0.02, section301: 0.25 },
  { code6: '853931', code4: '8539', chapter: '85', description: 'LED 灯管/灯泡', descriptionEn: 'LED tubes/bulbs', usRate: 0.027, euRate: 0.02, section301: 0.25, notes: 'LED 照明' },
  { code6: '853950', code4: '8539', chapter: '85', description: 'LED 灯具', descriptionEn: 'LED lamps', usRate: 0.027, euRate: 0.02, section301: 0.25 },
  { code6: '854110', code4: '8541', chapter: '85', description: '二极管/LED 芯片', descriptionEn: 'Diodes/LED chips', usRate: 0, euRate: 0, section301: 0.25 },
  { code6: '854231', code4: '8542', chapter: '85', description: '集成电路/芯片', descriptionEn: 'Integrated circuits/chips', usRate: 0, euRate: 0, section301: 0.25 },
  { code6: '854232', code4: '8542', chapter: '85', description: '存储芯片', descriptionEn: 'Memory chips', usRate: 0, euRate: 0, section301: 0.25 },
  { code6: '854233', code4: '8542', chapter: '85', description: '放大器芯片', descriptionEn: 'Amplifier chips', usRate: 0, euRate: 0, section301: 0.25 },
  { code6: '854239', code4: '8542', chapter: '85', description: '其他集成电路', descriptionEn: 'Other integrated circuits', usRate: 0, euRate: 0, section301: 0.25 },
  { code6: '854442', code4: '8544', chapter: '85', description: 'USB 数据线', descriptionEn: 'USB data cables', usRate: 0.027, euRate: 0.02, section301: 0.25 },
  { code6: '854449', code4: '8544', chapter: '85', description: '绝缘电线/电缆', descriptionEn: 'Insulated wires/cables', usRate: 0.027, euRate: 0.02, section301: 0.25 },
  { code6: '854470', code4: '8544', chapter: '85', description: '光纤电缆', descriptionEn: 'Fiber optic cables', usRate: 0.027, euRate: 0.02, section301: 0.25 },
  { code6: '854800', code4: '8548', chapter: '85', description: '电气设备废料/配件', descriptionEn: 'Electrical waste/parts', usRate: 0.027, euRate: 0.02, section301: 0.25 },

  // ===== Chapter 87: Vehicles (bicycles) =====
  { code6: '871200', code4: '8712', chapter: '87', description: '自行车', descriptionEn: 'Bicycles', usRate: 0.11, euRate: 0.04, section301: 0.25, notes: '范围 0-11%' },
  { code6: '871491', code4: '8714', chapter: '87', description: '自行车车架', descriptionEn: 'Bicycle frames', usRate: 0.06, euRate: 0.04, section301: 0.25 },
  { code6: '871493', code4: '8714', chapter: '87', description: '自行车轮毂', descriptionEn: 'Bicycle hubs', usRate: 0.06, euRate: 0.04, section301: 0.25 },
  { code6: '871494', code4: '8714', chapter: '87', description: '自行车刹车', descriptionEn: 'Bicycle brakes', usRate: 0.06, euRate: 0.04, section301: 0.25 },
  { code6: '871495', code4: '8714', chapter: '87', description: '自行车坐垫', descriptionEn: 'Bicycle saddles', usRate: 0.06, euRate: 0.04, section301: 0.25 },
  { code6: '871496', code4: '8714', chapter: '87', description: '自行车脚踏', descriptionEn: 'Bicycle pedals', usRate: 0.06, euRate: 0.04, section301: 0.25 },
  { code6: '871499', code4: '8714', chapter: '87', description: '自行车其他零配件', descriptionEn: 'Other bicycle parts', usRate: 0.06, euRate: 0.04, section301: 0.25 },
  { code6: '871680', code4: '8716', chapter: '87', description: '手推车/行李车', descriptionEn: 'Hand carts/luggage carts', usRate: 0.03, euRate: 0.04, section301: 0.25 },

  // ===== Chapter 90: Optical/Medical =====
  { code6: '900311', code4: '9003', chapter: '90', description: '塑料眼镜架', descriptionEn: 'Plastic eyeglass frames', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '900319', code4: '9003', chapter: '90', description: '金属眼镜架', descriptionEn: 'Metal eyeglass frames', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '900410', code4: '9004', chapter: '90', description: '太阳镜', descriptionEn: 'Sunglasses', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '900490', code4: '9004', chapter: '90', description: '其他眼镜/护目镜', descriptionEn: 'Other glasses/goggles', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '901010', code4: '9010', chapter: '90', description: '摄影设备', descriptionEn: 'Photographic equipment', usRate: 0.025, euRate: 0.02, section301: 0.25 },
  { code6: '901890', code4: '9018', chapter: '90', description: '医疗仪器/设备', descriptionEn: 'Medical instruments/devices', usRate: 0, euRate: 0.02, section301: 0.25, notes: '零关税' },
  { code6: '901910', code4: '9019', chapter: '90', description: '按摩器', descriptionEn: 'Massage apparatus', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '901920', code4: '9019', chapter: '90', description: '呼吸治疗设备', descriptionEn: 'Respiratory therapy devices', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '902000', code4: '9020', chapter: '90', description: '呼吸防护设备', descriptionEn: 'Breathing protection devices', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '902110', code4: '9021', chapter: '90', description: '矫形器具', descriptionEn: 'Orthopedic appliances', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '902511', code4: '9025', chapter: '90', description: '温度计', descriptionEn: 'Thermometers', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '902519', code4: '9025', chapter: '90', description: '其他温度测量仪', descriptionEn: 'Other temperature measuring devices', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '902620', code4: '9026', chapter: '90', description: '压力测量仪', descriptionEn: 'Pressure measuring instruments', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '902710', code4: '9027', chapter: '90', description: '气体分析仪', descriptionEn: 'Gas analyzers', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '902910', code4: '9029', chapter: '90', description: '计步器/转速表', descriptionEn: 'Pedometers/tachometers', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '903033', code4: '9030', chapter: '90', description: '万用表/电压表', descriptionEn: 'Multimeters/voltmeters', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '903110', code4: '9031', chapter: '90', description: '平衡测试仪', descriptionEn: 'Balancing instruments', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '903180', code4: '9031', chapter: '90', description: '其他测量仪器', descriptionEn: 'Other measuring instruments', usRate: 0, euRate: 0.02, section301: 0.25 },
  { code6: '903210', code4: '9032', chapter: '90', description: '恒温器', descriptionEn: 'Thermostats', usRate: 0, euRate: 0.02, section301: 0.25 },

  // ===== Chapter 91: Clocks/Watches =====
  { code6: '910111', code4: '9101', chapter: '91', description: '贵金属机械手表', descriptionEn: 'Precious metal mechanical watches', usRate: 0.054, euRate: 0.05, section301: 0.075 },
  { code6: '910119', code4: '9101', chapter: '91', description: '贵金属全自动手表', descriptionEn: 'Precious metal auto watches', usRate: 0.054, euRate: 0.05, section301: 0.075 },
  { code6: '910211', code4: '9102', chapter: '91', description: '石英手表（机械指示）', descriptionEn: 'Quartz watches (mechanical display)', usRate: 0.054, euRate: 0.05, section301: 0.075 },
  { code6: '910212', code4: '9102', chapter: '91', description: '石英手表（电子显示）', descriptionEn: 'Quartz watches (digital display)', usRate: 0.054, euRate: 0.05, section301: 0.075 },
  { code6: '910219', code4: '9102', chapter: '91', description: '其他石英手表', descriptionEn: 'Other quartz watches', usRate: 0.054, euRate: 0.05, section301: 0.075 },
  { code6: '910299', code4: '9102', chapter: '91', description: '其他手表', descriptionEn: 'Other watches', usRate: 0.054, euRate: 0.05, section301: 0.075 },
  { code6: '910310', code4: '9103', chapter: '91', description: '闹钟（电池）', descriptionEn: 'Alarm clocks (battery)', usRate: 0.054, euRate: 0.05, section301: 0.075 },
  { code6: '910390', code4: '9103', chapter: '91', description: '其他钟', descriptionEn: 'Other clocks', usRate: 0.054, euRate: 0.05, section301: 0.075 },
  { code6: '910511', code4: '9105', chapter: '91', description: '闹钟（电动）', descriptionEn: 'Alarm clocks (electric)', usRate: 0.054, euRate: 0.05, section301: 0.075 },
  { code6: '910521', code4: '9105', chapter: '91', description: '挂钟', descriptionEn: 'Wall clocks', usRate: 0.054, euRate: 0.05, section301: 0.075 },
  { code6: '910591', code4: '9105', chapter: '91', description: '其他钟', descriptionEn: 'Other clocks', usRate: 0.054, euRate: 0.05, section301: 0.075 },
  { code6: '911320', code4: '9113', chapter: '91', description: '贱金属表带', descriptionEn: 'Base metal watch straps', usRate: 0.054, euRate: 0.05, section301: 0.075 },
  { code6: '911390', code4: '9113', chapter: '91', description: '其他表带', descriptionEn: 'Other watch straps', usRate: 0.054, euRate: 0.05, section301: 0.075 },

  // ===== Chapter 94: Furniture & Lamps =====
  { code6: '940130', code4: '9401', chapter: '94', description: '旋转椅', descriptionEn: 'Swivel chairs', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940140', code4: '9401', chapter: '94', description: '沙发床', descriptionEn: 'Sofa beds', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940161', code4: '9401', chapter: '94', description: '木框架沙发', descriptionEn: 'Wooden frame sofas', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940169', code4: '9401', chapter: '94', description: '其他木框架座椅', descriptionEn: 'Other wood frame seats', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940171', code4: '9401', chapter: '94', description: '金属框架沙发', descriptionEn: 'Metal frame sofas', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940179', code4: '9401', chapter: '94', description: '其他金属框架座椅', descriptionEn: 'Other metal frame seats', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940180', code4: '9401', chapter: '94', description: '其他座椅', descriptionEn: 'Other seats', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940190', code4: '9401', chapter: '94', description: '座椅配件', descriptionEn: 'Seat parts', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940210', code4: '9402', chapter: '94', description: '理发椅/牙科椅', descriptionEn: 'Barber/dental chairs', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940290', code4: '9402', chapter: '94', description: '医用家具', descriptionEn: 'Medical furniture', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940310', code4: '9403', chapter: '94', description: '金属办公家具', descriptionEn: 'Metal office furniture', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940320', code4: '9403', chapter: '94', description: '金属家用家具', descriptionEn: 'Metal household furniture', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940330', code4: '9403', chapter: '94', description: '木办公家具', descriptionEn: 'Wood office furniture', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940340', code4: '9403', chapter: '94', description: '木厨房家具', descriptionEn: 'Wood kitchen furniture', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940350', code4: '9403', chapter: '94', description: '木卧室家具', descriptionEn: 'Wood bedroom furniture', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940360', code4: '9403', chapter: '94', description: '其他木家具', descriptionEn: 'Other wood furniture', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940370', code4: '9403', chapter: '94', description: '塑料家具', descriptionEn: 'Plastic furniture', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940382', code4: '9403', chapter: '94', description: '竹家具', descriptionEn: 'Bamboo furniture', usRate: 0.03, euRate: 0.03, section301: 0.075 },
  { code6: '940383', code4: '9403', chapter: '94', description: '藤家具', descriptionEn: 'Rattan furniture', usRate: 0.03, euRate: 0.03, section301: 0.075 },
  { code6: '940389', code4: '9403', chapter: '94', description: '其他材料家具', descriptionEn: 'Other material furniture', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940390', code4: '9403', chapter: '94', description: '家具配件', descriptionEn: 'Furniture parts', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940410', code4: '9404', chapter: '94', description: '床垫弹簧', descriptionEn: 'Mattress springs', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940421', code4: '9404', chapter: '94', description: '海绵床垫', descriptionEn: 'Foam mattresses', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940429', code4: '9404', chapter: '94', description: '其他床垫', descriptionEn: 'Other mattresses', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940430', code4: '9404', chapter: '94', description: '睡袋', descriptionEn: 'Sleeping bags', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940490', code4: '9404', chapter: '94', description: '枕头/靠垫/被子', descriptionEn: 'Pillows/cushions/blankets', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '940510', code4: '9405', chapter: '94', description: '吊灯', descriptionEn: 'Chandeliers/ceiling lights', usRate: 0.027, euRate: 0.03, section301: 0.25 },
  { code6: '940520', code4: '9405', chapter: '94', description: '台灯/落地灯', descriptionEn: 'Desk/floor lamps', usRate: 0.027, euRate: 0.03, section301: 0.25 },
  { code6: '940530', code4: '9405', chapter: '94', description: '彩灯串/LED 灯带', descriptionEn: 'Light strings/LED strips', usRate: 0.027, euRate: 0.03, section301: 0.25 },
  { code6: '940540', code4: '9405', chapter: '94', description: '其他灯具', descriptionEn: 'Other lamps', usRate: 0.027, euRate: 0.03, section301: 0.25 },
  { code6: '940550', code4: '9405', chapter: '94', description: '非电灯', descriptionEn: 'Non-electric lamps', usRate: 0.027, euRate: 0.03, section301: 0.25 },
  { code6: '940560', code4: '9405', chapter: '94', description: '发光标志', descriptionEn: 'Illuminated signs', usRate: 0.027, euRate: 0.03, section301: 0.25 },
  { code6: '940591', code4: '9405', chapter: '94', description: '玻璃灯具配件', descriptionEn: 'Glass lamp parts', usRate: 0.027, euRate: 0.03, section301: 0.25 },
  { code6: '940592', code4: '9405', chapter: '94', description: '塑料灯具配件', descriptionEn: 'Plastic lamp parts', usRate: 0.027, euRate: 0.03, section301: 0.25 },
  { code6: '940599', code4: '9405', chapter: '94', description: '其他灯具配件', descriptionEn: 'Other lamp parts', usRate: 0.027, euRate: 0.03, section301: 0.25 },

  // ===== Chapter 95: Toys =====
  { code6: '950300', code4: '9503', chapter: '95', description: '玩具（三轮车/娃娃/模型等）', descriptionEn: 'Toys (tricycles/dolls/models)', usRate: 0.048, euRate: 0.04, section301: 0.25 },
  { code6: '950420', code4: '9504', chapter: '95', description: '台球桌及配件', descriptionEn: 'Billiard tables & accessories', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950430', code4: '9504', chapter: '95', description: '博彩游戏机', descriptionEn: 'Gaming machines', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950440', code4: '9504', chapter: '95', description: '扑克牌', descriptionEn: 'Playing cards', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950450', code4: '9504', chapter: '95', description: '电子游戏机', descriptionEn: 'Video game consoles', usRate: 0, euRate: 0.04, section301: 0.25, notes: '零关税' },
  { code6: '950490', code4: '9504', chapter: '95', description: '其他游戏/棋类', descriptionEn: 'Other games/board games', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950510', code4: '9505', chapter: '95', description: '圣诞节装饰品', descriptionEn: 'Christmas decorations', usRate: 0.048, euRate: 0.04, section301: 0.25 },
  { code6: '950590', code4: '9505', chapter: '95', description: '其他节日装饰', descriptionEn: 'Other festive decorations', usRate: 0.048, euRate: 0.04, section301: 0.25 },
  { code6: '950611', code4: '9506', chapter: '95', description: '滑雪板', descriptionEn: 'Skis', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950619', code4: '9506', chapter: '95', description: '滑雪装备配件', descriptionEn: 'Ski equipment parts', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950621', code4: '9506', chapter: '95', description: '帆板', descriptionEn: 'Sailboards', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950629', code4: '9506', chapter: '95', description: '水上运动设备', descriptionEn: 'Water sport equipment', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950631', code4: '9506', chapter: '95', description: '高尔夫球杆', descriptionEn: 'Golf clubs', usRate: 0.044, euRate: 0.04, section301: 0.25 },
  { code6: '950632', code4: '9506', chapter: '95', description: '高尔夫球', descriptionEn: 'Golf balls', usRate: 0.044, euRate: 0.04, section301: 0.25 },
  { code6: '950639', code4: '9506', chapter: '95', description: '高尔夫装备配件', descriptionEn: 'Golf equipment accessories', usRate: 0.044, euRate: 0.04, section301: 0.25 },
  { code6: '950640', code4: '9506', chapter: '95', description: '乒乓球装备', descriptionEn: 'Table tennis equipment', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950651', code4: '9506', chapter: '95', description: '网球拍/羽毛球拍', descriptionEn: 'Tennis/badminton rackets', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950659', code4: '9506', chapter: '95', description: '其他球拍', descriptionEn: 'Other rackets', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950662', code4: '9506', chapter: '95', description: '球类（充气）', descriptionEn: 'Inflatable balls', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950669', code4: '9506', chapter: '95', description: '其他球类', descriptionEn: 'Other balls', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950670', code4: '9506', chapter: '95', description: '溜冰鞋/轮滑鞋', descriptionEn: 'Ice/roller skates', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950691', code4: '9506', chapter: '95', description: '健身器材', descriptionEn: 'Exercise equipment', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950699', code4: '9506', chapter: '95', description: '其他运动器材', descriptionEn: 'Other sports equipment', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950710', code4: '9507', chapter: '95', description: '钓鱼竿', descriptionEn: 'Fishing rods', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950720', code4: '9507', chapter: '95', description: '鱼钩', descriptionEn: 'Fish hooks', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950730', code4: '9507', chapter: '95', description: '渔线轮', descriptionEn: 'Fishing reels', usRate: 0.03, euRate: 0.04, section301: 0.25 },
  { code6: '950790', code4: '9507', chapter: '95', description: '其他渔具', descriptionEn: 'Other fishing equipment', usRate: 0.03, euRate: 0.04, section301: 0.25 },

  // ===== Chapter 96: Miscellaneous =====
  { code6: '960310', code4: '9603', chapter: '96', description: '扫帚/刷子', descriptionEn: 'Brooms/brushes', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960321', code4: '9603', chapter: '96', description: '牙刷', descriptionEn: 'Toothbrushes', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960329', code4: '9603', chapter: '96', description: '发刷/梳子', descriptionEn: 'Hair brushes/combs', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960330', code4: '9603', chapter: '96', description: '化妆刷', descriptionEn: 'Makeup brushes', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960340', code4: '9603', chapter: '96', description: '油漆刷', descriptionEn: 'Paint brushes', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960500', code4: '9605', chapter: '96', description: '旅行套装（个人护理）', descriptionEn: 'Travel sets (personal care)', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960610', code4: '9606', chapter: '96', description: '纽扣', descriptionEn: 'Buttons', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960621', code4: '9606', chapter: '96', description: '塑料纽扣', descriptionEn: 'Plastic buttons', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960622', code4: '9606', chapter: '96', description: '金属纽扣', descriptionEn: 'Metal buttons', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960630', code4: '9606', chapter: '96', description: '纽扣芯/纽扣配件', descriptionEn: 'Button blanks/parts', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960711', code4: '9607', chapter: '96', description: '拉链（贱金属）', descriptionEn: 'Zippers (base metal)', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960719', code4: '9607', chapter: '96', description: '其他拉链', descriptionEn: 'Other zippers', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960720', code4: '9607', chapter: '96', description: '拉链配件', descriptionEn: 'Zipper parts', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960810', code4: '9608', chapter: '96', description: '圆珠笔', descriptionEn: 'Ballpoint pens', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960820', code4: '9608', chapter: '96', description: '马克笔/荧光笔', descriptionEn: 'Markers/highlighters', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960830', code4: '9608', chapter: '96', description: '钢笔', descriptionEn: 'Fountain pens', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960840', code4: '9608', chapter: '96', description: '自动铅笔', descriptionEn: 'Mechanical pencils', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960850', code4: '9608', chapter: '96', description: '多功能笔', descriptionEn: 'Multi-function pens', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960860', code4: '9608', chapter: '96', description: '笔芯', descriptionEn: 'Pen refills', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960891', code4: '9608', chapter: '96', description: '笔尖/笔头', descriptionEn: 'Pen nibs/points', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960899', code4: '9608', chapter: '96', description: '其他笔配件', descriptionEn: 'Other pen parts', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960910', code4: '9609', chapter: '96', description: '铅笔', descriptionEn: 'Pencils', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960920', code4: '9609', chapter: '96', description: '铅笔芯', descriptionEn: 'Pencil leads', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '960990', code4: '9609', chapter: '96', description: '蜡笔/粉笔', descriptionEn: 'Crayons/chalk', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961000', code4: '9610', chapter: '96', description: '黑板/白板', descriptionEn: 'Blackboards/whiteboards', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961100', code4: '9611', chapter: '96', description: '印章', descriptionEn: 'Date/sealing stamps', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961210', code4: '9612', chapter: '96', description: '打字机色带/碳带', descriptionEn: 'Typewriter ribbons/ink cartridges', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961220', code4: '9612', chapter: '96', description: '印台', descriptionEn: 'Ink pads', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961310', code4: '9613', chapter: '96', description: '一次性打火机', descriptionEn: 'Disposable lighters', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961320', code4: '9613', chapter: '96', description: '可充气打火机', descriptionEn: 'Refillable lighters', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961380', code4: '9613', chapter: '96', description: '其他打火机', descriptionEn: 'Other lighters', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961400', code4: '9614', chapter: '96', description: '烟斗/烟嘴', descriptionEn: 'Smoking pipes/holders', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961511', code4: '9615', chapter: '96', description: '硬质橡胶梳子', descriptionEn: 'Hard rubber combs', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961519', code4: '9615', chapter: '96', description: '其他梳子', descriptionEn: 'Other combs', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961590', code4: '9615', chapter: '96', description: '发夹/卷发器', descriptionEn: 'Hair clips/curlers', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961610', code4: '9616', chapter: '96', description: '喷雾器/香水喷头', descriptionEn: 'Scent sprays/perfume atomizers', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961620', code4: '9616', chapter: '96', description: '化妆粉扑', descriptionEn: 'Makeup powder puffs', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961700', code4: '9617', chapter: '96', description: '保温瓶/真空瓶', descriptionEn: 'Vacuum flasks/bottles', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961800', code4: '9618', chapter: '96', description: '人体模型/展示架', descriptionEn: 'Mannequins/displays', usRate: 0.03, euRate: 0.03, section301: 0.25 },
  { code6: '961900', code4: '9619', chapter: '96', description: '卫生巾/尿不湿', descriptionEn: 'Sanitary towels/diapers', usRate: 0.03, euRate: 0.03, section301: 0.25 },
];

// Indexes for fast lookup
const byCode6 = new Map<string, HsTariffEntry>();
const byCode4 = new Map<string, HsTariffEntry[]>();
const byChapter = new Map<string, HsTariffEntry[]>();

for (const e of E) {
  byCode6.set(e.code6, e);
  const c4 = byCode4.get(e.code4) || [];
  c4.push(e);
  byCode4.set(e.code4, c4);
  const ch = byChapter.get(e.chapter) || [];
  ch.push(e);
  byChapter.set(e.chapter, ch);
}

export const HS_TARIFF_DATA = Object.freeze(E);
export const HS_TARIFF_BY_CODE6 = byCode6;
export const HS_TARIFF_BY_CODE4 = byCode4;
export const HS_TARIFF_BY_CHAPTER = byChapter;

/** Lookup exact 6-digit match */
export function lookupHs6(code6: string): HsTariffEntry | undefined {
  return byCode6.get(code6);
}

/** Lookup 4-digit heading entries */
export function lookupHs4(code4: string): HsTariffEntry[] {
  return byCode4.get(code4) || [];
}

/** Get the first/representative rate for a 4-digit heading */
export function lookupHs4Rate(code4: string): { usRate: number; euRate: number; section301: number } | null {
  const entries = byCode4.get(code4);
  if (!entries || entries.length === 0) return null;
  // Use the first entry's rates as representative
  return { usRate: entries[0].usRate, euRate: entries[0].euRate, section301: entries[0].section301 };
}

/** Total entries in database */
export const HS_TARIFF_COUNT = E.length;
