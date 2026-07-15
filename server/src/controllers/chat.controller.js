import Document from '../models/Document.js';
import { findDocumentByIdForUser, isMemoryStore } from '../repositories/memoryStore.js';
import { answerDocumentQuestion } from '../services/ai.service.js';
import { AppError } from '../utils/AppError.js';

export async function chatWithDocument(req, res, next) {
  try {
    const { question } = req.body;

    if (!question?.trim()) {
      throw new AppError('Question is required', 400);
    }

    const document = isMemoryStore()
      ? await findDocumentByIdForUser(req.params.id, req.user._id)
      : await Document.findOne({ _id: req.params.id, user: req.user._id });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    const language = req.headers['x-user-language'] || req.headers['accept-language'] || req.user?.language || 'en';
    const languageMap = { en: 'English', hi: 'Hindi', gu: 'Gujarati' };
    const targetLanguage = languageMap[language.split(',')[0].slice(0, 2)] || 'English';

    const answer = await answerDocumentQuestion(document, question.trim(), targetLanguage);
    res.json({ answer });
  } catch (error) {
    next(error);
  }
}
