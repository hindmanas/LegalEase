import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

let supabaseInstance = null;
let adminSupabaseInstance = null;

function getSupabaseClient(authHeader = null) {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/['"]/g, '').trim();
  const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').replace(/['"]/g, '').trim();
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/['"]/g, '').trim();

  if (!supabaseUrl) {
    throw new Error('Supabase URL is not configured in environment variables.');
  }

  // If authHeader is passed, we initialize a Supabase client that forwards the user's JWT.
  // This allows the request to be authorized on behalf of the user, respecting RLS policies.
  if (authHeader) {
    if (!supabaseAnonKey) {
      throw new Error('Supabase Anon Key is not configured in environment variables.');
    }
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
  }

  // If service role key is configured, use it for administrative backend operations
  if (supabaseServiceKey) {
    if (adminSupabaseInstance) {
      return adminSupabaseInstance;
    }
    adminSupabaseInstance = createClient(supabaseUrl, supabaseServiceKey);
    return adminSupabaseInstance;
  }

  // Fallback to anon key
  if (!supabaseAnonKey) {
    throw new Error('Neither Supabase Service Role Key nor Anon Key is configured.');
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
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/['"]/g, '').trim();

  if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceKey)) {
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

/**
 * Verifies that the 'documents' storage bucket exists in Supabase.
 * If not, it attempts to auto-create it.
 */
export async function initializeSupabaseBucket() {
  try {
    const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/['"]/g, '').trim();
    const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').replace(/['"]/g, '').trim();
    const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/['"]/g, '').trim();

    if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceKey)) {
      console.warn('Supabase credentials are not configured in environment variables. Skipping bucket initialization.');
      return;
    }

    const supabase = getSupabaseClient();
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      throw error;
    }

    const bucketExists = buckets && buckets.some((b) => b.name === 'documents');
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket('documents', {
        public: false,
        allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        fileSizeLimit: (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024
      });
      if (createError) {
        throw createError;
      }
      console.log('Successfully created Supabase storage bucket: documents');
    } else {
      console.log('Supabase storage bucket "documents" verified.');
    }
  } catch (error) {
    if (error.message && (
      error.message.includes('violates row-level security') ||
      error.message.includes('401') ||
      error.status === 401 ||
      error.status === 403
    )) {
      console.warn(
        '\n================================================================================' +
        '\n[Supabase Warning] Failed to auto-initialize bucket "documents": Permission Denied.' +
        '\nWhy this happens: The public anon key does not have permission to manage buckets.' +
        '\nHow to fix:' +
        '\n  Option A: Go to your Supabase dashboard, navigate to Storage, and create a private' +
        '\n            bucket named "documents" manually.' +
        '\n  Option B: (Recommended) Add SUPABASE_SERVICE_ROLE_KEY to your server/.env file' +
        '\n            so the backend can manage the bucket and upload files securely.' +
        '\n================================================================================\n'
      );
    } else {
      console.warn('Failed to auto-initialize Supabase bucket "documents":', error.message);
    }
  }
}

