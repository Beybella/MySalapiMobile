-- Add push_token column to users table for storing Expo Push Tokens
-- Run this in your Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token);

-- Comment describing the column
COMMENT ON COLUMN users.push_token IS 'Expo Push Token for sending push notifications';
