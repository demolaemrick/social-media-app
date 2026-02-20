import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { comment, post, postLike, user } from './schema.js';
import db from './index.js';
async function main() {
    const seedUser = {
        id: randomUUID(),
        name: 'John Doe',
        email: 'john@example.com',
    };
    await db.insert(user).values(seedUser);
    console.log('New user created!');
    if (process.env.SEED_POSTS !== 'false') {
        const seededPosts = await db.insert(post).values([
            {
                id: randomUUID(),
                title: 'Welcome to the network',
                content: 'First seeded post',
                authorId: seedUser.id,
            },
            {
                id: randomUUID(),
                title: 'Another update',
                content: 'Second seeded post',
                authorId: seedUser.id,
            },
        ]).returning();
        console.log('Sample posts created for seed user!');
        if (process.env.SEED_INTERACTIONS !== 'false') {
            const secondUser = {
                id: randomUUID(),
                name: 'Jane Roe',
                email: 'jane@example.com',
            };
            await db.insert(user).values(secondUser);
            await db.insert(postLike).values({
                id: randomUUID(),
                postId: seededPosts[0].id,
                userId: secondUser.id,
            });
            await db.insert(comment).values({
                id: randomUUID(),
                postId: seededPosts[0].id,
                authorId: secondUser.id,
                content: 'Great first post!',
            });
            console.log('Sample likes/comments created for seeded post!');
            await db.delete(user).where(eq(user.email, secondUser.email));
        }
    }
    const users = await db.select().from(user);
    console.log('Getting all users from the database: ', users);
    await db.delete(user).where(eq(user.email, seedUser.email));
    console.log('Seed user deleted!');
}
main();
