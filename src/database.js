export async function handleDatabaseRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
        if (path === '/inster_table' && method === 'POST') {
            const { table, data } = await request.json();
            if (!table || !data || typeof data !== 'object') return new Response(JSON.stringify({ error: 'Invalid table or data' }), { status: 400, headers: corsHeaders });
            const keys = Object.keys(data);
            const values = Object.values(data);
            const placeholders = keys.map(() => '?').join(',');
            const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
            await env.DB.prepare(sql).bind(...values).run();
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        if (path === '/read_table' && method === 'POST') {
            const { table, data = {} } = await request.json();
            if (!table) return new Response(JSON.stringify({ error: 'Missing table' }), { status: 400, headers: corsHeaders });

            const { limit, page, ...filters } = data;
            const keys = Object.keys(filters);
            const values = Object.values(filters);

            let sql = `SELECT * FROM ${table}`;
            if (keys.length) sql += ' WHERE ' + keys.map(k => `${k}=?`).join(' AND ');
            if (limit && page) sql += ` LIMIT ${parseInt(limit)} OFFSET ${(parseInt(page)-1)*parseInt(limit)}`;

            const rs = await env.DB.prepare(sql).bind(...values).all();
            return new Response(JSON.stringify(rs.results), { headers: corsHeaders });
        }

        if (path === '/delete_table' && method === 'POST') {
            const { table, data } = await request.json();
            if (!table || !data || typeof data !== 'object' || !Object.keys(data).length) return new Response(JSON.stringify({ error: 'Missing table or condition' }), { status: 400, headers: corsHeaders });

            if (!/^[a-zA-Z0-9_]+$/.test(table)) return new Response(JSON.stringify({ error: 'Invalid table name' }), { status: 400, headers: corsHeaders });

            const keys = Object.keys(data);
            const values = Object.values(data);

            const where = keys.map(k => `${k}=?`).join(' AND ');
            const sql = `DELETE FROM ${table} WHERE ${where}`;

            const rs = await env.DB.prepare(sql).bind(...values).run();
            return new Response(JSON.stringify({ success: true, changes: rs.changes }), { headers: corsHeaders });
        }

        if (path === '/count_table' && method === 'POST') {
            const { table, data = {} } = await request.json();
            if (!table) return new Response(JSON.stringify({ error: 'Missing table' }), { status: 400, headers: corsHeaders });

            if (!/^[a-zA-Z0-9_]+$/.test(table)) return new Response(JSON.stringify({ error: 'Invalid table name' }), { status: 400, headers: corsHeaders });

            const keys = Object.keys(data);
            const values = Object.values(data);

            let sql = `SELECT COUNT(*) as total FROM ${table}`;
            if (keys.length) sql += ' WHERE ' + keys.map(k => `${k}=?`).join(' AND ');

            const rs = await env.DB.prepare(sql).bind(...values).first();
            return new Response(JSON.stringify({ total: rs.total }), { headers: corsHeaders });
        }

		// 🚫 Không khớp route nào
		return new Response(JSON.stringify({ error: 'Unknown database route' }), {
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
