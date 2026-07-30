import mongoose from 'mongoose';
import { initializeDemoUser } from '../repositories/memoryStore.js';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production' ? '' : 'mongodb://127.0.0.1:27017/legal-ease-ai');

  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    console.error('CRITICAL ERROR: MONGODB_URI environment variable is required in production mode!');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    globalThis.LEGAL_EASE_MEMORY_STORE = false;
    console.log('MongoDB connected');
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL ERROR: MongoDB connection failed in production mode!', error.message);
      process.exit(1);
    }
    globalThis.LEGAL_EASE_MEMORY_STORE = true;
    console.warn('MongoDB unavailable. Using in-memory development store.');
    console.warn(error.message);
    // Initialize demo user when using memory store
    await initializeDemoUser();
  }
}
