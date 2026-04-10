---
name: api-design
description: REST API, GraphQL, and OpenAPI design patterns for scalable backend services
version: 1.0.0
category: backend
tags: [rest, graphql, openapi, api, http, endpoints, swagger]
---

# API Design Skill

Modern API design patterns for REST, GraphQL, and OpenAPI specifications.

## Quick Reference

| Request Type | Use This Skill | Don't Use If |
|--------------|----------------|--------------|
| REST API endpoints | ✅ Yes | Frontend UI components |
| GraphQL schema design | ✅ Yes | Database schema only |
| OpenAPI/Swagger specs | ✅ Yes | Internal function APIs |
| API versioning | ✅ Yes | CLI tool design |
| Error handling patterns | ✅ Yes | UI error messages |

## Triggers

Use this skill when the request includes:
- REST API, RESTful, HTTP endpoints
- GraphQL, schema, resolvers, mutations
- OpenAPI, Swagger, API documentation
- API versioning, rate limiting, pagination
- Status codes, error responses

## Anti-Triggers

Do NOT use this skill when:
- Request is about frontend components only
- Database design without API layer
- Internal library APIs (not HTTP)
- CLI tool design

## Implementation Patterns

### 1. REST API Design

```js
// Express REST API with best practices
import express from 'express';
import { body, param, query, validationResult } from 'express-validator';

const app = express();
app.use(express.json());

// GET /api/v1/users - List users with pagination
app.get('/api/v1/users',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isIn(['name', 'createdAt']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { page = 1, limit = 20, sort = 'createdAt' } = req.query;
    
    try {
      const users = await User.find()
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);
      
      const total = await User.countDocuments();

      res.json({
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
);

// GET /api/v1/users/:id - Get single user
app.get('/api/v1/users/:id',
  param('id').isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid user ID',
        details: errors.array() 
      });
    }

    try {
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          id: req.params.id 
        });
      }

      res.json({ data: user });
    } catch (error) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
);

// POST /api/v1/users - Create user
app.post('/api/v1/users',
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    try {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(409).json({ 
          error: 'User already exists',
          email: req.body.email 
        });
      }

      const user = await User.create(req.body);
      
      res.status(201).json({ 
        data: user,
        message: 'User created successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
);

// PATCH /api/v1/users/:id - Update user
app.patch('/api/v1/users/:id',
  param('id').isMongoId(),
  body('email').optional().isEmail(),
  body('name').optional().trim().isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          id: req.params.id 
        });
      }

      res.json({ 
        data: user,
        message: 'User updated successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
);

// DELETE /api/v1/users/:id - Delete user
app.delete('/api/v1/users/:id',
  param('id').isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid user ID',
        details: errors.array() 
      });
    }

    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          id: req.params.id 
        });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
);
```

### 2. GraphQL Schema Design

```graphql
# GraphQL schema with best practices
type Query {
  user(id: ID!): User
  users(
    page: Int = 1
    limit: Int = 20
    sort: UserSort = CREATED_AT
    filter: UserFilter
  ): UserConnection!
  
  post(id: ID!): Post
  posts(authorId: ID, published: Boolean): [Post!]!
}

type Mutation {
  createUser(input: CreateUserInput!): UserPayload!
  updateUser(id: ID!, input: UpdateUserInput!): UserPayload!
  deleteUser(id: ID!): DeletePayload!
  
  createPost(input: CreatePostInput!): PostPayload!
  publishPost(id: ID!): PostPayload!
}

type User {
  id: ID!
  email: String!
  name: String!
  posts: [Post!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  author: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

input CreateUserInput {
  email: String!
  name: String!
  password: String!
}

input UpdateUserInput {
  email: String
  name: String
}

input CreatePostInput {
  title: String!
  content: String!
  published: Boolean = false
}

input UserFilter {
  email: String
  name: String
}

enum UserSort {
  NAME
  CREATED_AT
  UPDATED_AT
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type UserPayload {
  user: User
  errors: [Error!]
}

type PostPayload {
  post: Post
  errors: [Error!]
}

type DeletePayload {
  success: Boolean!
  errors: [Error!]
}

type Error {
  field: String
  message: String!
}

scalar DateTime
```

```js
// GraphQL resolvers
import { GraphQLError } from 'graphql';

export const resolvers = {
  Query: {
    user: async (_, { id }, { dataSources }) => {
      const user = await dataSources.userAPI.getUserById(id);
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND', id }
        });
      }
      return user;
    },

    users: async (_, { page, limit, sort, filter }, { dataSources }) => {
      const result = await dataSources.userAPI.getUsers({
        page,
        limit,
        sort,
        filter
      });
      return result;
    }
  },

  Mutation: {
    createUser: async (_, { input }, { dataSources }) => {
      try {
        const user = await dataSources.userAPI.createUser(input);
        return { user, errors: [] };
      } catch (error) {
        return {
          user: null,
          errors: [{ message: error.message }]
        };
      }
    },

    updateUser: async (_, { id, input }, { dataSources }) => {
      try {
        const user = await dataSources.userAPI.updateUser(id, input);
        if (!user) {
          return {
            user: null,
            errors: [{ message: 'User not found' }]
          };
        }
        return { user, errors: [] };
      } catch (error) {
        return {
          user: null,
          errors: [{ message: error.message }]
        };
      }
    }
  },

  User: {
    posts: async (user, _, { dataSources }) => {
      return dataSources.postAPI.getPostsByAuthor(user.id);
    }
  },

  Post: {
    author: async (post, _, { dataSources }) => {
      return dataSources.userAPI.getUserById(post.authorId);
    }
  }
};
```

### 3. OpenAPI/Swagger Specification

```yaml
openapi: 3.0.3
info:
  title: User API
  description: RESTful API for user management
  version: 1.0.0
  contact:
    email: api@example.com
  license:
    name: MIT

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://staging-api.example.com/v1
    description: Staging

paths:
  /users:
    get:
      summary: List users
      description: Returns a paginated list of users
      operationId: listUsers
      tags:
        - Users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: sort
          in: query
          schema:
            type: string
            enum: [name, createdAt]
            default: createdAt
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
        '400':
          $ref: '#/components/responses/BadRequest'
        '500':
          $ref: '#/components/responses/InternalError'

    post:
      summary: Create user
      description: Creates a new user
      operationId: createUser
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/User'
                  message:
                    type: string
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'
        '500':
          $ref: '#/components/responses/InternalError'

  /users/{id}:
    get:
      summary: Get user
      description: Returns a single user by ID
      operationId: getUser
      tags:
        - Users
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'
        '500':
          $ref: '#/components/responses/InternalError'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        name:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CreateUserRequest:
      type: object
      required:
        - email
        - name
        - password
      properties:
        email:
          type: string
          format: email
        name:
          type: string
          minLength: 2
          maxLength: 100
        password:
          type: string
          minLength: 8

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        pages:
          type: integer

    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string
        details:
          type: array
          items:
            type: object

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    Conflict:
      description: Resource conflict
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    InternalError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

## Critical Rules

1. **Use proper HTTP status codes**
   - 200: Success
   - 201: Created
   - 204: No content
   - 400: Bad request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not found
   - 409: Conflict
   - 500: Internal error

2. **Version your APIs**
   - Use URL versioning: `/api/v1/users`
   - Or header versioning: `Accept: application/vnd.api+json; version=1`

3. **Implement pagination**
   - Use limit/offset or cursor-based pagination
   - Include total count and page info in response

4. **Validate all inputs**
   - Use validation libraries (express-validator, zod, joi)
   - Return detailed validation errors

5. **Handle errors consistently**
   - Use standard error response format
   - Include error codes and messages
   - Log errors for debugging

6. **Use proper HTTP methods**
   - GET: Retrieve data
   - POST: Create resources
   - PUT: Replace resources
   - PATCH: Update resources
   - DELETE: Remove resources

7. **Implement rate limiting**
   - Protect against abuse
   - Return rate limit headers

8. **Document your API**
   - Use OpenAPI/Swagger
   - Include examples
   - Keep docs up to date

## Common Mistakes to Avoid

1. ❌ Using GET for mutations
2. ❌ Not validating inputs
3. ❌ Returning sensitive data (passwords, tokens)
4. ❌ Inconsistent error responses
5. ❌ No API versioning
6. ❌ Missing pagination on list endpoints
7. ❌ Not using proper status codes
8. ❌ No rate limiting

## Dependencies

```json
{
  "express": "^4.18.0",
  "express-validator": "^7.0.0",
  "express-rate-limit": "^7.0.0",
  "apollo-server-express": "^3.12.0",
  "graphql": "^16.8.0",
  "swagger-ui-express": "^5.0.0",
  "swagger-jsdoc": "^6.2.0"
}
```
