import type { APIRoute } from 'astro';
import {
	DOCS_LOGOUT_CSRF_COOKIE,
	DOCS_SESSION_COOKIE,
	verifyCsrfToken,
} from '../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
	const form = await request.formData();
	const submittedCsrfToken = String(form.get('csrfToken') ?? '');
	const csrfCookie = cookies.get(DOCS_LOGOUT_CSRF_COOKIE)?.value;
	cookies.delete(DOCS_LOGOUT_CSRF_COOKIE, { path: '/' });

	if (!(await verifyCsrfToken(submittedCsrfToken, csrfCookie))) {
		return new Response('Invalid or expired form token.', { status: 403 });
	}

	cookies.delete(DOCS_SESSION_COOKIE, { path: '/' });
	return redirect('/login', 303);
};

export const ALL: APIRoute = () => new Response('Method Not Allowed', { status: 405 });
