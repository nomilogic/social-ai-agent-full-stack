-- Migration: Create notifications table
-- Description: Add support for user notifications with different types and read status

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder', 'campaign', 'post')),
    read boolean DEFAULT false,
    read_at timestamptz,
    action_url text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own notifications
CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER handle_notifications_updated_at BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert some sample notifications for testing (optional - remove in production)
-- Note: These will only work if there are actual user IDs in the auth.users table
INSERT INTO public.notifications (user_id, title, message, type, metadata) 
SELECT 
    id,
    'Welcome to Social AI Agent!',
    'Thank you for joining our platform. Start by creating your first company profile.',
    'info',
    '{"welcome": true}'
FROM auth.users 
WHERE email IS NOT NULL
ON CONFLICT DO NOTHING;

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.notifications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
