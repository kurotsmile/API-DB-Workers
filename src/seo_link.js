function normalizeSeoLink(url) {
	const raw = String(url || '').trim();
	if (!raw) return '';

	try {
		const parsed = new URL(raw);
		parsed.hash = '';
		return parsed.toString();
	} catch (error) {
		return raw;
	}
}

export async function handleSeoLinkRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
		if (path === '/list_seo_link' && method === 'GET') {
			const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '10000', 10) || 10000, 50000));
			const { results } = await env.DB
				.prepare('SELECT url, checked_at FROM seo_link ORDER BY checked_at DESC LIMIT ?')
				.bind(limit)
				.all();

			return Response.json(results || [], { headers: corsHeaders });
		}

		if (path === '/upsert_seo_link' && method === 'POST') {
			const body = await request.json();
			const normalizedUrl = normalizeSeoLink(body?.url);

			if (!normalizedUrl) {
				return Response.json({ error: 'Missing url' }, { status: 400, headers: corsHeaders });
			}

			await env.DB
				.prepare(`
					INSERT INTO seo_link (url, checked_at)
					VALUES (?, CURRENT_TIMESTAMP)
					ON CONFLICT(url) DO UPDATE SET checked_at = CURRENT_TIMESTAMP
				`)
				.bind(normalizedUrl)
				.run();

			return Response.json(
				{ success: true, url: normalizedUrl, is_live: true },
				{ headers: corsHeaders }
			);
		}

		if (path === '/delete_seo_link' && method === 'POST') {
			const body = await request.json();
			const normalizedUrl = normalizeSeoLink(body?.url);

			if (!normalizedUrl) {
				return Response.json({ error: 'Missing url' }, { status: 400, headers: corsHeaders });
			}

			const result = await env.DB
				.prepare('DELETE FROM seo_link WHERE url = ?')
				.bind(normalizedUrl)
				.run();

			return Response.json(
				{ success: true, url: normalizedUrl, is_live: false, changes: result?.changes || 0 },
				{ headers: corsHeaders }
			);
		}

		return new Response(JSON.stringify({ error: 'Unknown seo_link route' }), {
			status: 404,
			headers: corsHeaders,
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: corsHeaders,
		});
	}
}
