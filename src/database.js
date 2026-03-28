export async function handleDatabaseRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

    const isSafeIdentifier = (value) => /^[a-zA-Z0-9_]+$/.test(String(value || ''));
    const parsePositiveInt = (value, fallback = null) => {
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };
    const isTruthyFlag = (value) => value === true || value === 1 || value === '1' || value === 'true';

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
            if (!table) {
                return new Response(
                    JSON.stringify({ error: 'Missing table' }),
                    { status: 400, headers: corsHeaders }
                );
            }
            if (!isSafeIdentifier(table)) {
                return new Response(
                    JSON.stringify({ error: 'Invalid table name' }),
                    { status: 400, headers: corsHeaders }
                );
            }

            const {
                select,
                with_total,
                limit,
                page,
                order_key,
                order_type,
                ...filters
            } = data;

            const selectedFields = typeof select === 'string' && select.trim()
                ? select.split(',').map(field => field.trim()).filter(Boolean)
                : ['*'];
            const isRandomPage = page === -1 || String(page) === '-1';
            const parsedLimit = parsePositiveInt(limit);
            const parsedPage = isRandomPage ? -1 : parsePositiveInt(page, 1);

            if (selectedFields[0] !== '*' && !selectedFields.every(isSafeIdentifier)) {
                return new Response(
                    JSON.stringify({ error: 'Invalid select fields' }),
                    { status: 400, headers: corsHeaders }
                );
            }

            if (order_key && !isSafeIdentifier(order_key)) {
                return new Response(
                    JSON.stringify({ error: 'Invalid order key' }),
                    { status: 400, headers: corsHeaders }
                );
            }

            const filterKeys = Object.keys(filters).filter(key => {
                const value = filters[key];
                return isSafeIdentifier(key) && value !== undefined && value !== null && value !== '';
            });

            const selectClause = selectedFields[0] === '*' ? '*' : selectedFields.join(', ');
            let sql = `SELECT ${selectClause} FROM ${table}`;
            const safeValues = filterKeys.map(key => {
                const value = filters[key];
                return value === null || value === undefined ? value : String(value);
            });

            // WHERE
            if (filterKeys.length) {
                sql += ' WHERE ' + filterKeys.map(k => `${k}=?`).join(' AND ');
            }

            // ===== ORDER BY =====
            if (isRandomPage) {
                // 🔥 random khi page = -1
                sql += ' ORDER BY RANDOM()';
            } else if (order_key) {
                const type = (order_type || 'ASC').toUpperCase() === 'DESC'
                    ? 'DESC'
                    : 'ASC';
                sql += ` ORDER BY ${order_key} ${type}`;
            }

            // ===== LIMIT / OFFSET =====
            if (parsedLimit) {
                if (isRandomPage) {
                    // random + limit
                    sql += ` LIMIT ${parsedLimit}`;
                } else if (parsedPage) {
                    sql += ` LIMIT ${parsedLimit} OFFSET ${(parsedPage - 1) * parsedLimit}`;
                }
            }

            const rs = await env.DB.prepare(sql).bind(...safeValues).all();

            if (isTruthyFlag(with_total)) {
                let countSql = `SELECT COUNT(*) as total FROM ${table}`;
                if (filterKeys.length) {
                    countSql += ' WHERE ' + filterKeys.map(k => `${k}=?`).join(' AND ');
                }
                const countRow = await env.DB.prepare(countSql).bind(...safeValues).first();
                return new Response(
                    JSON.stringify({
                        items: rs.results,
                        total: Number(countRow?.total || 0),
                        page: parsedPage === -1 ? 1 : parsedPage,
                        limit: parsedLimit || rs.results.length
                    }),
                    { headers: corsHeaders }
                );
            }

            return new Response(
                JSON.stringify(rs.results),
                { headers: corsHeaders }
            );
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

        if (path === '/update_table' && method === 'POST') {
            const { table, data } = await request.json();
            if (!table || !data || typeof data !== 'object' || !data.id) return new Response(JSON.stringify({ error: 'Missing table or id' }), { status: 400, headers: corsHeaders });

            if (!/^[a-zA-Z0-9_]+$/.test(table)) return new Response(JSON.stringify({ error: 'Invalid table name' }), { status: 400, headers: corsHeaders });

            const { id, ...fields } = data;
            const keys = Object.keys(fields);
            if (!keys.length) return new Response(JSON.stringify({ error: 'No data to update' }), { status: 400, headers: corsHeaders });

            const values = Object.values(fields);
            const set = keys.map(k => `${k}=?`).join(',');

            const sql = `UPDATE ${table} SET ${set} WHERE id=?`;
            const rs = await env.DB.prepare(sql).bind(...values, id).run();

            return new Response(JSON.stringify({ success: true, changes: rs.changes }), { headers: corsHeaders });
        }


		if (path === '/search_table' && method === 'POST') {
            const { table, data = {} } = await request.json();
            const {q,page,limit,offset, ...fields } = data;

			let query = `
				SELECT *
				FROM ${table}
			`;
			const params = [];
			const conditions = [];

			if (q) {
				conditions.push('LOWER(name) LIKE ? ');
				params.push(`%${q.toLowerCase()}%`);
			}
			if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
            if (limit && page) {
			    query += ' LIMIT ? OFFSET ?';
			    params.push(limit, offset);
            }

			const { results } = await env.DB.prepare(query).bind(...params).all();
			return Response.json(results, { headers: corsHeaders });
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
