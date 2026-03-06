export async function onRequest(context) {
  const response = await context.next();

  // Clone response to modify headers
  const newResponse = new Response(response.body, response);

  // Force correct MIME type for JS files
  if (context.request.url.endsWith('.js') || context.request.url.includes('/assets/')) {
    newResponse.headers.set('Content-Type', 'application/javascript; charset=utf-8');
  }

  return newResponse;
}
