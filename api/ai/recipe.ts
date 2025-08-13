import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash';
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const REQUIRED_TOKEN = process.env.AI_API_TOKEN;

interface RecipeData {
  recipeTitle: string;
  recipeDescription: string;
  ingredients: string[];
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for cross-origin requests
  // CORS: reflect the request origin when present, otherwise allow all
  const origin = (req.headers.origin as string | undefined) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-ai-token, X-AI-Token, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Temporary: allow GET to verify function routing from the browser
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, note: 'GET ok - function reachable', runtime: 'node', model: MODEL_NAME });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST requests are supported.' });
  }

  try {
    if (REQUIRED_TOKEN) {
      const token = (req.headers['x-ai-token'] || req.headers['X-AI-Token']) as string | undefined;
      if (!token || token !== REQUIRED_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized - Invalid or missing AI token' });
      }
    }

    if (!API_KEY) {
      console.error('Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable');
      return res.status(500).json({ error: 'AI service configuration error' });
    }

    // Vercel parses JSON body for us when Content-Type is application/json
    const { query } = (req.body ?? {}) as { query?: string };
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter in request body' });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `You are a culinary shopping assistant. Given a user request, propose ONE recipe with title, 1-2 line description, and a concise ingredient list with simple names (no quantities). Respond ONLY as strict JSON with keys: recipeTitle, recipeDescription, ingredients (array of strings). User: ${query}`;
    
    const resp = await model.generateContent(prompt);
    const text = resp.response.text();

    let parsed: RecipeData;
    try { 
      parsed = JSON.parse(text) as RecipeData; 
    } catch { 
      // attempt to extract JSON block if the model added fluff
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) as RecipeData : { recipeTitle: 'Suggested Recipe', recipeDescription: 'A delicious idea', ingredients: [] };
    }

    const markdown = `"${parsed.recipeTitle}"\n\n${parsed.recipeDescription}\n\nIngredients:\n${(parsed.ingredients || []).map((i: string) => `- ${i}`).join('\n')}`;
    
    return res.status(200).json({ 
      markdown, 
      recipe: { 
        recipeTitle: parsed.recipeTitle, 
        recipeDescription: parsed.recipeDescription, 
        inStock: [], 
        missing: [], 
        ingredients: parsed.ingredients || [] 
      } 
    });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'AI service error';
    console.error('AI API error:', e);
    return res.status(500).json({ error: errorMessage });
  }
}