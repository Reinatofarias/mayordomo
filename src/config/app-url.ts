const LOCAL_APP_ORIGIN = 'http://localhost:3000';

type HeaderReader = Pick<Headers, 'get'>;

function normalizeOrigin(value: string | undefined) {
 if (!value) return null;
 try { return new URL(value).origin; }
 catch { return null; }
}

export function originFromHeaders(headers: HeaderReader) {
 const host = headers.get('x-forwarded-host') || headers.get('host');
 if (!host) return null;
 const protocol = headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
 return `${protocol}://${host}`;
}

export function appOrigin(headers?: HeaderReader, configured = process.env.APP_URL) {
 const requestOrigin = headers ? originFromHeaders(headers) : null;
 const configuredOrigin = normalizeOrigin(configured);
 if (configuredOrigin && !(configuredOrigin.includes('localhost') && requestOrigin && !requestOrigin.includes('localhost'))) {
  return configuredOrigin;
 }
 return requestOrigin || configuredOrigin || LOCAL_APP_ORIGIN;
}
