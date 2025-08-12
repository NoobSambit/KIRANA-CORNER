import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash';
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const REQUIRED_TOKEN = process.env.AI_API_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (REQUIRED_TOKEN) {
      const token = (req.headers['x-ai-token'] || req.headers['X-AI-Token']) as string | undefined;
      if (!token || token !== REQUIRED_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!API_KEY) return res.status(500).json({ error: 'Missing AI key' });
    const { query } = req.body as { query?: string };
    if (!query) return res.status(400).json({ error: 'Missing query' });

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `You are a culinary shopping assistant. Given a user request, propose ONE recipe with title, 1-2 line description, and a concise ingredient list with simple names (no quantities). Respond ONLY as strict JSON with keys: recipeTitle, recipeDescription, ingredients (array of strings). User: ${query}`;
    const resp = await model.generateContent(prompt);
    const text = resp.response.text();

    let parsed: any;
    try { parsed = JSON.parse(text); } catch {
      // attempt to extract JSON block if the model added fluff
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { recipeTitle: 'Suggested Recipe', recipeDescription: 'A delicious idea', ingredients: [] };
    }

    const markdown = `"${parsed.recipeTitle}"\n\n${parsed.recipeDescription}\n\nIngredients:\n${(parsed.ingredients || []).map((i: string) => `- ${i}`).join('\n')}`;
    return res.status(200).json({ markdown, recipe: { recipeTitle: parsed.recipeTitle, recipeDescription: parsed.recipeDescription, inStock: [], missing: [], ingredients: parsed.ingredients || [] } });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'AI failure' });
  }
}


