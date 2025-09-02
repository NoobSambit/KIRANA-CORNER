export const runtime = 'edge';

export default async function handler(request: Request): Promise<Response> {
	const headers = new Headers({
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization'
	});

	if (request.method === 'OPTIONS') {
		return new Response(null, { status: 200, headers });
	}

	if (request.method === 'GET') {
		return new Response('Chat API is live. Send POST {"prompt":"..."}.', { status: 200, headers });
	}

	if (request.method !== 'POST') {
		return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
			status: 405,
			headers
		});
	}

	try {
		const body = await request.json().catch(() => ({}));
		const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
		const text = prompt ? `You asked: "${prompt}". Here is a simple response.` : 'Hello! Ask me anything.';
		return new Response(text, { status: 200, headers });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers });
	}
}
