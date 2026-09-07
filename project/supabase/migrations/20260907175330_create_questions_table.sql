/*
# Create questions table for multi-language CS quiz

1. Purpose
   - Stores quiz questions across ANY programming language or computer science topic.
   - Each question has a category (e.g. "Python", "HTML", "Machine Learning") so the
     frontend can filter by language/topic.
   - Designed to scale to thousands of questions.

2. New Tables
   - `questions`
     - `id`          (uuid, primary key, auto-generated)
     - `category`    (text, not null) — the language or CS topic, e.g. "Python", "React", "AI"
     - `question`    (text, not null) — the question text
     - `options`     (jsonb, not null) — array of 2+ answer option strings
     - `answer`      (int, not null)  — zero-based index into `options` of the correct answer
     - `explanation` (text, nullable) — optional explanation shown after answering
     - `difficulty`  (text, nullable, default 'medium') — 'easy' | 'medium' | 'hard'
     - `created_at`  (timestamptz, default now())

3. Indexes
   - `idx_questions_category` on `category` for fast category filtering.
   - `idx_questions_category_question` GIN trigram index on `category` + `question` for
     combined search + category filtering (requires pg_trgm extension).

4. Security
   - Enable RLS on `questions`.
   - This is a single-tenant public quiz app (no sign-in): allow anon + authenticated
     full CRUD so the anon-key frontend can read, add, edit, and delete questions.

5. Notes
   - The `category` column is a free-text field — you can add ANY language or topic
     without a schema change. The frontend reads distinct categories dynamically.
   - `options` is a JSONB array so the number of options is flexible (2–6 typical).
*/

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text NOT NULL,
  question    text NOT NULL,
  options     jsonb NOT NULL,
  answer      int  NOT NULL,
  explanation text,
  difficulty  text DEFAULT 'medium',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_category ON questions (category);
CREATE INDEX IF NOT EXISTS idx_questions_question_trgm ON questions USING gin (question gin_trgm_ops);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_questions" ON questions;
CREATE POLICY "anon_select_questions" ON questions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_questions" ON questions;
CREATE POLICY "anon_insert_questions" ON questions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_questions" ON questions;
CREATE POLICY "anon_update_questions" ON questions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_questions" ON questions;
CREATE POLICY "anon_delete_questions" ON questions FOR DELETE
  TO anon, authenticated USING (true);