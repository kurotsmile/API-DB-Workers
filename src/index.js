import { handleSongRequest } from './song.js';
import { handleUserRequest } from './user.js';
import { handleUploadFile, handleGetFile } from './fileR2.js';
import { handleOrdersRequest } from './orders.js';
import { handleContactsRequest } from './contacts.js';

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const { pathname } = url;

		// Thiết lập CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': '*',
		};

		// ✅ Trả về nhanh nếu là preflight request (OPTIONS)
		if (request.method === 'OPTIONS') {
			return new Response('OK', { headers: corsHeaders });
		}

		// ✅ Router chính
		switch (true) {
			case pathname.startsWith('/song'):
			case pathname.startsWith('/get_song'):
			case pathname.startsWith('/song_random'):
			case pathname.startsWith('/list_song'):
			case pathname.startsWith('/add_song'):
			case pathname.startsWith('/update_song'):
			case pathname.startsWith('/search_song'):
				return handleSongRequest(request, env, corsHeaders);

			case pathname.startsWith('/user'):
			case pathname === '/users':
			case pathname.startsWith('/get_user'):
			case pathname.startsWith('/search_user'):
				return handleUserRequest(request, env, corsHeaders);

			case pathname === '/upload_file' && request.method === 'POST':
				return handleUploadFile(request, env, corsHeaders);
			case pathname === '/get_file' && request.method === 'GET':
				return handleGetFile(request, env, corsHeaders);

			case pathname.startsWith('/add_order'):
			case pathname.startsWith('/orders'):
			case pathname.startsWith('/delete_order'):
				return handleOrdersRequest(request, env, corsHeaders);

			case pathname.startsWith('/contacts'):
			case pathname.startsWith('/add_contact'):
			case pathname.startsWith('/delete_contact'):
				return handleContactsRequest(request, env, corsHeaders);

			default:
				return new Response(
					JSON.stringify({ message: 'Worker is running but route not found', path: pathname }),
					{ status: 404, headers: corsHeaders }
				);
		}
	},
};
