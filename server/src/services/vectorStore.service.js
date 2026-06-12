import { ChromaClient } from 'chromadb';
import Chunk from '../models/Chunk.js';
import { createChunk, isMemoryStore, listChunksByDocument } from '../repositories/memoryStore.js';
import { generateEmbedding } from './ai.service.js';

let chromaAvailable = null;
let collection = null;

async function getChromaCollection() {
  if (chromaAvailable === false) return null;
  try {
    const client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
    // Simple heartbeat check to verify ChromaDB is running
    await client.heartbeat();
    chromaAvailable = true;
    collection = await client.getOrCreateCollection({ name: 'legal_ease_chunks' });
    return collection;
  } catch (err) {
    chromaAvailable = false;
    console.warn('ChromaDB connection failed. Falling back to MongoDB/Memory store.', err.message);
    return null;
  }
}

export function chunkText(text, chunkSize = 1000, chunkOverlap = 200) {
  if (!text) return [];
  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex > text.length) {
      endIndex = text.length;
    } else {
      // Attempt to split cleanly on space or boundary
      const lastSpace = text.lastIndexOf(' ', endIndex);
      if (lastSpace > startIndex + chunkSize / 2) {
        endIndex = lastSpace;
      }
    }
    chunks.push(text.slice(startIndex, endIndex).trim());
    startIndex = endIndex - chunkOverlap;
    if (startIndex >= text.length - chunkOverlap) {
      break;
    }
  }
  return chunks.filter(Boolean);
}

export async function embedAndStoreDocument(document) {
  const text = document.extractedText;
  if (!text) return;

  // 1. Chunk the text
  const chunks = chunkText(text);
  if (chunks.length === 0) return;

  // 2. Generate embeddings for each chunk
  const embeddings = await generateEmbedding(chunks);

  // 3. Try to store in ChromaDB
  const chromaColl = await getChromaCollection();
  if (chromaColl) {
    try {
      const ids = chunks.map((_, i) => `${document._id}_chunk_${i}`);
      const metadatas = chunks.map((_, i) => ({
        documentId: document._id.toString(),
        userId: document.user.toString(),
        index: i
      }));

      await chromaColl.add({
        ids,
        embeddings,
        metadatas,
        documents: chunks
      });
      console.log(`Successfully stored ${chunks.length} chunks in ChromaDB for document ${document._id}`);
      return;
    } catch (err) {
      console.error('Failed to store chunks in ChromaDB, falling back to database storage:', err);
    }
  }

  // 4. Fallback to MongoDB / Memory Store
  const memory = isMemoryStore();
  for (let i = 0; i < chunks.length; i++) {
    const payload = {
      document: document._id,
      user: document.user,
      text: chunks[i],
      embedding: embeddings[i],
      index: i
    };
    if (memory) {
      await createChunk(payload);
    } else {
      await Chunk.create(payload);
    }
  }
  console.log(`Successfully stored ${chunks.length} chunks in MongoDB/Memory fallback for document ${document._id}`);
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchRelevantChunks(documentId, queryText, k = 5) {
  // 1. Generate query embedding
  const queryVector = await generateEmbedding(queryText);

  // 2. Try to search ChromaDB
  const chromaColl = await getChromaCollection();
  if (chromaColl) {
    try {
      const results = await chromaColl.query({
        queryEmbeddings: [queryVector],
        nResults: k,
        where: { documentId: documentId.toString() }
      });

      if (results && results.documents && results.documents[0]) {
        return results.documents[0].map((docText, index) => ({
          text: docText,
          metadata: results.metadatas[0][index]
        }));
      }
    } catch (err) {
      console.error('ChromaDB query failed, falling back to database query:', err);
    }
  }

  // 3. Fallback: Search MongoDB/Memory
  let docChunks = [];
  if (isMemoryStore()) {
    docChunks = await listChunksByDocument(documentId);
  } else {
    docChunks = await Chunk.find({ document: documentId });
  }

  // Compute similarities
  const scoredChunks = docChunks.map((chunk) => {
    const similarity = cosineSimilarity(queryVector, chunk.embedding);
    return {
      text: chunk.text,
      similarity
    };
  });

  // Sort by similarity descending
  scoredChunks.sort((a, b) => b.similarity - a.similarity);

  // Return top k chunks
  return scoredChunks.slice(0, k);
}
