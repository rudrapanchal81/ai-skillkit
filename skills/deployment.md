---
name: deployment
description: Docker, CI/CD, cloud deployment patterns for Vercel, AWS, Railway, and containerized applications
version: 1.0.0
category: devops
tags: [docker, cicd, deployment, vercel, aws, railway, github-actions, containers]
---

# Deployment Skill

Production deployment patterns for Docker, CI/CD pipelines, and cloud platforms.

## Quick Reference

| Request Type | Use This Skill | Don't Use If |
|--------------|----------------|--------------|
| Docker containerization | ✅ Yes | Local development only |
| CI/CD pipeline setup | ✅ Yes | Manual deployment scripts |
| Cloud deployment (Vercel, AWS) | ✅ Yes | Desktop applications |
| Environment configuration | ✅ Yes | Frontend build config only |
| Container orchestration | ✅ Yes | Single server setups |

## Triggers

Use this skill when the request includes:
- Docker, Dockerfile, containers, images
- CI/CD, GitHub Actions, GitLab CI
- Deployment, production, hosting
- Vercel, AWS, Railway, Render, Fly.io
- Environment variables, secrets, configuration

## Anti-Triggers

Do NOT use this skill when:
- Request is about local development setup only
- Desktop or mobile app deployment
- Pure infrastructure as code (Terraform, Pulumi)
- Database administration only

## Implementation Patterns

### 1. Docker Multi-Stage Build

```dockerfile
# Dockerfile for Node.js application
# Multi-stage build for smaller production images

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
```

### 2. Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: npm run dev

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### 3. GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    environment:
      name: production
      url: https://myapp.com

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        run: |
          curl -X POST ${{ secrets.RAILWAY_WEBHOOK_URL }}

      - name: Wait for deployment
        run: sleep 30

      - name: Health check
        run: |
          curl --fail https://myapp.com/health || exit 1

      - name: Notify deployment
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 4. Vercel Deployment Configuration

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "DATABASE_URL": "@database-url",
      "JWT_SECRET": "@jwt-secret"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

```js
// vercel-build.js - Custom build script
const { execSync } = require('child_process');

async function build() {
  console.log('Running Prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });

  console.log('Building application...');
  execSync('npm run build', { stdio: 'inherit' });
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
```

### 5. Railway Deployment

```toml
# railway.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "node dist/index.js"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "web"
port = 3000

[services.env]
NODE_ENV = "production"

[[services.volumes]]
mountPath = "/app/uploads"
name = "uploads"
```

### 6. AWS ECS Deployment

```json
// task-definition.json
{
  "family": "myapp",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:jwt"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/myapp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 7. Environment Configuration

```bash
# .env.example - Template for environment variables
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# API Keys
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloud Storage
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=myapp-uploads
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

```ts
// config/env.ts - Type-safe environment validation
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
```

### 8. Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: myapp-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Critical Rules

1. **Never commit secrets**
   - Use environment variables
   - Use secret management (AWS Secrets Manager, Vercel Env)
   - Add .env to .gitignore

2. **Use multi-stage Docker builds**
   - Separate build and production stages
   - Minimize final image size
   - Remove dev dependencies

3. **Implement health checks**
   - Add /health endpoint
   - Configure Docker healthcheck
   - Use in load balancers

4. **Run as non-root user**
   - Create dedicated user in Dockerfile
   - Use USER directive
   - Set proper file permissions

5. **Enable logging and monitoring**
   - Structured logging (JSON)
   - Send logs to aggregation service
   - Set up error tracking (Sentry)

6. **Use CI/CD for deployments**
   - Automate testing before deploy
   - Deploy on merge to main
   - Implement rollback strategy

7. **Configure resource limits**
   - Set memory and CPU limits
   - Prevent resource exhaustion
   - Monitor resource usage

8. **Implement zero-downtime deployments**
   - Use rolling updates
   - Health check before routing traffic
   - Keep old version running during deploy

## Common Mistakes to Avoid

1. ❌ Committing .env files
2. ❌ Running containers as root
3. ❌ Not using .dockerignore
4. ❌ Missing health checks
5. ❌ No resource limits
6. ❌ Hardcoding configuration
7. ❌ Not testing in staging first
8. ❌ Ignoring security updates

## Dependencies

```json
{
  "dotenv": "^16.3.1",
  "zod": "^3.22.0"
}
```

### DevOps Tools
- Docker Desktop
- GitHub Actions
- Vercel CLI: `npm i -g vercel`
- Railway CLI: `npm i -g @railway/cli`
- AWS CLI
