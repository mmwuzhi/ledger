import { NextResponse, type NextRequest } from 'next/server';

/**
 * Simple HTTP Basic Auth gate.
 * Set SITE_PASSWORD in .env.local to enable.
 * Leave it unset (or empty) for open access in local dev.
 *
 * Usage: open the site in a browser — it will prompt for a username and
 * password. Enter anything as the username and your SITE_PASSWORD as the
 * password.
 */
export function middleware(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;

  // No password configured → allow everything (local dev default)
  if (!password) return NextResponse.next();

  const auth = request.headers.get('authorization') ?? '';
  if (auth.startsWith('Basic ')) {
    const decoded = atob(auth.slice(6)); // atob is available in Edge Runtime; Buffer is not
    // Accept any username; only the password is checked
    const [, pass] = decoded.split(':');
    if (pass === password) return NextResponse.next();
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="MoneyBook"' },
  });
}

export const config = {
  // Apply to every route except Next.js internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
