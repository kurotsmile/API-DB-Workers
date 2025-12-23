import { handleSongRequest } from './song.js';
import { handleUserRequest } from './user.js';
import { handleUploadFile, handleGetFile } from './fileR2.js';
import { handleOrdersRequest } from './orders.js';
import { handleContactsRequest } from './contacts.js';
import { handleReportsRequest } from './reports.js';
import { handleLogRequest } from './log.js';
import { handleAppRequest } from './app.js';
import { handleTopPlayerRequest } from './top_player.js';
import { handleDatabaseRequest } from './database.js';

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const { pathname } = url;

		// Thiết lập CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			"Access-Control-Allow-Methods": 'GET,HEAD,POST,OPTIONS',
			'Access-Control-Allow-Headers': '*',
		};

		// ✅ Trả về nhanh nếu là preflight request (OPTIONS)
		if (request.method === 'OPTIONS') {
			return new Response('OK', { headers: corsHeaders });
		}

		// ✅ Router chính
		switch (true) {
			case pathname === '/song':
			case pathname === '/get_song':
			case pathname === '/song_random':
			case pathname === '/list_song':
			case pathname === '/add_song':
			case pathname === '/update_song':
			case pathname === '/search_song':
			case pathname === '/report_song':
			case pathname === '/count_song':
			case pathname === '/delete_song':
				return handleSongRequest(request, env, corsHeaders);

			case pathname === '/users':
			case pathname === '/get_user':
			case pathname === '/search_user':
			case pathname === '/login':
			case pathname === '/register':
			case pathname === '/get_password':
			case pathname === '/update_user':
			case pathname === '/update_password':
			case pathname === '/update_avatar':
			case pathname === '/report_user':
			case pathname === '/count_user':
			case pathname === '/delete_u':
				return handleUserRequest(request, env, corsHeaders);

			case pathname === '/upload_file' && request.method === 'POST':
				return handleUploadFile(request, env, corsHeaders);
			case pathname === '/delete_file' && request.method === "POST":
				return handleDeleteFile(request, env, corsHeaders);
			case pathname === '/get_file' && request.method === 'GET':
				return handleGetFile(request, env, corsHeaders);

			case pathname === '/add_order':
			case pathname === '/orders':
			case pathname === '/delete_order':
			case pathname === '/report_order':
			case pathname === '/check_pay':
				return handleOrdersRequest(request, env, corsHeaders);

			case pathname === '/contacts':
			case pathname === '/contacts_count':
			case pathname === '/add_contact':
			case pathname === '/delete_contact':
				return handleContactsRequest(request, env, corsHeaders);

			case pathname === '/add_report':
			case pathname === '/list_report':
			case pathname === '/count_report':
			case pathname === '/delete_report':
				return handleReportsRequest(request, env, corsHeaders);

			case pathname === '/list_logs':
			case pathname === '/delete_log':
				return handleLogRequest(request, env, corsHeaders);

			case pathname === '/list_app_img':
			case pathname === '/add_app_img':
			case pathname === '/delete_app_img':
			case pathname === '/get_app_img':
			case pathname === '/update_app_img':
				return handleAppRequest(request, env, corsHeaders);

			case pathname === '/update_top_player':
			case pathname === '/list_top_player':
			case pathname === '/delete_top_player':
				return handleTopPlayerRequest(request, env, corsHeaders);

			case pathname === '/inster_table':
			case pathname === '/read_table':
			case pathname === '/delete_table':
			case pathname === '/count_table':
			case pathname === '/update_table':
				return handleDatabaseRequest(request, env, corsHeaders);
			default:
				return new Response(
					JSON.stringify({ message: 'Worker is running but route not found', path: pathname }),
					{ status: 404, headers: corsHeaders }
				);
		}
	},
};
