import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const users = [];
const documents = [];
const chunks = [];

function now() {
  return new Date();
}

function id() {
  return crypto.randomBytes(12).toString('hex');
}

// Initialize with demo user
async function seedDemoUser() {
  // Demo credentials: demo@legal-ease.com / Demo@1234
  const demoPasswordHash = await bcrypt.hash('Demo@1234', 12);
  const demoUser = {
    _id: id(),
    name: 'Demo User',
    email: 'demo@legal-ease.com',
    passwordHash: demoPasswordHash,
    createdAt: now(),
    updatedAt: now()
  };
  users.push(demoUser);
}

function attachSave(collection, entity) {
  return {
    ...entity,
    async save() {
      this.updatedAt = now();
      const index = collection.findIndex((item) => item._id === this._id);
      if (index >= 0) {
        collection[index] = { ...this };
      }
      return this;
    }
  };
}

export function isMemoryStore() {
  return Boolean(globalThis.LEGAL_EASE_MEMORY_STORE);
}

export async function createUser(data) {
  const entity = attachSave(users, {
    _id: id(),
    ...data,
    createdAt: now(),
    updatedAt: now()
  });
  users.push({ ...entity });
  return entity;
}

export async function findUserByEmail(email) {
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  return user ? attachSave(users, user) : null;
}

export async function findUserById(userId) {
  const user = users.find((item) => item._id === userId);
  return user ? attachSave(users, user) : null;
}

export async function createDocument(data) {
  const entity = attachSave(documents, {
    _id: id(),
    ...data,
    user: data.user.toString(),
    createdAt: now(),
    updatedAt: now()
  });
  documents.push({ ...entity });
  return entity;
}

export async function listDocumentsByUser(userId) {
  return documents
    .filter((item) => item.user === userId.toString())
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map((item) => attachSave(documents, item));
}

export async function findDocumentByIdForUser(documentId, userId) {
  const document = documents.find((item) => item._id === documentId && item.user === userId.toString());
  return document ? attachSave(documents, document) : null;
}

export async function initializeDemoUser() {
  // Check if demo user already exists
  const existing = await findUserByEmail('demo@legal-ease.com');
  if (!existing) {
    await seedDemoUser();
    console.log('Demo user initialized: demo@legal-ease.com / Demo@1234');
  }
}

export async function createChunk(data) {
  const entity = {
    _id: id(),
    ...data,
    document: data.document.toString(),
    createdAt: now(),
    updatedAt: now()
  };
  chunks.push(entity);
  return entity;
}

export async function listChunksByDocument(documentId) {
  return chunks.filter((item) => item.document === documentId.toString());
}
