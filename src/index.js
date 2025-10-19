export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const corsHeaders = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "*",
		};


		if (url.pathname === '/song') {
			const { results } = await env.DB.prepare('SELECT * FROM song').all();
			return Response.json(results);
		}

		if (url.pathname === '/song_random') {
			try {
				const { results } = await env.DB.prepare('SELECT * FROM song ORDER BY RANDOM() LIMIT 15').all();

				return new Response(JSON.stringify(results), {
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (err) {
				return new Response(JSON.stringify({ error: err.message }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		if (url.pathname === '/list_song') {
			const page = parseInt(url.searchParams.get('page') || '1');
			const limit = parseInt(url.searchParams.get('limit') || '20');
			const offset = (page - 1) * limit;

			const { results } = await env.DB.prepare('SELECT * FROM song ORDER BY date DESC LIMIT ? OFFSET ?').bind(limit, offset).all();

			return Response.json(results,{ headers: corsHeaders });
		}

		if (url.pathname === '/add' && request.method === 'POST') {
			const data = await request.json();
			await env.DB.prepare('INSERT INTO song (id, name, artist, mp3) VALUES (?, ?, ?, ?)')
				.bind(data.id, data.name, data.artist, data.mp3)
				.run();
			return new Response('OK', { status: 200 });
		}

		return new Response('Worker is running!', { status: 200 });
	},
};
