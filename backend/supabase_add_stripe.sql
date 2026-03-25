-- DataChat - Add Stripe Subscription Fields to Users
-- Run this in your Supabase SQL Editor

-- Add subscription columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON public.users(stripe_customer_id);

-- Success message
SELECT 'Stripe columns added! ✅' as message;
