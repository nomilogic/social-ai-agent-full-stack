-- Add is_read boolean columns to posts and scheduled_posts tables
-- This simplifies read tracking by storing it directly on each post

-- Add is_read column to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

-- Add is_read column to scheduled_posts table  
ALTER TABLE public.scheduled_posts 
ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

-- Add indexes for faster filtering by read status
CREATE INDEX IF NOT EXISTS idx_posts_is_read ON public.posts(is_read);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_is_read ON public.scheduled_posts(is_read);

-- Optional: Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_posts_user_read ON public.posts(campaign_id, is_read);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_read ON public.scheduled_posts(user_id, is_read) WHERE user_id IS NOT NULL;
