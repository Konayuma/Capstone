import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import env from '../config/env.js';

export const authService = {
  async register({ name, email, password, role }) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role || 'student' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Generate token
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return { user, token };
  },

  async login({ email, password }) {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
      token,
    };
  },

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true,
        profileImage: true, createdAt: true,
        memberships: {
          include: {
            project: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });

    if (!user) {
      throw Object.assign(new Error('User not found.'), { status: 404 });
    }

    return user;
  },

  async updateProfile(userId, { name, password, profileImage }) {
    const data = {};
    if (name) data.name = name;
    if (profileImage !== undefined) data.profileImage = profileImage || null;
    if (password) {
      const salt = await bcrypt.genSalt(12);
      data.passwordHash = await bcrypt.hash(password, salt);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, profileImage: true },
    });

    return user;
  },
};

export default authService;
