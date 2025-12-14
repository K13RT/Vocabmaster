-- Supabase/Postgres helper functions and views for RPC
-- Run this file in Supabase SQL Editor to create the functions used by the server repositories.

-- 1) Get word counts for a list of set IDs
CREATE OR REPLACE FUNCTION public.get_word_counts_for_sets(set_ids integer[])
RETURNS TABLE (set_id integer, count bigint)
LANGUAGE sql
AS $$
  SELECT s.set_id, COUNT(w.id) as count
  FROM (SELECT unnest(set_ids) as set_id) s
  LEFT JOIN words w ON w.set_id = s.set_id
  GROUP BY s.set_id
  ORDER BY s.set_id;
$$;

-- 2) Admin weekly stats (last 7 days)
CREATE OR REPLACE FUNCTION public.admin_weekly_stats()
RETURNS TABLE (day date, words_reviewed bigint, active_users bigint)
LANGUAGE sql
AS $$
  SELECT date(last_reviewed) as day,
         COUNT(*) as words_reviewed,
         COUNT(DISTINCT user_id) as active_users
  FROM user_progress
  WHERE last_reviewed >= now() - interval '7 days'
  GROUP BY date(last_reviewed)
  ORDER BY date(last_reviewed) ASC;
$$;

-- 3) Admin monthly stats (group by ISO week over last 30 days)
CREATE OR REPLACE FUNCTION public.admin_monthly_stats()
RETURNS TABLE (week text, words_reviewed bigint, active_users bigint)
LANGUAGE sql
AS $$
  SELECT to_char(last_reviewed, 'IYYY-IW') as week,
         COUNT(*) as words_reviewed,
         COUNT(DISTINCT user_id) as active_users
  FROM user_progress
  WHERE last_reviewed >= now() - interval '30 days'
  GROUP BY to_char(last_reviewed, 'IYYY-IW')
  ORDER BY week ASC;
$$;

-- 4) Admin yearly stats (monthly aggregation over last 365 days)
CREATE OR REPLACE FUNCTION public.admin_yearly_stats()
RETURNS TABLE (month text, words_reviewed bigint, active_users bigint)
LANGUAGE sql
AS $$
  SELECT to_char(last_reviewed, 'YYYY-MM') as month,
         COUNT(*) as words_reviewed,
         COUNT(DISTINCT user_id) as active_users
  FROM user_progress
  WHERE last_reviewed >= now() - interval '365 days'
  GROUP BY to_char(last_reviewed, 'YYYY-MM')
  ORDER BY month ASC;
$$;

-- 5) Hardest words (words with at least 3 reviews, ordered by lowest success rate)
CREATE OR REPLACE FUNCTION public.admin_hardest_words(p_limit integer DEFAULT 10)
RETURNS TABLE (word text, meaning text, set_name text, review_count bigint, success_rate double precision)
LANGUAGE sql
AS $$
  SELECT w.word, w.meaning, vs.name as set_name,
         COUNT(up.id) as review_count,
         AVG(CASE WHEN up.remembered THEN 1.0 ELSE 0.0 END) as success_rate
  FROM words w
  JOIN vocabulary_sets vs ON vs.id = w.set_id
  JOIN user_progress up ON up.word_id = w.id
  GROUP BY w.id, vs.name
  HAVING COUNT(up.id) >= 3
  ORDER BY success_rate ASC
  LIMIT p_limit;
$$;

-- 6) User recent activity (last 30 days) — returns date and words reviewed count
CREATE OR REPLACE FUNCTION public.user_recent_activity(p_user_id integer)
RETURNS TABLE (day date, words_reviewed bigint)
LANGUAGE sql
AS $$
  SELECT date(last_reviewed) as day, COUNT(*) as words_reviewed
  FROM user_progress
  WHERE user_id = p_user_id AND last_reviewed >= now() - interval '30 days'
  GROUP BY date(last_reviewed)
  ORDER BY day DESC;
$$;

-- Notes:
-- - After running these, your server code can call these functions via supabase.rpc('function_name', params)
-- - You may create indexes on user_progress.last_reviewed and words.set_id for better performance.
