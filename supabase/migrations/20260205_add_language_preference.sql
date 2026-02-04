-- Add language preference to users table
-- Default: 'th' (Thai)

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS language_preference VARCHAR(5) DEFAULT 'th';

-- Add comment
COMMENT ON COLUMN public.users.language_preference IS 'User preferred language: th (Thai) or en (English). Default: th';

-- Update existing users to default Thai
UPDATE public.users 
SET language_preference = 'th' 
WHERE language_preference IS NULL;
