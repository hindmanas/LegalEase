import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

let supabaseInstance = null;

function getSupabaseClient(authHeader = null) {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/['"]/g, '').trim();
  const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').replace(/['"]/g, '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are not configured in environment variables.');
  }

  // If authHeader is passed, we initialize a Supabase client that forwards the user's JWT.
  // This allows the request to be authorized on behalf of the user, respecting RLS policies.
  if (authHeader) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
  }

  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

/**
 * Uploads a file to Supabase Storage.
 * @param {Object} file Multer file object
 * @param {string} userId User ID for folder organization
 * @returns {Promise<string>} The uploaded file path inside the bucket
 */
export async function uploadToSupabase(file, userId) {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/['"]/g, '').trim();
  const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').replace(/['"]/g, '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not set. Skipping Supabase upload.');
    return file.path;
  }

  try {
    const supabase = getSupabaseClient();
    const fileBuffer = await fs.readFile(file.path);
    const fileExt = file.originalname.split('.').pop() || '';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const storagePath = `${userId}/${fileName}`;

    // Attempt to ensure the 'documents' bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (buckets && !buckets.some((b) => b.name === 'documents')) {
        await supabase.storage.createBucket('documents', { public: false });
      }
    } catch (bucketError) {
      console.warn('Error checking/creating documents bucket:', bucketError.message);
    }

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      throw error;
    }

    return data.path;
  } catch (error) {
    console.error('Failed to upload file to Supabase Storage:', error);
    throw error;
  }
}

/**
 * Downloads a file from Supabase Storage and returns it as a Node.js Buffer.
 * @param {string} storagePath The path of the file inside the bucket
 * @param {string} [authHeader] Authorization header (JWT) of the user
 * @returns {Promise<Buffer>} The file content buffer
 */
export async function downloadFromSupabase(storagePath, authHeader = null) {
  try {
    const supabase = getSupabaseClient(authHeader);
    const { data, error } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (error) {
      throw error;
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Failed to download file from Supabase Storage:', error);
    throw error;
  }
}
