export async function handleUserRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	try {
		// Đăng ký tài khoản
		if (path === '/register' && request.method === 'POST') {
			const body = await request.json();
			const { name, email, password, phone, lang = 'en' } = body;

			if (!email || !password) {
				return new Response(JSON.stringify({ error: 'Missing email or password' }), { status: 400, headers: corsHeaders });
			}

			// Kiểm tra trùng email
			const checkUser = await env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1').bind(email).all();
			if (checkUser.results.length > 0) {
				return new Response(JSON.stringify({ error: 'Email already registered' }), { status: 400, headers: corsHeaders });
			}

			// Hash mật khẩu (SHA-256)
			//const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
			//const hashPassword = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

			const createdAt = new Date().toISOString();
			const role = 'user';
			const type = 'basic';

			await env.DB.prepare(`
				INSERT INTO users (name, email, password, phone, lang, created_at, role, type)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			`).bind(name || '', email.trim().toLowerCase(), password, phone || '', lang, createdAt, role, type).run();

			return new Response(JSON.stringify({ success: true, message: 'User registered successfully' }), { headers: corsHeaders });
		}

		// Đăng nhập
		if (path === '/login' && request.method === 'POST') {
			const body = await request.json();
			const { email, password } = body;

			if (!email || !password) {
				return new Response(JSON.stringify({ error: 'Missing email or password' }), { status: 400, headers: corsHeaders });
			}

			//const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
			//const hashPassword = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

			const { results } = await env.DB.prepare('SELECT id, name, email, avatar,address,phone,sex,type,role,birthday,lang FROM users WHERE LOWER(email) = LOWER(?) AND password = ? LIMIT 1')
				.bind(email, password)
				.all();

			if (results.length === 0) {
				return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401, headers: corsHeaders });
			}

			const user = results[0];
			return new Response(JSON.stringify({ success: true, user }), { headers: corsHeaders });
		}

		if (path === '/get_password' && request.method === 'POST') {
			const body = await request.json();
			const { email } = body;

			if (!email) {
				return new Response(JSON.stringify({ error: 'Missing email' }), {
					status: 400,
					headers: corsHeaders
				});
			}

			const { results } = await env.DB.prepare(
				'SELECT id, name, email, password FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1'
			).bind(email).all();

			if (results.length === 0) {
				return new Response(JSON.stringify({ error: 'Email not found' }), {
					status: 404,
					headers: corsHeaders
				});
			}

			const user = results[0];
			return new Response(JSON.stringify({
				success: true,
				message: 'Password found',
				email: user.email,
				password: user.password // ⚠️ chỉ nên dùng cho dev/test
			}), { headers: corsHeaders });
		}

		// Danh sách user
		if (path === '/users') {
			const page = parseInt(url.searchParams.get('page') || '1');
			const limit = parseInt(url.searchParams.get('limit') || '20');
			const offset = (page - 1) * limit;
			const lang = url.searchParams.get('lang') || '';
			const fields = 'id,address,avatar,email,name,phone,sex,type,role,birthday';

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

		// Lấy 1 user theo id
		if (path === '/get_user') {
			const id = url.searchParams.get('id');
			if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: corsHeaders });
			const { results } = await env.DB.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(id).all();
			return Response.json(results, { headers: corsHeaders });
		}

		// Tìm kiếm user
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

		if (path === '/update_user' && request.method === 'POST') {
			const body = await request.json();
			const { id, name, email, phone, address, avatar, sex, lang, role, type, birthday} = body;

			// Kiểm tra bắt buộc
			if (!id) {
				return new Response(JSON.stringify({ error: 'Missing user id' }), {
					status: 400,
					headers: corsHeaders
				});
			}

			// Lấy dữ liệu hiện tại để giữ nguyên những field chưa cập nhật
			const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(id).all();
			if (existing.results.length === 0) {
				return new Response(JSON.stringify({ error: 'User not found' }), {
					status: 404,
					headers: corsHeaders
				});
			}
			const user = existing.results[0];

			// Gán giá trị mới nếu có, nếu không thì giữ giá trị cũ
			const newName = name ?? user.name;
			const newEmail = email ?? user.email;
			const newPhone = phone ?? user.phone;
			const newAddress = address ?? user.address;
			const newAvatar = avatar ?? user.avatar;
			const newSex = sex ?? user.sex;
			const newLang = lang ?? user.lang;
			const newRole = role ?? user.role;
			const newType = type ?? user.type;
			const newBirthday = birthday ?? user.birthday;

			await env.DB.prepare(`
				UPDATE users SET
					name = ?, email = ?, phone = ?, address = ?, avatar = ?,
					sex = ?, lang = ?, role = ?, type = ?, birthday = ?
				WHERE id = ?
			`).bind(newName, newEmail, newPhone, newAddress, newAvatar, newSex, newLang, newRole, newType, newBirthday, id).run();

			return new Response(JSON.stringify({
				success: true,
				message: 'User updated successfully',
				user: {
					id,
					name: newName,
					email: newEmail,
					phone: newPhone,
					address: newAddress,
					avatar: newAvatar,
					sex: newSex,
					lang: newLang,
					role: newRole,
					type: newType,
					birthday:newBirthday
				}
			}), { headers: corsHeaders });
		}

		if (path === '/update_password' && request.method === 'POST') {
			const body = await request.json();
			const { id, old_password, new_password } = body;

			// Kiểm tra các trường bắt buộc
			if (!id || !old_password || !new_password) {
				return new Response(JSON.stringify({ error: 'Missing fields' }), {
					status: 400,
					headers: corsHeaders
				});
			}

			// Kiểm tra người dùng có tồn tại không
			const existing = await env.DB.prepare('SELECT id, password FROM users WHERE id = ? LIMIT 1')
				.bind(id)
				.all();

			if (existing.results.length === 0) {
				return new Response(JSON.stringify({ error: 'User not found' }), {
					status: 404,
					headers: corsHeaders
				});
			}

			const user = existing.results[0];

			// Kiểm tra mật khẩu cũ
			if (user.password !== old_password) {
				return new Response(JSON.stringify({ error: 'Old password incorrect' }), {
					status: 401,
					headers: corsHeaders
				});
			}

			// Cập nhật mật khẩu mới
			await env.DB.prepare('UPDATE users SET password = ? WHERE id = ?')
				.bind(new_password, id)
				.run();

			// Lấy lại thông tin user đầy đủ
			const { results } = await env.DB.prepare(
				'SELECT id, name, email, avatar, phone, address, lang, role, type, sex, created_at FROM users WHERE id = ? LIMIT 1'
			).bind(id).all();

			const updatedUser = results[0] || {};

			return new Response(JSON.stringify({
				success: true,
				message: 'Password updated successfully',
				user: updatedUser
			}), { headers: corsHeaders });
		}

		if (path === '/update_avatar' && request.method === 'POST') {
			const body = await request.json();
			const { id, avatar } = body;

			// Kiểm tra các trường bắt buộc
			if (!id || !avatar) {
				return new Response(JSON.stringify({ error: 'Missing fields' }), {
				status: 400,
				headers: corsHeaders
				});
			}

			// Kiểm tra người dùng có tồn tại không
			const existing = await env.DB.prepare(
				'SELECT id FROM users WHERE id = ? LIMIT 1'
			).bind(id).all();

			if (existing.results.length === 0) {
				return new Response(JSON.stringify({ error: 'User not found' }), {
				status: 404,
				headers: corsHeaders
				});
			}

			// Cập nhật avatar mới
			await env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?')
				.bind(avatar, id)
				.run();

			// Lấy lại thông tin user sau khi cập nhật
			const { results } = await env.DB.prepare(
				'SELECT id, name, email, avatar, phone, address, lang, role, type, sex, created_at FROM users WHERE id = ? LIMIT 1'
			).bind(id).all();

			const updatedUser = results[0] || {};

			return new Response(JSON.stringify({
				success: true,
				message: 'Avatar updated successfully',
				user: updatedUser
			}), { headers: corsHeaders });
		}

		// Báo cáo người dùng theo quốc gia và ngày
		if (path === '/report_user' && method === 'GET') {
			const date_from = url.searchParams.get('date_from');
			const date_to = url.searchParams.get('date_to');

			if (!date_from || !date_to) {
				return new Response(JSON.stringify({ error: 'Missing date_from or date_to' }), {
					status: 400,
					headers: corsHeaders
				});
			}

			const query = `
				SELECT 
					lang,
					DATE(created_at) AS date,
					COUNT(*) AS total
				FROM users
				WHERE DATE(created_at) BETWEEN ? AND ?
				GROUP BY lang, DATE(created_at)
				ORDER BY date ASC;
			`;

			const { results } = await env.DB.prepare(query)
				.bind(date_from, date_to)
				.all();

			return Response.json(results, { headers: corsHeaders });
		}


		return new Response(JSON.stringify({ error: 'Unknown user route' }), { status: 404, headers: corsHeaders });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
	}
}
