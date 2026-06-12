import jwt from 'jsonwebtoken';

export function signToken(user) {
  const secret = process.env.JWT_SECRET || 'development-only-change-me';
  return jwt.sign({ id: user._id.toString() }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}
