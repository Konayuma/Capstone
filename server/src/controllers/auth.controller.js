import { z } from 'zod';
import authService from '../services/auth.service.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'supervisor']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const authController = {
  async register(req, res, next) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const data = z.object({
        name: z.string().min(2).optional(),
        password: z.string().min(6).optional(),
        profileImage: z.string().trim().min(1).nullable().optional(),
      }).parse(req.body);
      const user = await authService.updateProfile(req.user.id, data);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res) {
    // JWT is stateless, client handles token removal
    res.json({ message: 'Logged out successfully.' });
  },
};

export default authController;
