import { randomUUID } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import db from '../db/index.js';
import { comment, post, postLike, user } from '../db/schema.js';
import { auth } from '../lib/better-auth.js';
const DEFAULT_POSTS_LIMIT = 20;
const DEFAULT_COMMENTS_LIMIT = 20;
const MAX_LIST_LIMIT = 50;
const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 1000;
function parsePositiveInt(value, fallback) {
    const parsed = Number.parseInt(value ?? '', 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
}
function getCappedLimit(value, fallback) {
    return Math.min(parsePositiveInt(value, fallback), MAX_LIST_LIMIT);
}
async function getSessionUser(c) {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });
    return session?.user ?? null;
}
async function postExists(postId) {
    const [existingPost] = await db
        .select({ id: post.id })
        .from(post)
        .where(eq(post.id, postId))
        .limit(1);
    return Boolean(existingPost);
}
const app = new Hono();
app.post('/', async (c) => {
    const sessionUser = await getSessionUser(c);
    if (!sessionUser) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const body = await c.req.json().catch(() => null);
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!title) {
        return c.json({ error: 'Title is required' }, 400);
    }
    if (!content) {
        return c.json({ error: 'Content is required' }, 400);
    }
    if (title.length > MAX_TITLE_LENGTH) {
        return c.json({ error: `Title must be ${MAX_TITLE_LENGTH} characters or less` }, 400);
    }
    if (content.length > MAX_CONTENT_LENGTH) {
        return c.json({ error: `Content must be ${MAX_CONTENT_LENGTH} characters or less` }, 400);
    }
    const [createdPost] = await db
        .insert(post)
        .values({
        id: randomUUID(),
        title,
        content,
        authorId: sessionUser.id,
    })
        .returning();
    return c.json({ data: createdPost }, 201);
});
app.get('/', async (c) => {
    const limit = getCappedLimit(c.req.query('limit'), DEFAULT_POSTS_LIMIT);
    const postsList = await db
        .select({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        authorName: user.name,
        authorImage: user.image,
        likesCount: sql `(
        SELECT COUNT(*)::int
        FROM post_likes pl
        WHERE pl.post_id = ${post.id}
      )`,
        commentsCount: sql `(
        SELECT COUNT(*)::int
        FROM comments cm
        WHERE cm.post_id = ${post.id}
      )`,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
    })
        .from(post)
        .innerJoin(user, eq(post.authorId, user.id))
        .orderBy(desc(post.createdAt))
        .limit(limit);
    return c.json({ data: postsList, meta: { limit } });
});
app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const [existingPost] = await db
        .select({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        authorName: user.name,
        authorImage: user.image,
        likesCount: sql `(
        SELECT COUNT(*)::int
        FROM post_likes pl
        WHERE pl.post_id = ${post.id}
      )`,
        commentsCount: sql `(
        SELECT COUNT(*)::int
        FROM comments cm
        WHERE cm.post_id = ${post.id}
      )`,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
    })
        .from(post)
        .innerJoin(user, eq(post.authorId, user.id))
        .where(eq(post.id, id))
        .limit(1);
    if (!existingPost) {
        return c.json({ error: 'Post not found' }, 404);
    }
    return c.json({ data: existingPost });
});
app.patch('/:id', async (c) => {
    const sessionUser = await getSessionUser(c);
    if (!sessionUser) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => null);
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!title) {
        return c.json({ error: 'Title is required' }, 400);
    }
    if (!content) {
        return c.json({ error: 'Content is required' }, 400);
    }
    if (title.length > MAX_TITLE_LENGTH) {
        return c.json({ error: `Title must be ${MAX_TITLE_LENGTH} characters or less` }, 400);
    }
    if (content.length > MAX_CONTENT_LENGTH) {
        return c.json({ error: `Content must be ${MAX_CONTENT_LENGTH} characters or less` }, 400);
    }
    const [updatedPost] = await db
        .update(post)
        .set({
        title,
        content,
        updatedAt: new Date(),
    })
        .where(and(eq(post.id, id), eq(post.authorId, sessionUser.id)))
        .returning();
    if (!updatedPost) {
        const [existingPost] = await db
            .select({ id: post.id })
            .from(post)
            .where(eq(post.id, id))
            .limit(1);
        if (!existingPost) {
            return c.json({ error: 'Post not found' }, 404);
        }
        return c.json({ error: 'Forbidden' }, 403);
    }
    return c.json({ data: updatedPost });
});
app.delete('/:id', async (c) => {
    const sessionUser = await getSessionUser(c);
    if (!sessionUser) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const id = c.req.param('id');
    const [deletedPost] = await db
        .delete(post)
        .where(and(eq(post.id, id), eq(post.authorId, sessionUser.id)))
        .returning({ id: post.id });
    if (!deletedPost) {
        const [existingPost] = await db
            .select({ id: post.id })
            .from(post)
            .where(eq(post.id, id))
            .limit(1);
        if (!existingPost) {
            return c.json({ error: 'Post not found' }, 404);
        }
        return c.json({ error: 'Forbidden' }, 403);
    }
    return c.body(null, 204);
});
app.post('/:id/likes', async (c) => {
    const sessionUser = await getSessionUser(c);
    if (!sessionUser) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const postId = c.req.param('id');
    if (!(await postExists(postId))) {
        return c.json({ error: 'Post not found' }, 404);
    }
    await db
        .insert(postLike)
        .values({
        id: randomUUID(),
        postId,
        userId: sessionUser.id,
    })
        .onConflictDoNothing({
        target: [postLike.postId, postLike.userId],
    });
    return c.json({ data: { postId, liked: true } });
});
app.delete('/:id/likes', async (c) => {
    const sessionUser = await getSessionUser(c);
    if (!sessionUser) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const postId = c.req.param('id');
    if (!(await postExists(postId))) {
        return c.json({ error: 'Post not found' }, 404);
    }
    await db
        .delete(postLike)
        .where(and(eq(postLike.postId, postId), eq(postLike.userId, sessionUser.id)));
    return c.json({ data: { postId, liked: false } });
});
app.post('/:id/comments', async (c) => {
    const sessionUser = await getSessionUser(c);
    if (!sessionUser) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const postId = c.req.param('id');
    if (!(await postExists(postId))) {
        return c.json({ error: 'Post not found' }, 404);
    }
    const body = await c.req.json().catch(() => null);
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content) {
        return c.json({ error: 'Content is required' }, 400);
    }
    if (content.length > MAX_CONTENT_LENGTH) {
        return c.json({ error: `Content must be ${MAX_CONTENT_LENGTH} characters or less` }, 400);
    }
    const [createdComment] = await db
        .insert(comment)
        .values({
        id: randomUUID(),
        postId,
        authorId: sessionUser.id,
        content,
    })
        .returning();
    return c.json({ data: createdComment }, 201);
});
app.get('/:id/comments', async (c) => {
    const postId = c.req.param('id');
    if (!(await postExists(postId))) {
        return c.json({ error: 'Post not found' }, 404);
    }
    const limit = getCappedLimit(c.req.query('limit'), DEFAULT_COMMENTS_LIMIT);
    const commentsList = await db
        .select({
        id: comment.id,
        postId: comment.postId,
        authorId: comment.authorId,
        authorName: user.name,
        authorImage: user.image,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
    })
        .from(comment)
        .innerJoin(user, eq(comment.authorId, user.id))
        .where(eq(comment.postId, postId))
        .orderBy(desc(comment.createdAt))
        .limit(limit);
    return c.json({ data: commentsList, meta: { limit } });
});
app.get('/:id/comments/:commentId', async (c) => {
    const postId = c.req.param('id');
    const commentId = c.req.param('commentId');
    const [existingComment] = await db
        .select({
        id: comment.id,
        postId: comment.postId,
        authorId: comment.authorId,
        authorName: user.name,
        authorImage: user.image,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
    })
        .from(comment)
        .innerJoin(user, eq(comment.authorId, user.id))
        .where(and(eq(comment.postId, postId), eq(comment.id, commentId)))
        .limit(1);
    if (!existingComment) {
        return c.json({ error: 'Comment not found' }, 404);
    }
    return c.json({ data: existingComment });
});
app.patch('/:id/comments/:commentId', async (c) => {
    const sessionUser = await getSessionUser(c);
    if (!sessionUser) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const postId = c.req.param('id');
    const commentId = c.req.param('commentId');
    const body = await c.req.json().catch(() => null);
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content) {
        return c.json({ error: 'Content is required' }, 400);
    }
    if (content.length > MAX_CONTENT_LENGTH) {
        return c.json({ error: `Content must be ${MAX_CONTENT_LENGTH} characters or less` }, 400);
    }
    const [updatedComment] = await db
        .update(comment)
        .set({
        content,
        updatedAt: new Date(),
    })
        .where(and(eq(comment.postId, postId), eq(comment.id, commentId), eq(comment.authorId, sessionUser.id)))
        .returning();
    if (!updatedComment) {
        const [existingComment] = await db
            .select({ id: comment.id })
            .from(comment)
            .where(and(eq(comment.postId, postId), eq(comment.id, commentId)))
            .limit(1);
        if (!existingComment) {
            return c.json({ error: 'Comment not found' }, 404);
        }
        return c.json({ error: 'Forbidden' }, 403);
    }
    return c.json({ data: updatedComment });
});
app.delete('/:id/comments/:commentId', async (c) => {
    const sessionUser = await getSessionUser(c);
    if (!sessionUser) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const postId = c.req.param('id');
    const commentId = c.req.param('commentId');
    const [deletedComment] = await db
        .delete(comment)
        .where(and(eq(comment.postId, postId), eq(comment.id, commentId), eq(comment.authorId, sessionUser.id)))
        .returning({ id: comment.id });
    if (!deletedComment) {
        const [existingComment] = await db
            .select({ id: comment.id })
            .from(comment)
            .where(and(eq(comment.postId, postId), eq(comment.id, commentId)))
            .limit(1);
        if (!existingComment) {
            return c.json({ error: 'Comment not found' }, 404);
        }
        return c.json({ error: 'Forbidden' }, 403);
    }
    return c.body(null, 204);
});
export default app;
