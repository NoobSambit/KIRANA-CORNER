import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = process.env.GEMINI_VISION_MODEL_NAME || 'gemini-2.0-flash';
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
    const { dataUrl } = req.body as { dataUrl?: string };
    if (!dataUrl) return res.status(400).json({ error: 'Missing dataUrl' });

    const [meta, b64] = dataUrl.split(',');
    const mimeType = meta.replace('data:', '').replace(';base64', '');

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = 'Detect the most likely cooked dish in this image and return one suitable recipe with JSON keys: recipeTitle, recipeDescription, ingredients (array of strings). Only JSON.';
    const resp = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: prompt }, { inlineData: { data: b64, mimeType } }] }
      ]
    });
    const text = resp.response.text();
    let parsed: any;
    try { parsed = JSON.parse(text); } catch {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { recipeTitle: 'Detected Recipe', recipeDescription: 'A tasty dish', ingredients: [] };
    }
    const markdown = `"${parsed.recipeTitle}"\n\n${parsed.recipeDescription}\n\nIngredients:\n${(parsed.ingredients || []).map((i: string) => `- ${i}`).join('\n')}`;
    return res.status(200).json({ markdown, recipe: { recipeTitle: parsed.recipeTitle, recipeDescription: parsed.recipeDescription, inStock: [], missing: [], ingredients: parsed.ingredients || [] } });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'AI failure' });
  }
}


