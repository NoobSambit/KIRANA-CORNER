import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	if (req.method === 'GET') {
		return res.status(200).send('Chat API is live. Send POST {"prompt":"..."}.');
	}

	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed. Use POST.' });
	}

	try {
		const { prompt } = req.body || {};
		const text = prompt?.trim() ? `You asked: "${prompt}". Here is a simple response.` : 'Hello! Ask me anything.';
		return res.status(200).send(text);
	} catch (e: any) {
		return res.status(500).json({ error: e?.message || 'Unknown error' });
	}
}
