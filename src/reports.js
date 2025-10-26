export async function handleReportsRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
		if (path === '/add_report' && method === 'POST') {
			const data = await request.json();
			const { email, type, message,userId} = data;

			if (!email) {
				return new Response(JSON.stringify({ error: 'Missing email' }), {
					status: 400,
					headers: corsHeaders,
				});
			}

			await env.DB.prepare(`INSERT INTO reports (email, type, message,userId) VALUES (?, ?, ?,?)`).bind(email, type || '', message || '',userId || '').run();

			return new Response(JSON.stringify({ success: true }), {
				status: 201,
				headers: corsHeaders,
			});
		}

		// 🚫 Không khớp route nào
		return new Response(JSON.stringify({ error: 'Unknown reports route' }), {
			status: 404,
			headers: corsHeaders,
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), {
			status: 500,
			headers: corsHeaders,
		});
	}
}
