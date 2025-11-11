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

			let query = `SELECT * FROM orders`;
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
			const { order_name, user_name, user_email, country, type, amount, currency,user_id,product_id} = data;

			if (!user_email) {
				return new Response(
					JSON.stringify({ error: 'Missing user_email' }),
					{ status: 400, headers: corsHeaders }
				);
			}

			const query = `
				INSERT INTO orders (order_name, user_name, user_email, country, type, amount, currency,user_id,product_id)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`;

			await env.DB.prepare(query)
				.bind(order_name, user_name, user_email, country, type, amount, currency,user_id||'',product_id||'')
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

		if (path === '/report_order' && method === 'GET') {
			const date_from = url.searchParams.get('date_from');
			const date_to = url.searchParams.get('date_to');

			if (!date_from || !date_to) {
				return new Response(
				JSON.stringify({ error: 'Missing date_from or date_to' }),
				{ status: 400, headers: corsHeaders }
				);
			}

			// Chỉ lấy các trường cần thiết để hiển thị biểu đồ (ngày, tổng tiền)
			const query = `
				SELECT 
				DATE(created_at) AS date,
				SUM(amount) AS total_amount,
				COUNT(*) AS total_orders
				FROM orders
				WHERE DATE(created_at) BETWEEN ? AND ?
				GROUP BY DATE(created_at)
				ORDER BY DATE(created_at) ASC
			`;

			const { results } = await env.DB.prepare(query).bind(date_from, date_to).all();

			// Trả về dạng thân thiện cho Chart.js
			const data = results.map(r => ({
				date: r.date,
				total_amount: r.total_amount,
				total_orders: r.total_orders
			}));

			return Response.json(data, { headers: corsHeaders });
		}

		if (path === '/check_pay' && method === 'POST') {
			let body = {};
			const contentType = request.headers.get("content-type") || "";
			if (contentType.includes("application/json")) {
				body = await request.json();
			} else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
				const formData = await request.formData();
				body = Object.fromEntries(formData);
			}
			const { user_id,product_id } = body;

			if (!user_id || !product_id) {
				return new Response(
				JSON.stringify({ error: 'Missing user_id or product_id' }),
				{ status: 400, headers: corsHeaders }
				);
			}

			const query = `
				SELECT * FROM orders
				WHERE user_id = ? AND product_id = ?
				ORDER BY created_at DESC
				LIMIT 1
			`;

			const { results } = await env.DB.prepare(query).bind(user_id, product_id).all();

			if (results.length > 0) {
				return Response.json({
				purchased: true,
				order: results[0]
				}, { headers: corsHeaders });
			}

			return Response.json({ purchased: false }, { headers: corsHeaders });
		}

		return new Response(JSON.stringify({ error: 'Unknown order route' }), { status: 404, headers: corsHeaders });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
	}
}
