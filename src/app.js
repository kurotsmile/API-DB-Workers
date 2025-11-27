export async function handleAppRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;

    try{

        if (path === '/add_app_img' && request.method === 'POST') {
            try {
                const data = await request.json();

                const sql = `INSERT INTO app_img (id, app_id, img1, img2, img3, img4, img5)
                            VALUES (?, ?, ?, ?, ?, ?, ?)`;

                await env.DB.prepare(sql).bind(
                    data.id || null,
                    data.app_id,
                    data.img1 || '',
                    data.img2 || '',
                    data.img3 || '',
                    data.img4 || '',
                    data.img5 || ''
                ).run();

                return new Response(JSON.stringify({ success: true, message: 'App images added successfully' }), {
                    headers: corsHeaders
                });

            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: corsHeaders
                });
            }
        }

        if (path === '/list_app_img' && request.method === 'GET') {
            let query = `SELECT * FROM app_img`;
            const { results } = await env.DB.prepare(query).all();
            return Response.json(results, { headers: corsHeaders });
        }

        // Xóa app_img theo id
        if (path === '/delete_app_img') {
            const id = url.searchParams.get('id');
            if (!id) {
                return new Response(JSON.stringify({ error: 'Missing id' }), {
                    status: 400,
                    headers: corsHeaders
                });
            }

            try {
                const query = 'DELETE FROM app_img WHERE id = ?';
                const result = await env.DB.prepare(query).bind(id).run();

                if (result.success) {
                    return Response.json({ success: true, message: 'App image deleted successfully' }, { headers: corsHeaders });
                } else {
                    return new Response(JSON.stringify({ error: 'App image not found or delete failed' }), {
                        status: 404,
                        headers: corsHeaders
                    });
                }
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: corsHeaders
                });
            }
        }

        // Lấy thông tin ảnh app theo id
        if (path === '/get_app_img') {
            const id = url.searchParams.get('id');
            if (!id) {
                return new Response(JSON.stringify({ error: 'Missing id' }), {
                    status: 400,
                    headers: corsHeaders
                });
            }

            try {
                const query = 'SELECT * FROM app_img WHERE app_id = ? LIMIT 1';
                const { results } = await env.DB.prepare(query).bind(id).all();

                if (!results || results.length === 0) {
                    return new Response(JSON.stringify({ error: 'App image not found' }), {
                        status: 404,
                        headers: corsHeaders
                    });
                }

                return Response.json(results[0], { headers: corsHeaders });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: corsHeaders
                });
            }
        }

        // Cập nhật ảnh app theo id
        if (path === '/update_app_img' && request.method === 'POST') {
            try {
                const data = await request.json();
                const id = data.id;

                if (!id) {
                    return new Response(JSON.stringify({ error: 'Missing id' }), {
                        status: 400,
                        headers: corsHeaders
                    });
                }

                const sql = `
                    UPDATE app_img 
                    SET app_id = ?, 
                        img1 = ?, 
                        img2 = ?, 
                        img3 = ?, 
                        img4 = ?, 
                        img5 = ?
                    WHERE id = ?
                `;

                const result = await env.DB.prepare(sql).bind(
                    data.app_id || '',
                    data.img1 || '',
                    data.img2 || '',
                    data.img3 || '',
                    data.img4 || '',
                    data.img5 || '',
                    id
                ).run();

                if (result.success) {
                    return new Response(JSON.stringify({ success: true, message: 'App image updated successfully' }), {
                        headers: corsHeaders
                    });
                } else {
                    return new Response(JSON.stringify({ error: 'Update failed or app image not found' }), {
                        status: 404,
                        headers: corsHeaders
                    });
                }

            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: corsHeaders
                });
            }
        }

    	return new Response(JSON.stringify({ error: 'Unknown app route' }), { status: 404, headers: corsHeaders });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
	}
}