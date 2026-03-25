-- DataChat - Supabase Schema Setup
-- Run this in your Supabase SQL Editor
-- WARNING: This will DROP existing tables and recreate them!

-- Drop existing tables (CASCADE removes dependent objects)
DROP TABLE IF EXISTS public.queries CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    plan TEXT DEFAULT 'free',
    subscription_status TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create files table
CREATE TABLE public.files (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    rows INTEGER NOT NULL,
    columns INTEGER NOT NULL,
    file_url TEXT,
    headers JSONB,
    dtypes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 3. Create queries table
CREATE TABLE public.queries (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    file_id TEXT REFERENCES public.files(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    answer TEXT,
    chart_type TEXT,
    generated_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 4. Create indexes for better performance
CREATE INDEX idx_files_user_id ON public.files(user_id);
CREATE INDEX idx_files_created_at ON public.files(created_at DESC);
CREATE INDEX idx_files_deleted_at ON public.files(deleted_at);
CREATE INDEX idx_queries_user_id ON public.queries(user_id);
CREATE INDEX idx_queries_created_at ON public.queries(created_at DESC);
CREATE INDEX idx_queries_deleted_at ON public.queries(deleted_at);
CREATE INDEX idx_users_clerk_id ON public.users(clerk_user_id);
CREATE INDEX idx_users_stripe_customer ON public.users(stripe_customer_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (allow service role to access everything)
CREATE POLICY "Enable all access for service role" ON public.users
    FOR ALL USING (true);

CREATE POLICY "Enable all access for service role" ON public.files
    FOR ALL USING (true);

CREATE POLICY "Enable all access for service role" ON public.queries
    FOR ALL USING (true);

-- 7. Grant permissions
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.files TO service_role;
GRANT ALL ON public.queries TO service_role;

-- Success message
SELECT 'Schema setup complete! ✅' as message;
