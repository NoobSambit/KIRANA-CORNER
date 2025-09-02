import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.warn('Firebase Admin initialization failed, using client SDK fallback:', error);
  }
}

const db = getFirestore();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

interface RecipeRequest {
  query: string;
  userLocation?: { lat: number; lng: number };
}

interface RecipeResponse {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  inventoryMatch: {
    available: Array<{
      ingredient: string;
      product: any;
      shop: any;
    }>;
    unavailable: string[];
    alternatives: Array<{
      ingredient: string;
      alternative: any;
      shop: any;
    }>;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body as RecipeRequest;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('🍳 Generating recipe for:', query);

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

    // STEP 2: Match ingredients with Firebase catalog
    const inventoryMatch = await matchIngredientsWithCatalog(recipe.ingredients);

    console.log('📦 Inventory match results:', inventoryMatch);

    // STEP 3: Prepare final response
    const response: RecipeResponse = {
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      inventoryMatch
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Recipe generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate recipe',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// FIREBASE CATALOG MATCHING FUNCTION
async function matchIngredientsWithCatalog(ingredients: string[]) {
  const available = [];
  const unavailable = [];
  const alternatives = [];

  console.log('🔍 Matching ingredients:', ingredients);

  try {
    // Get all shops from Firebase
    const shopsSnapshot = await db.collection('shops').get();
    console.log('🏪 Found shops:', shopsSnapshot.size);

    for (const ingredient of ingredients) {
      console.log(`🔎 Searching for: ${ingredient}`);
      
      let foundExact = false;
      const similarItems = [];

      // Search through each shop's catalog
      for (const shopDoc of shopsSnapshot.docs) {
        const shopData = shopDoc.data();
        
        try {
          // Get catalog subcollection
          const catalogSnapshot = await db
            .collection(`shops/${shopDoc.id}/catalog`)
            .get();

          for (const productDoc of catalogSnapshot.docs) {
            const product = productDoc.data();
            const productName = product.name?.toLowerCase() || '';
            const searchTerm = ingredient.toLowerCase();

            // EXACT MATCH CHECK
            if (
              productName.includes(searchTerm) || 
              searchTerm.includes(productName) ||
              productName === searchTerm
            ) {
              available.push({
                ingredient,
                product: {
                  id: productDoc.id,
                  ...product
                },
                shop: {
                  id: shopDoc.id,
                  name: shopData.name,
                  address: shopData.address
                }
              });
              foundExact = true;
              console.log(`✅ Found exact match: ${product.name} in ${shopData.name}`);
            }
            // SIMILARITY CHECK (for alternatives)
            else if (calculateSimilarity(productName, searchTerm) > 0.4) {
              similarItems.push({
                ingredient,
                alternative: {
                  id: productDoc.id,
                  ...product
                },
                shop: {
                  id: shopDoc.id,
                  name: shopData.name,
                  address: shopData.address
                },
                similarity: calculateSimilarity(productName, searchTerm)
              });
            }
          }
        } catch (catalogError) {
          console.warn(`⚠️ Could not access catalog for shop ${shopDoc.id}:`, catalogError);
        }
      }

      // If no exact match found, add to alternatives or unavailable
      if (!foundExact) {
        if (similarItems.length > 0) {
          // Sort by similarity and take top 2
          const topAlternatives = similarItems
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 2);
          alternatives.push(...topAlternatives);
          console.log(`🔄 Found ${topAlternatives.length} alternatives for ${ingredient}`);
        } else {
          unavailable.push(ingredient);
          console.log(`❌ No matches found for ${ingredient}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error matching ingredients:', error);
  }

  return {
    available: available.slice(0, 10), // Limit results
    unavailable,
    alternatives: alternatives.slice(0, 6) // Limit alternatives
  };
}

// SIMILARITY CALCULATION FUNCTION
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

// LEVENSHTEIN DISTANCE FUNCTION
function editDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}
