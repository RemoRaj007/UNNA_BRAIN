export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      const apiOrigin = (env.API_ORIGIN || 'https://api.example.com').replace(/\/$/, '');
      const target = new URL(url.pathname + url.search, apiOrigin);
      return Response.redirect(target.toString(), 302);
    }

    return env.ASSETS.fetch(request);
  },
};
