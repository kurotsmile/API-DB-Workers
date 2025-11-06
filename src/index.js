import { handleSongRequest } from './song.js';
import { handleUserRequest } from './user.js';
import { handleUploadFile, handleGetFile } from './fileR2.js';
import { handleOrdersRequest } from './orders.js';
import { handleContactsRequest } from './contacts.js';
import { handleReportsRequest } from './reports.js';
import { handleLogRequest } from './log.js';


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
			case pathname	===	'/song':
			case pathname	===	'/get_song':
			case pathname.startsWith('/song_random'):
			case pathname.startsWith('/list_song'):
			case pathname.startsWith('/add_song'):
			case pathname.startsWith('/update_song'):
			case pathname.startsWith('/search_song'):
			case pathname ==='/report_song':
				return handleSongRequest(request, env, corsHeaders);

			case pathname ==='/users':
			case pathname ==='/get_user':
			case pathname ==='/search_user':
			case pathname ==='/login':
			case pathname ==='/register':
			case pathname ==='/get_password':
			case pathname ==='/update_user':
			case pathname ==='/update_password':
			case pathname ==='/update_avatar':
			case pathname ==='/report_user':
				return handleUserRequest(request, env, corsHeaders);

			case pathname === '/upload_file' && request.method === 'POST':
				return handleUploadFile(request, env, corsHeaders);
			case pathname === '/get_file' && request.method === 'GET':
				return handleGetFile(request, env, corsHeaders);

			case pathname ==='/add_order':
			case pathname ==='/orders':
			case pathname ==='/delete_order':
			case pathname ==='/report_order':
				return handleOrdersRequest(request, env, corsHeaders);

			case pathname.startsWith('/contacts'):
			case pathname.startsWith('/add_contact'):
			case pathname.startsWith('/delete_contact'):
				return handleContactsRequest(request, env, corsHeaders);

			case pathname.startsWith('/add_report'):
				return handleReportsRequest(request, env, corsHeaders);
			
			case pathname ==='/list_logs':
			case pathname ==='/delete_log':
				return handleLogRequest(request, env, corsHeaders);

			default:
				return new Response(
					JSON.stringify({ message: 'Worker is running but route not found', path: pathname }),
					{ status: 404, headers: corsHeaders }
				);
		}
	},
};
