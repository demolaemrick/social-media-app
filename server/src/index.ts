import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './lib/better-auth.js';
import { registerSwagger } from './docs/register-swagger.js';
import posts from './routes/posts.js';

const app = new Hono();
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

app.use(
  '/api/*',
  cors({
    origin: frontendOrigin,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));
app.route('/api/posts', posts);

app.get('/health', (c) => {
  return c.json({ message: 'Ok' });
});

registerSwagger(app);

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT),
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
