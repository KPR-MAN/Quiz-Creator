export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  OPEN_ENDED = 'OPEN_ENDED',
}

export interface QuizQuestion {
  question: string;
  type: QuestionType;
  options: string[]; // For MULTIPLE_CHOICE and TRUE_FALSE
  correctAnswer: string;
}

export interface EvaluationResult {
  isCorrect: boolean;
  feedback?: string;
  correctAnswer: string;
}


export enum GameState {
  CONFIGURING = 'CONFIGURING',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  HISTORY = 'HISTORY',
  REVIEW = 'REVIEW',
}

export interface QuizConfig {
  files: File[];
  numQuestions: number;
  questionTypes: QuestionType[];
  timer: number | null; // in minutes, null for unlimited
}

export interface CompletedQuiz {
  id: number; // Using timestamp as ID
  fileNames: string[];
  date: string;
  score: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  userAnswers: (string | null)[];
  evaluationResults: (EvaluationResult | null)[];
  timer: number | null;
}
