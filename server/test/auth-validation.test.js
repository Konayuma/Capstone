import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
  role: z.enum(['student', 'supervisor']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

test('register validation trims and normalizes auth fields', () => {
  const parsed = registerSchema.parse({
    name: '  Ada Lovelace  ',
    email: '  ADA@Example.com  ',
    password: 'secret123',
    confirmPassword: 'secret123',
    role: 'student',
  });

  assert.equal(parsed.name, 'Ada Lovelace');
  assert.equal(parsed.email, 'ada@example.com');
  assert.equal(parsed.password, 'secret123');
  assert.equal(parsed.role, 'student');
});

test('register validation rejects weak passwords', () => {
  assert.throws(() => {
    registerSchema.parse({
      name: 'Ada',
      email: 'ada@example.com',
      password: '123',
      confirmPassword: '123',
    });
  }, /Password must be at least 6 characters/);
});

test('register validation rejects mismatched passwords', () => {
  assert.throws(() => {
    registerSchema.parse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'secret123',
      confirmPassword: 'different',
    });
  }, /Passwords do not match/);
});

test('login validation rejects malformed emails and empty passwords', () => {
  assert.throws(() => {
    loginSchema.parse({
      email: 'not-an-email',
      password: 'secret123',
    });
  }, /Invalid email address/);

  assert.throws(() => {
    loginSchema.parse({
      email: 'ada@example.com',
      password: '',
    });
  }, /Password is required/);
});
