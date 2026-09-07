import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string | null;
  difficulty: string | null;
  created_at: string;
}

export type QuestionInput = Omit<Question, 'id' | 'created_at'>;
