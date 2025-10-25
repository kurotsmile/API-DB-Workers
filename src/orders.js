export async function handleOrdersRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
		// 🧾 Lấy danh sách đơn hàng
		if (path === '/orders' && method === 'GET') {
			const page = parseInt(url.searchParams.get('page') || '1');
			const limit = parseInt(url.searchParams.get('limit') || '20');
			const offset = (page - 1) * limit;
			const email = url.searchParams.get('email')?.trim() || '';

			let query = `
				SELECT id, created_at, order_name, user_name, user_email, country, type, amount, currency
				FROM orders
			`;
			const params = [];

			if (email) {
				query += ' WHERE user_email = ?';
				params.push(email);
			}

			query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
			params.push(limit, offset);

			const { results } = await env.DB.prepare(query).bind(...params).all();
			return Response.json(results, { headers: corsHeaders });
		}

		// ➕ Thêm đơn hàng mới
		if (path === '/add_order' && method === 'POST') {
			const data = await request.json();
			const { order_name, user_name, user_email, country, type, amount, currency } = data;

			if (!user_email) {
				return new Response(
					JSON.stringify({ error: 'Missing user_email' }),
					{ status: 400, headers: corsHeaders }
				);
			}

			const query = `
				INSERT INTO orders (order_name, user_name, user_email, country, type, amount, currency)
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`;

			await env.DB.prepare(query)
				.bind(order_name, user_name, user_email, country, type, amount, currency)
				.run();

			return new Response(JSON.stringify({ success: true }), { status: 201, headers: corsHeaders });
		}

		// ❌ Xoá đơn hàng theo id
		if (path === '/delete_order' && method === 'POST') {
			const data = await request.json();
			const id = data.id;

			if (!id) {
				return new Response(
					JSON.stringify({ error: 'Missing id' }),
					{ status: 400, headers: corsHeaders }
				);
			}

			await env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
			return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
		}

		// 🚫 Không khớp route nào
		return new Response(JSON.stringify({ error: 'Unknown order route' }), { status: 404, headers: corsHeaders });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
	}
}
