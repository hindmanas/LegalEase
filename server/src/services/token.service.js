import jwt from 'jsonwebtoken';

export function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'development-only-change-me') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not configured or insecure in production environment');
    }
  }
  return jwt.sign({ id: user._id.toString() }, secret || 'development-only-change-me', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}
