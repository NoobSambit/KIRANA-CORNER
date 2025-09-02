import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 Test API called');
    console.log('📝 Method:', req.method);
    console.log('📝 Body:', req.body);

    return res.status(200).json({ 
      message: 'API is working perfectly!', 
      method: req.method,
      timestamp: new Date().toISOString(),
      body: req.body,
      success: true
    });
  } catch (error) {
    console.error('Test API error:', error);
    return res.status(500).json({ 
      error: 'Test API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
