import { defineMiddleware } from 'astro:middleware';
import { DOCS_SESSION_COOKIE, getAuthConfig, isSessionValueValid } from './lib/auth';

const PUBLIC_PATHS = new Set(['/login', '/api/login', '/api/logout', '/robots.txt', '/favicon.ico', '/favicon.svg']);
const PUBLIC_PREFIXES = ['/_astro/'];

function applySecurityHeaders(response: Response): Response {
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'no-referrer');
	response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname, search } = context.url;
	const isPublic = PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
	const config = getAuthConfig();
	const session = context.cookies.get(DOCS_SESSION_COOKIE)?.value;
	const isAuthenticated = config ? await isSessionValueValid(session, config.sessionSecret) : false;

	if (pathname === '/login' && isAuthenticated) {
		return applySecurityHeaders(context.redirect('/', 303));
	}

	if (!isPublic && !isAuthenticated) {
		const returnTo = `${pathname}${search}`;
		return applySecurityHeaders(context.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`, 303));
	}

	return applySecurityHeaders(await next());
});
