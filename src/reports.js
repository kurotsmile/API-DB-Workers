export async function handleReportsRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
		if (path === '/add_report' && method === 'POST') {
			const data = await request.json();
			const { email, type, message,userId,object_id} = data;

			if (!email) {
				return new Response(JSON.stringify({ error: 'Missing email' }), {
					status: 400,
					headers: corsHeaders,
				});
			}

			await env.DB.prepare(`INSERT INTO reports (email, type, message,userId,object_id) VALUES (?, ?, ?,?,?)`).bind(email, type || '', message || '',userId || '',object_id || '').run();

			return new Response(JSON.stringify({ success: true }), {
				status: 201,
				headers: corsHeaders,
			});
		}

		if (path === '/count_report' && method === 'GET') {
			try {
				const type = url.searchParams.get('type');

				let sql = `SELECT COUNT(*) AS total FROM reports`;
				let stmt;

				if (type) {
					sql += ` WHERE type = ?`;
					stmt = env.DB.prepare(sql).bind(type);
				} else {
					stmt = env.DB.prepare(sql);
				}

				const result = await stmt.first();

				return new Response(
					JSON.stringify({ total: result?.total ?? 0 }),
					{
						status: 200,
						headers: corsHeaders
					}
				);
			} catch (err) {
				return new Response(
					JSON.stringify({ error: err.message }),
					{
						status: 500,
						headers: corsHeaders
					}
				);
			}
		}

		if (path === '/list_report' && method === 'GET') {
			try {
				const type = url.searchParams.get('type');
				const limit = Math.min(Number(url.searchParams.get('limit')) || 20,100);
				const page = Math.max(Number(url.searchParams.get('page')) || 1,1);
				const offset = (page - 1) * limit;

				let sql = `SELECT id, email, type, message, userId, object_id, created_at FROM reports`;

				const binds = [];

				if (type) {
					sql += ` WHERE type = ?`;
					binds.push(type);
				}

				sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
				binds.push(limit, offset);

				const { results } = await env.DB
					.prepare(sql)
					.bind(...binds)
					.all();

				return new Response(
					JSON.stringify({
						page,
						limit,
						count: results.length,
						data: results
					}),
					{status: 200,headers: corsHeaders}
				);
			} catch (err) {
				return new Response(JSON.stringify({ error: err.message }),{status: 500,headers: corsHeaders});
			}
		}

		if (path === '/delete_report' && method === 'POST') {
			const data = await request.json(); const { id } = data; if (!id) { return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: corsHeaders }); } await env.DB.prepare(`DELETE FROM reports WHERE id=?`).bind(id).run(); return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
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
