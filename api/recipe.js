const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

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

    // Check if Gemini AI is available
    if (!genAI) {
      console.error('❌ Gemini AI not initialized - missing API key');
      return res.status(500).json({ 
        error: 'AI service not configured',
        details: 'Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable'
      });
    }

    // STEP 1: Generate Recipe using Gemini AI
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
    let recipe;
    try {
      // Clean the response (remove any markdown formatting)
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      recipe = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      // Fallback recipe
      recipe = {
        title: `Recipe for ${query}`,
        description: "A delicious homemade recipe crafted just for you!",
        ingredients: ["onions", "tomatoes", "spices", "oil"],
        instructions: ["Prepare ingredients", "Cook as desired", "Serve hot"]
      };
    }

    console.log('✅ Parsed recipe:', recipe);

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

// Note: Firebase catalog matching will be implemented later
// For now, we're using mock data to get the basic functionality working
