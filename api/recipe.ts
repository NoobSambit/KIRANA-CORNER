import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enhanced CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  // Enhanced logging for debugging
  console.log('🚀 Recipe API called');
  console.log('📝 Request method:', req.method);
  console.log('📝 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('📝 Request body:', req.body);
  console.log('📝 Request query:', req.query);
  console.log('📝 Request URL:', req.url);

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.',
      received_method: req.method,
      allowed_methods: ['POST'],
      debug_info: {
        url: req.url,
        headers: req.headers
      }
    });
  }

  try {
    console.log('✅ POST request received, processing...');
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('🍳 Generating recipe for:', query);

    // For now, just use fallback recipes to ensure it works
    console.log('📝 Generating fallback recipe...');
    const recipe = generateFallbackRecipe(query);

    console.log('✅ Final recipe:', recipe);

    // STEP 2: For now, return mock inventory data (we'll implement real matching later)
    const inventoryMatch = {
      available: [
        {
          ingredient: recipe.ingredients[0] || "onions",
          product: {
            id: "mock1",
            name: "Fresh Onions",
            price: 30,
            image: "https://via.placeholder.com/100"
          },
          shop: {
            id: "shop1",
            name: "Local Grocery Store",
            address: "Near you"
          }
        }
      ],
      unavailable: recipe.ingredients.slice(3) || [],
      alternatives: [
        {
          ingredient: recipe.ingredients[1] || "tomatoes",
          alternative: {
            id: "mock2",
            name: "Cherry Tomatoes",
            price: 50,
            image: "https://via.placeholder.com/100"
          },
          shop: {
            id: "shop1",
            name: "Local Grocery Store",
            address: "Near you"
          }
        }
      ]
    };

    // STEP 3: Prepare final response
    const response = {
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      inventoryMatch
    };

    console.log('✅ Sending response:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Recipe generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate recipe',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Fallback recipe generation function
function generateFallbackRecipe(query: string) {
  const recipes = {
    'chicken curry': {
      title: 'Classic Chicken Curry',
      description: 'A rich and flavorful chicken curry with aromatic spices, perfect for dinner.',
      ingredients: ['chicken', 'onions', 'tomatoes', 'garlic', 'ginger', 'curry powder', 'coconut milk', 'oil', 'salt', 'cilantro'],
      instructions: [
        'Heat oil in a large pan over medium heat',
        'Add diced onions and cook until golden brown',
        'Add minced garlic and ginger, cook for 1 minute',
        'Add chicken pieces and brown on all sides',
        'Add tomatoes and curry powder, cook for 5 minutes',
        'Pour in coconut milk and simmer for 20 minutes',
        'Season with salt and garnish with cilantro',
        'Serve hot with rice'
      ]
    },
    'pasta': {
      title: 'Simple Pasta Recipe',
      description: 'Quick and easy pasta dish that\'s perfect for any meal.',
      ingredients: ['pasta', 'olive oil', 'garlic', 'tomatoes', 'basil', 'parmesan cheese', 'salt', 'black pepper'],
      instructions: [
        'Boil water in a large pot with salt',
        'Add pasta and cook according to package directions',
        'Heat olive oil in a pan, add minced garlic',
        'Add diced tomatoes and cook for 5 minutes',
        'Drain pasta and add to the pan',
        'Toss with fresh basil and parmesan cheese',
        'Season with salt and pepper',
        'Serve immediately'
      ]
    }
  };

  // Find matching recipe or create generic one
  const lowerQuery = query.toLowerCase();
  
  for (const [key, recipe] of Object.entries(recipes)) {
    if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
      return recipe;
    }
  }

  // Generic fallback recipe
  return {
    title: `Recipe for ${query}`,
    description: 'A delicious homemade recipe crafted just for you!',
    ingredients: ['main ingredient', 'onions', 'garlic', 'spices', 'oil', 'salt'],
    instructions: [
      'Prepare all ingredients by washing and chopping',
      'Heat oil in a pan over medium heat',
      'Add aromatics and cook until fragrant',
      'Add main ingredients and cook thoroughly',
      'Season to taste with salt and spices',
      'Serve hot and enjoy!'
    ]
  };
}

// Note: Firebase catalog matching will be implemented later
// For now, we're using mock data to get the basic functionality working
