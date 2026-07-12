-- enum for set kind
CREATE TYPE public.set_kind AS ENUM ('study', 'test', 'exam');

-- profiles: add plan
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

-- study_sets
CREATE TABLE public.study_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.set_kind NOT NULL DEFAULT 'study',
  title text NOT NULL,
  subject text,
  description text,
  source_material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_limit_minutes int,
  ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sets TO authenticated;
GRANT ALL ON public.study_sets TO service_role;
ALTER TABLE public.study_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study_sets" ON public.study_sets
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_study_sets_touch BEFORE UPDATE ON public.study_sets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- attempts
CREATE TABLE public.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  set_id uuid NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  duration_seconds int NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attempts TO authenticated;
GRANT ALL ON public.attempts TO service_role;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own attempts" ON public.attempts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_usage
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  tokens int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ai_usage" ON public.ai_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ai_usage" ON public.ai_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_usage_user_month ON public.ai_usage (user_id, created_at DESC);
CREATE INDEX idx_study_sets_user ON public.study_sets (user_id, created_at DESC);
CREATE INDEX idx_attempts_user ON public.attempts (user_id, completed_at DESC);
