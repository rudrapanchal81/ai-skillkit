---
name: performance
description: Performance optimization patterns for React, Node.js, caching, lazy loading, and code splitting
version: 1.0.0
category: optimization
tags: [performance, optimization, caching, lazy-loading, memoization, code-splitting]
---

# Performance Skill

Production-ready performance optimization patterns for frontend and backend applications.

## Quick Reference

| Request Type | Use This Skill | Don't Use If |
|--------------|----------------|--------------|
| React performance optimization | ✅ Yes | Initial MVP development |
| Caching strategies | ✅ Yes | Real-time data only |
| Code splitting and lazy loading | ✅ Yes | Small applications |
| Database query optimization | ✅ Yes | Simple CRUD only |
| Image and asset optimization | ✅ Yes | Text-only content |

## Triggers

Use this skill when the request includes:
- Performance, optimization, speed, slow
- Caching, memoization, lazy loading
- Code splitting, bundle size, chunks
- React.memo, useMemo, useCallback
- Database indexes, query optimization
- Image optimization, CDN

## Anti-Triggers

Do NOT use this skill when:
- Building initial MVP or prototype
- Performance is not a concern yet
- Simple static websites
- Development environment only

## Implementation Patterns

### 1. React Performance Optimization

```tsx
// React.memo for component memoization
import { memo, useMemo, useCallback, lazy, Suspense } from 'react';

// Memoize expensive components
const UserCard = memo(({ user, onEdit }: { user: User; onEdit: (id: string) => void }) => {
  console.log('UserCard rendered');
  
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if user data changed
  return prevProps.user.id === nextProps.user.id &&
         prevProps.user.name === nextProps.user.name &&
         prevProps.user.email === nextProps.user.email;
});

// useMemo for expensive calculations
function UserList({ users, searchTerm }: { users: User[]; searchTerm: string }) {
  // Only recalculate when users or searchTerm changes
  const filteredUsers = useMemo(() => {
    console.log('Filtering users...');
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const sortedUsers = useMemo(() => {
    console.log('Sorting users...');
    return [...filteredUsers].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredUsers]);

  return (
    <div>
      {sortedUsers.map(user => (
        <UserCard key={user.id} user={user} onEdit={handleEdit} />
      ))}
    </div>
  );
}

// useCallback for stable function references
function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize callback to prevent child re-renders
  const handleEdit = useCallback((userId: string) => {
    console.log('Editing user:', userId);
    // Edit logic here
  }, []); // Empty deps - function never changes

  const handleDelete = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []); // setUsers is stable, so this is safe

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search users..."
      />
      <UserList users={users} searchTerm={searchTerm} />
    </div>
  );
}
```

### 2. Code Splitting and Lazy Loading

```tsx
// Route-based code splitting
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load route components
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

// Loading fallback component
function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// Component-level lazy loading
function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  // Only load chart library when needed
  const Chart = lazy(() => import('./components/Chart'));

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <Chart data={chartData} />
        </Suspense>
      )}
    </div>
  );
}

// Dynamic imports for heavy libraries
async function exportToPDF(data: any) {
  // Only load PDF library when user clicks export
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  // Generate PDF...
  doc.save('export.pdf');
}
```

### 3. Image Optimization

```tsx
// Next.js Image component for automatic optimization
import Image from 'next/image';

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="product-card">
      <Image
        src={product.imageUrl}
        alt={product.name}
        width={400}
        height={300}
        quality={85}
        placeholder="blur"
        blurDataURL={product.thumbnailUrl}
        loading="lazy"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
    </div>
  );
}

// Lazy loading images with Intersection Observer
import { useEffect, useRef, useState } from 'react';

function LazyImage({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isInView ? src : undefined}
      alt={alt}
      onLoad={() => setIsLoaded(true)}
      className={isLoaded ? 'loaded' : 'loading'}
      {...props}
    />
  );
}
```

### 4. Caching Strategies

```ts
// In-memory caching with TTL
class Cache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();

  set(key: string, value: T, ttlMs: number = 60000) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage
const userCache = new Cache<User>();

async function getUser(id: string): Promise<User> {
  // Check cache first
  const cached = userCache.get(id);
  if (cached) {
    console.log('Cache hit');
    return cached;
  }

  // Fetch from database
  console.log('Cache miss - fetching from DB');
  const user = await prisma.user.findUnique({ where: { id } });
  
  if (user) {
    userCache.set(id, user, 5 * 60 * 1000); // 5 minutes
  }
  
  return user;
}

// Redis caching for distributed systems
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  
  return data;
}

// Usage
app.get('/api/posts', async (req, res) => {
  const posts = await getCachedData(
    'posts:all',
    () => prisma.post.findMany({ where: { published: true } }),
    60 * 5 // 5 minutes
  );
  
  res.json({ data: posts });
});
```

### 5. Database Query Optimization

```ts
// Prisma query optimization
import { Prisma } from '@prisma/client';

// ❌ Bad: N+1 query problem
async function getPostsWithAuthors_BAD() {
  const posts = await prisma.post.findMany();
  
  // This creates N additional queries!
  for (const post of posts) {
    post.author = await prisma.user.findUnique({
      where: { id: post.authorId }
    });
  }
  
  return posts;
}

// ✅ Good: Use include to fetch relations in one query
async function getPostsWithAuthors_GOOD() {
  return prisma.post.findMany({
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      categories: true,
      _count: {
        select: { comments: true },
      },
    },
  });
}

// Pagination for large datasets
async function getPaginatedPosts(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: limit,
      where: { published: true },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.post.count({ where: { published: true } }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// Cursor-based pagination for better performance
async function getCursorPaginatedPosts(cursor?: string, limit: number = 20) {
  const posts = await prisma.post.findMany({
    take: limit + 1, // Fetch one extra to check if there's more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor itself
    }),
    where: { published: true },
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

// Select only needed fields
async function getPostTitles() {
  return prisma.post.findMany({
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
  });
}
```

### 6. Debouncing and Throttling

```tsx
// Debounce hook for search inputs
import { useEffect, useState } from 'react';

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in search component
function SearchUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [results, setResults] = useState<User[]>([]);

  useEffect(() => {
    if (debouncedSearch) {
      // Only search after user stops typing for 300ms
      searchUsers(debouncedSearch).then(setResults);
    }
  }, [debouncedSearch]);

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search users..."
      />
      <UserList users={results} />
    </div>
  );
}

// Throttle hook for scroll events
function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Date.now() - lastRan.current >= interval) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, interval - (Date.now() - lastRan.current));

    return () => clearTimeout(timer);
  }, [value, interval]);

  return throttledValue;
}
```

### 7. Virtual Scrolling for Large Lists

```tsx
// Virtual scrolling with react-window
import { FixedSizeList } from 'react-window';

function VirtualizedUserList({ users }: { users: User[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const user = users[index];
    
    return (
      <div style={style} className="user-row">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    );
  };

  return (
    <FixedSizeList
      height={600}
      itemCount={users.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 8. Bundle Size Optimization

```js
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    minimize: true,
    usedExports: true, // Tree shaking
  },
};

// Tree shaking - import only what you need
// ❌ Bad: Imports entire library
import _ from 'lodash';

// ✅ Good: Import specific functions
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// Or use lodash-es for better tree shaking
import { debounce, throttle } from 'lodash-es';
```

## Critical Rules

1. **Measure before optimizing**
   - Use React DevTools Profiler
   - Use Chrome DevTools Performance tab
   - Measure actual impact of changes

2. **Avoid premature optimization**
   - Build features first
   - Optimize when performance issues arise
   - Focus on user-perceived performance

3. **Use memoization wisely**
   - Only memoize expensive calculations
   - Don't over-use React.memo
   - Profile to verify improvements

4. **Implement code splitting**
   - Split by routes
   - Lazy load heavy components
   - Use dynamic imports for large libraries

5. **Optimize images**
   - Use modern formats (WebP, AVIF)
   - Implement lazy loading
   - Serve responsive images

6. **Cache strategically**
   - Cache expensive database queries
   - Use appropriate TTL values
   - Invalidate cache when data changes

7. **Optimize database queries**
   - Use indexes on frequently queried fields
   - Avoid N+1 queries
   - Use pagination for large datasets

8. **Monitor performance**
   - Set up performance monitoring (Lighthouse, Web Vitals)
   - Track Core Web Vitals
   - Monitor bundle size

## Common Mistakes to Avoid

1. ❌ Over-memoizing everything
2. ❌ Not using indexes on database queries
3. ❌ Loading all data at once without pagination
4. ❌ Not lazy loading images
5. ❌ Importing entire libraries instead of specific functions
6. ❌ Not implementing code splitting
7. ❌ Caching without expiration
8. ❌ Optimizing before measuring

## Dependencies

```json
{
  "react-window": "^1.8.10",
  "ioredis": "^5.3.2",
  "lodash-es": "^4.17.21"
}
```

### DevTools
- React DevTools
- Chrome DevTools
- Lighthouse
- webpack-bundle-analyzer
