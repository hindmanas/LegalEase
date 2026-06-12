import mongoose from 'mongoose';
import { initializeDemoUser } from '../repositories/memoryStore.js';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/legal-ease-ai';

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    globalThis.LEGAL_EASE_MEMORY_STORE = false;
    console.log('MongoDB connected');
  } catch (error) {
    globalThis.LEGAL_EASE_MEMORY_STORE = true;
    console.warn('MongoDB unavailable. Using in-memory development store.');
    console.warn(error.message);
    // Initialize demo user when using memory store
    await initializeDemoUser();
  }
}
