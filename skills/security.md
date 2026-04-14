---
name: security
description: Authentication, authorization, encryption, input validation, and security best practices for web applications
version: 1.0.0
category: security
tags: [security, authentication, authorization, jwt, bcrypt, validation, xss, csrf, encryption]
---

# Security Skill

Production-grade security patterns for authentication, authorization, data protection, and vulnerability prevention.

## Quick Reference

| Request Type | Use This Skill | Don't Use If |
|--------------|----------------|--------------|
| Authentication (JWT, sessions) | ✅ Yes | UI-only components |
| Password hashing and validation | ✅ Yes | Public data display |
| Input validation and sanitization | ✅ Yes | Read-only operations |
| Authorization and permissions | ✅ Yes | Static content |
| Encryption and data protection | ✅ Yes | Development-only code |

## Triggers

Use this skill when the request includes:
- Authentication, login, signup, JWT
- Authorization, permissions, roles, RBAC
- Password, hashing, bcrypt, encryption
- Security, XSS, CSRF, SQL injection
- Input validation, sanitization
- API keys, tokens, secrets

## Anti-Triggers

Do NOT use this skill when:
- Request is about UI styling only
- Public read-only content
- Development tooling without security needs
- Pure frontend state management

## Implementation Patterns

### 1. Password Hashing with Bcrypt

```ts
// Secure password handling
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Higher = more secure but slower

// Hash password on signup
export async function hashPassword(plainPassword: string): Promise<string> {
  // Validate password strength first
  if (plainPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(plainPassword)) {
    throw new Error('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(plainPassword)) {
    throw new Error('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(plainPassword)) {
    throw new Error('Password must contain at least one number');
  }

  // Hash with bcrypt
  const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hash;
}

// Verify password on login
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Example usage in signup
async function signup(email: string, password: string) {
  const hashedPassword = await hashPassword(password);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  return user;
}

// Example usage in login
async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  return user;
}
```

### 2. JWT Authentication

```ts
// JWT token generation and verification
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// Generate access token
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'myapp',
    audience: 'myapp-users',
  });
}

// Generate refresh token
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'myapp',
    audience: 'myapp-refresh',
  });
}

// Verify token
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'myapp',
      audience: 'myapp-users',
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

// Authentication middleware
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    // Attach user to request
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    });
  }
}

// Token refresh endpoint
export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET, {
      issuer: 'myapp',
      audience: 'myapp-refresh',
    }) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}
```

### 3. Role-Based Authorization

```ts
// RBAC middleware
export enum Permission {
  READ_POSTS = 'read:posts',
  WRITE_POSTS = 'write:posts',
  DELETE_POSTS = 'delete:posts',
  MANAGE_USERS = 'manage:users',
  ADMIN = 'admin',
}

export enum Role {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

// Role to permissions mapping
const rolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [Permission.READ_POSTS, Permission.WRITE_POSTS],
  [Role.MODERATOR]: [
    Permission.READ_POSTS,
    Permission.WRITE_POSTS,
    Permission.DELETE_POSTS,
  ],
  [Role.ADMIN]: [
    Permission.READ_POSTS,
    Permission.WRITE_POSTS,
    Permission.DELETE_POSTS,
    Permission.MANAGE_USERS,
    Permission.ADMIN,
  ],
};

// Check if user has permission
export function hasPermission(userRole: Role, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) || false;
}

// Authorization middleware
export function authorize(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.user.role as Role;
    const hasRequiredPermission = permissions.some((permission) =>
      hasPermission(userRole, permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permissions,
      });
    }

    next();
  };
}

// Resource ownership check
export function authorizeOwnership(resourceIdParam: string = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const resourceId = req.params[resourceIdParam];
    
    // Check if user is admin (bypass ownership check)
    if (hasPermission(req.user.role as Role, Permission.ADMIN)) {
      return next();
    }

    // Check resource ownership
    const resource = await prisma.post.findUnique({
      where: { id: resourceId },
      select: { authorId: true },
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (resource.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to access this resource' });
    }

    next();
  };
}

// Usage examples
app.get('/api/posts', 
  authenticate, 
  authorize(Permission.READ_POSTS),
  getPosts
);

app.delete('/api/posts/:id',
  authenticate,
  authorize(Permission.DELETE_POSTS),
  authorizeOwnership('id'),
  deletePost
);

app.get('/api/admin/users',
  authenticate,
  authorize(Permission.ADMIN),
  getUsers
);
```

### 4. Input Validation and Sanitization

```ts
// Input validation with Zod
import { z } from 'zod';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

// Email validation
const emailSchema = z.string()
  .email('Invalid email format')
  .toLowerCase()
  .trim()
  .refine((email) => validator.isEmail(email), {
    message: 'Invalid email address',
  });

// Password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .refine((password) => /[A-Z]/.test(password), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((password) => /[a-z]/.test(password), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((password) => /[0-9]/.test(password), {
    message: 'Password must contain at least one number',
  })
  .refine((password) => /[^A-Za-z0-9]/.test(password), {
    message: 'Password must contain at least one special character',
  });

// URL validation
const urlSchema = z.string()
  .url('Invalid URL')
  .refine((url) => validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
  }), {
    message: 'URL must use HTTP or HTTPS protocol',
  });

// Sanitize HTML input (prevent XSS)
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  return validator.escape(validator.trim(input));
}

// Validate and sanitize user registration
const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .transform((name) => sanitizeInput(name)),
  bio: z.string()
    .max(500, 'Bio too long')
    .optional()
    .transform((bio) => bio ? sanitizeHtml(bio) : undefined),
});

// Validate post creation
const createPostSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title too long')
    .transform((title) => sanitizeInput(title)),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content too long')
    .transform((content) => sanitizeHtml(content)),
  tags: z.array(z.string())
    .max(10, 'Too many tags')
    .transform((tags) => tags.map(sanitizeInput)),
});

// SQL injection prevention (use parameterized queries)
// ❌ NEVER do this:
// const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ ALWAYS do this:
const user = await prisma.user.findUnique({
  where: { email }, // Prisma handles parameterization
});

// Or with raw SQL:
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`; // Template literal syntax prevents SQL injection
```

### 5. CSRF Protection

```ts
// CSRF token generation and validation
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Generate CSRF token
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// CSRF middleware
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

// Generate and attach CSRF token to session
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
});

// Use CSRF protection on state-changing routes
app.post('/api/posts', csrfProtection, createPost);
app.delete('/api/posts/:id', csrfProtection, deletePost);
```

### 6. Rate Limiting

```ts
// Rate limiting to prevent brute force attacks
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:',
  }),
});

// Strict rate limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true, // Don't count successful logins
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.post('/api/auth/login', authLimiter, login);
app.post('/api/auth/register', authLimiter, register);
```

### 7. Secure Headers

```ts
// Security headers with Helmet
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS configuration
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours
}));
```

### 8. Data Encryption

```ts
// Encrypt sensitive data at rest
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // Must be 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return iv + authTag + encrypted
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

export function decrypt(encryptedData: string): string {
  const iv = Buffer.from(encryptedData.slice(0, 32), 'hex');
  const authTag = Buffer.from(encryptedData.slice(32, 64), 'hex');
  const encrypted = encryptedData.slice(64);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Example: Encrypt sensitive user data
async function storeApiKey(userId: string, apiKey: string) {
  const encryptedKey = encrypt(apiKey);
  
  await prisma.userApiKey.create({
    data: {
      userId,
      encryptedKey,
    },
  });
}
```

## Critical Rules

1. **Never store passwords in plain text**
   - Always use bcrypt or argon2
   - Use salt rounds >= 10
   - Never log passwords

2. **Use HTTPS in production**
   - Enforce HTTPS redirects
   - Set secure cookie flags
   - Use HSTS headers

3. **Validate all inputs**
   - Use validation libraries (Zod, Joi)
   - Sanitize HTML to prevent XSS
   - Use parameterized queries for SQL

4. **Implement proper authentication**
   - Use JWT or sessions
   - Implement token refresh
   - Set appropriate expiration times

5. **Use role-based access control**
   - Define clear permission levels
   - Check authorization on every request
   - Verify resource ownership

6. **Protect against common attacks**
   - XSS: Sanitize user input
   - CSRF: Use CSRF tokens
   - SQL Injection: Parameterized queries
   - Brute Force: Rate limiting

7. **Secure sensitive data**
   - Encrypt data at rest
   - Use environment variables for secrets
   - Never commit secrets to git

8. **Keep dependencies updated**
   - Run npm audit regularly
   - Update security patches promptly
   - Monitor for vulnerabilities

## Common Mistakes to Avoid

1. ❌ Storing passwords in plain text
2. ❌ Not validating user input
3. ❌ Exposing sensitive data in responses
4. ❌ Missing rate limiting on auth endpoints
5. ❌ Not using HTTPS in production
6. ❌ Weak JWT secrets
7. ❌ SQL injection vulnerabilities
8. ❌ Missing CORS configuration

## Dependencies

```json
{
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "zod": "^3.22.0",
  "validator": "^13.11.0",
  "isomorphic-dompurify": "^2.9.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.1.0",
  "rate-limit-redis": "^4.2.0",
  "ioredis": "^5.3.2"
}
```
