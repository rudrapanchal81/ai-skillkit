---
name: backend
description: Node.js backend patterns with Express, middleware, error handling, and authentication
version: 1.0.0
category: backend
tags: [nodejs, express, middleware, authentication, error-handling, security]
---

# Backend Skill

Production-ready Node.js backend patterns for Express applications with proper error handling, middleware, and security.

## Quick Reference

| Request Type | Use This Skill | Don't Use If |
|--------------|----------------|--------------|
| Express server setup | ✅ Yes | Frontend React apps |
| Middleware patterns | ✅ Yes | Static site generation |
| Error handling | ✅ Yes | Client-side errors |
| Authentication/Authorization | ✅ Yes | UI authentication flows |
| Database integration | ✅ Yes | Pure SQL queries |

## Triggers

Use this skill when the request includes:
- Express, Node.js server, backend
- Middleware, route handlers, controllers
- Error handling, logging, monitoring
- Authentication, JWT, sessions
- Database connections, ORM, Prisma

## Anti-Triggers

Do NOT use this skill when:
- Request is about frontend components
- Pure database queries without API layer
- DevOps/infrastructure setup
- Frontend state management

## Implementation Patterns

### 1. Express Server Setup

```js
// Modern Express server with TypeScript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(logger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
```

### 2. Error Handling Middleware

```js
// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} not found`, 404);
    this.resource = resource;
    this.id = id;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

// Error handler middleware
export function errorHandler(err, req, res, next) {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default to 500 if not an operational error
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(err.errors && { details: err.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: err.timestamp || new Date().toISOString()
  });
}

// Async error wrapper
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage in routes
import { asyncHandler, NotFoundError } from './middleware/errorHandler';

app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new NotFoundError('User', req.params.id);
  }
  
  res.json({ data: user });
}));
```

### 3. Authentication Middleware

```js
// JWT authentication
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errorHandler';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export async function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// Role-based authorization
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}

// Usage
app.get('/api/admin/users', 
  authenticate, 
  authorize('admin'), 
  asyncHandler(async (req, res) => {
    const users = await User.find();
    res.json({ data: users });
  })
);
```

### 4. Request Validation Middleware

```js
// Validation with Zod
import { z } from 'zod';
import { ValidationError } from './errorHandler';

export function validate(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Replace with validated data
      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        next(new ValidationError('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
}

// Schema definitions
const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['user', 'admin']).optional().default('user')
  })
});

const updateUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')
  }),
  body: z.object({
    email: z.string().email().optional(),
    name: z.string().min(2).optional()
  })
});

// Usage
app.post('/api/users', 
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const user = await User.create(req.body);
    res.status(201).json({ data: user });
  })
);
```

### 5. Database Integration with Prisma

```js
// Prisma client setup
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

// Repository pattern
export class UserRepository {
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: { posts: true }
    });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async create(data) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true
      }
    });
  }

  async delete(id) {
    return prisma.user.delete({
      where: { id }
    });
  }

  async findMany({ page = 1, limit = 20, sort = 'createdAt' }) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: 'desc' }
      }),
      prisma.user.count()
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

// Service layer
export class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getUser(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    return user;
  }

  async createUser(data) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ValidationError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.userRepository.create({
      ...data,
      password: hashedPassword
    });
  }

  async updateUser(id, data) {
    await this.getUser(id); // Check exists
    return this.userRepository.update(id, data);
  }

  async deleteUser(id) {
    await this.getUser(id); // Check exists
    return this.userRepository.delete(id);
  }
}
```

### 6. Logging Middleware

```js
// Request logging with Winston
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
}

export { logger };
```

## Critical Rules

1. **Always use async error handling**
   - Wrap async routes with asyncHandler
   - Use try-catch in async middleware
   - Pass errors to next()

2. **Validate all inputs**
   - Use validation libraries (Zod, Joi)
   - Validate body, query, and params
   - Return detailed validation errors

3. **Implement proper authentication**
   - Use JWT or sessions
   - Hash passwords with bcrypt
   - Implement token refresh
   - Protect sensitive routes

4. **Use environment variables**
   - Never hardcode secrets
   - Use dotenv for local development
   - Validate required env vars on startup

5. **Implement rate limiting**
   - Protect against brute force
   - Use express-rate-limit
   - Different limits for different endpoints

6. **Log everything important**
   - Use structured logging (Winston, Pino)
   - Log errors with stack traces
   - Log request/response metadata
   - Don't log sensitive data

7. **Handle graceful shutdown**
   - Close database connections
   - Finish pending requests
   - Listen for SIGTERM/SIGINT

8. **Use middleware composition**
   - Keep middleware focused
   - Chain middleware logically
   - Error handler must be last

## Common Mistakes to Avoid

1. ❌ Not handling async errors
2. ❌ Exposing stack traces in production
3. ❌ Not validating inputs
4. ❌ Storing passwords in plain text
5. ❌ Not implementing rate limiting
6. ❌ Hardcoding secrets
7. ❌ Not logging errors
8. ❌ Blocking the event loop

## Dependencies

```json
{
  "express": "^4.18.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "compression": "^1.7.4",
  "express-rate-limit": "^7.1.0",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1",
  "zod": "^3.22.0",
  "winston": "^3.11.0",
  "@prisma/client": "^5.7.0",
  "dotenv": "^16.3.1"
}
```

### Development Dependencies

```json
{
  "prisma": "^5.7.0",
  "nodemon": "^3.0.2",
  "@types/express": "^4.17.21",
  "@types/node": "^20.10.0",
  "typescript": "^5.3.0"
}
```
