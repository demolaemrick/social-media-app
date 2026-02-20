import { relations } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
export const user = pgTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});
export const session = pgTable('session', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .$onUpdate(() => new Date())
        .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
}, (table) => [index('session_userId_idx').on(table.userId)]);
export const account = pgTable('account', {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => [index('account_userId_idx').on(table.userId)]);
export const verification = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => [index('verification_identifier_idx').on(table.identifier)]);
export const post = pgTable('posts', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    authorId: text('author_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => [index('post_authorId_idx').on(table.authorId), index('post_createdAt_idx').on(table.createdAt)]);
export const postLike = pgTable('post_likes', {
    id: text('id').primaryKey(),
    postId: text('post_id')
        .notNull()
        .references(() => post.id, { onDelete: 'cascade' }),
    userId: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('postLike_postId_idx').on(table.postId),
    index('postLike_userId_idx').on(table.userId),
    uniqueIndex('postLike_postId_userId_unique').on(table.postId, table.userId),
]);
export const comment = pgTable('comments', {
    id: text('id').primaryKey(),
    postId: text('post_id')
        .notNull()
        .references(() => post.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => [
    index('comment_postId_idx').on(table.postId),
    index('comment_authorId_idx').on(table.authorId),
    index('comment_createdAt_idx').on(table.createdAt),
]);
export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
    posts: many(post),
    postLikes: many(postLike),
    comments: many(comment),
}));
export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));
export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));
export const postRelations = relations(post, ({ one, many }) => ({
    author: one(user, {
        fields: [post.authorId],
        references: [user.id],
    }),
    likes: many(postLike),
    comments: many(comment),
}));
export const postLikeRelations = relations(postLike, ({ one }) => ({
    post: one(post, {
        fields: [postLike.postId],
        references: [post.id],
    }),
    user: one(user, {
        fields: [postLike.userId],
        references: [user.id],
    }),
}));
export const commentRelations = relations(comment, ({ one }) => ({
    post: one(post, {
        fields: [comment.postId],
        references: [post.id],
    }),
    author: one(user, {
        fields: [comment.authorId],
        references: [user.id],
    }),
}));
