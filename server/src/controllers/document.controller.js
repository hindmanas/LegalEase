import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { createDocument, findDocumentByIdForUser, isMemoryStore, listDocumentsByUser, deleteDocumentForUser } from '../repositories/memoryStore.js';
import { extractTextFromFile, extractTextFromBuffer } from '../services/parser.service.js';
import { uploadToSupabase, downloadFromSupabase, deleteFromSupabase } from '../services/supabase.service.js';
import { classifyLegalDocument } from '../services/ai.service.js';
import { AppError } from '../utils/AppError.js';
import fs from 'fs/promises';
import https from 'https';

function getFileType(filename) {
  return filename.split('.').pop()?.toLowerCase() || 'unknown';
}

function fetchUrlBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch URL, status code: ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', (err) => reject(err));
    }).on('error', (err) => reject(err));
  });
}

export async function uploadDocument(req, res, next) {
  try {
    let originalName, size, mimeType, supabasePath, extractedText;

    if (req.file) {
      // Flow 1: Traditional FormData upload (Multer files)
      originalName = req.file.originalname;
      size = req.file.size;
      mimeType = req.file.mimetype;

      // 1. Upload to Supabase Storage first (or returns local path if skipped)
      supabasePath = await uploadToSupabase(req.file, req.user._id);

      if (supabasePath === req.file.path) {
        // Supabase was skipped/not configured. Extract text from the local file.
        extractedText = await extractTextFromFile(req.file);
        // Cleanup local copy
        await fs.unlink(req.file.path).catch((err) => {
          console.error('Failed to delete temporary local file:', err);
        });
      } else {
        // Cleanup local copy
        await fs.unlink(req.file.path).catch((err) => {
          console.error('Failed to delete temporary local file:', err);
        });

        // 2 & 3. Read PDF from Supabase Storage
        const buffer = await downloadFromSupabase(supabasePath, req.headers.authorization);

        // 4. Extract text from the downloaded buffer
        extractedText = await extractTextFromBuffer(buffer, mimeType);
      }

      if (!extractedText.trim()) {
        throw new AppError('No readable text could be extracted from this file', 422);
      }
    } else if (req.body.pdfUrl || req.body.supabasePath) {
      // Flow 2: Direct Supabase Upload (JSON payload containing url or path)
      const { pdfUrl } = req.body;
      ({ originalName, supabasePath, size, mimeType } = req.body);

      if (!originalName || !size || !mimeType) {
        throw new AppError('Missing required metadata (originalName, size, mimeType)', 400);
      }

      const maxSize = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;
      if (size > maxSize) {
        throw new AppError(`File size exceeds the allowed limit of ${process.env.MAX_FILE_SIZE_MB || 10} MB`, 400);
      }

      let buffer;
      try {
        if (supabasePath) {
          buffer = await downloadFromSupabase(supabasePath, req.headers.authorization);
        } else if (pdfUrl) {
          buffer = await fetchUrlBuffer(pdfUrl);
        } else {
          throw new AppError('Missing supabasePath or pdfUrl', 400);
        }
      } catch (downloadError) {
        console.warn('Primary download attempt failed, trying fallback:', downloadError.message);
        if (pdfUrl) {
          buffer = await fetchUrlBuffer(pdfUrl);
        } else {
          throw downloadError;
        }
      }

      // Parse text directly from buffer
      extractedText = await extractTextFromBuffer(buffer, mimeType);
      if (!extractedText.trim()) {
        throw new AppError('No readable text could be extracted from this file', 422);
      }
    } else {
      throw new AppError('Please upload a document or provide a Supabase storage path', 400);
    }

    // Verify if it is a legal document
    const isLegal = await classifyLegalDocument(extractedText);
    if (!isLegal) {
      if (supabasePath && supabasePath !== (req.file ? req.file.path : null)) {
        await deleteFromSupabase(supabasePath, req.headers.authorization).catch((err) => {
          console.error('Failed to cleanup rejected non-legal document from Supabase storage:', err);
        });
      }
      throw new AppError('This platform currently supports only legal documents. Please upload a valid legal document.', 400);
    }

    const payload = {
      user: req.user._id,
      originalName,
      fileName: supabasePath ? supabasePath.split('/').pop() : originalName,
      filePath: supabasePath || pdfUrl,
      fileType: getFileType(originalName),
      mimeType,
      size,
      extractedText,
      status: 'parsed'
    };

    const document = isMemoryStore() ? await createDocument(payload) : await Document.create(payload);

    // Chunk and embed the document text
    try {
      const { embedAndStoreDocument } = await import('../services/vectorStore.service.js');
      await embedAndStoreDocument(document);
    } catch (vectorError) {
      console.error('Failed to chunk/embed document:', vectorError);
    }

    res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
}

export async function listDocuments(req, res, next) {
  try {
    const documents = isMemoryStore()
      ? await listDocumentsByUser(req.user._id)
      : await Document.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ documents });
  } catch (error) {
    next(error);
  }
}

export async function getDocument(req, res, next) {
  try {
    const document = isMemoryStore()
      ? await findDocumentByIdForUser(req.params.id, req.user._id)
      : await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!document) {
      throw new AppError('Document not found', 404);
    }
    res.json({ document });
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const documentId = req.params.id;
    const userId = req.user._id;

    const document = isMemoryStore()
      ? await findDocumentByIdForUser(documentId, userId)
      : await Document.findOne({ _id: documentId, user: userId });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // 1. Delete from Supabase Storage
    if (document.filePath) {
      const isUrl = document.filePath.startsWith('http://') || document.filePath.startsWith('https://');
      if (!isUrl) {
        await deleteFromSupabase(document.filePath, req.headers.authorization);
      } else if (document.filePath.includes('/storage/v1/object/')) {
        const parts = document.filePath.split('/documents/');
        if (parts.length > 1) {
          const relativePath = parts[1].split('?')[0];
          await deleteFromSupabase(decodeURIComponent(relativePath), req.headers.authorization);
        }
      }
    }

    // 2. Delete from Database and Vector chunks
    if (isMemoryStore()) {
      await deleteDocumentForUser(documentId, userId);
    } else {
      await Document.deleteOne({ _id: documentId, user: userId });
      await Chunk.deleteMany({ document: documentId });
    }

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
}
