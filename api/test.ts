import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🧪 Test API called');
  console.log('📝 Method:', req.method);
  console.log('📝 Headers:', req.headers);
  console.log('📝 Body:', req.body);

  return res.status(200).json({ 
    message: 'API is working!', 
    method: req.method,
    timestamp: new Date().toISOString(),
    env: {
      hasGeminiKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      hasViteGeminiKey: !!process.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
}
