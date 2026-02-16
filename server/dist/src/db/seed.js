import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { user } from './schema.js';
import db from './index.js';
async function main() {
    const seedUser = {
        id: randomUUID(),
        name: 'John Doe',
        email: 'john@example.com',
    };
    await db.insert(user).values(seedUser);
    console.log('New user created!');
    const users = await db.select().from(user);
    console.log('Getting all users from the database: ', users);
    await db.delete(user).where(eq(user.email, seedUser.email));
    console.log('Seed user deleted!');
}
main();
