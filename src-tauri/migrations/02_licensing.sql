-- Migration 02: Licensing & Trial System

-- Add licensing columns to the profiles table
ALTER TABLE profiles ADD COLUMN license_key TEXT;
ALTER TABLE profiles ADD COLUMN trial_start_date DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE profiles ADD COLUMN is_activated BOOLEAN DEFAULT 0;
ALTER TABLE profiles ADD COLUMN activation_token TEXT;

-- For existing users, ensure they have a trial_start_date set to now if it was null (redundant due to default but good for clarity)
UPDATE profiles SET trial_start_date = CURRENT_TIMESTAMP WHERE trial_start_date IS NULL;
