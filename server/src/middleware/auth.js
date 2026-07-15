import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { findUserById, isMemoryStore } from '../repositories/memoryStore.js';
import { AppError } from '../utils/AppError.js';

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    const queryToken = req.query.token;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : queryToken;

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    // Verify using Supabase JWT Secret if provided, otherwise fallback
    const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'development-only-change-me';
    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('\x1b[33m[Auth Warning]\x1b[0m Supabase JWT verification failed. Falling back to decoding without signature verification for local testing.');
        payload = jwt.decode(token);
        if (!payload) {
          throw new AppError('Invalid token structure', 401);
        }
      } else {
        throw err;
      }
    }
    
    // In Supabase, the user ID is in 'sub' and email in 'email'
    const email = payload.email || payload.id; // fallback if it's the old custom JWT
    
    let user = null;

    if (isMemoryStore()) {
      // Memory store logic (for local development without MongoDB)
      user = await findUserById(payload.sub || payload.id);
      
      // Auto-create user in memory store if using Supabase and missing
      if (!user && payload.email) {
        // Pseudo logic for memory store sync
        const { users } = await import('../repositories/memoryStore.js');
        user = {
          _id: payload.sub,
          email: payload.email,
          name: payload.user_metadata?.name || payload.email.split('@')[0],
          language: payload.user_metadata?.language || 'en',
          passwordHash: 'oauth',
        };
        users.push(user);
        
        // Add helper save method manually to new memory record if needed
        const { attachSave, users: collection } = await import('../repositories/memoryStore.js');
        user = attachSave(collection, user);
      } else if (user && payload.user_metadata?.language && user.language !== payload.user_metadata.language) {
        user.language = payload.user_metadata.language;
        await user.save();
      }
    } else {
      // MongoDB logic
      // Supabase JWT doesn't use MongoDB ObjectIds. 
      // We sync the user using their email to ensure they exist in our DB.
      if (payload.email) {
        user = await User.findOne({ email: payload.email.toLowerCase() }).select('-passwordHash');
        
        // Auto-create MongoDB user if they signed up via Supabase (e.g., Google OAuth)
        if (!user) {
          user = await User.create({
            email: payload.email.toLowerCase(),
            name: payload.user_metadata?.name || payload.email.split('@')[0],
            language: payload.user_metadata?.language || 'en',
            passwordHash: 'oauth-or-supabase-managed' // password handled by supabase
          });
        } else if (payload.user_metadata?.language && user.language !== payload.user_metadata.language) {
          user.language = payload.user_metadata.language;
          await user.save();
        }
      } else {
        // Fallback for legacy custom JWT
        user = await User.findById(payload.id).select('-passwordHash');
      }
    }

    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Invalid or expired token', 401));
  }
}
