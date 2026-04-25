export async function handleSongRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;
	const songFields = 'id, name, artist, album, genre, lang, year, date, publishedAt, link_ytb, mp3, avatar, lyrics, created_at, sync_status';

	try {

		if (path === '/count_song') {
			const { results } = await env.DB
				.prepare('SELECT COUNT(*) AS total FROM song')
				.all();

			return Response.json(results[0], { headers: corsHeaders });
		}

		if (path === '/get_song') {
			const id = url.searchParams.get('id');
			if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: corsHeaders });
			const { results } = await env.DB.prepare(`SELECT ${songFields} FROM song WHERE id = ? LIMIT 1`).bind(id).all();
			return Response.json(results, { headers: corsHeaders });
		}

		if (path === '/song_random') {
			const { results } = await env.DB.prepare('SELECT * FROM song ORDER BY RANDOM() LIMIT 15').all();
			return Response.json(results, { headers: corsHeaders });
		}

			if (path === "/list_song") {
				const page = parseInt(url.searchParams.get("page") || "1");
				const limit = parseInt(url.searchParams.get("limit") || "20");
				const offset = (page - 1) * limit;
				const lang = url.searchParams.get("lang");
				const key = (url.searchParams.get("key") || "").trim();
				const value = (url.searchParams.get("value") || "").trim();
				const orderKey = getSongOrderKey(url.searchParams.get("order_key") || "publishedAt");
				const orderType = getOrderType(url.searchParams.get("order_type") || "DESC");
				const allowFields = ["artist", "album", "genre", "year", "lang", "id", "name"];
				let query = `SELECT ${songFields} FROM song`;
				const params = [];
				const conditions = [];
				if (lang) {
					conditions.push("lang = ?");
					params.push(lang);
				}
				if (key && value) {
					if (!allowFields.includes(key)) {
						return Response.json({ error: "Invalid key" }, { status: 400, headers: corsHeaders });
					}

					if (["artist", "album", "genre", "name", "lang"].includes(key)) {
						conditions.push(`LOWER(${key}) = ?`);
						params.push(value.toLowerCase());
					} else {
						conditions.push(`${key} = ?`);
						params.push(value);
					}
				}
				if (conditions.length > 0) {
					query += " WHERE " + conditions.join(" AND ");
			}
			if (page === 0) {
				query += " ORDER BY RANDOM()";
			} else {
				query += ` ORDER BY ${orderKey} ${orderType}`;
			}
			if (limit !== -1) {
				query += " LIMIT ? OFFSET ?";
				params.push(limit, offset);
			}
			const { results } = await env.DB.prepare(query).bind(...params).all();
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
			const userId = url.searchParams.get('userId') || '';
			const log = url.searchParams.get('log') || '1';
			const orderKey = getSongOrderKey(url.searchParams.get('order_key') || 'publishedAt');
			const orderType = getOrderType(url.searchParams.get('order_type') || 'DESC');

			let query = `
				SELECT ${songFields}
				FROM song
			`;
			const params = [];
			const conditions = [];

			if (lang) {
				conditions.push('lang = ?');
				params.push(lang);
			}
			if (q) {
				conditions.push('(LOWER(name) LIKE ? OR LOWER(artist) LIKE ?)');
				params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
			}

			if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
			query += ` ORDER BY ${orderKey} ${orderType} LIMIT ? OFFSET ?`;
			params.push(limit, offset);

			const { results } = await env.DB.prepare(query).bind(...params).all();

			// 🔹 Ghi log text ngắn gọn
			if(log=='1'){
				try {
					const logQuery = `
					INSERT INTO logs (type, content, userId, lang)
					VALUES (?, ?, ?, ?)
					`;
					await env.DB.prepare(logQuery)
					.bind('song', q, userId, lang)
					.run();
				} catch (err) {
					console.error('Log error:', err);
				}
			}

			return Response.json(results, { headers: corsHeaders });
		}


		if (path === '/report_song' && request.method === 'GET') {
			const date_from = url.searchParams.get('date_from');
			const date_to = url.searchParams.get('date_to');
			const lang = url.searchParams.get('lang');

			if (!date_from || !date_to) {
				return new Response(JSON.stringify({ error: 'Missing date_from or date_to' }), {
					status: 400,
					headers: corsHeaders
				});
			}

			let query = `
				SELECT 
					lang,
					DATE(date) AS date,
					COUNT(*) AS total
				FROM song
				WHERE DATE(date) BETWEEN ? AND ?
			`;
			const params = [date_from, date_to];

			if (lang) {
				query += ' AND lang = ?';
				params.push(lang);
			}

			query += `
				GROUP BY lang, DATE(date)
				ORDER BY date ASC;
			`;

			const { results } = await env.DB.prepare(query).bind(...params).all();

			return Response.json(results, { headers: corsHeaders });
		}

		if (path === '/delete_song' && request.method === 'POST') {
			try {
				const data = await request.json();
				const id = data.id;

				if (!id) {
					return new Response(
						JSON.stringify({ error: 'Missing id' }),
						{ status: 400, headers: corsHeaders }
					);
				}

				const sql = `DELETE FROM song WHERE id = ?`;

				const result = await env.DB.prepare(sql).bind(id).run();

				return new Response(
					JSON.stringify({ success: true, deleted_id: id, changes: result.changes }),
					{ headers: corsHeaders }
				);

			} catch (err) {
				return new Response(
					JSON.stringify({ error: err.message }),
					{ status: 500, headers: corsHeaders }
				);
			}
		}

		if (path === "/list_song_category") {
			const page = parseInt(url.searchParams.get("page") || "1");
			const limit = parseInt(url.searchParams.get("limit") || "20");
			const offset = (page - 1) * limit;
			const lang = url.searchParams.get("lang");
			const field = url.searchParams.get("field") || "artist";

			// ✅ whitelist field cho phép
			const allowFields = [
				"artist",
				"album",
				"genre",
				"year",
				"lang"
			];

			if (!allowFields.includes(field)) {
				return Response.json(
					{ error: "Invalid field" },
					{ status: 400, headers: corsHeaders }
				);
			}

			let query = `
				SELECT DISTINCT ${field}
				FROM song
			`;
			const params = [];
			const conditions = [];

			// filter theo ngôn ngữ
			if (lang) {
				conditions.push("lang = ?");
				params.push(lang);
			}

			// bỏ giá trị NULL / rỗng
			conditions.push(`${field} IS NOT NULL`);
			conditions.push(`${field} != ''`);

			if (conditions.length > 0) {
				query += " WHERE " + conditions.join(" AND ");
			}

			// sắp xếp
			if (page === 0) {
				query += " ORDER BY RANDOM()";
			} else {
				query += ` ORDER BY ${field} COLLATE NOCASE ASC`;
			}

			// phân trang
			if (limit !== -1) {
				query += " LIMIT ? OFFSET ?";
				params.push(limit, offset);
			}

			const { results } = await env.DB
				.prepare(query)
				.bind(...params)
				.all();

			return Response.json(results, { headers: corsHeaders });
		}

		return new Response(JSON.stringify({ error: 'Unknown song route' }), { status: 404, headers: corsHeaders });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
	}
}

function getOrderType(rawValue) {
	return String(rawValue || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
}

function getSongOrderKey(rawValue) {
	switch (String(rawValue || '').trim()) {
		case 'name':
			return 'name COLLATE NOCASE';
		case 'artist':
			return 'artist COLLATE NOCASE';
		case 'album':
			return 'album COLLATE NOCASE';
		case 'genre':
			return 'genre COLLATE NOCASE';
		case 'year':
			return 'year';
		case 'date':
			return "COALESCE(NULLIF(date, ''), created_at)";
		case 'created_at':
			return 'created_at';
		case 'publishedAt':
		default:
			return "COALESCE(NULLIF(publishedAt, ''), NULLIF(date, ''), created_at)";
	}
}
