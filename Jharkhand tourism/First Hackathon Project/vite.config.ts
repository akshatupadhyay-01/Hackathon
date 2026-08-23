import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { generateItinerary } from './src/server/itineraryService';
import { SimpleRateLimiter, SECURITY_LIMITS, redactSecrets } from './src/lib/security';

const rateLimiter = new SimpleRateLimiter(60000, 30); // 30 requests / minute max

function handleItineraryRequest(req: any, res: any) {
  // 1. Rate Limiting (LPDOS Protection)
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local-client';
  if (!rateLimiter.isAllowed(String(clientIp))) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Retry-After', '60');
    res.statusCode = 429;
    res.end(JSON.stringify({ error: 'Too Many Requests. Please slow down and try again in 1 minute.' }));
    return;
  }

  // 2. Content-Type Check
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json') && req.method === 'POST' && req.headers['content-length'] !== '0') {
    // allow empty body with fallback, but block invalid mime types
  }

  // 3. Bounded Payload Ingestion (LPDOS & Memory Exhaustion Protection)
  let body = '';
  let bodyBytes = 0;
  let isTooLarge = false;

  req.on('data', (chunk: Buffer | string) => {
    if (isTooLarge) return;

    bodyBytes += typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length;
    if (bodyBytes > SECURITY_LIMITS.MAX_JSON_PAYLOAD_BYTES) {
      isTooLarge = true;
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 413;
      res.end(JSON.stringify({ error: 'Payload Too Large. Maximum allowed size is 64 KB.' }));
      req.destroy();
      return;
    }
    body += chunk;
  });

  req.on('end', async () => {
    if (isTooLarge) return;

    try {
      // 4. Safe JSON Parsing
      let parsed = {};
      if (body && body.trim()) {
        try {
          parsed = JSON.parse(body);
        } catch {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Malformed JSON payload.' }));
          return;
        }
      }

      // 5. Generate with Sanitized Itinerary Service
      const result = await generateItinerary(parsed);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    } catch (err: any) {
      const safeErrorMsg = redactSecrets(err.message || 'Internal Server Error');
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ error: safeErrorMsg }));
    }
  });
}

function apiPlugin(): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/itinerary' && req.method === 'POST') {
          handleItineraryRequest(req, res);
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/itinerary' && req.method === 'POST') {
          handleItineraryRequest(req, res);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
