export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Handle JSX files - serve them with JS MIME type (not commonly used in production)
  if (pathname.endsWith('.jsx')) {
    const response = await context.next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Content-Type', 'application/javascript; charset=utf-8');
    return newResponse;
  }

  // Handle JS files in assets
  if (pathname.endsWith('.js') || pathname.includes('/assets/')) {
    const response = await context.next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Content-Type', 'application/javascript; charset=utf-8');
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return newResponse;
  }

  // Handle CSS files
  if (pathname.endsWith('.css')) {
    const response = await context.next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Content-Type', 'text/css; charset=utf-8');
    return newResponse;
  }

  // Handle HTML files (don't cache them)
  if (pathname.endsWith('.html') || pathname === '/') {
    const response = await context.next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Content-Type', 'text/html; charset=utf-8');
    newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return newResponse;
  }

  return context.next();
}
