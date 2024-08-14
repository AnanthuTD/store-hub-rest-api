import { z } from 'zod';

// Schema for registering a new user
export const registerSchema = z.object({
  firstName: z
    .string()
    .min(4, { message: 'First Name should be at least 4 characters' }),
  lastName: z
    .string()
    .min(1, { message: 'Last Name should be at least 1 character' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' }),
});

// Schema for logging in an existing user
export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' }),
});

// Schema for verifying an email address
export const emailVerificationSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});
