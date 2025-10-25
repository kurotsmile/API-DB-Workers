export async function handleUserRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;

	try {
		if (path === '/users') {
			const page = parseInt(url.searchParams.get('page') || '1');
			const limit = parseInt(url.searchParams.get('limit') || '20');
			const offset = (page - 1) * limit;
			const lang = url.searchParams.get('lang') || '';
			const fields = 'id,address,avatar,email,name,phone,sex,type,role';

			let query = `SELECT ${fields} FROM users`;
			const params = [];

			if (lang) {
				query += ' WHERE lang = ?';
				params.push(lang);
			}

			query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
			params.push(limit, offset);

			const { results } = await env.DB.prepare(query).bind(...params).all();
			return Response.json(results, { headers: corsHeaders });
		}

		if (path === '/get_user') {
			const id = url.searchParams.get('id');
			if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: corsHeaders });
			const { results } = await env.DB.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(id).all();
			return Response.json(results, { headers: corsHeaders });
		}

		if (path === '/search_user') {
			const q = url.searchParams.get('q')?.trim() || '';
			const page = parseInt(url.searchParams.get('page') || '1');
			const limit = parseInt(url.searchParams.get('limit') || '20');
			const offset = (page - 1) * limit;
			const fields = 'id,name,email,phone,avatar,address,role,type,sex,status_share,created_at';

			let query = `SELECT ${fields} FROM users`;
			const params = [];
			if (q) {
				query += ' WHERE (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(phone) LIKE ?)';
				params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
			}
			query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
			params.push(limit, offset);

			const { results } = await env.DB.prepare(query).bind(...params).all();
			return Response.json(results, { headers: corsHeaders });
		}

		return new Response(JSON.stringify({ error: 'Unknown user route' }), { status: 404, headers: corsHeaders });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
	}
}
