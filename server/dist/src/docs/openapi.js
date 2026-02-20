export const openApiDocument = {
    openapi: '3.0.3',
    info: {
        title: 'Social Media App API',
        version: '1.0.0',
        description: 'API documentation for the Hono backend and Better Auth endpoints.',
    },
    servers: [{ url: process.env.BETTER_AUTH_URL ?? 'http://localhost:8080' }],
    tags: [
        { name: 'Health', description: 'Service health endpoints' },
        { name: 'Auth', description: 'Better Auth endpoints' },
        { name: 'Posts', description: 'Post CRUD endpoints' },
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
                                        message: { type: 'string', example: 'Ok' },
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
        '/api/posts': {
            post: {
                tags: ['Posts'],
                summary: 'Create a post',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string', example: 'My first post' },
                                    content: { type: 'string', example: 'Hello from my first post!' },
                                },
                                required: ['title', 'content'],
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Post created successfully' },
                    '400': { description: 'Validation error' },
                    '401': { description: 'Unauthorized' },
                },
            },
            get: {
                tags: ['Posts'],
                summary: 'List latest posts (capped)',
                parameters: [
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { type: 'integer', default: 20, minimum: 1, maximum: 50 },
                    },
                ],
                responses: {
                    '200': { description: 'Posts returned' },
                },
            },
        },
        '/api/posts/{id}': {
            get: {
                tags: ['Posts'],
                summary: 'Get a single post',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    '200': { description: 'Post returned' },
                    '404': { description: 'Post not found' },
                },
            },
            patch: {
                tags: ['Posts'],
                summary: 'Update a post',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string', example: 'Updated title' },
                                    content: { type: 'string', example: 'Updated post content' },
                                },
                                required: ['title', 'content'],
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Post updated successfully' },
                    '400': { description: 'Validation error' },
                    '401': { description: 'Unauthorized' },
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Post not found' },
                },
            },
            delete: {
                tags: ['Posts'],
                summary: 'Delete a post',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    '204': { description: 'Post deleted successfully' },
                    '401': { description: 'Unauthorized' },
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Post not found' },
                },
            },
        },
        '/api/posts/{id}/likes': {
            post: {
                tags: ['Posts'],
                summary: 'Like a post (idempotent)',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    '200': { description: 'Post liked' },
                    '401': { description: 'Unauthorized' },
                    '404': { description: 'Post not found' },
                },
            },
            delete: {
                tags: ['Posts'],
                summary: 'Unlike a post (idempotent)',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    '200': { description: 'Post unliked' },
                    '401': { description: 'Unauthorized' },
                    '404': { description: 'Post not found' },
                },
            },
        },
        '/api/posts/{id}/comments': {
            post: {
                tags: ['Posts'],
                summary: 'Create comment on a post',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    content: { type: 'string', example: 'Nice post!' },
                                },
                                required: ['content'],
                            },
                        },
                    },
                },
                responses: {
                    '201': { description: 'Comment created' },
                    '400': { description: 'Validation error' },
                    '401': { description: 'Unauthorized' },
                    '404': { description: 'Post not found' },
                },
            },
            get: {
                tags: ['Posts'],
                summary: 'List post comments (capped)',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: { type: 'string' },
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { type: 'integer', default: 20, minimum: 1, maximum: 50 },
                    },
                ],
                responses: {
                    '200': { description: 'Comments returned' },
                    '404': { description: 'Post not found' },
                },
            },
        },
        '/api/posts/{id}/comments/{commentId}': {
            get: {
                tags: ['Posts'],
                summary: 'Get a single comment',
                parameters: [
                    { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
                    { in: 'path', name: 'commentId', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '200': { description: 'Comment returned' },
                    '404': { description: 'Comment not found' },
                },
            },
            patch: {
                tags: ['Posts'],
                summary: 'Update own comment',
                parameters: [
                    { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
                    { in: 'path', name: 'commentId', required: true, schema: { type: 'string' } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    content: { type: 'string', example: 'Updated comment' },
                                },
                                required: ['content'],
                            },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Comment updated' },
                    '400': { description: 'Validation error' },
                    '401': { description: 'Unauthorized' },
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Comment not found' },
                },
            },
            delete: {
                tags: ['Posts'],
                summary: 'Delete own comment',
                parameters: [
                    { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
                    { in: 'path', name: 'commentId', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    '204': { description: 'Comment deleted' },
                    '401': { description: 'Unauthorized' },
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Comment not found' },
                },
            },
        },
    },
};
