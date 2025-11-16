import React, { useState, useCallback, useEffect } from 'react';
import { GameState, QuestionType } from './types';
import type { QuizQuestion, QuizConfig, EvaluationResult, CompletedQuiz } from './types';
import { generateQuizQuestions, evaluateAnswer } from './services/geminiService';

import QuizConfigurator from './components/TopicSelector';
import Quiz from './components/Quiz';
import Results from './components/Results';
import Loader from './components/Loader';
import History from './components/History';
import QuizReview from './components/QuizReview';


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.CONFIGURING);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<(EvaluationResult | null)[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizTimer, setQuizTimer] = useState<number | null>(null);

  // History State
  const [history, setHistory] = useState<CompletedQuiz[]>([]);
  const [quizToReview, setQuizToReview] = useState<CompletedQuiz | null>(null);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('geminiQuizHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (gameState !== GameState.QUIZ || timeLeft === null) {
      return;
    }

    if (timeLeft <= 0) {
      handleFinishQuiz();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => (prevTime ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [gameState, timeLeft]);


  const handleStartQuiz = useCallback(async (config: QuizConfig) => {
    if (config.files.length === 0) {
      setError('يرجى تحميل ملف واحد على الأقل.');
      return;
    }
    if (config.questionTypes.length === 0) {
      setError('يرجى اختيار نوع واحد على الأقل من الأسئلة.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetchedQuestions = await generateQuizQuestions(config.files, config.numQuestions, config.questionTypes);
      if (fetchedQuestions && fetchedQuestions.length > 0) {
        setQuestions(fetchedQuestions);
        setUserAnswers(Array(fetchedQuestions.length).fill(null));
        setEvaluationResults(Array(fetchedQuestions.length).fill(null));
        setFileNames(config.files.map(f => f.name));
        setQuizTimer(config.timer);
        if (config.timer) {
          setTimeLeft(config.timer * 60);
        } else {
          setTimeLeft(null);
        }
        setGameState(GameState.QUIZ);
        setCurrentQuestionIndex(0);
        setScore(0);
      } else {
        throw new Error('لم يتم إنشاء أسئلة لهذا المحتوى.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير معروف.');
      setGameState(GameState.CONFIGURING);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAnswer = useCallback(async (answer: string) => {
    const question = questions[currentQuestionIndex];
    if (!question) return;

    setIsEvaluating(true);
    
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newUserAnswers);
    
    let result: EvaluationResult;
    if (question.type === QuestionType.OPEN_ENDED) {
        result = await evaluateAnswer(question.question, question.correctAnswer, answer);
    } else {
        const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.toLowerCase();
        result = { isCorrect, correctAnswer: question.correctAnswer };
    }

    const newEvaluationResults = [...evaluationResults];
    newEvaluationResults[currentQuestionIndex] = result;
    setEvaluationResults(newEvaluationResults);

    setIsEvaluating(false);
  }, [currentQuestionIndex, questions, userAnswers, evaluationResults]);

  const handleFinishQuiz = useCallback(() => {
    const finalScore = evaluationResults.filter(r => r?.isCorrect).length;
    setScore(finalScore);

    const completedQuiz: CompletedQuiz = {
      id: Date.now(),
      fileNames: fileNames,
      date: new Date().toLocaleString('ar-EG'),
      score: finalScore,
      totalQuestions: questions.length,
      questions: questions,
      userAnswers: userAnswers,
      evaluationResults: evaluationResults,
      timer: quizTimer,
    };
    
    const newHistory = [...history, completedQuiz];
    setHistory(newHistory);
    try {
      localStorage.setItem('geminiQuizHistory', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
    
    setGameState(GameState.RESULTS);
  }, [questions, userAnswers, evaluationResults, fileNames, quizTimer, history]);


  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleFinishQuiz();
    }
  }, [currentQuestionIndex, questions.length, handleFinishQuiz]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);


  const handleRestart = useCallback(() => {
    setGameState(GameState.CONFIGURING);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setError(null);
    setFileNames([]);
    setTimeLeft(null);
    setUserAnswers([]);
    setEvaluationResults([]);
    setQuizToReview(null);
  }, []);

  const handleViewHistory = () => setGameState(GameState.HISTORY);
  const handleReviewQuiz = (quizId: number) => {
    const quiz = history.find(q => q.id === quizId);
    if (quiz) {
        setQuizToReview(quiz);
        setGameState(GameState.REVIEW);
    }
  };


  const renderContent = () => {
    if (isLoading) {
      return <Loader message="جاري إنشاء اختبارك..." />;
    }

    switch (gameState) {
      case GameState.CONFIGURING:
        return <QuizConfigurator onStartQuiz={handleStartQuiz} onViewHistory={handleViewHistory} error={error} />;
      case GameState.QUIZ:
        return (
          <Quiz
            question={questions[currentQuestionIndex]}
            userAnswer={userAnswers[currentQuestionIndex]}
            evaluationResult={evaluationResults[currentQuestionIndex]}
            isEvaluating={isEvaluating}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            onNext={handleNextQuestion}
            onPrevious={handlePreviousQuestion}
            timeLeft={timeLeft}
          />
        );
      case GameState.RESULTS:
        return (
          <Results
            score={score}
            totalQuestions={questions.length}
            fileNames={fileNames}
            onRestart={handleRestart}
          />
        );
      case GameState.HISTORY:
        return <History history={history} onReview={handleReviewQuiz} onBack={handleRestart} />;
      case GameState.REVIEW:
        return quizToReview ? <QuizReview quiz={quizToReview} onExit={handleRestart} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto">
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                مولد اختبارات Gemini
                </h1>
                <p className="text-gray-400 mt-2">اختبر معلوماتك في أي محتوى عن طريق تحميل ملف</p>
            </header>
            <main>
                {renderContent()}
            </main>
        </div>
    </div>
  );
};

export default App;
