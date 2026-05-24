import { createClient } from '@supabase/supabase-js';
import env from './env.js';

const hasSupabaseStorageConfig = Boolean(
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_BUCKET_NAME
);

export const supabaseStorageEnabled = hasSupabaseStorageConfig;

export const supabase = hasSupabaseStorageConfig
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export default supabase;