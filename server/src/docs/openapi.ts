export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Social Media App API',
    version: '1.0.0',
    description:
      'API documentation for the Hono backend and Better Auth endpoints.',
  },
  servers: [{ url: process.env.BETTER_AUTH_URL ?? 'http://localhost:8080' }],
  tags: [
    { name: 'Health', description: 'Service health endpoints' },
    { name: 'Auth', description: 'Better Auth endpoints' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Server is reachable',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Hello Hono!' },
                  },
                  required: ['message'],
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/sign-up/email': {
      post: {
        tags: ['Auth'],
        summary: 'Sign up with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', format: 'password', example: 'your-password' },
                },
                required: ['name', 'email', 'password'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'User signed up successfully' },
          '400': { description: 'Validation or signup error' },
        },
      },
    },
    '/api/auth/sign-in/email': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', format: 'password', example: 'your-password' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'User signed in successfully' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/sign-out': {
      post: {
        tags: ['Auth'],
        summary: 'Sign out current user',
        responses: {
          '200': { description: 'User signed out successfully' },
        },
      },
    },
    '/api/auth/get-session': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user session',
        responses: {
          '200': { description: 'Session returned' },
          '401': { description: 'No active session' },
        },
      },
    },
  },
};
