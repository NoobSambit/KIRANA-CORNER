export interface ProductImageLike {
  id?: string;
  name?: string;
  canonicalName?: string;
  normalizedName?: string;
  category?: string;
  subcategory?: string;
  image?: string;
  imageUrl?: string;
  ingredientIds?: string[];
  aliases?: string[];
}

type ImageRule = {
  keys: string[];
  url: string;
};

const EXACT_IMAGE_OVERRIDES: Record<string, string> = {
  'basmati-rice': 'https://m.media-amazon.com/images/I/716IEKwQvoL.jpg',
  'gobindobhog-rice': 'https://www.bigbasket.com/media/uploads/p/l/40202359_2-bb-royal-gobindobhog-rice.jpg',
  'sona-masoori-rice': 'https://m.media-amazon.com/images/I/71U5zqZao0L.jpg',
  poha: 'https://m.media-amazon.com/images/I/61WAa8YcNOL.jpg',
  suji: 'https://m.media-amazon.com/images/I/71HFiR9Q7yL.jpg',
  sabudana: 'https://m.media-amazon.com/images/I/71OJvZ2SY6L.jpg',
  vermicelli: 'https://m.media-amazon.com/images/I/71XcH4jlLKL.jpg',
  'puffed-rice': 'https://m.media-amazon.com/images/I/71R3mPc1NBL.jpg',
  'wheat-flour': 'https://m.media-amazon.com/images/I/81LwYfQ4MEL.jpg',
  maida: 'https://m.media-amazon.com/images/I/71mkT6j7NeL.jpg',
  besan: 'https://m.media-amazon.com/images/I/71aV9AtBzML.jpg',
  'rice-flour': 'https://m.media-amazon.com/images/I/71Jj1je-jQL.jpg',
  'corn-flour': 'https://m.media-amazon.com/images/I/71eG7e2IY8L.jpg',
  'moong-dal': 'https://www.tatanutrikorner.com/cdn/shop/files/Tata-Sampann-Moong-Dal-500g-_FOP_-with-Sanjeev-kapoor.png?v=1748858300&width=1000',
  'masoor-dal': 'https://m.media-amazon.com/images/I/71FoE8Yk+AL.jpg',
  'toor-dal': 'https://m.media-amazon.com/images/I/71CzPrOj1UL.jpg',
  'chana-dal': 'https://m.media-amazon.com/images/I/61NZt0SHUgL._UF1000,1000_QL80_.jpg',
  'urad-dal': 'https://m.media-amazon.com/images/I/71eQPgx+HCL.jpg',
  rajma: 'https://m.media-amazon.com/images/I/71h4i5RgdBL.jpg',
  'kabuli-chana': 'https://m.media-amazon.com/images/I/71cWa5tS2hL.jpg',
  'black-chana': 'https://m.media-amazon.com/images/I/71Mi3iL4AjL.jpg',
  'mustard-oil': 'https://www.bbassets.com/media/uploads/p/xl/276756_11-fortune-fortune-premium-kachi-ghani-pure-mustard-oil.jpg',
  'refined-sunflower-oil': 'https://m.media-amazon.com/images/I/61m+PAz9W9L.jpg',
  'rice-bran-oil': 'https://m.media-amazon.com/images/I/61nnR5kN5XL.jpg',
  'groundnut-oil': 'https://m.media-amazon.com/images/I/71GCoNwhOPL.jpg',
  ghee: 'https://m.media-amazon.com/images/I/81DaNTeNErL._UF1000,1000_QL80_.jpg',
  salt: 'https://m.media-amazon.com/images/I/614mm2hYHyL._UF894,1000_QL80_.jpg',
  sugar: 'https://m.media-amazon.com/images/I/61N3dZtZ4RL.jpg',
  tea: 'https://m.media-amazon.com/images/I/61T8+u9yJQL.jpg',
  'coffee-powder': 'https://m.media-amazon.com/images/I/71qBQnpQFYL.jpg',
  milk: 'https://www.bbassets.com/media/uploads/p/l/306926_4-amul-homogenised-toned-milk.jpg',
  curd: 'https://www.bbassets.com/media/uploads/p/l/40332424_1-amul-curd-creamy-tasty.jpg',
  butter: 'https://www.bbassets.com/media/uploads/p/xl/104860_8-amul-butter-pasteurised.jpg',
  paneer: 'https://www.bbassets.com/media/uploads/p/l/40096747_8-amul-malai-fresh-paneer.jpg',
  'cheese-slices': 'https://m.media-amazon.com/images/I/710E8gugmfL.jpg',
  yogurt: 'https://m.media-amazon.com/images/I/51gc4bxCBuL.jpg',
  cream: 'https://m.media-amazon.com/images/I/713SesS87nL.jpg',
  'milk-powder': 'https://www.jiomart.com/images/product/original/490011303/amulya-dairy-whitener-500-g-pouch-product-images-o490011303-p490011303-0-202203170156.jpg',
  'condensed-milk': 'https://www.recipes.com.au/sites/default/files/2020-07/1.-NESTLE%CC%81-SWEETENED-CONDENSED-MILK-.png',
  buttermilk: 'https://www.jiomart.com/images/product/original/491282411/amul-buttermilk-1-l-product-images-o491282411-p607702707-0-202402021433.jpg',
  eggs: 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=700',
  tomato: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=700',
  onion: 'https://images.pexels.com/photos/4197447/pexels-photo-4197447.jpeg?auto=compress&cs=tinysrgb&w=700',
  potato: 'https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg?auto=compress&cs=tinysrgb&w=700',
  carrot: 'https://images.pexels.com/photos/65174/pexels-photo-65174.jpeg?auto=compress&cs=tinysrgb&w=700',
  cabbage: 'https://images.pexels.com/photos/2518893/pexels-photo-2518893.jpeg?auto=compress&cs=tinysrgb&w=700',
  cauliflower: 'https://images.pexels.com/photos/6316515/pexels-photo-6316515.jpeg?auto=compress&cs=tinysrgb&w=700',
  'green-peas': 'https://images.pexels.com/photos/255469/pexels-photo-255469.jpeg?auto=compress&cs=tinysrgb&w=700',
  spinach: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=700',
  cucumber: 'https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?auto=compress&cs=tinysrgb&w=700',
  brinjal: 'https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg?auto=compress&cs=tinysrgb&w=700',
  okra: 'https://images.pexels.com/photos/5529604/pexels-photo-5529604.jpeg?auto=compress&cs=tinysrgb&w=700',
  'green-chilli': 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=700',
  ginger: 'https://images.pexels.com/photos/161556/ginger-plant-asia-rhizome-161556.jpeg?auto=compress&cs=tinysrgb&w=700',
  garlic: 'https://images.pexels.com/photos/1392585/pexels-photo-1392585.jpeg?auto=compress&cs=tinysrgb&w=700',
  coriander: 'https://images.pexels.com/photos/4198023/pexels-photo-4198023.jpeg?auto=compress&cs=tinysrgb&w=700',
  lemon: 'https://images.pexels.com/photos/1414130/pexels-photo-1414130.jpeg?auto=compress&cs=tinysrgb&w=700',
  banana: 'https://images.pexels.com/photos/1093038/pexels-photo-1093038.jpeg?auto=compress&cs=tinysrgb&w=700',
  apple: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=700',
  orange: 'https://images.pexels.com/photos/42059/citrus-diet-food-fresh-42059.jpeg?auto=compress&cs=tinysrgb&w=700',
  mango: 'https://images.pexels.com/photos/2294471/pexels-photo-2294471.jpeg?auto=compress&cs=tinysrgb&w=700',
  grapes: 'https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg?auto=compress&cs=tinysrgb&w=700',
  pomegranate: 'https://images.pexels.com/photos/65256/pomegranate-open-maturity-fruit-65256.jpeg?auto=compress&cs=tinysrgb&w=700',
  watermelon: 'https://images.pexels.com/photos/1313267/pexels-photo-1313267.jpeg?auto=compress&cs=tinysrgb&w=700',
  pineapple: 'https://images.pexels.com/photos/947879/pexels-photo-947879.jpeg?auto=compress&cs=tinysrgb&w=700',
  papaya: 'https://images.pexels.com/photos/5945650/pexels-photo-5945650.jpeg?auto=compress&cs=tinysrgb&w=700',
  guava: 'https://images.pexels.com/photos/5945758/pexels-photo-5945758.jpeg?auto=compress&cs=tinysrgb&w=700',
  coconut: 'https://images.pexels.com/photos/872400/pexels-photo-872400.jpeg?auto=compress&cs=tinysrgb&w=700',
  'turmeric-powder': 'https://www.bbassets.com/media/uploads/p/l/40019828_4-catch-turmeric-powder.jpg',
  'red-chilli-powder': 'https://m.media-amazon.com/images/I/611XUlpeUYL.jpg',
  'coriander-powder': 'https://shop.mtrfoods.com/cdn/shop/products/CorianderPowder-100g-frontcopy.png?v=1611249400',
  'cumin-seeds': 'https://www.tatanutrikorner.com/cdn/shop/files/cumin_100.png?v=1748858411',
  'garam-masala': 'https://m.media-amazon.com/images/I/71zzVDV0fCL.jpg',
  'biryani-masala': 'https://m.media-amazon.com/images/I/61C8Dr+iLhL.jpg',
  'chicken-masala': 'https://m.media-amazon.com/images/I/71tEJHAO6KL.jpg',
  'fish-curry-masala': 'https://m.media-amazon.com/images/I/71-Tot4avUL.jpg',
  'ginger-garlic-paste': 'https://m.media-amazon.com/images/I/61VKYGc4UIL.jpg',
  'kasuri-methi': 'https://m.media-amazon.com/images/I/71M9ohg6TBL.jpg',
  'chicken-curry-cut': 'https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=700',
  'rohu-fish': 'https://images.pexels.com/photos/3296279/pexels-photo-3296279.jpeg?auto=compress&cs=tinysrgb&w=700',
  'katla-fish': 'https://images.pexels.com/photos/3296279/pexels-photo-3296279.jpeg?auto=compress&cs=tinysrgb&w=700',
  prawns: 'https://images.pexels.com/photos/566345/pexels-photo-566345.jpeg?auto=compress&cs=tinysrgb&w=700',
  bread: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=700',
  'potato-chips': 'https://images.pexels.com/photos/479628/pexels-photo-479628.jpeg?auto=compress&cs=tinysrgb&w=700',
  bhujia: 'https://m.media-amazon.com/images/I/71D0Nq1a3AL.jpg',
  biscuits: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=700',
  popcorn: 'https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg?auto=compress&cs=tinysrgb&w=700',
  peanuts: 'https://images.pexels.com/photos/209439/pexels-photo-209439.jpeg?auto=compress&cs=tinysrgb&w=700',
  cashews: 'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg?auto=compress&cs=tinysrgb&w=700',
  almonds: 'https://images.pexels.com/photos/3997459/pexels-photo-3997459.jpeg?auto=compress&cs=tinysrgb&w=700',
  raisins: 'https://images.pexels.com/photos/4198124/pexels-photo-4198124.jpeg?auto=compress&cs=tinysrgb&w=700',
  chocolate: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=700',
  'soft-drink-cola': 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=700',
  'fruit-juice': 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=700',
  'mineral-water': 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=700',
  'gulab-jamun': 'https://m.media-amazon.com/images/I/61i2a2M5WjL.jpg',
  rasgulla: 'https://m.media-amazon.com/images/I/61sqrivNP9L.jpg',
  detergent: productPackImage('Detergent Powder', 'Laundry Care', '#2563eb', '#dbeafe'),
  'dishwash-gel': productPackImage('Dishwash Gel', 'Kitchen Cleaner', '#16a34a', '#dcfce7'),
  'floor-cleaner': productPackImage('Floor Cleaner', 'Home Hygiene', '#7c3aed', '#ede9fe'),
  'toilet-cleaner': productPackImage('Toilet Cleaner', 'Bathroom Care', '#0891b2', '#cffafe'),
  toothpaste: 'https://images.pexels.com/photos/298611/pexels-photo-298611.jpeg?auto=compress&cs=tinysrgb&w=700',
  toothbrush: 'https://images.pexels.com/photos/3737594/pexels-photo-3737594.jpeg?auto=compress&cs=tinysrgb&w=700',
  soap: 'https://images.pexels.com/photos/4465831/pexels-photo-4465831.jpeg?auto=compress&cs=tinysrgb&w=700',
  shampoo: 'https://images.pexels.com/photos/3737578/pexels-photo-3737578.jpeg?auto=compress&cs=tinysrgb&w=700',
  paracetamol: 'https://digitalcontent.api.tesco.com/v2/media/ghs/c322593f-ea2e-4b4e-adec-cd908a717551/61a7b7b3-e1a0-4335-862d-9dc170dc4511_1042002236.jpeg?h=960&w=960',
};

const KEYWORD_IMAGE_RULES: ImageRule[] = [
  { keys: ['aashirvaad atta', 'atta', 'wheat flour'], url: EXACT_IMAGE_OVERRIDES['wheat-flour'] },
  { keys: ['basmati rice', 'daawat basmati'], url: EXACT_IMAGE_OVERRIDES['basmati-rice'] },
  { keys: ['gobindobhog'], url: EXACT_IMAGE_OVERRIDES['gobindobhog-rice'] },
  { keys: ['sona masoori'], url: EXACT_IMAGE_OVERRIDES['sona-masoori-rice'] },
  { keys: ['moong dal', 'mung dal'], url: EXACT_IMAGE_OVERRIDES['moong-dal'] },
  { keys: ['masoor dal', 'red lentil'], url: EXACT_IMAGE_OVERRIDES['masoor-dal'] },
  { keys: ['toor dal', 'arhar dal'], url: EXACT_IMAGE_OVERRIDES['toor-dal'] },
  { keys: ['chana dal'], url: EXACT_IMAGE_OVERRIDES['chana-dal'] },
  { keys: ['urad dal'], url: EXACT_IMAGE_OVERRIDES['urad-dal'] },
  { keys: ['rajma'], url: EXACT_IMAGE_OVERRIDES.rajma },
  { keys: ['kabuli chana', 'chole'], url: EXACT_IMAGE_OVERRIDES['kabuli-chana'] },
  { keys: ['black chana', 'kala chana'], url: EXACT_IMAGE_OVERRIDES['black-chana'] },
  { keys: ['mustard oil', 'sarson oil'], url: EXACT_IMAGE_OVERRIDES['mustard-oil'] },
  { keys: ['sunflower oil'], url: EXACT_IMAGE_OVERRIDES['refined-sunflower-oil'] },
  { keys: ['rice bran oil'], url: EXACT_IMAGE_OVERRIDES['rice-bran-oil'] },
  { keys: ['groundnut oil', 'peanut oil'], url: EXACT_IMAGE_OVERRIDES['groundnut-oil'] },
  { keys: ['ghee'], url: EXACT_IMAGE_OVERRIDES.ghee },
  { keys: ['paneer'], url: EXACT_IMAGE_OVERRIDES.paneer },
  { keys: ['curd', 'dahi', 'yogurt'], url: EXACT_IMAGE_OVERRIDES.curd },
  { keys: ['milk powder'], url: EXACT_IMAGE_OVERRIDES['milk-powder'] },
  { keys: ['milk'], url: EXACT_IMAGE_OVERRIDES.milk },
  { keys: ['butter'], url: EXACT_IMAGE_OVERRIDES.butter },
  { keys: ['tomato'], url: EXACT_IMAGE_OVERRIDES.tomato },
  { keys: ['onion'], url: EXACT_IMAGE_OVERRIDES.onion },
  { keys: ['potato'], url: EXACT_IMAGE_OVERRIDES.potato },
  { keys: ['carrot'], url: EXACT_IMAGE_OVERRIDES.carrot },
  { keys: ['cauliflower'], url: EXACT_IMAGE_OVERRIDES.cauliflower },
  { keys: ['cabbage'], url: EXACT_IMAGE_OVERRIDES.cabbage },
  { keys: ['green peas', 'peas'], url: EXACT_IMAGE_OVERRIDES['green-peas'] },
  { keys: ['spinach', 'palak'], url: EXACT_IMAGE_OVERRIDES.spinach },
  { keys: ['cucumber'], url: EXACT_IMAGE_OVERRIDES.cucumber },
  { keys: ['brinjal', 'eggplant', 'baingan'], url: EXACT_IMAGE_OVERRIDES.brinjal },
  { keys: ['ladies finger', 'okra'], url: EXACT_IMAGE_OVERRIDES.okra },
  { keys: ['green chilli', 'green chili'], url: EXACT_IMAGE_OVERRIDES['green-chilli'] },
  { keys: ['ginger garlic paste'], url: EXACT_IMAGE_OVERRIDES['ginger-garlic-paste'] },
  { keys: ['ginger'], url: EXACT_IMAGE_OVERRIDES.ginger },
  { keys: ['garlic'], url: EXACT_IMAGE_OVERRIDES.garlic },
  { keys: ['coriander leaves', 'dhaniya leaves'], url: EXACT_IMAGE_OVERRIDES.coriander },
  { keys: ['lemon'], url: EXACT_IMAGE_OVERRIDES.lemon },
  { keys: ['banana'], url: EXACT_IMAGE_OVERRIDES.banana },
  { keys: ['apple'], url: EXACT_IMAGE_OVERRIDES.apple },
  { keys: ['orange'], url: EXACT_IMAGE_OVERRIDES.orange },
  { keys: ['mango'], url: EXACT_IMAGE_OVERRIDES.mango },
  { keys: ['grapes'], url: EXACT_IMAGE_OVERRIDES.grapes },
  { keys: ['pomegranate'], url: EXACT_IMAGE_OVERRIDES.pomegranate },
  { keys: ['watermelon'], url: EXACT_IMAGE_OVERRIDES.watermelon },
  { keys: ['pineapple'], url: EXACT_IMAGE_OVERRIDES.pineapple },
  { keys: ['papaya'], url: EXACT_IMAGE_OVERRIDES.papaya },
  { keys: ['guava'], url: EXACT_IMAGE_OVERRIDES.guava },
  { keys: ['coconut'], url: EXACT_IMAGE_OVERRIDES.coconut },
  { keys: ['turmeric'], url: EXACT_IMAGE_OVERRIDES['turmeric-powder'] },
  { keys: ['red chilli powder', 'red chili powder'], url: EXACT_IMAGE_OVERRIDES['red-chilli-powder'] },
  { keys: ['coriander powder'], url: EXACT_IMAGE_OVERRIDES['coriander-powder'] },
  { keys: ['cumin', 'jeera'], url: EXACT_IMAGE_OVERRIDES['cumin-seeds'] },
  { keys: ['garam masala'], url: EXACT_IMAGE_OVERRIDES['garam-masala'] },
  { keys: ['biryani masala'], url: EXACT_IMAGE_OVERRIDES['biryani-masala'] },
  { keys: ['chicken masala'], url: EXACT_IMAGE_OVERRIDES['chicken-masala'] },
  { keys: ['fish curry masala'], url: EXACT_IMAGE_OVERRIDES['fish-curry-masala'] },
  { keys: ['kasuri methi'], url: EXACT_IMAGE_OVERRIDES['kasuri-methi'] },
  { keys: ['chicken curry cut', 'chicken'], url: EXACT_IMAGE_OVERRIDES['chicken-curry-cut'] },
  { keys: ['rohu'], url: EXACT_IMAGE_OVERRIDES['rohu-fish'] },
  { keys: ['katla'], url: EXACT_IMAGE_OVERRIDES['katla-fish'] },
  { keys: ['prawn'], url: EXACT_IMAGE_OVERRIDES.prawns },
  { keys: ['bread'], url: EXACT_IMAGE_OVERRIDES.bread },
  { keys: ['potato chips', 'chips'], url: EXACT_IMAGE_OVERRIDES['potato-chips'] },
  { keys: ['bhujia', 'namkeen'], url: EXACT_IMAGE_OVERRIDES.bhujia },
  { keys: ['biscuit', 'cookie'], url: EXACT_IMAGE_OVERRIDES.biscuits },
  { keys: ['popcorn'], url: EXACT_IMAGE_OVERRIDES.popcorn },
  { keys: ['peanut'], url: EXACT_IMAGE_OVERRIDES.peanuts },
  { keys: ['cashew'], url: EXACT_IMAGE_OVERRIDES.cashews },
  { keys: ['almond'], url: EXACT_IMAGE_OVERRIDES.almonds },
  { keys: ['raisin'], url: EXACT_IMAGE_OVERRIDES.raisins },
  { keys: ['chocolate'], url: EXACT_IMAGE_OVERRIDES.chocolate },
  { keys: ['cola', 'coca cola', 'pepsi', 'soft drink'], url: EXACT_IMAGE_OVERRIDES['soft-drink-cola'] },
  { keys: ['fruit juice', 'juice'], url: EXACT_IMAGE_OVERRIDES['fruit-juice'] },
  { keys: ['mineral water', 'bottled water'], url: EXACT_IMAGE_OVERRIDES['mineral-water'] },
  { keys: ['gulab jamun'], url: EXACT_IMAGE_OVERRIDES['gulab-jamun'] },
  { keys: ['rasgulla'], url: EXACT_IMAGE_OVERRIDES.rasgulla },
  { keys: ['detergent'], url: EXACT_IMAGE_OVERRIDES.detergent },
  { keys: ['dishwash', 'dish soap'], url: EXACT_IMAGE_OVERRIDES['dishwash-gel'] },
  { keys: ['floor cleaner'], url: EXACT_IMAGE_OVERRIDES['floor-cleaner'] },
  { keys: ['toilet cleaner'], url: EXACT_IMAGE_OVERRIDES['toilet-cleaner'] },
  { keys: ['toothpaste'], url: EXACT_IMAGE_OVERRIDES.toothpaste },
  { keys: ['toothbrush'], url: EXACT_IMAGE_OVERRIDES.toothbrush },
  { keys: ['shampoo'], url: EXACT_IMAGE_OVERRIDES.shampoo },
  { keys: ['soap'], url: EXACT_IMAGE_OVERRIDES.soap },
  { keys: ['paracetamol'], url: EXACT_IMAGE_OVERRIDES.paracetamol },
];

const CATEGORY_IMAGE_URLS: Record<string, string> = {
  Staples: EXACT_IMAGE_OVERRIDES['basmati-rice'],
  Kirana: EXACT_IMAGE_OVERRIDES['basmati-rice'],
  Flours: EXACT_IMAGE_OVERRIDES['wheat-flour'],
  Pulses: EXACT_IMAGE_OVERRIDES['moong-dal'],
  'Oils & Ghee': EXACT_IMAGE_OVERRIDES['mustard-oil'],
  Spices: EXACT_IMAGE_OVERRIDES['turmeric-powder'],
  Dairy: EXACT_IMAGE_OVERRIDES.milk,
  Eggs: EXACT_IMAGE_OVERRIDES.eggs,
  'Fresh Vegetables': EXACT_IMAGE_OVERRIDES.tomato,
  Vegetables: EXACT_IMAGE_OVERRIDES.tomato,
  'Fresh Fruits': EXACT_IMAGE_OVERRIDES.apple,
  Fruits: EXACT_IMAGE_OVERRIDES.apple,
  'Fresh Herbs': EXACT_IMAGE_OVERRIDES.coriander,
  'Meat & Fish': EXACT_IMAGE_OVERRIDES['chicken-curry-cut'],
  Bakery: EXACT_IMAGE_OVERRIDES.bread,
  Snacks: EXACT_IMAGE_OVERRIDES['potato-chips'],
  Beverages: EXACT_IMAGE_OVERRIDES['soft-drink-cola'],
  Sweets: EXACT_IMAGE_OVERRIDES['gulab-jamun'],
  Household: EXACT_IMAGE_OVERRIDES.detergent,
  'Personal Care': EXACT_IMAGE_OVERRIDES.toothpaste,
  'Medical Store': EXACT_IMAGE_OVERRIDES.paracetamol,
};

const GENERIC_OR_BAD_IMAGE_PATTERNS = [
  'via.placeholder.com',
  'photos/264636/',
  'photos/33239/',
  'photos/4518843/',
  'photos/4239091/',
  'photos/416656/',
  'photos/4198019/',
  'photos/1282279/',
  'photos/1132047/',
  'photos/264537/',
  'photos/587741/',
  'photos/4465831/',
];

export function resolveProductImage(product: ProductImageLike): string {
  const existing = product.image || product.imageUrl || '';
  const exact = findExactOverride(product);
  if (exact) return exact;

  const keyword = findKeywordOverride(product);
  if (keyword) return keyword;

  if (existing && !isGenericImage(existing)) return existing;

  return CATEGORY_IMAGE_URLS[String(product.category || '')] || fallbackProductImage(product.name || product.canonicalName || 'Product');
}

export function fallbackProductImage(name: string): string {
  return productPackImage(name || 'Product', 'KiranaConnect', '#f97316', '#fff7ed');
}

function findExactOverride(product: ProductImageLike): string | undefined {
  const candidates = [
    product.id,
    product.canonicalName,
    product.normalizedName,
    ...(product.ingredientIds || []),
    ...(product.aliases || []),
  ]
    .filter(Boolean)
    .map((value) => slugify(String(value)));

  for (const candidate of candidates) {
    const image = EXACT_IMAGE_OVERRIDES[candidate];
    if (image) return image;
  }

  return undefined;
}

function findKeywordOverride(product: ProductImageLike): string | undefined {
  const haystack = normalize(
    [
      product.canonicalName,
      product.normalizedName,
      product.name,
      product.category,
      product.subcategory,
      ...(product.ingredientIds || []),
      ...(product.aliases || []),
    ]
      .filter(Boolean)
      .join(' '),
  );

  return KEYWORD_IMAGE_RULES.find((rule) => rule.keys.some((key) => haystack.includes(normalize(key))))?.url;
}

function isGenericImage(url: string): boolean {
  return GENERIC_OR_BAD_IMAGE_PATTERNS.some((pattern) => url.includes(pattern));
}

function slugify(value: string): string {
  return normalize(value).replace(/\s+/g, '-');
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(\d+)\s*(kg|g|gm|ml|l|pcs?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function productPackImage(name: string, subtitle: string, accent: string, background: string): string {
  const safeName = stripUnsafeText(name || 'Product');
  const safeSubtitle = stripUnsafeText(subtitle || 'Product');
  const lines = wrapText(safeName, 18, 3);
  const lineElements = lines
    .map((line, index) => {
      const y = 128 + index * 28;
      return `<text x="160" y="${y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="#111827">${line}</text>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420">
    <rect width="420" height="420" rx="36" fill="${background}"/>
    <rect x="74" y="42" width="272" height="336" rx="30" fill="#ffffff" stroke="${accent}" stroke-width="8"/>
    <rect x="94" y="66" width="232" height="42" rx="18" fill="${accent}"/>
    <text x="210" y="94" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="800" fill="#ffffff">${safeSubtitle}</text>
    <circle cx="210" cy="198" r="54" fill="${background}" stroke="${accent}" stroke-width="6"/>
    <path d="M178 198h64M210 166v64" stroke="${accent}" stroke-width="10" stroke-linecap="round" opacity=".55"/>
    ${lineElements}
    <rect x="112" y="310" width="196" height="42" rx="16" fill="${accent}"/>
    <text x="210" y="337" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="#ffffff">PRODUCT IMAGE</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

function wrapText(value: string, maxChars: number, maxLines: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });

  if (current) lines.push(current);
  const trimmed = lines.slice(0, maxLines);
  if (lines.length > maxLines && trimmed.length > 0) {
    trimmed[trimmed.length - 1] = `${trimmed[trimmed.length - 1].slice(0, maxChars - 1)}...`;
  }
  return trimmed.length > 0 ? trimmed : ['Product'];
}

function stripUnsafeText(value: string): string {
  return value.replace(/[<>&'"]/g, '').slice(0, 60);
}
