export async function handleTopPlayerRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;

    try{

        if (path === '/update_top_player' && method === 'POST') {
			let body = {};
			const contentType = request.headers.get("content-type") || "";
			if (contentType.includes("application/json")) {
				body = await request.json();
			} else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
				const formData = await request.formData();
				body = Object.fromEntries(formData);
			}
            const { userId, appId, score, mode = '' } = body;
            const now = new Date().toISOString();

            if (!userId || !appId || !score) {
                return new Response(
                    JSON.stringify({ error: 'Missing required fields' }),
                    { status: 400, headers: corsHeaders }
                );
            }

            // Kiểm tra xem đã có bản ghi với userId + appId + mode chưa
            const checkQuery = `
                SELECT * FROM top_player WHERE userId = ? AND appId = ? AND mode = ?
            `;
            const existing = await env.DB.prepare(checkQuery)
                .bind(userId, appId, mode)
                .first();

            if (!existing) {
                // Nếu chưa có -> thêm mới
                const insertQuery = `
                    INSERT INTO top_player (userId, appId, mode, score, created_at, update_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                await env.DB.prepare(insertQuery)
                    .bind(userId, appId, mode, score, now, now)
                    .run();

                return new Response(
                    JSON.stringify({ success: true, action: 'inserted', message: 'New top player added' }),
                    { status: 201, headers: corsHeaders }
                );
            } else {
                // Nếu đã có -> chỉ cập nhật nếu score mới lớn hơn score cũ
                const currentScore = parseFloat(existing.score);
                const newScore = parseFloat(score);

                if (newScore > currentScore) {
                    const updateQuery = `
                        UPDATE top_player
                        SET score = ?, update_at = ?
                        WHERE id = ?
                    `;
                    await env.DB.prepare(updateQuery)
                        .bind(newScore, now, existing.id)
                        .run();

                    return new Response(
                        JSON.stringify({ success: true, action: 'updated', message: 'Score updated' }),
                        { status: 200, headers: corsHeaders }
                    );
                } else {
                    return new Response(
                        JSON.stringify({ success: true, action: 'no_change', message: 'Existing score is higher or equal' }),
                        { status: 200, headers: corsHeaders }
                    );
                }
            }
        }

        if (path === '/list_top_player' && method === 'GET') {
            const appId = url.searchParams.get('appId');
            const mode = url.searchParams.get('mode') || '';
            const userId = url.searchParams.get('userId');
            const limit = parseInt(url.searchParams.get('limit') || '20');
            const page = parseInt(url.searchParams.get('page') || '1');
            const offset = (page - 1) * limit;

            if (!appId) {
                return new Response(
                    JSON.stringify({ error: 'Missing appId' }),
                    { status: 400, headers: corsHeaders }
                );
            }

            // Câu query chính có JOIN users để lấy avatar và name
            let query = `
                SELECT 
                    top_player.*,
                    users.name AS user_name,
                    users.avatar AS user_avatar
                FROM top_player
                LEFT JOIN users ON top_player.userId = users.id
                WHERE top_player.appId = ?
            `;
            const params = [appId];

            if (mode) {
                query += ` AND top_player.mode = ?`;
                params.push(mode);
            }

            if (userId) {
                query += ` AND top_player.userId = ?`;
                params.push(userId);
            }

            query += ` ORDER BY CAST(top_player.score AS REAL) DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const result = await env.DB.prepare(query).bind(...params).all();

            // Đếm tổng số bản ghi (phục vụ phân trang)
            let countQuery = `SELECT COUNT(*) as total FROM top_player WHERE appId = ?`;
            const countParams = [appId];

            if (mode) {
                countQuery += ` AND mode = ?`;
                countParams.push(mode);
            }

            if (userId) {
                countQuery += ` AND userId = ?`;
                countParams.push(userId);
            }

            const countRes = await env.DB.prepare(countQuery).bind(...countParams).first();
            const total = countRes?.total || 0;

            return new Response(
                JSON.stringify({
                    success: true,
                    total,
                    page,
                    limit,
                    data: result.results || []
                }),
                { headers: corsHeaders }
            );
        }

        if (path === '/delete_top_player' && method === 'POST') {
            const data = await request.json();
            const { id } = data;

            if (!id) {
                return new Response(
                    JSON.stringify({ error: 'Missing id' }),
                    { status: 400, headers: corsHeaders }
                );
            }

            // Kiểm tra xem bản ghi có tồn tại không
            const existing = await env.DB.prepare(
                `SELECT id FROM top_player WHERE id = ?`
            ).bind(id).first();

            if (!existing) {
                return new Response(
                    JSON.stringify({ success: false, message: 'Top player not found' }),
                    { status: 404, headers: corsHeaders }
                );
            }

            // Xóa bản ghi
            await env.DB.prepare(`DELETE FROM top_player WHERE id = ?`).bind(id).run();

            return new Response(
                JSON.stringify({ success: true, message: 'Top player deleted successfully' }),
                { status: 200, headers: corsHeaders }
            );
        }

    	return new Response(JSON.stringify({ error: 'Unknown top player route' }), { status: 404, headers: corsHeaders });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
	}
}