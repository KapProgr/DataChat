-- Migration: Add missing columns to existing users table
-- Run this in your Supabase SQL Editor

-- Add clerk_id column (for Clerk authentication)
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT;

-- Add name column
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Add subscription_tier column
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Add stripe_customer_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add updated_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraint for subscription_tier values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_subscription_tier_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check 
        CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));
    END IF;
END $$;

-- Create unique constraint on clerk_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_clerk_id_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_clerk_id_key UNIQUE (clerk_id);
    END IF;
END $$;

-- Create index on clerk_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Service role has full access" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Policy: Allow service role full access (backend uses this)
CREATE POLICY "Service role has full access" ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Users can read their own data (for frontend direct queries if needed)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT
    TO authenticated, anon
    USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Note: We don't allow INSERT/UPDATE from frontend since backend handles sync
