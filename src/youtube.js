export async function handleYoutubeRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const videoId = (url.searchParams.get('id') || '').trim();

	if (!videoId) {
		return Response.json({ error: 'Missing id' }, { status: 400, headers: corsHeaders });
	}

	if (!env.YOUTUBE_API_KEY) {
		return Response.json(
			{ error: 'Missing worker secret: YOUTUBE_API_KEY' },
			{ status: 500, headers: corsHeaders }
		);
	}

	const youtubeUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
	youtubeUrl.searchParams.set('part', 'snippet');
	youtubeUrl.searchParams.set('id', videoId);
	youtubeUrl.searchParams.set('key', env.YOUTUBE_API_KEY);

	try {
		const youtubeResponse = await fetch(youtubeUrl.toString(), {
			headers: {
				Accept: 'application/json',
			},
		});
		const payload = await youtubeResponse.json();

		if (!youtubeResponse.ok) {
			return Response.json(
				{
					error: 'YouTube API request failed',
					details: payload?.error || payload,
				},
				{ status: youtubeResponse.status, headers: corsHeaders }
			);
		}

		return Response.json(
			{ snippet: payload?.items?.[0]?.snippet || null },
			{ headers: corsHeaders }
		);
	} catch (error) {
		return Response.json(
			{ error: 'Failed to fetch YouTube API', details: error.message },
			{ status: 500, headers: corsHeaders }
		);
	}
}
