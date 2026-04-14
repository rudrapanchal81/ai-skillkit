---
name: database
description: Database design, SQL queries, ORM patterns, migrations, and data modeling with Prisma, TypeORM, and raw SQL
version: 1.0.0
category: backend
tags: [database, sql, prisma, typeorm, postgres, mysql, mongodb, migrations]
---

# Database Skill

Production-ready database patterns for SQL, NoSQL, ORMs, migrations, and efficient data modeling.

## Quick Reference

| Request Type | Use This Skill | Don't Use If |
|--------------|----------------|--------------|
| SQL queries and optimization | ✅ Yes | Frontend data fetching |
| Prisma/TypeORM schemas | ✅ Yes | UI state management |
| Database migrations | ✅ Yes | In-memory caching only |
| Data modeling and relationships | ✅ Yes | File system operations |
| Connection pooling | ✅ Yes | API design without DB |

## Triggers

Use this skill when the request includes:
- SQL, PostgreSQL, MySQL, MongoDB
- Prisma, TypeORM, Sequelize, Mongoose
- Database schema, migrations, models
- Queries, joins, indexes, transactions
- Data modeling, relationships, normalization

## Anti-Triggers

Do NOT use this skill when:
- Request is about frontend state only
- In-memory data structures without persistence
- File system operations
- API design without database layer

## Implementation Patterns

### 1. Prisma Schema Design

```prisma
// schema.prisma - Modern type-safe ORM
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(USER)
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

model Profile {
  id        String   @id @default(cuid())
  bio       String?
  avatar    String?
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("profiles")
}

model Post {
  id          String     @id @default(cuid())
  title       String
  content     String
  published   Boolean    @default(false)
  authorId    String
  author      User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  categories  Category[]
  tags        Tag[]
  viewCount   Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  publishedAt DateTime?

  @@index([authorId])
  @@index([published])
  @@index([createdAt])
  @@map("posts")
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  slug  String @unique
  posts Post[]

  @@map("categories")
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]

  @@map("tags")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### 2. Prisma CRUD Operations

```ts
// Efficient Prisma queries with relations
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Create with relations
async function createUserWithProfile(data: {
  email: string;
  name: string;
  password: string;
  bio?: string;
}) {
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: data.password,
      profile: {
        create: {
          bio: data.bio || '',
        },
      },
    },
    include: {
      profile: true,
    },
  });
}

// Complex query with filtering, pagination, and relations
async function getPosts(params: {
  skip?: number;
  take?: number;
  where?: {
    published?: boolean;
    authorId?: string;
    search?: string;
  };
  orderBy?: 'createdAt' | 'viewCount';
}) {
  const { skip = 0, take = 20, where, orderBy = 'createdAt' } = params;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take,
      where: {
        published: where?.published,
        authorId: where?.authorId,
        ...(where?.search && {
          OR: [
            { title: { contains: where.search, mode: 'insensitive' } },
            { content: { contains: where.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: true,
        tags: true,
        _count: {
          select: { categories: true, tags: true },
        },
      },
      orderBy: { [orderBy]: 'desc' },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      total,
      pages: Math.ceil(total / take),
      page: Math.floor(skip / take) + 1,
      limit: take,
    },
  };
}

// Transaction for atomic operations
async function transferPostOwnership(postId: string, newAuthorId: string) {
  return prisma.$transaction(async (tx) => {
    // Verify new author exists
    const newAuthor = await tx.user.findUnique({
      where: { id: newAuthorId },
    });

    if (!newAuthor) {
      throw new Error('New author not found');
    }

    // Update post
    const post = await tx.post.update({
      where: { id: postId },
      data: { authorId: newAuthorId },
      include: { author: true },
    });

    // Log the transfer
    await tx.$executeRaw`
      INSERT INTO post_transfers (post_id, old_author_id, new_author_id, transferred_at)
      VALUES (${postId}, ${post.authorId}, ${newAuthorId}, NOW())
    `;

    return post;
  });
}

// Batch operations
async function bulkUpdatePostViews(postIds: string[]) {
  return prisma.post.updateMany({
    where: {
      id: { in: postIds },
    },
    data: {
      viewCount: { increment: 1 },
    },
  });
}

// Aggregations
async function getUserStats(userId: string) {
  const [user, postStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    }),
    prisma.post.aggregate({
      where: { authorId: userId, published: true },
      _sum: { viewCount: true },
      _avg: { viewCount: true },
      _max: { viewCount: true },
    }),
  ]);

  return {
    user,
    stats: {
      totalPosts: user?._count.posts || 0,
      totalViews: postStats._sum.viewCount || 0,
      avgViews: postStats._avg.viewCount || 0,
      maxViews: postStats._max.viewCount || 0,
    },
  };
}
```

### 3. Raw SQL Queries (When Needed)

```ts
// Complex queries that are easier with raw SQL
import { Prisma } from '@prisma/client';

// Parameterized queries (safe from SQL injection)
async function searchPostsFullText(searchTerm: string) {
  return prisma.$queryRaw<Post[]>`
    SELECT p.*, u.name as author_name
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE 
      to_tsvector('english', p.title || ' ' || p.content) 
      @@ plainto_tsquery('english', ${searchTerm})
    ORDER BY ts_rank(
      to_tsvector('english', p.title || ' ' || p.content),
      plainto_tsquery('english', ${searchTerm})
    ) DESC
    LIMIT 20
  `;
}

// Complex aggregation
async function getTopAuthors(limit: number = 10) {
  return prisma.$queryRaw<
    Array<{ id: string; name: string; postCount: number; totalViews: number }>
  >`
    SELECT 
      u.id,
      u.name,
      COUNT(p.id) as post_count,
      COALESCE(SUM(p.view_count), 0) as total_views
    FROM users u
    LEFT JOIN posts p ON u.id = p.author_id AND p.published = true
    GROUP BY u.id, u.name
    HAVING COUNT(p.id) > 0
    ORDER BY total_views DESC
    LIMIT ${limit}
  `;
}

// Execute raw SQL (for DDL or complex operations)
async function createFullTextIndex() {
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS posts_fulltext_idx 
    ON posts 
    USING GIN (to_tsvector('english', title || ' ' || content))
  `;
}
```

### 4. Database Migrations

```ts
// Migration file: 20240408_add_post_tags.ts
import { Prisma } from '@prisma/client';

export async function up(prisma: PrismaClient) {
  // Create tags table
  await prisma.$executeRaw`
    CREATE TABLE tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create junction table
  await prisma.$executeRaw`
    CREATE TABLE post_tags (
      post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
      tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    )
  `;

  // Create indexes
  await prisma.$executeRaw`
    CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
    CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);
  `;
}

export async function down(prisma: PrismaClient) {
  await prisma.$executeRaw`DROP TABLE IF EXISTS post_tags`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS tags`;
}
```

### 5. TypeORM Patterns

```ts
// TypeORM entity with decorators
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';

@Entity('users')
@Index(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: ['USER', 'ADMIN'], default: 'USER' })
  role: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('posts')
@Index(['authorId', 'published'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  published: boolean;

  @Column()
  authorId: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  author: User;

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// TypeORM repository patterns
import { Repository } from 'typeorm';
import { AppDataSource } from './data-source';

export class PostRepository {
  private repository: Repository<Post>;

  constructor() {
    this.repository = AppDataSource.getRepository(Post);
  }

  async findPublished(page: number = 1, limit: number = 20) {
    return this.repository.find({
      where: { published: true },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findByAuthor(authorId: string) {
    return this.repository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.authorId = :authorId', { authorId })
      .andWhere('post.published = :published', { published: true })
      .orderBy('post.createdAt', 'DESC')
      .getMany();
  }

  async searchPosts(searchTerm: string) {
    return this.repository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.title ILIKE :search OR post.content ILIKE :search', {
        search: `%${searchTerm}%`,
      })
      .andWhere('post.published = :published', { published: true })
      .orderBy('post.createdAt', 'DESC')
      .getMany();
  }
}
```

### 6. MongoDB with Mongoose

```ts
// Mongoose schema and model
import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  role: 'USER' | 'ADMIN';
  posts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Virtual fields
userSchema.virtual('postCount').get(function () {
  return this.posts.length;
});

// Instance methods
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model<IUser>('User', userSchema);

// Mongoose queries
async function findUsersWithPosts() {
  return User.find()
    .populate({
      path: 'posts',
      match: { published: true },
      select: 'title createdAt viewCount',
      options: { sort: { createdAt: -1 }, limit: 5 },
    })
    .select('-password')
    .lean();
}

// Aggregation pipeline
async function getUserStatistics() {
  return User.aggregate([
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'authorId',
        as: 'posts',
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        postCount: { $size: '$posts' },
        totalViews: { $sum: '$posts.viewCount' },
      },
    },
    { $sort: { totalViews: -1 } },
    { $limit: 10 },
  ]);
}
```

## Critical Rules

1. **Always use parameterized queries**
   - Never concatenate user input into SQL
   - Use Prisma/TypeORM query builders
   - Use `$queryRaw` with template literals for raw SQL

2. **Index frequently queried fields**
   - Add indexes on foreign keys
   - Index fields used in WHERE clauses
   - Composite indexes for multi-field queries

3. **Use transactions for related operations**
   - Wrap multiple writes in transactions
   - Ensure atomicity for critical operations
   - Handle transaction rollbacks

4. **Optimize N+1 queries**
   - Use `include` or `populate` for relations
   - Batch queries when possible
   - Use `dataloader` for GraphQL

5. **Handle connection pooling**
   - Configure max connections
   - Reuse database connections
   - Close connections gracefully

6. **Validate data at database level**
   - Use constraints (UNIQUE, NOT NULL, CHECK)
   - Define foreign key relationships
   - Use enums for fixed values

7. **Plan for migrations**
   - Version control schema changes
   - Test migrations on staging first
   - Write reversible migrations (up/down)

8. **Monitor query performance**
   - Log slow queries
   - Use EXPLAIN for optimization
   - Add indexes based on query patterns

## Common Mistakes to Avoid

1. ❌ Not using indexes on foreign keys
2. ❌ N+1 query problems
3. ❌ Missing database transactions
4. ❌ Storing sensitive data unencrypted
5. ❌ Not handling connection pool limits
6. ❌ Ignoring query performance
7. ❌ Not validating data before insert
8. ❌ Hardcoding database credentials

## Dependencies

### Prisma
```json
{
  "@prisma/client": "^5.7.0",
  "prisma": "^5.7.0"
}
```

### TypeORM
```json
{
  "typeorm": "^0.3.19",
  "pg": "^8.11.0",
  "reflect-metadata": "^0.2.0"
}
```

### Mongoose
```json
{
  "mongoose": "^8.0.0"
}
```

### Connection Pooling
```json
{
  "pg-pool": "^3.6.0"
}
```
