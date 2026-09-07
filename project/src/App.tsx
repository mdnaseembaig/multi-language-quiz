import { useState, useEffect, useCallback } from 'react';
import { supabase, type Question, type QuestionInput } from '@/lib/supabase';
import { Search, Plus, Filter, Trash2, Pencil, X, Check, ChevronDown, Code2, Brain, Database, Network, Shield, Cpu, Layers } from 'lucide-react';

type View = 'browse' | 'quiz';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  hard: 'bg-rose-100 text-rose-700 border-rose-200',
};

const CATEGORY_ICONS: Record<string, typeof Code2> = {
  Python: Code2,
  HTML: Code2,
  CSS: Code2,
  JavaScript: Code2,
  React: Code2,
  'Node.js': Code2,
  Java: Code2,
  C: Code2,
  'C++': Code2,
  'C#': Code2,
  PHP: Code2,
  SQL: Database,
  DBMS: Database,
  'Machine Learning': Brain,
  'Artificial Intelligence': Brain,
  'Deep Learning': Brain,
  LLM: Brain,
  NLP: Brain,
  'Data Structures & Algorithms': Layers,
  'Computer Networks': Network,
  'Operating Systems': Cpu,
  'Cyber Security': Shield,
};

function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category] || Code2;
}

export default function App() {
  const [view, setView] = useState<View>('browse');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase.from('questions').select('*').order('created_at', { ascending: false });
    if (selectedCategory !== 'ALL') {
      query = query.eq('category', selectedCategory);
    }
    if (searchQuery.trim()) {
      query = query.ilike('question', `%${searchQuery.trim()}%`);
    }
    const { data, error: fetchError } = await query.limit(500);
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setQuestions(data || []);
    }
    setLoading(false);
  }, [selectedCategory, searchQuery]);

  const fetchCategories = useCallback(async () => {
    const { data, error: catError } = await supabase
      .from('questions')
      .select('category')
      .order('category');
    if (catError) {
      return;
    }
    const unique = [...new Set((data || []).map((r: { category: string }) => r.category))].sort();
    setCategories(unique);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchQuestions();
    }, searchQuery ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [fetchQuestions, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    const { error: delError } = await supabase.from('questions').delete().eq('id', id);
    if (delError) {
      setError(delError.message);
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    fetchCategories();
  };

  const handleSave = async (input: QuestionInput, id?: string) => {
    if (id) {
      const { data, error: updateError } = await supabase
        .from('questions')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (updateError) {
        setError(updateError.message);
        return false;
      }
      setQuestions((prev) => prev.map((q) => (q.id === id ? data : q)));
    } else {
      const { data, error: insertError } = await supabase
        .from('questions')
        .insert(input)
        .select()
        .single();
      if (insertError) {
        setError(insertError.message);
        return false;
      }
      setQuestions((prev) => [data, ...prev]);
    }
    setShowForm(false);
    setEditingQuestion(null);
    fetchCategories();
    return true;
  };

  const openEdit = (q: Question) => {
    setEditingQuestion(q);
    setShowForm(true);
  };

  const openAdd = () => {
    setEditingQuestion(null);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">CS Quiz Hub</h1>
                <p className="hidden text-xs text-slate-500 sm:block">Programming & Computer Science Questions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  onClick={() => setView('browse')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    view === 'browse' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => setView('quiz')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    view === 'quiz' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Quiz
                </button>
              </div>
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Question</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {view === 'browse' ? (
          <BrowseView
            questions={questions}
            categories={categories}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onDelete={handleDelete}
            onEdit={openEdit}
          />
        ) : (
          <QuizView
            questions={questions}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        )}
      </main>

      {showForm && (
        <QuestionForm
          question={editingQuestion}
          categories={categories}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Browse View ---------- */

function BrowseView({
  questions,
  categories,
  loading,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onDelete,
  onEdit,
}: {
  questions: Question[];
  categories: string[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  onDelete: (id: string) => void;
  onEdit: (q: Question) => void;
}) {
  return (
    <div>
      {/* Search + Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm font-medium text-slate-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Category Pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <CategoryPill
          label="ALL"
          active={selectedCategory === 'ALL'}
          onClick={() => setSelectedCategory('ALL')}
        />
        {categories.map((cat) => (
          <CategoryPill
            key={cat}
            label={cat}
            active={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading...' : `${questions.length} question${questions.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Question Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Code2 className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No questions found</p>
          <p className="mt-1 text-xs text-slate-400">Try a different search or category filter</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const Icon = getCategoryIcon(label);
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
        active
          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function QuestionCard({
  question,
  onDelete,
  onEdit,
}: {
  question: Question;
  onDelete: (id: string) => void;
  onEdit: (q: Question) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const Icon = getCategoryIcon(question.category);

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
            <Icon className="h-3 w-3" />
            {question.category}
          </span>
          {question.difficulty && (
            <span className={`rounded-md border px-2 py-1 text-xs font-medium ${DIFFICULTY_COLORS[question.difficulty] || DIFFICULTY_COLORS.medium}`}>
              {question.difficulty}
            </span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onEdit(question)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(question.id)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm font-semibold leading-relaxed text-slate-800">{question.question}</p>

      <div className="space-y-1.5">
        {question.options.map((opt, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              revealed && i === question.answer
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-slate-100 bg-slate-50 text-slate-600'
            }`}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-400">
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
            {revealed && i === question.answer && <Check className="ml-auto h-4 w-4 text-emerald-600" />}
          </div>
        ))}
      </div>

      {revealed && question.explanation && (
        <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-700">
          {question.explanation}
        </p>
      )}

      <button
        onClick={() => setRevealed(!revealed)}
        className="mt-3 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
      >
        {revealed ? 'Hide answer' : 'Reveal answer'}
      </button>
    </div>
  );
}

/* ---------- Quiz View ---------- */

function QuizView({
  questions,
  categories,
  selectedCategory,
  setSelectedCategory,
}: {
  questions: Question[];
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
}) {
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const startQuiz = () => {
    if (questions.length === 0) return;
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, Math.min(questions.length, 10));
    setQuizQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswered(false);
    setStarted(true);
    setFinished(false);
  };

  const handleAnswer = (optionIndex: number) => {
    if (answered) return;
    setSelectedAnswer(optionIndex);
    setAnswered(true);
    if (optionIndex === quizQuestions[currentIndex].answer) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= quizQuestions.length) {
      setFinished(true);
      setStarted(false);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  if (!started && !finished) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-900">Test Your Knowledge</h2>
        <p className="mb-6 max-w-md text-sm text-slate-500">
          Take a 10-question quiz from the filtered questions. Pick a category or search first, then start.
        </p>

        <div className="mb-6 w-full max-w-xs">
          <label className="mb-1.5 block text-left text-xs font-semibold text-slate-600">Category</label>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <button
          onClick={startQuiz}
          disabled={questions.length === 0}
          className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {questions.length === 0 ? 'No questions available' : `Start Quiz (${Math.min(questions.length, 10)} questions)`}
        </button>
      </div>
    );
  }

  if (finished) {
    const total = quizQuestions.length;
    const percentage = Math.round((score / total) * 100);
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold ${
          percentage >= 70 ? 'bg-emerald-100 text-emerald-600' : percentage >= 40 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
        }`}>
          {percentage}%
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-900">Quiz Complete!</h2>
        <p className="mb-6 text-sm text-slate-500">
          You scored <span className="font-bold text-slate-700">{score}</span> out of <span className="font-bold text-slate-700">{total}</span>
        </p>
        <button
          onClick={startQuiz}
          className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        >
          Take Another Quiz
        </button>
      </div>
    );
  }

  const current = quizQuestions[currentIndex];
  const Icon = getCategoryIcon(current.category);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Question {currentIndex + 1} of {quizQuestions.length}</span>
          <span>Score: {score}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
            style={{ width: `${((currentIndex + (answered ? 1 : 0)) / quizQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
            <Icon className="h-3 w-3" />
            {current.category}
          </span>
          {current.difficulty && (
            <span className={`rounded-md border px-2 py-1 text-xs font-medium ${DIFFICULTY_COLORS[current.difficulty] || DIFFICULTY_COLORS.medium}`}>
              {current.difficulty}
            </span>
          )}
        </div>

        <p className="mb-5 text-base font-semibold leading-relaxed text-slate-900">{current.question}</p>

        <div className="space-y-2">
          {current.options.map((opt, i) => {
            const isCorrect = i === current.answer;
            const isSelected = i === selectedAnswer;
            let style = 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50';
            if (answered) {
              if (isCorrect) {
                style = 'border-emerald-300 bg-emerald-50 text-emerald-800';
              } else if (isSelected) {
                style = 'border-rose-300 bg-rose-50 text-rose-800';
              } else {
                style = 'border-slate-200 bg-slate-50 text-slate-400';
              }
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={answered}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${style} ${!answered ? 'active:scale-[0.99]' : 'cursor-default'}`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  answered && isCorrect ? 'bg-emerald-500 text-white' : answered && isSelected ? 'bg-rose-500 text-white' : 'bg-white text-slate-400'
                }`}>
                  {answered && isCorrect ? <Check className="h-3.5 w-3.5" /> : answered && isSelected ? <X className="h-3.5 w-3.5" /> : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {answered && current.explanation && (
          <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-700">
            <span className="font-semibold">Explanation: </span>{current.explanation}
          </div>
        )}

        {answered && (
          <button
            onClick={nextQuestion}
            className="mt-5 w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
          >
            {currentIndex + 1 >= quizQuestions.length ? 'See Results' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Question Form Modal ---------- */

function QuestionForm({
  question,
  categories,
  onSave,
  onClose,
}: {
  question: Question | null;
  categories: string[];
  onSave: (input: QuestionInput, id?: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [category, setCategory] = useState(question?.category || '');
  const [questionText, setQuestionText] = useState(question?.question || '');
  const [options, setOptions] = useState<string[]>(question?.options || ['', '', '', '']);
  const [answer, setAnswer] = useState(question?.answer ?? 0);
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [difficulty, setDifficulty] = useState(question?.difficulty || 'medium');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    if (answer >= newOptions.length) setAnswer(newOptions.length - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!category.trim()) {
      setFormError('Please enter a category');
      return;
    }
    if (!questionText.trim()) {
      setFormError('Please enter a question');
      return;
    }
    const filledOptions = options.map((o) => o.trim());
    if (filledOptions.some((o) => !o)) {
      setFormError('All options must have text');
      return;
    }
    if (answer < 0 || answer >= filledOptions.length) {
      setFormError('Please select a correct answer');
      return;
    }

    setSaving(true);
    const input: QuestionInput = {
      category: category.trim(),
      question: questionText.trim(),
      options: filledOptions,
      answer,
      explanation: explanation.trim() || null,
      difficulty,
    };
    await onSave(input, question?.id);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:p-6">
      <div className="my-4 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">{question ? 'Edit Question' : 'Add Question'}</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {formError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </div>
          )}

          {/* Category */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Category / Language</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="category-list"
              placeholder="e.g. Python, React, Machine Learning"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <datalist id="category-list">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          {/* Question */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Question</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={2}
              placeholder="Enter the question..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Options */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Options (select the correct answer)</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAnswer(i)}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                      answer === i
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {answer === i ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + i)}
                  </button>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="rounded-md p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add option
              </button>
            )}
          </div>

          {/* Difficulty */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Difficulty</label>
            <div className="flex gap-2">
              {['easy', 'medium', 'hard'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold capitalize transition ${
                    difficulty === d
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Explanation (optional)</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              placeholder="Explain the correct answer..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </form>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving...' : question ? 'Update' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
}
