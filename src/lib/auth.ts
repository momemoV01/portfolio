const textEncoder = new TextEncoder();

export const DOCS_SESSION_COOKIE = 'rp_docs_session';
export const DOCS_SESSION_TTL_SECONDS = 60 * 60 * 12;
export const DOCS_LOGIN_CSRF_COOKIE = 'rp_docs_login_csrf';
export const DOCS_LOGOUT_CSRF_COOKIE = 'rp_docs_logout_csrf';
export const DOCS_CSRF_TTL_SECONDS = 60 * 10;

type AuthConfig = {
	password: string;
	sessionSecret: string;
};

const buildEnvironment: Record<string, string | undefined> = {
	DOCS_ACCESS_PASSWORD: import.meta.env.DOCS_ACCESS_PASSWORD,
	DOCS_SESSION_SECRET: import.meta.env.DOCS_SESSION_SECRET,
};

function readRuntimeEnv(name: string): string {
	const runtimeValue = typeof process !== 'undefined' ? process.env[name] : undefined;
	const value = runtimeValue || buildEnvironment[name];
	return value?.trim() ?? '';
}

export function getAuthConfig(): AuthConfig | null {
	const password = readRuntimeEnv('DOCS_ACCESS_PASSWORD');
	const sessionSecret = readRuntimeEnv('DOCS_SESSION_SECRET');

	if (!password || sessionSecret.length < 32) {
		return null;
	}

	return { password, sessionSecret };
}

function toBase64Url(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString('base64url');
}

function fromBase64Url(value: string): Uint8Array | null {
	try {
		return new Uint8Array(Buffer.from(value, 'base64url'));
	} catch {
		return null;
	}
}

async function hmac(value: string, secret: string): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey(
		'raw',
		textEncoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	return new Uint8Array(await crypto.subtle.sign('HMAC', key, textEncoder.encode(value)));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
	if (left.length !== right.length) return false;
	let difference = 0;
	for (let index = 0; index < left.length; index += 1) {
		difference |= left[index] ^ right[index];
	}
	return difference === 0;
}

export function createCsrfToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return toBase64Url(bytes);
}

export function getCsrfCookieOptions(secure: boolean) {
	return {
		httpOnly: true,
		secure,
		sameSite: 'strict' as const,
		path: '/',
		maxAge: DOCS_CSRF_TTL_SECONDS,
	};
}

export async function verifyCsrfToken(candidate: string, expected: string | undefined): Promise<boolean> {
	if (!candidate || !expected) return false;
	const [candidateDigest, expectedDigest] = await Promise.all([
		crypto.subtle.digest('SHA-256', textEncoder.encode(candidate)),
		crypto.subtle.digest('SHA-256', textEncoder.encode(expected)),
	]);
	return constantTimeEqual(new Uint8Array(candidateDigest), new Uint8Array(expectedDigest));
}

export async function verifyAccessPassword(candidate: string, expected: string): Promise<boolean> {
	const [candidateDigest, expectedDigest] = await Promise.all([
		crypto.subtle.digest('SHA-256', textEncoder.encode(candidate)),
		crypto.subtle.digest('SHA-256', textEncoder.encode(expected)),
	]);
	return constantTimeEqual(new Uint8Array(candidateDigest), new Uint8Array(expectedDigest));
}

export async function createSessionValue(secret: string): Promise<string> {
	const expiresAt = Math.floor(Date.now() / 1000) + DOCS_SESSION_TTL_SECONDS;
	const nonce = crypto.randomUUID();
	const payload = `v1.${expiresAt}.${nonce}`;
	const signature = await hmac(payload, secret);
	return `${payload}.${toBase64Url(signature)}`;
}

export async function isSessionValueValid(value: string | undefined, secret: string): Promise<boolean> {
	if (!value) return false;
	const parts = value.split('.');
	if (parts.length !== 4 || parts[0] !== 'v1') return false;

	const expiresAt = Number(parts[1]);
	if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

	const providedSignature = fromBase64Url(parts[3]);
	if (!providedSignature) return false;

	const payload = parts.slice(0, 3).join('.');
	const expectedSignature = await hmac(payload, secret);
	return constantTimeEqual(providedSignature, expectedSignature);
}

export function safeReturnTo(value: FormDataEntryValue | string | null | undefined): string {
	if (typeof value !== 'string') return '/';
	if (!value.startsWith('/') || value.startsWith('//')) return '/';
	return value;
}
