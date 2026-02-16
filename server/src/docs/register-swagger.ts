import type { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { openApiDocument } from './openapi.js';

export function registerSwagger(app: Hono) {
  app.get('/api/docs', (c) => c.json(openApiDocument));
  app.get('/docs', swaggerUI({ url: '/api/docs' }));
}
