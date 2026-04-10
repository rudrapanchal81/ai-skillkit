---
name: testing
description: Test automation patterns for Jest, Vitest, Playwright, and modern testing workflows
version: 1.0.0
category: testing
tags: [jest, vitest, playwright, testing, tdd, e2e, unit-tests]
---

# Testing Skill

Reliable test automation patterns for unit tests, integration tests, and end-to-end testing.

## Quick Reference

| Request Type | Use This Skill | Don't Use If |
|--------------|----------------|--------------|
| Unit tests with Jest/Vitest | ✅ Yes | GraphQL schema tests |
| E2E tests with Playwright | ✅ Yes | Load testing |
| Test fixtures and mocks | ✅ Yes | Manual QA scripts |
| CI/CD test pipelines | ✅ Yes | Performance profiling |
| Component testing | ✅ Yes | Security audits |

## Triggers

Use this skill when the request includes:
- Unit tests, integration tests, E2E tests
- Jest, Vitest, Playwright, Testing Library
- Test coverage, mocking, fixtures
- TDD, BDD, test-driven development
- CI/CD testing pipelines

## Anti-Triggers

Do NOT use this skill when:
- Request is about load testing or performance testing
- Security penetration testing
- Manual QA procedures
- Non-test automation scripts

## Implementation Patterns

### 1. Jest/Vitest Unit Tests

```js
// Modern unit test with Vitest
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateTotal, fetchUser } from './utils';

describe('calculateTotal', () => {
  it('should sum array of numbers', () => {
    expect(calculateTotal([1, 2, 3])).toBe(6);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('should handle negative numbers', () => {
    expect(calculateTotal([10, -5, 3])).toBe(8);
  });
});

describe('fetchUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user data', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ id: 1, name: 'Alice' })
    });
    global.fetch = mockFetch;

    const user = await fetchUser(1);
    
    expect(user).toEqual({ id: 1, name: 'Alice' });
    expect(mockFetch).toHaveBeenCalledWith('/api/users/1');
  });

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchUser(1)).rejects.toThrow('Network error');
  });
});
```

### 2. React Component Testing

```jsx
// Component testing with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('should call onSubmit with form data', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('should show validation errors', async () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });
});
```

### 3. Playwright E2E Tests

```js
// E2E testing with Playwright
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should login successfully', async ({ page }) => {
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    await context.route('**/api/login', route => route.abort());

    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText(/network error/i)).toBeVisible();
  });
});
```

### 4. Test Fixtures and Factories

```js
// Test data factories
import { faker } from '@faker-js/faker';

export function createUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    createdAt: faker.date.past(),
    ...overrides
  };
}

export function createProduct(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    price: parseFloat(faker.commerce.price()),
    stock: faker.number.int({ min: 0, max: 100 }),
    ...overrides
  };
}

// Usage in tests
import { createUser, createProduct } from './factories';

it('should process order', () => {
  const user = createUser({ email: 'test@example.com' });
  const product = createProduct({ price: 29.99, stock: 5 });
  
  const order = processOrder(user, product);
  expect(order.total).toBe(29.99);
});
```

### 5. Mocking External APIs

```js
// Mock Service Worker (MSW) for API mocking
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterEach, afterAll } from 'vitest';

const server = setupServer(
  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({
        id,
        name: 'Test User',
        email: 'test@example.com'
      })
    );
  }),

  rest.post('/api/orders', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({
        id: '123',
        ...body,
        status: 'pending'
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Tests now use mocked API
it('should create order', async () => {
  const order = await createOrder({ productId: '1', quantity: 2 });
  expect(order.status).toBe('pending');
});
```

## Critical Rules

1. **Always test behavior, not implementation**
   - Test what the code does, not how it does it
   - Avoid testing internal state or private methods

2. **Use meaningful test descriptions**
   - Write test names that describe the expected behavior
   - Use "should" statements: `it('should return error for invalid input')`

3. **Follow AAA pattern**
   - Arrange: Set up test data
   - Act: Execute the code under test
   - Assert: Verify the results

4. **Keep tests isolated**
   - Each test should be independent
   - Use beforeEach/afterEach for setup/cleanup
   - Don't rely on test execution order

5. **Mock external dependencies**
   - Mock API calls, databases, file system
   - Use MSW for HTTP mocking
   - Use vi.fn() or jest.fn() for function mocks

6. **Test edge cases**
   - Empty inputs, null values, undefined
   - Boundary conditions
   - Error scenarios

7. **Avoid test interdependence**
   - Tests should not share state
   - Clear mocks between tests
   - Use fresh data for each test

## Common Mistakes to Avoid

1. ❌ Testing implementation details
2. ❌ Not cleaning up after tests
3. ❌ Flaky tests that pass/fail randomly
4. ❌ Testing too many things in one test
5. ❌ Not testing error cases
6. ❌ Hardcoding test data instead of using factories
7. ❌ Not using proper async/await in async tests
8. ❌ Ignoring test coverage gaps

## Dependencies

### Unit Testing
```json
{
  "vitest": "^1.0.0",
  "@vitest/ui": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/user-event": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0"
}
```

### E2E Testing
```json
{
  "@playwright/test": "^1.40.0"
}
```

### Mocking
```json
{
  "msw": "^2.0.0",
  "@faker-js/faker": "^8.0.0"
}
```

### Configuration

**vitest.config.js:**
```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/']
    }
  }
});
```

**playwright.config.js:**
```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```
