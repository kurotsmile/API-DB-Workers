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

function normalizeSeoStatus(status) {
	const raw = String(status || '').trim().toLowerCase();
	if (raw === 'awaiting_confirmation') return 'awaiting_confirmation';
	return 'live';
}

export async function handleSeoLinkRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
		if (path === '/list_seo_link' && method === 'GET') {
			const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '10000', 10) || 10000, 50000));
			let results = [];
			try {
				const rs = await env.DB
					.prepare('SELECT url, status, checked_at FROM seo_link ORDER BY checked_at DESC LIMIT ?')
					.bind(limit)
					.all();
				results = rs.results || [];
			} catch (error) {
				if (!String(error?.message || '').includes('no such column: status')) throw error;
				const legacy = await env.DB
					.prepare('SELECT url, checked_at FROM seo_link ORDER BY checked_at DESC LIMIT ?')
					.bind(limit)
					.all();
				results = (legacy.results || []).map((item) => ({ ...item, status: 'live' }));
			}

			return Response.json(results || [], { headers: corsHeaders });
		}

		if ((path === '/upsert_seo_link' || path === '/set_seo_link_status') && method === 'POST') {
			const body = await request.json();
			const normalizedUrl = normalizeSeoLink(body?.url);
			const status = String(body?.status || '').trim().toLowerCase();

			if (!normalizedUrl) {
				return Response.json({ error: 'Missing url' }, { status: 400, headers: corsHeaders });
			}

			if (status === 'need_check') {
				const deleted = await env.DB
					.prepare('DELETE FROM seo_link WHERE url = ?')
					.bind(normalizedUrl)
					.run();

				return Response.json(
					{ success: true, url: normalizedUrl, status: 'need_check', changes: deleted?.changes || 0 },
					{ headers: corsHeaders }
				);
			}

			const normalizedStatus = normalizeSeoStatus(status);
			await env.DB
				.prepare(`
					INSERT INTO seo_link (url, status, checked_at)
					VALUES (?, ?, CURRENT_TIMESTAMP)
					ON CONFLICT(url) DO UPDATE SET status = excluded.status, checked_at = CURRENT_TIMESTAMP
				`)
				.bind(normalizedUrl, normalizedStatus)
				.run();

			return Response.json(
				{ success: true, url: normalizedUrl, status: normalizedStatus },
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
		if (String(error?.message || '').includes('no such column: status')) {
			return new Response(JSON.stringify({ error: 'Missing seo_link.status column. Please run API-DB-Workers/sql/seo_link_upgrade.sql first.' }), {
				status: 500,
				headers: corsHeaders,
			});
		}

		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: corsHeaders,
		});
	}
}
