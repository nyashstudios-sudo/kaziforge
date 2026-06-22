-- 1. Create a Profiles table to store user roles and metadata
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  user_type TEXT CHECK (user_type IN ('client', 'freelancer', 'admin', 'pending')) NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create the Jobs table
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  budget INTEGER NOT NULL,
  description TEXT,
  proposals INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS on jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 3. Create the Messages table for private chat
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room TEXT NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Set up Row Level Security (RLS) Policies

-- Profiles: Users can view their own profile and clients/skillers can view each other
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Jobs: Anyone logged in can read active jobs
CREATE POLICY "Public jobs are viewable by everyone logged in" 
ON public.jobs FOR SELECT 
USING (auth.role() = 'authenticated');

-- Jobs: Only clients can insert new jobs
CREATE POLICY "Clients can insert their own jobs" 
ON public.jobs FOR INSERT 
WITH CHECK (
  auth.uid() = client_id AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'client')
);

-- Jobs: Clients can update their own jobs
CREATE POLICY "Clients can update their own jobs" 
ON public.jobs FOR UPDATE
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

-- Jobs: Clients can delete their own jobs
CREATE POLICY "Clients can delete their own jobs" 
ON public.jobs FOR DELETE
USING (auth.uid() = client_id);

-- Messages: Users can only see messages in rooms they belong to
-- (Room naming convention: sorted_user_id1_user_id2)
CREATE POLICY "Users can view their own private messages" 
ON public.messages FOR SELECT 
USING (auth.uid()::text = ANY(string_to_array(room, '_')));

-- Messages: Users can only send messages if they are part of the room
CREATE POLICY "Users can send messages to their rooms" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid()::text = ANY(string_to_array(room, '_')));

-- 5. Automatic Profile Creation
-- This function creates a profile entry whenever a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type, display_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'pending'),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on every signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Proposals: Clients can update proposal status (to accept them)
CREATE POLICY "Clients can update proposal status"
ON public.proposals FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = proposals.job_id AND jobs.client_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = proposals.job_id AND jobs.client_id = auth.uid()));

-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 6. Create the Proposals table
CREATE TABLE public.proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cover_letter TEXT NOT NULL,
  bid_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  UNIQUE(job_id, freelancer_id)
);

-- Enable RLS on proposals
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Policies for proposals
CREATE POLICY "Freelancers can view their own proposals"
ON public.proposals FOR SELECT
USING (auth.uid() = freelancer_id);

CREATE POLICY "Clients can view proposals for their jobs"
ON public.proposals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = proposals.job_id
    AND jobs.client_id = auth.uid()
  )
);

CREATE POLICY "Freelancers can submit proposals"
ON public.proposals FOR INSERT
WITH CHECK (
  auth.uid() = freelancer_id AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'freelancer')
);

-- Trigger to increment proposals count in jobs table
CREATE OR REPLACE FUNCTION public.increment_job_proposals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.jobs
  SET proposals = proposals + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_proposal_submitted
  AFTER INSERT ON public.proposals
  FOR EACH ROW EXECUTE PROCEDURE public.increment_job_proposals();

-- Enable Realtime for proposals
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;

-- 7. Storage Setup for Chat Attachments
-- Create a public bucket for chat files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for Chat Attachments
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Authenticated users can view chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

-- 8. Storage Setup for Avatars
-- Create a public bucket for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for Avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');