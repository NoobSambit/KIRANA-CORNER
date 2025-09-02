export type CatalogItem = { name: string; price: number; description: string; image: string };
export type Catalog = Record<string, CatalogItem[]>;

// Seed catalog sourced from seeding script (condensed to run locally without network calls)
export const productCatalog: Catalog = {
  'Medical Store': [
    { name: 'Paracetamol 500mg (10 tablets)', price: 15, description: 'Effective pain relief and fever reducer', image: 'https://digitalcontent.api.tesco.com/v2/media/ghs/c322593f-ea2e-4b4e-adec-cd908a717551/61a7b7b3-e1a0-4335-862d-9dc170dc4511_1042002236.jpeg?h=960&w=960' },
    { name: 'Cough Syrup 100ml', price: 85, description: 'Relieves cough and throat irritation', image: 'https://m.media-amazon.com/images/I/51Mq6JyiT1L._UF1000,1000_QL80_.jpg' },
    { name: 'Bandage Roll 5m', price: 45, description: 'Sterile bandage for wound dressing', image: 'https://m.media-amazon.com/images/I/81Gb3BwmkdL.jpg' },
    { name: 'Vitamin C 1000mg (30 tablets)', price: 120, description: 'Boosts immunity and overall health', image: 'https://cdn01.pharmeasy.in/dam/products/277120/health-aid-vitamin-c-1000mg-pr-tab-30s-3-1641535419.jpg' },
    { name: 'Antiseptic Solution 100ml', price: 65, description: 'Cleanses wounds and prevents infection', image: 'https://www.noworry.in/cdn/shop/files/51fFgtFBshL._SL1000_c23965dd-dc61-4fb7-85a9-10ed22cf2d06.jpg?v=1741467320' },
    { name: 'Thermometer Digital', price: 250, description: 'Accurate body temperature measurement', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMV94uLA9u7BaZGQxoZqRRR-YwfuItLcWkOg&s' },
    { name: 'First Aid Kit', price: 350, description: 'Complete emergency medical kit', image: 'https://firstaidsuppliesonline.com/wp-content/uploads/2023/10/68-BANSI-RR.png' },
    { name: 'Pain Relief Gel 50g', price: 95, description: 'Topical pain relief for muscle aches', image: 'https://www.drscholls.com/cdn/shop/files/888853003863_Aid_Hydrogel_Patches_12Hour_PainRelief_ATF_01.jpg?v=1736521516' },
    { name: 'Blood Pressure Monitor', price: 1200, description: 'Digital BP monitor for home use', image: 'https://shop.medtechlife.com/cdn/shop/files/2_b88a885a-7f24-4ec4-8d0b-106ea3768a45_700x700.png?v=1687777383' },
    { name: 'Diabetes Test Strips (50)', price: 180, description: 'Glucose monitoring test strips', image: 'https://m.media-amazon.com/images/I/614kGUJTB8L._UF1000,1000_QL80_.jpg' },
    { name: 'Eye Drops 10ml', price: 75, description: 'Relieves dry eyes and irritation', image: 'https://www.practostatic.com/practopedia-images/v3/res-750/moistane-eye-drops-10ml_39324763-7de6-44af-bf8a-2469b9a01124.JPG' },
    { name: 'Surgical Mask (Pack of 10)', price: 40, description: '3-ply surgical face masks', image: 'https://www.jiomart.com/images/product/original/rvciamwehg/fabaura-100-certified-surgical-masks-blue-3-ply-mask-pack-of-50-pcs-pollution-mask-face-mask-03-surgical-mask-03-washable-reusable-water-resistant-surgical-mask-with-melt-blown-fabric-layer-product-images-orvciamwehg-p595738854-0-202211272027.png?im=Resize=(1000,1000)' }
  ],
  'Kirana': [
    { name: 'Basmati Rice 1kg', price: 120, description: 'Premium long grain basmati rice', image: 'https://m.media-amazon.com/images/I/716IEKwQvoL.jpg' },
    { name: 'Wheat Flour 2kg', price: 80, description: 'Fine wheat flour for cooking', image: 'https://odhi.in/image/cache/catalog/grocery/flour-rava/aashirvaad-atta-whole-wheat-2-kg-front-sale-online-coimbatore-1000x1000.jpg' },
    { name: 'Turmeric Powder 100g', price: 45, description: 'Pure turmeric powder for cooking', image: 'https://www.bbassets.com/media/uploads/p/l/40019828_4-catch-turmeric-powder.jpg' },
    { name: 'Red Chilli Powder 100g', price: 35, description: 'Spicy red chilli powder', image: 'https://m.media-amazon.com/images/I/611XUlpeUYL.jpg' },
    { name: 'Coriander Powder 100g', price: 40, description: 'Aromatic coriander powder', image: 'https://shop.mtrfoods.com/cdn/shop/products/CorianderPowder-100g-frontcopy.png?v=1611249400' },
    { name: 'Cumin Seeds 100g', price: 50, description: 'Whole cumin seeds for tempering', image: 'https://www.tatanutrikorner.com/cdn/shop/files/cumin_100.png?v=1748858411' },
    { name: 'Mustard Oil 1L', price: 180, description: 'Pure mustard oil for cooking', image: 'https://www.bbassets.com/media/uploads/p/xl/276756_11-fortune-fortune-premium-kachi-ghani-pure-mustard-oil.jpg' },
    { name: 'Sugar 1kg', price: 55, description: 'Refined white sugar', image: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_600/d1dbda41b751502bebc6c210e1329635' },
    { name: 'Salt 1kg', price: 20, description: 'Iodized table salt', image: 'https://m.media-amazon.com/images/I/614mm2hYHyL._UF894,1000_QL80_.jpg' },
    { name: 'Dal Chana 500g', price: 60, description: 'Split chickpea lentils', image: 'https://m.media-amazon.com/images/I/61NZt0SHUgL._UF1000,1000_QL80_.jpg' },
    { name: 'Dal Moong 500g', price: 70, description: 'Split green gram lentils', image: 'https://www.tatanutrikorner.com/cdn/shop/files/Tata-Sampann-Moong-Dal-500g-_FOP_-with-Sanjeev-kapoor.png?v=1748858300&width=1946' },
    { name: 'Tea Leaves 250g', price: 90, description: 'Premium black tea leaves', image: 'https://m.media-amazon.com/images/I/61T8+u9yJQL.jpg' }
  ],
  'Dairy': [
    { name: 'Amul Fresh Milk 1L', price: 60, description: 'Pure cow milk, pasteurized', image: 'https://www.bbassets.com/media/uploads/p/l/306926_4-amul-homogenised-toned-milk.jpg' },
    { name: 'Curd 500g', price: 40, description: 'Fresh homemade curd', image: 'https://www.bbassets.com/media/uploads/p/l/40332424_1-amul-curd-creamy-tasty.jpg' },
    { name: 'Butter 100g', price: 55, description: 'Pure butter for cooking', image: 'https://www.bbassets.com/media/uploads/p/xl/104860_8-amul-butter-pasteurised.jpg' },
    { name: 'Paneer 200g', price: 80, description: 'Fresh cottage cheese', image: 'https://www.bbassets.com/media/uploads/p/l/40096747_8-amul-malai-fresh-paneer.jpg' },
    { name: 'Ghee 500ml', price: 250, description: 'Pure clarified butter', image: 'https://m.media-amazon.com/images/I/81DaNTeNErL._UF1000,1000_QL80_.jpg' },
    { name: 'Cheese Slice (10 pieces)', price: 120, description: 'Processed cheese slices', image: 'https://m.media-amazon.com/images/I/710E8gugmfL.jpg' },
    { name: 'Yogurt 400g', price: 45, description: 'Greek style yogurt', image: 'https://m.media-amazon.com/images/I/51gc4bxCBuL.jpg' },
    { name: 'Cream 200ml', price: 65, description: 'Fresh dairy cream', image: 'https://m.media-amazon.com/images/I/713SesS87nL.jpg' },
    { name: 'Milk Powder 500g', price: 180, description: 'Instant milk powder', image: 'https://www.jiomart.com/images/product/original/490011303/amulya-dairy-whitener-500-g-pouch-product-images-o490011303-p490011303-0-202203170156.jpg?im=Resize=(1000,1000)' },
    { name: 'Condensed Milk 400g', price: 75, description: 'Sweetened condensed milk', image: 'https://www.recipes.com.au/sites/default/files/2020-07/1.-NESTLE%CC%81-SWEETENED-CONDENSED-MILK-.png' },
    { name: 'Buttermilk 1L', price: 35, description: 'Fresh buttermilk', image: 'https://www.jiomart.com/images/product/original/491282411/amul-buttermilk-1-l-product-images-o491282411-p607702707-0-202402021433.jpg?im=Resize=(420,420)' },
    { name: 'Ice Cream 500ml', price: 150, description: 'Vanilla ice cream', image: 'https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/owm6jrj3icaujc89gsf5' }
  ],
  'Vegetables': [
    { name: 'Fresh Tomatoes 1kg', price: 40, description: 'Red ripe tomatoes', image: 'https://via.placeholder.com/150?text=Tomatoes' },
    { name: 'Onions 1kg', price: 30, description: 'Fresh white onions', image: 'https://via.placeholder.com/150?text=Onions' },
    { name: 'Potatoes 1kg', price: 25, description: 'Fresh potatoes', image: 'https://via.placeholder.com/150?text=Potatoes' },
    { name: 'Carrots 500g', price: 35, description: 'Fresh orange carrots', image: 'https://via.placeholder.com/150?text=Carrots' },
    { name: 'Cabbage 1kg', price: 20, description: 'Fresh green cabbage', image: 'https://via.placeholder.com/150?text=Cabbage' },
    { name: 'Cauliflower 1kg', price: 45, description: 'Fresh white cauliflower', image: 'https://via.placeholder.com/150?text=Cauliflower' },
    { name: 'Green Peas 500g', price: 50, description: 'Fresh green peas', image: 'https://via.placeholder.com/150?text=Green+Peas' },
    { name: 'Spinach 250g', price: 25, description: 'Fresh spinach leaves', image: 'https://via.placeholder.com/150?text=Spinach' },
    { name: 'Cucumber 500g', price: 30, description: 'Fresh cucumbers', image: 'https://via.placeholder.com/150?text=Cucumbers' },
    { name: 'Brinjal 500g', price: 35, description: 'Fresh purple brinjal', image: 'https://via.placeholder.com/150?text=Brinjal' },
    { name: 'Ladies Finger 500g', price: 40, description: 'Fresh okra', image: 'https://via.placeholder.com/150?text=Ladies+Finger' },
    { name: 'Green Chillies 100g', price: 15, description: 'Fresh green chillies', image: 'https://via.placeholder.com/150?text=Chillies' }
  ],
  'Fruits': [
    { name: 'Bananas 1kg', price: 50, description: 'Fresh yellow bananas', image: 'https://via.placeholder.com/150?text=Bananas' },
    { name: 'Apples 1kg', price: 120, description: 'Fresh red apples', image: 'https://via.placeholder.com/150?text=Apples' },
    { name: 'Oranges 1kg', price: 80, description: 'Fresh sweet oranges', image: 'https://via.placeholder.com/150?text=Oranges' },
    { name: 'Mangoes 1kg', price: 100, description: 'Fresh ripe mangoes', image: 'https://via.placeholder.com/150?text=Mangoes' },
    { name: 'Grapes 500g', price: 90, description: 'Fresh green grapes', image: 'https://via.placeholder.com/150?text=Grapes' },
    { name: 'Pomegranate 1kg', price: 150, description: 'Fresh pomegranate', image: 'https://via.placeholder.com/150?text=Pomegranate' },
    { name: 'Watermelon 1kg', price: 30, description: 'Fresh watermelon', image: 'https://via.placeholder.com/150?text=Watermelon' },
    { name: 'Pineapple 1kg', price: 60, description: 'Fresh pineapple', image: 'https://via.placeholder.com/150?text=Pineapple' },
    { name: 'Papaya 1kg', price: 40, description: 'Fresh ripe papaya', image: 'https://via.placeholder.com/150?text=Papaya' },
    { name: 'Guava 500g', price: 35, description: 'Fresh guava', image: 'https://via.placeholder.com/150?text=Guava' },
    { name: 'Coconut 2 pieces', price: 50, description: 'Fresh green coconut', image: 'https://via.placeholder.com/150?text=Coconut' },
    { name: 'Lemon 500g', price: 25, description: 'Fresh lemons', image: 'https://via.placeholder.com/150?text=Lemons' }
  ],
  'Snacks': [
    { name: 'Kurkure 100g', price: 20, description: 'Spicy snack chips', image: 'https://via.placeholder.com/150?text=Kurkure' },
    { name: "Lay's Chips 100g", price: 25, description: 'Potato chips', image: 'https://via.placeholder.com/150?text=Lay\'s+Chips' },
    { name: 'Haldiram Namkeen 200g', price: 45, description: 'Traditional namkeen', image: 'https://via.placeholder.com/150?text=Haldiram+Namkeen' },
    { name: 'Biscuits Pack (10 pieces)', price: 30, description: 'Sweet biscuits', image: 'https://via.placeholder.com/150?text=Biscuits' },
    { name: 'Popcorn 100g', price: 35, description: 'Butter popcorn', image: 'https://via.placeholder.com/150?text=Popcorn' },
    { name: 'Peanuts 250g', price: 40, description: 'Roasted peanuts', image: 'https://via.placeholder.com/150?text=Peanuts' },
    { name: 'Cashews 100g', price: 120, description: 'Premium cashews', image: 'https://via.placeholder.com/150?text=Cashews' },
    { name: 'Almonds 100g', price: 150, description: 'Premium almonds', image: 'https://via.placeholder.com/150?text=Almonds' },
    { name: 'Raisins 200g', price: 60, description: 'Dried raisins', image: 'https://via.placeholder.com/150?text=Raisins' },
    { name: 'Chocolate Bar 100g', price: 50, description: 'Milk chocolate bar', image: 'https://via.placeholder.com/150?text=Chocolate+Bar' },
    { name: 'Candy Pack (20 pieces)', price: 25, description: 'Assorted candies', image: 'https://via.placeholder.com/150?text=Candy+Pack' },
    { name: 'Cheese Balls 100g', price: 30, description: 'Cheese flavored snacks', image: 'https://via.placeholder.com/150?text=Cheese+Balls' }
  ],
  'Beverages': [
    { name: 'Coca Cola 500ml', price: 25, description: 'Refreshing cola drink', image: 'https://via.placeholder.com/150?text=Coca+Cola' },
    { name: 'Pepsi 500ml', price: 25, description: 'Carbonated soft drink', image: 'https://via.placeholder.com/150?text=Pepsi' },
    { name: 'Sprite 500ml', price: 25, description: 'Lemon-lime soda', image: 'https://via.placeholder.com/150?text=Sprite' },
    { name: 'Fanta 500ml', price: 25, description: 'Orange flavored soda', image: 'https://via.placeholder.com/150?text=Fanta' },
    { name: 'Thumbs Up 500ml', price: 25, description: 'Strong cola drink', image: 'https://via.placeholder.com/150?text=Thumbs+Up' },
    { name: 'Limca 500ml', price: 25, description: 'Lemon soda', image: 'https://via.placeholder.com/150?text=Limca' },
    { name: '7UP 500ml', price: 25, description: 'Clear lemon-lime soda', image: 'https://via.placeholder.com/150?text=7UP' },
    { name: 'Mountain Dew 500ml', price: 25, description: 'Citrus flavored soda', image: 'https://via.placeholder.com/150?text=Mountain+Dew' },
    { name: 'Fruit Juice 1L', price: 80, description: 'Mixed fruit juice', image: 'https://via.placeholder.com/150?text=Fruit+Juice' },
    { name: 'Energy Drink 250ml', price: 45, description: 'Energy booster drink', image: 'https://via.placeholder.com/150?text=Energy+Drink' },
    { name: 'Mineral Water 1L', price: 20, description: 'Pure mineral water', image: 'https://via.placeholder.com/150?text=Mineral+Water' },
    { name: 'Coffee Powder 100g', price: 75, description: 'Instant coffee powder', image: 'https://via.placeholder.com/150?text=Coffee+Powder' }
  ],
  'Personal Care': [
    { name: 'Colgate Toothpaste 100g', price: 85, description: 'Fresh mint toothpaste', image: 'https://via.placeholder.com/150?text=Colgate+Toothpaste' },
    { name: 'Toothbrush', price: 45, description: 'Soft bristle toothbrush', image: 'https://via.placeholder.com/150?text=Toothbrush' },
    { name: 'Soap Bar 100g', price: 35, description: 'Antibacterial soap', image: 'https://via.placeholder.com/150?text=Soap+Bar' },
    { name: 'Shampoo 200ml', price: 120, description: 'Hair care shampoo', image: 'https://via.placeholder.com/150?text=Shampoo' },
    { name: 'Body Wash 250ml', price: 150, description: 'Refreshing body wash', image: 'https://via.placeholder.com/150?text=Body+Wash' },
    { name: 'Deodorant 150ml', price: 95, description: 'Long-lasting deodorant', image: 'https://via.placeholder.com/150?text=Deodorant' },
    { name: 'Face Cream 50g', price: 180, description: 'Moisturizing face cream', image: 'https://via.placeholder.com/150?text=Face+Cream' },
    { name: 'Hair Oil 100ml', price: 65, description: 'Coconut hair oil', image: 'https://via.placeholder.com/150?text=Hair+Oil' },
    { name: 'Sanitary Pads (10 pieces)', price: 55, description: 'Comfortable sanitary pads', image: 'https://via.placeholder.com/150?text=Sanitary+Pads' },
    { name: 'Razor Blades (5 pieces)', price: 40, description: 'Sharp razor blades', image: 'https://via.placeholder.com/150?text=Razor+Blades' },
    { name: 'Nail Cutter', price: 25, description: 'Stainless steel nail cutter', image: 'https://via.placeholder.com/150?text=Nail+Cutter' },
    { name: 'Hair Comb', price: 30, description: 'Plastic hair comb', image: 'https://via.placeholder.com/150?text=Hair+Comb' }
  ],
  'Household': [
    { name: 'Detergent Powder 1kg', price: 120, description: 'Washing machine detergent', image: 'https://via.placeholder.com/150?text=Detergent+Powder' },
    { name: 'Dish Soap 500ml', price: 85, description: 'Liquid dish cleaner', image: 'https://via.placeholder.com/150?text=Dish+Soap' },
    { name: 'Floor Cleaner 1L', price: 95, description: 'Multi-surface cleaner', image: 'https://via.placeholder.com/150?text=Floor+Cleaner' },
    { name: 'Toilet Cleaner 500ml', price: 75, description: 'Bathroom cleaner', image: 'https://via.placeholder.com/150?text=Toilet+Cleaner' },
    { name: 'Air Freshener 200ml', price: 65, description: 'Room freshener spray', image: 'https://via.placeholder.com/150?text=Air+Freshener' },
    { name: 'Tissue Paper (6 rolls)', price: 45, description: 'Soft tissue paper', image: 'https://via.placeholder.com/150?text=Tissue+Paper' },
    { name: 'Paper Towels (2 rolls)', price: 35, description: 'Absorbent paper towels', image: 'https://via.placeholder.com/150?text=Paper+Towels' },
    { name: 'Garbage Bags (10 pieces)', price: 55, description: 'Large garbage bags', image: 'https://via.placeholder.com/150?text=Garbage+Bags' },
    { name: 'Matchbox (10 pieces)', price: 25, description: 'Safety matches', image: 'https://via.placeholder.com/150?text=Matchbox' },
    { name: 'Candles (5 pieces)', price: 40, description: 'Emergency candles', image: 'https://via.placeholder.com/150?text=Candles' },
    { name: 'Mosquito Repellent', price: 85, description: 'Mosquito coil pack', image: 'https://via.placeholder.com/150?text=Mosquito+Repellent' },
    { name: 'Broom', price: 75, description: 'Plastic broom', image: 'https://via.placeholder.com/150?text=Broom' }
  ],
  'Bakery': [
    { name: 'White Bread 400g', price: 35, description: 'Fresh white bread', image: 'https://via.placeholder.com/150?text=White+Bread' },
    { name: 'Brown Bread 400g', price: 45, description: 'Whole wheat bread', image: 'https://via.placeholder.com/150?text=Brown+Bread' },
    { name: 'Bun Pack (6 pieces)', price: 30, description: 'Soft dinner buns', image: 'https://via.placeholder.com/150?text=Bun+Pack' },
    { name: 'Croissant', price: 25, description: 'Buttery croissant', image: 'https://via.placeholder.com/150?text=Croissant' },
    { name: 'Cake Slice', price: 40, description: 'Chocolate cake slice', image: 'https://via.placeholder.com/150?text=Cake+Slice' },
    { name: 'Cookies Pack (10 pieces)', price: 50, description: 'Sweet cookies', image: 'https://via.placeholder.com/150?text=Cookies' },
    { name: 'Muffin', price: 35, description: 'Blueberry muffin', image: 'https://via.placeholder.com/150?text=Muffin' },
    { name: 'Donut', price: 30, description: 'Glazed donut', image: 'https://via.placeholder.com/150?text=Donut' },
    { name: 'Pizza Base', price: 40, description: 'Ready-to-use pizza base', image: 'https://via.placeholder.com/150?text=Pizza+Base' },
    { name: 'Pastry', price: 45, description: 'Cream pastry', image: 'https://via.placeholder.com/150?text=Pastry' },
    { name: 'Rusk Pack (10 pieces)', price: 25, description: 'Crispy rusk', image: 'https://via.placeholder.com/150?text=Rusk+Pack' },
    { name: 'Biscotti', price: 55, description: 'Italian biscotti', image: 'https://via.placeholder.com/150?text=Biscotti' }
  ],
  'Spices': [
    { name: 'Black Pepper 100g', price: 85, description: 'Whole black peppercorns', image: 'https://via.placeholder.com/150?text=Black+Pepper' },
    { name: 'Cardamom 50g', price: 120, description: 'Green cardamom pods', image: 'https://via.placeholder.com/150?text=Cardamom' },
    { name: 'Cinnamon 100g', price: 95, description: 'Ground cinnamon powder', image: 'https://via.placeholder.com/150?text=Cinnamon' },
    { name: 'Cloves 50g', price: 75, description: 'Whole cloves', image: 'https://via.placeholder.com/150?text=Cloves' },
    { name: 'Bay Leaves 50g', price: 45, description: 'Dried bay leaves', image: 'https://via.placeholder.com/150?text=Bay+Leaves' },
    { name: 'Nutmeg 50g', price: 110, description: 'Ground nutmeg', image: 'https://via.placeholder.com/150?text=Nutmeg' },
    { name: 'Star Anise 50g', price: 90, description: 'Whole star anise', image: 'https://via.placeholder.com/150?text=Star+Anise' },
    { name: 'Fennel Seeds 100g', price: 65, description: 'Sweet fennel seeds', image: 'https://via.placeholder.com/150?text=Fennel+Seeds' },
    { name: 'Mustard Seeds 100g', price: 55, description: 'Yellow mustard seeds', image: 'https://via.placeholder.com/150?text=Mustard+Seeds' },
    { name: 'Fenugreek Seeds 100g', price: 45, description: 'Methi seeds', image: 'https://via.placeholder.com/150?text=Fenugreek+Seeds' },
    { name: 'Asafoetida 50g', price: 35, description: 'Hing powder', image: 'https://via.placeholder.com/150?text=Asafoetida' },
    { name: 'Garam Masala 100g', price: 85, description: 'Mixed spice powder', image: 'https://via.placeholder.com/150?text=Garam+Masala' }
  ],
  'Meat & Fish': [
    { name: 'Chicken Breast 500g', price: 200, description: 'Fresh chicken breast', image: 'https://via.placeholder.com/150?text=Chicken+Breast' },
    { name: 'Chicken Legs 500g', price: 180, description: 'Fresh chicken legs', image: 'https://via.placeholder.com/150?text=Chicken+Legs' },
    { name: 'Mutton 500g', price: 350, description: 'Fresh mutton pieces', image: 'https://via.placeholder.com/150?text=Mutton' },
    { name: 'Fish Fillet 500g', price: 250, description: 'Fresh fish fillet', image: 'https://via.placeholder.com/150?text=Fish+Fillet' },
    { name: 'Prawns 500g', price: 400, description: 'Fresh prawns', image: 'https://via.placeholder.com/150?text=Prawns' },
    { name: 'Eggs (12 pieces)', price: 80, description: 'Fresh farm eggs', image: 'https://via.placeholder.com/150?text=Eggs' },
    { name: 'Sausages 250g', price: 150, description: 'Chicken sausages', image: 'https://via.placeholder.com/150?text=Sausages' },
    { name: 'Bacon 200g', price: 180, description: 'Smoked bacon', image: 'https://via.placeholder.com/150?text=Bacon' },
    { name: 'Ham 200g', price: 160, description: 'Sliced ham', image: 'https://via.placeholder.com/150?text=Ham' },
    { name: 'Salmon 300g', price: 450, description: 'Fresh salmon fillet', image: 'https://via.placeholder.com/150?text=Salmon' },
    { name: 'Tuna 200g', price: 120, description: 'Canned tuna', image: 'https://via.placeholder.com/150?text=Tuna' },
    { name: 'Crab 500g', price: 300, description: 'Fresh crab', image: 'https://via.placeholder.com/150?text=Crab' }
  ],
  'Sweets': [
    { name: 'Rasgulla (6 pieces)', price: 80, description: 'Bengali sweet rasgulla', image: 'https://via.placeholder.com/150?text=Rasgulla' },
    { name: 'Gulab Jamun (8 pieces)', price: 90, description: 'Sweet gulab jamun', image: 'https://via.placeholder.com/150?text=Gulab+Jamun' },
    { name: 'Jalebi (250g)', price: 60, description: 'Crispy jalebi', image: 'https://via.placeholder.com/150?text=Jalebi' },
    { name: 'Ladoo (6 pieces)', price: 70, description: 'Besan ladoo', image: 'https://via.placeholder.com/150?text=Ladoo' },
    { name: 'Barfi (8 pieces)', price: 85, description: 'Milk barfi', image: 'https://via.placeholder.com/150?text=Barfi' },
    { name: 'Sandesh (6 pieces)', price: 75, description: 'Bengali sandesh', image: 'https://via.placeholder.com/150?text=Sandesh' },
    { name: 'Rasmalai (4 pieces)', price: 95, description: 'Creamy rasmalai', image: 'https://via.placeholder.com/150?text=Rasmalai' },
    { name: 'Kheer 500g', price: 65, description: 'Rice pudding', image: 'https://via.placeholder.com/150?text=Kheer' },
    { name: 'Halwa 250g', price: 55, description: 'Carrot halwa', image: 'https://via.placeholder.com/150?text=Halwa' },
    { name: 'Pedha (8 pieces)', price: 80, description: 'Milk pedha', image: 'https://via.placeholder.com/150?text=Pedha' },
    { name: 'Cham Cham (6 pieces)', price: 70, description: 'Bengali cham cham', image: 'https://via.placeholder.com/150?text=Cham+Cham' },
    { name: 'Misti Doi 200g', price: 45, description: 'Sweet yogurt', image: 'https://via.placeholder.com/150?text=Misti+Doi' }
  ],
  'Electronics': [
    { name: 'USB Type-C Cable 1m', price: 150, description: 'Fast charging USB-C cable', image: 'https://via.placeholder.com/150?text=USB+Cable' },
    { name: 'Power Bank 10000mAh', price: 1200, description: 'Portable charger for mobile devices', image: 'https://via.placeholder.com/150?text=Power+Bank' },
    { name: 'Bluetooth Earphones', price: 800, description: 'Wireless earphones with mic', image: 'https://via.placeholder.com/150?text=Bluetooth+Earphones' },
    { name: 'Phone Charger 2A', price: 250, description: 'Fast wall charger adapter', image: 'https://via.placeholder.com/150?text=Phone+Charger' },
    { name: 'HDMI Cable 2m', price: 180, description: 'High definition video cable', image: 'https://via.placeholder.com/150?text=HDMI+Cable' },
    { name: 'Memory Card 32GB', price: 350, description: 'Class 10 microSD card', image: 'https://via.placeholder.com/150?text=Memory+Card' },
    { name: 'Phone Stand', price: 120, description: 'Adjustable phone holder', image: 'https://via.placeholder.com/150?text=Phone+Stand' },
    { name: 'Screen Protector', price: 80, description: 'Tempered glass screen guard', image: 'https://via.placeholder.com/150?text=Screen+Protector' },
    { name: 'Wireless Mouse', price: 450, description: 'Optical wireless mouse', image: 'https://via.placeholder.com/150?text=Wireless+Mouse' },
    { name: 'Keyboard USB', price: 600, description: 'Wired USB keyboard', image: 'https://via.placeholder.com/150?text=Keyboard+USB' },
    { name: 'LED Bulb 9W', price: 75, description: 'Energy efficient LED bulb', image: 'https://via.placeholder.com/150?text=LED+Bulb' },
    { name: 'Extension Board', price: 200, description: '6-socket extension board', image: 'https://via.placeholder.com/150?text=Extension+Board' }
  ],
  'Stationery': [
    { name: 'Blue Pen (Pack of 5)', price: 25, description: 'Smooth writing ballpoint pens', image: 'https://via.placeholder.com/150?text=Blue+Pen' },
    { name: 'Notebook A4 100 pages', price: 45, description: 'Spiral bound notebook', image: 'https://via.placeholder.com/150?text=Notebook' },
    { name: 'Pencil Set (12 pieces)', price: 30, description: 'HB graphite pencils', image: 'https://via.placeholder.com/150?text=Pencil+Set' },
    { name: 'Eraser Pack (5 pieces)', price: 15, description: 'Soft white erasers', image: 'https://via.placeholder.com/150?text=Eraser+Pack' },
    { name: 'Sharpener', price: 10, description: 'Pencil sharpener with container', image: 'https://via.placeholder.com/150?text=Sharpener' },
    { name: 'File Folder A4', price: 35, description: 'Plastic file folder', image: 'https://via.placeholder.com/150?text=File+Folder' },
    { name: 'Stapler', price: 85, description: 'Office stapler with pins', image: 'https://via.placeholder.com/150?text=Stapler' },
    { name: 'Sticky Notes (100 sheets)', price: 40, description: 'Colorful sticky notes', image: 'https://via.placeholder.com/150?text=Sticky+Notes' },
    { name: 'Ruler 30cm', price: 20, description: 'Plastic measuring ruler', image: 'https://via.placeholder.com/150?text=Ruler' },
    { name: 'Glue Stick 20g', price: 25, description: 'Non-toxic glue stick', image: 'https://via.placeholder.com/150?text=Glue+Stick' },
    { name: 'Scissors', price: 65, description: 'Office scissors', image: 'https://via.placeholder.com/150?text=Scissors' },
    { name: 'Calculator', price: 150, description: 'Basic calculator', image: 'https://via.placeholder.com/150?text=Calculator' }
  ]
};

export const allCatalogItems = (): { item: CatalogItem; category: string }[] => {
  const out: { item: CatalogItem; category: string }[] = [];
  for (const [category, items] of Object.entries(productCatalog)) {
    items.forEach((item) => out.push({ item, category }));
  }
  return out;
};


