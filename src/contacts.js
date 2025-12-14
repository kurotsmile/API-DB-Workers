export async function handleContactsRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
		// 📋 Lấy danh sách liên hệ
		if (path === '/contacts' && method === 'GET') {
			const page = parseInt(url.searchParams.get('page') || '1');
			const limit = parseInt(url.searchParams.get('limit') || '20');
			const offset = (page - 1) * limit;
			const email = url.searchParams.get('email')?.trim() || '';

			let query = `
				SELECT id, created_at, email, subject, content
				FROM contacts
			`;
			const params = [];

			if (email) {
				query += ' WHERE email = ?';
				params.push(email);
			}

			query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
			params.push(limit, offset);

			const { results } = await env.DB.prepare(query).bind(...params).all();
			return Response.json(results, { headers: corsHeaders });
		}

		if (path === '/contacts_count' && method === 'GET') {
			const email = url.searchParams.get('email')?.trim() || '';

			let query = `
				SELECT COUNT(*) AS total
				FROM contacts
			`;
			const params = [];

			if (email) {query += ' WHERE email = ?';params.push(email);}

			const { results } = await env.DB.prepare(query).bind(...params).all();
			return Response.json(
				{ total: results?.[0]?.total || 0 },
				{ headers: corsHeaders }
			);
		}

		// ➕ Thêm liên hệ mới
		if (path === '/add_contact' && method === 'POST') {
			const data = await request.json();
			const { email, subject, content } = data;

			if (!email) {
				return new Response(JSON.stringify({ error: 'Missing email' }), {
					status: 400,
					headers: corsHeaders,
				});
			}

			await env.DB.prepare(`
				INSERT INTO contacts (email, subject, content)
				VALUES (?, ?, ?)
			`).bind(email, subject || '', content || '').run();

			return new Response(JSON.stringify({ success: true }), {
				status: 201,
				headers: corsHeaders,
			});
		}

		// ❌ Xoá liên hệ
		if (path === '/delete_contact' && method === 'POST') {
			const data = await request.json();
			const id = data.id;

			if (!id) {
				return new Response(JSON.stringify({ error: 'Missing id' }), {
					status: 400,
					headers: corsHeaders,
				});
			}

			await env.DB.prepare('DELETE FROM contacts WHERE id = ?').bind(id).run();
			return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
		}

		// 🚫 Không khớp route nào
		return new Response(JSON.stringify({ error: 'Unknown contact route' }), {
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
