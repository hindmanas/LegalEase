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

    const answer = await answerDocumentQuestion(document, question.trim());
    res.json({ answer });
  } catch (error) {
    next(error);
  }
}
