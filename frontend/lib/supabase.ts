import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface User {
  id: string;
  clerk_id: string;
  email: string;
  name?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  headers: string[];
  row_count: number;
  column_count: number;
  created_at: string;
}

export interface QueryRecord {
  id: string;
  user_id: string;
  file_id: string;
  query_text: string;
  ai_response: string;
  generated_code?: string;
  chart_type?: string;
  chart_data?: any;
  created_at: string;
}

// Helper functions
export async function getOrCreateUser(clerkId: string, email: string, name?: string) {
  // Call backend API to sync user with Supabase using service key
  // This avoids all RLS/policy issues
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${backendUrl}/api/user/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerk_id: clerkId,
        email,
        name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to sync user');
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Error syncing user with backend:', error);
    throw error;
  }
}

export async function getUserFiles(userId: string) {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as FileRecord[];
}

export async function getFileQueries(fileId: string) {
  const { data, error } = await supabase
    .from('queries')
    .select('*')
    .eq('file_id', fileId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as QueryRecord[];
}

export async function saveQuery(
  userId: string,
  fileId: string,
  queryText: string,
  aiResponse: string,
  generatedCode?: string,
  chartType?: string,
  chartData?: any
) {
  const { data, error } = await supabase
    .from('queries')
    .insert([
      {
        user_id: userId,
        file_id: fileId,
        query_text: queryText,
        ai_response: aiResponse,
        generated_code: generatedCode,
        chart_type: chartType,
        chart_data: chartData,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFile(fileId: string) {
  const { error } = await supabase.from('files').delete().eq('id', fileId);
  if (error) throw error;
}

// Usage tracking for rate limiting
export async function trackUsage(userId: string, actionType: 'upload' | 'query') {
  const { error } = await supabase
    .from('usage')
    .insert([{ user_id: userId, action_type: actionType }]);

  if (error) throw error;
}

export async function getUserUsageToday(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  if (error) throw error;
  return data.length;
}