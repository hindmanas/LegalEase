import Document from '../models/Document.js';
import { createDocument, findDocumentByIdForUser, isMemoryStore, listDocumentsByUser } from '../repositories/memoryStore.js';
import { extractTextFromFile, extractTextFromBuffer } from '../services/parser.service.js';
import { uploadToSupabase, downloadFromSupabase } from '../services/supabase.service.js';
import { AppError } from '../utils/AppError.js';
import fs from 'fs/promises';

function getFileType(filename) {
  return filename.split('.').pop()?.toLowerCase() || 'unknown';
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
      if (pdfUrl) {
        const fetchRes = await fetch(pdfUrl);
        if (!fetchRes.ok) {
          throw new AppError('Failed to download document from the provided URL', 400);
        }
        buffer = Buffer.from(await fetchRes.arrayBuffer());
      } else {
        // Download file from Supabase Storage
        buffer = await downloadFromSupabase(supabasePath, req.headers.authorization);
      }

      // Parse text directly from buffer
      extractedText = await extractTextFromBuffer(buffer, mimeType);
      if (!extractedText.trim()) {
        throw new AppError('No readable text could be extracted from this file', 422);
      }
    } else {
      throw new AppError('Please upload a document or provide a Supabase storage path', 400);
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
