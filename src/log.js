export async function handleLogRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;

    try {

        if (path === '/list_logs' && request.method === 'GET') {
            const page = parseInt(url.searchParams.get('page') || '1');
            const limit = parseInt(url.searchParams.get('limit') || '50');
            const offset = (page - 1) * limit;

            const type = url.searchParams.get('type') || '';
            const userId = url.searchParams.get('userId') || '';
            const lang = url.searchParams.get('lang') || '';

            const params = [];
            const conditions = [];

            let query = `SELECT id, created_at, type, content, userId, lang FROM logs`;

            if (type) {
                conditions.push('type = ?');
                params.push(type);
            }

            if (userId) {
                conditions.push('userId = ?');
                params.push(userId);
            }

            if (lang) {
                conditions.push('lang = ?');
                params.push(lang);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const { results } = await env.DB.prepare(query).bind(...params).all();

            return Response.json(results, { headers: corsHeaders });
        }

        if (path === '/delete_log') {
            const id = url.searchParams.get('id');

            if (!id) {
                return new Response(
                JSON.stringify({ error: 'Missing id parameter' }),
                { status: 400, headers: corsHeaders }
                );
            }

            try {
                const query = `DELETE FROM logs WHERE id = ?`;
                const result = await env.DB.prepare(query).bind(id).run();

                // Kiểm tra có dòng nào bị xóa không
                if (result.changes === 0) {
                return new Response(
                    JSON.stringify({ success: false, message: 'Log not found' }),
                    { status: 404, headers: corsHeaders }
                );
                }

                return new Response(
                JSON.stringify({ success: true, message: 'Log deleted successfully' }),
                { status: 200, headers: corsHeaders }
                );

            } catch (err) {
                console.error('Delete log error:', err);
                return new Response(
                JSON.stringify({ success: false, error: 'Failed to delete log' }),
                { status: 500, headers: corsHeaders }
                );
            }
        }

		return new Response(JSON.stringify({ error: 'Unknown log route' }), { status: 404, headers: corsHeaders });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
	}
}