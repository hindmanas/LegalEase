import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Document from '../models/Document.js';
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

export async function getQuota(req, res, next) {
  try {
    const user = req.user;

    // 1. Process weekly cycle reset dynamically
    const now = new Date();
    const cycleDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (user.quotaCycleStart && (now - new Date(user.quotaCycleStart) >= cycleDuration)) {
      user.quotaAnalyzedCount = 0;
      user.quotaCycleStart = null;
      user.quotaLastAnalyzedAt = null;
      await user.save();
    }

    const docsRemaining = Math.max(0, 3 - (user.quotaAnalyzedCount || 0));

    // 2. Next analysis availability calculation
    let nextAnalysisAvailableInMs = 0;
    const cooldownDuration = 24 * 60 * 60 * 1000; // 24 hours
    if (docsRemaining > 0 && user.quotaLastAnalyzedAt) {
      const elapsed = now - new Date(user.quotaLastAnalyzedAt);
      if (elapsed < cooldownDuration) {
        nextAnalysisAvailableInMs = cooldownDuration - elapsed;
      }
    }

    // 3. Weekly reset date calculation
    let weeklyResetDate = null;
    if (user.quotaCycleStart) {
      weeklyResetDate = new Date(new Date(user.quotaCycleStart).getTime() + cycleDuration);
    }

    // 4. Questions remaining on the most recently analyzed document
    let questionsRemaining = 3;
    let currentDocName = null;

    let currentDoc = null;
    if (isMemoryStore()) {
      const { listDocumentsByUser } = await import('../repositories/memoryStore.js');
      const docs = await listDocumentsByUser(user._id);
      currentDoc = docs.find(d => d.status === 'analyzed');
    } else {
      currentDoc = await Document.findOne({ user: user._id, status: 'analyzed' }).sort({ updatedAt: -1 });
    }

    if (currentDoc) {
      questionsRemaining = Math.max(0, 3 - (currentDoc.questionCount || 0));
      currentDocName = currentDoc.originalName;
    }

    res.json({
      documentsRemaining: docsRemaining,
      nextAnalysisAvailableInMs,
      questionsRemaining,
      currentDocName,
      weeklyResetDate
    });
  } catch (error) {
    next(error);
  }
}
