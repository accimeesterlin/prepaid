# Testing Guide

This document provides comprehensive guidance for testing the PG Prepaid Minutes application.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage](#coverage)
- [Best Practices](#best-practices)

## Overview

This project uses **Jest** as the testing framework with the following setup:

- **Jest 30.x** - Testing framework
- **ts-jest** - TypeScript support for Jest
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM testing

## Setup

All testing dependencies are already installed. The test configuration is in:

- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Global test setup and environment variables

### Environment Variables

Test environment variables are automatically configured in `jest.setup.js`:

```javascript
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.MONGODB_DB_NAME = 'pg-prepaid-test';
process.env.NODE_ENV = 'test';
```

## Running Tests

### Available Commands

```bash
# Run all tests once
yarn test

# Run tests in watch mode (re-runs on file changes)
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

### Running Specific Tests

```bash
# Run tests in a specific file
yarn test src/lib/__tests__/auth.test.ts

# Run tests matching a pattern
yarn test --testNamePattern="password"

# Run tests for a specific directory
yarn test packages/db
```

## Test Structure

Tests are organized alongside the code they test:

```
src/
├── lib/
│   ├── auth.ts
│   ├── __tests__/
│   │   ├── auth.test.ts
│   │   ├── api-error.test.ts
│   │   └── utils.test.ts
│   └── services/
│       └── __tests__/
│           └── dingconnect.service.test.ts
packages/
└── db/
    └── src/
        └── models/
            ├── Product.ts
            └── __tests__/
                ├── Product.test.ts
                └── Wallet.test.ts
```

## Writing Tests

### Test File Naming

- Unit tests: `filename.test.ts` or `filename.spec.ts`
- Place tests in `__tests__/` directory or alongside source files

### Basic Test Structure

```typescript
import { functionToTest } from '../module';

describe('Module Name', () => {
  describe('functionToTest', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test input';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Example: Testing Utility Functions

```typescript
import { cn } from '../utils';

describe('cn (classname utility)', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });
});
```

### Example: Testing Async Functions

```typescript
import { hashPassword, verifyPassword } from '../auth';

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
  });

  it('should verify correct password', async () => {
    const password = 'test-password-123';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });
});
```

### Example: Testing Error Handling

```typescript
import { ApiErrors } from '../api-error';

describe('ApiErrors', () => {
  it('should create a 404 error', () => {
    const error = ApiErrors.NotFound('Resource not found');

    expect(error.status).toBe(404);
    expect(error.type).toBe('not-found');
    expect(error.detail).toBe('Resource not found');
  });
});
```

### Example: Testing Model Methods

```typescript
describe('Product Model - getEffectivePrice', () => {
  it('should return sell price when no customizations', () => {
    const product = createMockProduct({
      pricing: {
        costPrice: 10,
        sellPrice: 12,
        currency: 'USD',
        profitMargin: 20,
      },
    });

    const price = product.getEffectivePrice();
    expect(price).toBe(12);
  });

  it('should apply percentage discount correctly', () => {
    const product = createMockProduct({
      pricing: { sellPrice: 100 },
      resaleSettings: {
        discount: {
          enabled: true,
          type: 'percentage',
          value: 10, // 10% off
        },
      },
    });

    const price = product.getEffectivePrice();
    expect(price).toBe(90); // 100 - 10%
  });
});
```

## Test Coverage

### Viewing Coverage Reports

```bash
yarn test:coverage
```

Coverage reports are generated in the `coverage/` directory:

- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI/CD tools

### Coverage Goals

Aim for the following coverage targets:

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### What to Test

#### High Priority

1. **Business Logic**
   - Product pricing calculations (`getEffectivePrice`)
   - Wallet balance operations (`reserve`, `deduct`, `deposit`)
   - Authentication and authorization
   - Payment processing

2. **Data Validation**
   - Input validation functions
   - Model schema validations
   - API request/response validation

3. **Utility Functions**
   - Helper functions
   - Formatting and parsing utilities
   - String manipulation

#### Medium Priority

1. **API Endpoints**
   - Request handling
   - Response formatting
   - Error handling

2. **Integration Points**
   - Third-party API interactions (mock these)
   - Database operations (use test database or mocks)

#### Low Priority

1. **UI Components** (focus on logic, not presentation)
2. **Configuration files**
3. **Type definitions**

## Best Practices

### 1. Follow AAA Pattern

Structure tests with Arrange, Act, Assert:

```typescript
it('should calculate total price', () => {
  // Arrange
  const items = [10, 20, 30];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(60);
});
```

### 2. Test One Thing Per Test

Each test should verify a single behavior:

```typescript
// Good
it('should return true for valid email', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
});

it('should return false for invalid email', () => {
  expect(isValidEmail('invalid-email')).toBe(false);
});

// Bad - testing multiple things
it('should validate emails', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
  expect(isValidEmail('invalid-email')).toBe(false);
  expect(isValidEmail('')).toBe(false);
});
```

### 3. Use Descriptive Test Names

Test names should clearly describe what is being tested:

```typescript
// Good
it('should return null when token is invalid', () => {
  // ...
});

// Bad
it('works correctly', () => {
  // ...
});
```

### 4. Avoid Testing Implementation Details

Focus on behavior, not implementation:

```typescript
// Good - testing behavior
it('should increase balance when deposit is made', () => {
  wallet.deposit(100);
  expect(wallet.balance).toBe(1100);
});

// Bad - testing implementation
it('should call _updateBalance method', () => {
  const spy = jest.spyOn(wallet, '_updateBalance');
  wallet.deposit(100);
  expect(spy).toHaveBeenCalled();
});
```

### 5. Mock External Dependencies

Always mock external services, databases, and APIs:

```typescript
// Mock external API
jest.mock('../services/dingconnect.service', () => ({
  getProducts: jest.fn().mockResolvedValue([
    { id: '1', name: 'Product 1' },
  ]),
}));
```

### 6. Use Test Fixtures and Helpers

Create reusable test data and helper functions:

```typescript
// Test helpers
const createMockProduct = (overrides = {}) => ({
  id: 'prod-123',
  name: 'Test Product',
  price: 10,
  ...overrides,
});

// Usage
const product = createMockProduct({ price: 20 });
```

### 7. Test Edge Cases

Always test boundary conditions and edge cases:

```typescript
describe('validateQuantity', () => {
  it('should accept quantity at minimum boundary', () => {
    expect(validateQuantity(1, { min: 1, max: 10 })).toBe(true);
  });

  it('should accept quantity at maximum boundary', () => {
    expect(validateQuantity(10, { min: 1, max: 10 })).toBe(true);
  });

  it('should reject quantity below minimum', () => {
    expect(validateQuantity(0, { min: 1, max: 10 })).toBe(false);
  });

  it('should reject quantity above maximum', () => {
    expect(validateQuantity(11, { min: 1, max: 10 })).toBe(false);
  });
});
```

### 8. Clean Up After Tests

Use `beforeEach`, `afterEach`, `beforeAll`, `afterAll`:

```typescript
describe('DatabaseTests', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should create a record', async () => {
    // Test code
  });
});
```

### 9. Don't Test External Libraries

Don't write tests for third-party libraries - they should have their own tests:

```typescript
// Bad - testing bcrypt library
it('should hash password using bcrypt', () => {
  const hash = bcrypt.hashSync('password', 10);
  expect(hash).toMatch(/^\$2[aby]\$/);
});

// Good - testing your wrapper function
it('should hash password', async () => {
  const hash = await hashPassword('password');
  expect(hash).not.toBe('password');
  expect(typeof hash).toBe('string');
});
```

### 10. Keep Tests Fast

- Mock slow operations (database, network calls)
- Use in-memory databases for integration tests
- Run unit tests in parallel

## Continuous Integration

### Running Tests in CI/CD

Add this to your CI/CD pipeline:

```yaml
# Example: GitHub Actions
- name: Run tests
  run: yarn test --ci --coverage --maxWorkers=2

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Troubleshooting

### Common Issues

#### Issue: Tests timing out

```bash
# Increase timeout for specific test
it('should complete long operation', async () => {
  // Test code
}, 10000); // 10 second timeout

# Or set global timeout in jest.config.js
testTimeout: 10000
```

#### Issue: Module not found errors

Check that path aliases are correctly configured in `jest.config.js`:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@pg-prepaid/db$': '<rootDir>/packages/db/src/index.ts',
}
```

#### Issue: TypeScript errors in tests

Ensure `tsconfig.json` includes test files:

```json
{
  "include": ["src/**/*", "packages/**/*", "**/*.test.ts"]
}
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [Testing Best Practices](https://testingjavascript.com/)

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure all tests pass before committing
3. Maintain or improve code coverage
4. Update this documentation if adding new test patterns

---

**Remember:** Good tests are:
- ✅ Fast
- ✅ Independent
- ✅ Repeatable
- ✅ Self-validating
- ✅ Timely (written close to the code)
