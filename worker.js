/**
 * PilotWx — Cloudflare Worker CORS Proxy
 *
 * DEPLOY INSTRUCTIONS:
 * 1. Go to https://workers.cloudflare.com and create a free account
 * 2. Create a new Worker, paste this file, and deploy
 * 3. Copy your worker URL (e.g. https://pilotwx-proxy.YOUR-NAME.workers.dev)
 * 4. In index.html, set:  const PROXY_BASE = 'https://pilotwx-proxy.YOUR-NAME.workers.dev';
 *
 * Routes handled:
 *   GET /metar?ids=KXXX        → aviationweather.gov METAR JSON
 *   GET /taf?ids=KXXX          → aviationweather.gov TAF JSON
 *   GET /atis/KXXX             → datis.clowd.io ATIS JSON
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const AWC_BASE  = 'https://aviationweather.gov/api/data';
const ATIS_BASE = 'https://datis.clowd.io/api';

export default {
  async fetch(request) {
    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    let upstream;

    if (path === '/metar') {
      const ids = url.searchParams.get('ids') || '';
      upstream = `${AWC_BASE}/metar?ids=${ids}&format=json&hours=2`;
    } else if (path === '/taf') {
      const ids = url.searchParams.get('ids') || '';
      upstream = `${AWC_BASE}/taf?ids=${ids}&format=json&time=valid`;
    } else if (path === '/taf-radius') {
      const lat    = url.searchParams.get('lat')    || '';
      const lon    = url.searchParams.get('lon')    || '';
      const radius = url.searchParams.get('radius') || '75';
      upstream = `${AWC_BASE}/taf?format=json&time=valid&radial=${lon},${lat},${radius}`;
    } else if (path.startsWith('/atis/')) {
      const icao = path.replace('/atis/', '').toUpperCase();
      upstream = `${ATIS_BASE}/${icao}`;
    } else {
      return new Response('Not found', { status: 404, headers: CORS_HEADERS });
    }

    try {
      const resp = await fetch(upstream, {
        headers: { 'User-Agent': 'PilotWx-PWA/1.0' },
        cf: { cacheTtl: 60, cacheEverything: true },  // edge-cache for 60s
      });
      const body = await resp.text();
      return new Response(body, {
        status: resp.status,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      });
    } catch(err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  }
};
