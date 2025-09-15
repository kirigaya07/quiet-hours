-- Supabase Database Triggers for Quiet Hours
-- Run these in your Supabase SQL editor

-- Enable Row Level Security on auth.users (if not already enabled)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be used to sync user data to MongoDB
  -- or perform other actions when a new user signs up
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a function to log user activity (optional)
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log user activity for analytics or debugging
  INSERT INTO public.user_activity_log (user_id, action, timestamp)
  VALUES (NEW.id, 'user_created', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user activity log table (optional)
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on activity log
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Create policy for activity log
CREATE POLICY "Users can view their own activity" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Create a function to clean up old activity logs (optional)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_activity_log 
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean up old logs (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-activity-logs', '0 2 * * *', 'SELECT cleanup_old_activity_logs();');
