import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { createUser, findUserByEmail, isMemoryStore } from '../repositories/memoryStore.js';
import { signToken } from '../services/token.service.js';
import { AppError } from '../utils/AppError.js';

function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    language: user.language || 'en',
    createdAt: user.createdAt
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    const existingUser = isMemoryStore() ? await findUserByEmail(email) : await User.findOne({ email });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = isMemoryStore()
      ? await createUser({ name, email: email.toLowerCase(), passwordHash })
      : await User.create({ name, email, passwordHash });
    const token = signToken(user);

    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = isMemoryStore() ? await findUserByEmail(email) : await User.findOne({ email });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!valid) {
      throw new AppError('Invalid email or password', 401);
    }

    res.json({ user: sanitizeUser(user), token: signToken(user) });
  } catch (error) {
    next(error);
  }
}

export function me(req, res) {
  res.json({ user: sanitizeUser(req.user) });
}

export async function updateProfile(req, res, next) {
  try {
    const { name, email, language } = req.body;
    req.user.name = name || req.user.name;
    req.user.email = email || req.user.email;
    req.user.language = language || req.user.language;
    await req.user.save();
    res.json({ user: sanitizeUser(req.user) });
  } catch (error) {
    next(error);
  }
}
