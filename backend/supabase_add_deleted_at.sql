-- Add deleted_at column to existing tables for soft delete functionality
-- Run this in Supabase SQL Editor

-- Add deleted_at to files table
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at to queries table
ALTER TABLE public.queries 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add indexes for better performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON public.files(deleted_at);
CREATE INDEX IF NOT EXISTS idx_queries_deleted_at ON public.queries(deleted_at);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('files', 'queries') AND column_name = 'deleted_at';
