-- 1. Create public.users table (Required for Community features)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Sync auth.users to public.users (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username', COALESCE(new.raw_user_meta_data->>'role', 'user'))
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Backfill existing users
INSERT INTO public.users (id, email, username, role)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'username', 
  COALESCE(raw_user_meta_data->>'role', 'user')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 5. Fix Foreign Keys (Critical for Joins and 500 errors)
-- Point vocabulary_sets to public.users to allow joining for username
ALTER TABLE vocabulary_sets DROP CONSTRAINT IF EXISTS vocabulary_sets_user_id_fkey;
ALTER TABLE vocabulary_sets DROP CONSTRAINT IF EXISTS vocabulary_sets_user_id_fkey_public;
ALTER TABLE vocabulary_sets ADD CONSTRAINT vocabulary_sets_user_id_fkey_public FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Ensure words link to sets
ALTER TABLE words DROP CONSTRAINT IF EXISTS words_set_id_fkey;
ALTER TABLE words ADD CONSTRAINT words_set_id_fkey FOREIGN KEY (set_id) REFERENCES vocabulary_sets(id) ON DELETE CASCADE;

-- Ensure progress links to words
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_word_id_fkey;
ALTER TABLE user_progress ADD CONSTRAINT user_progress_word_id_fkey FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE;

-- 6. Fix RLS Policies (Drop first to avoid "already exists" error)
-- Users
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Sets
DROP POLICY IF EXISTS "Users can view own sets" ON vocabulary_sets;
CREATE POLICY "Users can view own sets" ON vocabulary_sets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view public sets" ON vocabulary_sets;
CREATE POLICY "Users can view public sets" ON vocabulary_sets FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Users can create sets" ON vocabulary_sets;
CREATE POLICY "Users can create sets" ON vocabulary_sets FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own sets" ON vocabulary_sets;
CREATE POLICY "Users can update own sets" ON vocabulary_sets FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own sets" ON vocabulary_sets;
CREATE POLICY "Users can delete own sets" ON vocabulary_sets FOR DELETE USING (auth.uid() = user_id);

-- Words (Fix for "Cannot add words")
DROP POLICY IF EXISTS "Users can view words" ON words;
CREATE POLICY "Users can view words" ON words FOR SELECT USING (EXISTS (SELECT 1 FROM vocabulary_sets WHERE vocabulary_sets.id = words.set_id AND (vocabulary_sets.user_id = auth.uid() OR vocabulary_sets.is_public = true)));
DROP POLICY IF EXISTS "Users can insert words" ON words;
CREATE POLICY "Users can insert words" ON words FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM vocabulary_sets WHERE vocabulary_sets.id = words.set_id AND vocabulary_sets.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update words" ON words;
CREATE POLICY "Users can update words" ON words FOR UPDATE USING (EXISTS (SELECT 1 FROM vocabulary_sets WHERE vocabulary_sets.id = words.set_id AND vocabulary_sets.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete words" ON words;
CREATE POLICY "Users can delete words" ON words FOR DELETE USING (EXISTS (SELECT 1 FROM vocabulary_sets WHERE vocabulary_sets.id = words.set_id AND vocabulary_sets.user_id = auth.uid()));

-- Quiz Results
CREATE TABLE IF NOT EXISTS public.quiz_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    set_id UUID REFERENCES public.vocabulary_sets(id) ON DELETE SET NULL,
    quiz_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own quiz results" ON quiz_results;
CREATE POLICY "Users can view own quiz results" ON quiz_results FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own quiz results" ON quiz_results;
CREATE POLICY "Users can insert own quiz results" ON quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
