import { AppError } from '../utils/AppError.js';

export async function checkAnalysisQuota(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    const now = new Date();
    const cycleDuration = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Check weekly cycle reset
    if (user.quotaCycleStart && (now - new Date(user.quotaCycleStart) >= cycleDuration)) {
      user.quotaAnalyzedCount = 0;
      user.quotaCycleStart = null;
      user.quotaLastAnalyzedAt = null;
      await user.save();
    }

    const docsRemaining = 3 - (user.quotaAnalyzedCount || 0);

    // 1. Max 3 documents check
    if (docsRemaining <= 0) {
      const resetDate = new Date(new Date(user.quotaCycleStart).getTime() + cycleDuration);
      throw new AppError(`Weekly quota limit reached (3/3 documents analyzed). Next analysis available on ${resetDate.toLocaleString()}`, 403);
    }

    // 2. 24 hour cooldown check
    const cooldownDuration = 24 * 60 * 60 * 1000; // 24 hours
    if (user.quotaLastAnalyzedAt) {
      const elapsed = now - new Date(user.quotaLastAnalyzedAt);
      if (elapsed < cooldownDuration) {
        const remainingMs = cooldownDuration - elapsed;
        const hours = Math.floor(remainingMs / (3600 * 1000));
        const minutes = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
        throw new AppError(`Analysis limit reached. You can analyze only 1 document every 24 hours. Next analysis available in ${hours}h ${minutes}m.`, 403);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
