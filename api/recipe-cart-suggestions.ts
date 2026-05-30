import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  RequestError,
  buildRecipeCartSuggestions,
  validateRecipeAssistantRequest,
} from './_lib/recipeAssistant.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const bodySize = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
    if (bodySize > 4_000) {
      return res.status(413).json({ error: 'Request is too large.' });
    }

    const input = validateRecipeAssistantRequest(req.body);
    const suggestions = await buildRecipeCartSuggestions(input);

    return res.status(200).json({
      success: true,
      ...suggestions,
    });
  } catch (error) {
    const statusCode = error instanceof RequestError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Recipe assistant failed.';
    console.error('Recipe assistant API error:', message);
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}
