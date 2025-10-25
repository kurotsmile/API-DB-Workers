export async function handleUploadFile(request, env, corsHeaders) {
	try {
		const formData = await request.formData();
		const file = formData.get('file');
		const nameFileInput = formData.get('name_file');

		if (!file) {
			return new Response('Missing file', {
				status: 400,
				headers: corsHeaders,
			});
		}

		const folder = file.type.startsWith('image/')
			? 'image'
			: file.type.startsWith('audio/')
			? 'audio'
			: 'other';

		let originalExt = '';
		const match = file.name.match(/\.[a-z0-9]+$/i);
		if (match) originalExt = match[0].toLowerCase();

		let nameFile = nameFileInput?.trim() || file.name;
		if (!/\.[a-z0-9]+$/i.test(nameFile)) {
			if (originalExt) {
				nameFile += originalExt;
			} else {
				let ext = '';
				if (file.type.includes('jpeg')) ext = '.jpg';
				else if (file.type.includes('png')) ext = '.png';
				else if (file.type.includes('gif')) ext = '.gif';
				else if (file.type.includes('webp')) ext = '.webp';
				else if (file.type.includes('mp3')) ext = '.mp3';
				else if (file.type.includes('wav')) ext = '.wav';
				else if (file.type.includes('ogg')) ext = '.ogg';
				else if (file.type.includes('mp4')) ext = '.mp4';
				nameFile += ext;
			}
		}

		const fileName = `${folder}/${nameFile}`;
		await env.MY_BUCKET.put(fileName, file.stream(), {
			httpMetadata: { contentType: file.type },
		});

		return new Response(
			JSON.stringify({ success: true, url: fileName }),
			{
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch (err) {
		return new Response('Upload error: ' + err.message, {
			status: 500,
			headers: corsHeaders,
		});
	}
}

export async function handleGetFile(request, env, corsHeaders) {
	const url = new URL(request.url);
	const key = url.searchParams.get('file');

	if (!key) {
		return new Response(
			JSON.stringify({ error: "Missing 'file' parameter" }),
			{
				status: 400,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	}

	try {
		const object = await env.MY_BUCKET.get(key);
		if (!object) {
			return new Response(
				JSON.stringify({ error: 'File not found' }),
				{
					status: 404,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
				}
			);
		}

		const contentType =
			object.httpMetadata?.contentType ||
			(key.endsWith('.jpg') || key.endsWith('.jpeg')
				? 'image/jpeg'
				: key.endsWith('.png')
				? 'image/png'
				: key.endsWith('.gif')
				? 'image/gif'
				: key.endsWith('.webp')
				? 'image/webp'
				: key.endsWith('.mp3')
				? 'audio/mpeg'
				: key.endsWith('.wav')
				? 'audio/wav'
				: key.endsWith('.ogg')
				? 'audio/ogg'
				: key.endsWith('.mp4')
				? 'video/mp4'
				: 'application/octet-stream');

		return new Response(object.body, {
			headers: {
				...corsHeaders,
				'Content-Type': contentType,
			},
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: 'Error reading file: ' + err.message }),
			{
				status: 500,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}
