import type { APIRoute } from 'astro';
import {
	DOCS_SESSION_COOKIE,
	DOCS_SESSION_TTL_SECONDS,
	DOCS_LOGIN_CSRF_COOKIE,
	createSessionValue,
	getAuthConfig,
	safeReturnTo,
	verifyAccessPassword,
	verifyCsrfToken,
} from '../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
	const config = getAuthConfig();
	const form = await request.formData();
	const returnTo = safeReturnTo(form.get('returnTo'));
	const submittedCsrfToken = String(form.get('csrfToken') ?? '');
	const csrfCookie = cookies.get(DOCS_LOGIN_CSRF_COOKIE)?.value;
	cookies.delete(DOCS_LOGIN_CSRF_COOKIE, { path: '/' });

	if (!(await verifyCsrfToken(submittedCsrfToken, csrfCookie))) {
		return redirect(`/login?error=expired&returnTo=${encodeURIComponent(returnTo)}`, 303);
	}

	if (!config) {
		return redirect(`/login?error=config&returnTo=${encodeURIComponent(returnTo)}`, 303);
	}

	const password = String(form.get('password') ?? '');
	if (!(await verifyAccessPassword(password, config.password))) {
		await new Promise((resolve) => setTimeout(resolve, 350));
		return redirect(`/login?error=invalid&returnTo=${encodeURIComponent(returnTo)}`, 303);
	}

	cookies.set(DOCS_SESSION_COOKIE, await createSessionValue(config.sessionSecret), {
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'strict',
		path: '/',
		maxAge: DOCS_SESSION_TTL_SECONDS,
	});

	return redirect(returnTo, 303);
};

export const ALL: APIRoute = () => new Response('Method Not Allowed', { status: 405 });
