import Document from '../models/Document.js';
import { findDocumentByIdForUser, isMemoryStore } from '../repositories/memoryStore.js';
import { analyzeLegalText } from '../services/ai.service.js';
import { buildTextReport } from '../services/report.service.js';
import { AppError } from '../utils/AppError.js';

export async function analyzeDocument(req, res, next) {
  try {
    const document = isMemoryStore()
      ? await findDocumentByIdForUser(req.params.id, req.user._id)
      : await Document.findOne({ _id: req.params.id, user: req.user._id });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    const language = req.headers['x-user-language'] || req.headers['accept-language'] || req.user?.language || 'en';
    const languageMap = { en: 'English', hi: 'Hindi', gu: 'Gujarati' };
    const targetLanguage = languageMap[language.split(',')[0].slice(0, 2)] || 'English';

    const analysis = await analyzeLegalText(document.extractedText, targetLanguage);
    document.analysis = analysis;
    document.status = 'analyzed';
    await document.save();

    res.json({ document });
  } catch (error) {
    next(error);
  }
}

export async function downloadReport(req, res, next) {
  try {
    const document = isMemoryStore()
      ? await findDocumentByIdForUser(req.params.id, req.user._id)
      : await Document.findOne({ _id: req.params.id, user: req.user._id });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    const report = buildTextReport(document);
    const filename = `${document.originalName.replace(/\.[^.]+$/, '')}-simplified-report.txt`.replace(/[^a-zA-Z0-9._-]/g, '_');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(report);
  } catch (error) {
    next(error);
  }
}
