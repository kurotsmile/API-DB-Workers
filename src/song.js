export async function handleSongRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;

	try {
		if (path === '/get_song') {
			const id = url.searchParams.get('id');
			if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: corsHeaders });
			const { results } = await env.DB.prepare('SELECT * FROM song WHERE id = ? LIMIT 1').bind(id).all();
			return Response.json(results, { headers: corsHeaders });
		}

		if (path === '/song_random') {
			const { results } = await env.DB.prepare('SELECT * FROM song ORDER BY RANDOM() LIMIT 15').all();
			return Response.json(results, { headers: corsHeaders });
		}

		if (path === '/list_song') {
			const page = parseInt(url.searchParams.get('page') || '1');
			const limit = parseInt(url.searchParams.get('limit') || '20');
			const offset = (page - 1) * limit;
			const lang = url.searchParams.get('lang') || 'en';
			const fields = 'id, name, artist, album, genre, lang, link_ytb, mp3, avatar';
			const { results } = await env.DB.prepare(
				`SELECT ${fields} FROM song WHERE lang = ? ORDER BY date DESC LIMIT ? OFFSET ?`
			)
				.bind(lang, limit, offset)
				.all();
			return Response.json(results, { headers: corsHeaders });
		}

		if (path === '/add_song' && request.method === 'POST') {
			const data = await request.json();
			const sql = `INSERT INTO song (id, name, artist, mp3, genre, year, album, link_ytb, lang, avatar, date, lyrics, publishedAt)
			             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
			await env.DB.prepare(sql).bind(
				data.id, data.name, data.artist, data.mp3,
				data.genre || '', data.year || '', data.album || '',
				data.link_ytb || '', data.lang || 'vi', data.avatar || '',
				data.date || '', data.lyrics || '', data.publishedAt || ''
			).run();
			return new Response('OK', { headers: corsHeaders });
		}

		if (path === '/update_song' && request.method === 'POST') {
			const data = await request.json();
			const sql = `UPDATE song SET name=?, artist=?, mp3=?, genre=?, year=?, album=?, link_ytb=?, lang=?, avatar=?, date=?, lyrics=?, publishedAt=? WHERE id=?`;
			await env.DB.prepare(sql).bind(
				data.name, data.artist, data.mp3, data.genre || '', data.year || '',
				data.album || '', data.link_ytb || '', data.lang || 'vi',
				data.avatar || '', data.date || '', data.lyrics || '',
				data.publishedAt || '', data.id
			).run();
			return Response.json({ message: 'Updated successfully' }, { headers: corsHeaders });
		}

		if (path === '/search_song') {
			const q = url.searchParams.get('q')?.trim() || '';
			const lang = url.searchParams.get('lang') || '';
			const page = parseInt(url.searchParams.get('page') || '1');
			const limit = parseInt(url.searchParams.get('limit') || '20');
			const offset = (page - 1) * limit;
			let query = 'SELECT id,name,artist,album,genre,lang,link_ytb,mp3,avatar FROM song';
			const params = [];
			const conditions = [];

			if (lang) { conditions.push('lang = ?'); params.push(lang); }
			if (q) {
				conditions.push('(LOWER(name) LIKE ? OR LOWER(artist) LIKE ?)');
				params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
			}
			if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
			query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
			params.push(limit, offset);

			const { results } = await env.DB.prepare(query).bind(...params).all();
			return Response.json(results, { headers: corsHeaders });
		}

		return new Response(JSON.stringify({ error: 'Unknown song route' }), { status: 404, headers: corsHeaders });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
	}
}
