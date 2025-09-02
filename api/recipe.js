// Try to import Gemini AI, but don't fail if it's not available
let GoogleGenerativeAI;
let genAI = null;

try {
  const geminiModule = require('@google/generative-ai');
  GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
  
  // Initialize Gemini AI
  const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY;
  if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
} catch (error) {
  console.warn('Failed to initialize Gemini AI:', error.message);
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('🚀 Recipe API called');
    console.log('📝 Request method:', req.method);
    console.log('📝 Request body:', req.body);

    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('🍳 Generating recipe for:', query);

    let recipe;

    // STEP 1: Try to Generate Recipe using Gemini AI, with fallback
    if (genAI) {
      try {
        console.log('🤖 Attempting Gemini AI generation...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `
          Create a detailed recipe for: "${query}"
          
          Return ONLY a JSON object with this EXACT structure (no additional text):
          {
            "title": "Recipe name",
            "description": "Brief appetizing description (1-2 sentences)",
            "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
            "instructions": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
          }
          
          Requirements:
          - Keep ingredients simple and generic (e.g., "onions", "tomatoes", "rice", "chicken")
          - Include 6-12 ingredients
          - Provide 5-8 clear cooking steps
          - Make it authentic and delicious
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        console.log('🤖 Raw Gemini response:', text);

        // Parse JSON response from Gemini
        try {
          // Clean the response (remove any markdown formatting)
          const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
          recipe = JSON.parse(cleanText);
          console.log('✅ Successfully parsed Gemini recipe:', recipe);
        } catch (parseError) {
          console.error('❌ JSON parsing failed:', parseError);
          throw parseError; // This will trigger the fallback
        }

      } catch (aiError) {
        console.error('❌ Gemini AI failed:', aiError);
        console.log('🔄 Using fallback recipe generation...');
        recipe = null; // Trigger fallback
      }
    } else {
      console.log('⚠️ Gemini AI not available, using fallback...');
    }

    // Fallback recipe generation if AI fails
    if (!recipe) {
      console.log('📝 Generating fallback recipe...');
      recipe = generateFallbackRecipe(query);
    }

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
function generateFallbackRecipe(query) {
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
