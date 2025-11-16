import React, { useState, useEffect, useRef } from 'react';
import type { QuizQuestion, EvaluationResult } from '../types';
import { QuestionType } from '../types';
import Card from './Card';

interface QuizProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string) => Promise<void>;
  onNext: () => void;
  onPrevious: () => void;
  timeLeft: number | null;
  userAnswer: string | null;
  evaluationResult: EvaluationResult | null;
  isEvaluating: boolean;
}

const formatTime = (seconds: number | null) => {
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const Quiz: React.FC<QuizProps> = ({ 
    question, 
    questionNumber, 
    totalQuestions, 
    onAnswer, 
    onNext, 
    onPrevious,
    timeLeft,
    userAnswer,
    evaluationResult,
    isEvaluating,
}) => {
  const [textAnswer, setTextAnswer] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAnswered = evaluationResult !== null;

  useEffect(() => {
    setTextAnswer(userAnswer || '');
    
    if (!isAnswered) {
        if (question.type === QuestionType.FILL_IN_THE_BLANK && inputRef.current) {
            inputRef.current.focus();
        } else if (question.type === QuestionType.OPEN_ENDED && textareaRef.current) {
            textareaRef.current.focus();
        }
    }
  }, [question, userAnswer, isAnswered]);

  const handleAnswerSubmit = async (answer: string) => {
    if (isAnswered || isEvaluating) return;
    onAnswer(answer);
  };
  
  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      return 'bg-gray-700 hover:bg-purple-700';
    }
    if (option === evaluationResult?.correctAnswer) {
      return 'bg-green-600';
    }
    if (option === userAnswer) {
      return 'bg-red-600';
    }
    return 'bg-gray-700 opacity-50';
  };

  const renderQuestionBody = () => {
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.TRUE_FALSE:
        return (
          <div className="flex flex-col gap-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSubmit(option)}
                disabled={isAnswered || isEvaluating}
                className={`w-full text-right p-4 rounded-lg transition-all duration-200 ${getButtonClass(option)} ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span dangerouslySetInnerHTML={{ __html: option }}></span>
              </button>
            ))}
          </div>
        );
      case QuestionType.FILL_IN_THE_BLANK:
      case QuestionType.OPEN_ENDED:
        const isTextArea = question.type === QuestionType.OPEN_ENDED;
        return (
          <form onSubmit={(e) => { e.preventDefault(); handleAnswerSubmit(textAnswer); }}>
            {isTextArea ? (
              <textarea
                ref={textareaRef}
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={isAnswered || isEvaluating}
                placeholder="اكتب إجابتك التفصيلية هنا..."
                rows={5}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={isAnswered || isEvaluating}
                placeholder="اكتب إجابتك هنا..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            )}
            
            {!isAnswered && (
                <button type="submit" disabled={isEvaluating || !textAnswer.trim()} className="mt-4 w-full px-4 py-3 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-500 transition-colors">
                    {isEvaluating ? 'جاري التقييم...' : 'تأكيد الإجابة'}
                </button>
            )}
            {isAnswered && evaluationResult && (
                <div className={`mt-4 p-4 rounded-lg ${evaluationResult.isCorrect ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'} border`}>
                    {evaluationResult.feedback && <p className="font-semibold text-white mb-2">{evaluationResult.feedback}</p>}
                    <p className="text-gray-400">الإجابة الصحيحة:</p>
                    <p className="font-bold text-white">{evaluationResult.correctAnswer}</p>
                </div>
            )}
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-400">
              السؤال {questionNumber} من {totalQuestions}
            </p>
            {timeLeft !== null && (
                <div className={`text-sm font-semibold px-3 py-1 rounded-full ${timeLeft < 60 ? 'text-red-300 bg-red-800/50' : 'text-purple-300 bg-purple-800/50'}`}>
                    ⏳ {formatTime(timeLeft)}
                </div>
            )}
        </div>
        <h2 className="text-xl md:text-2xl font-semibold text-white leading-snug" dangerouslySetInnerHTML={{ __html: question.question }}></h2>
      </div>
      {renderQuestionBody()}
      <div className="mt-6 flex justify-between items-center">
            <button
                onClick={onPrevious}
                disabled={questionNumber === 1}
                className="px-6 py-3 font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300"
            >
                السؤال السابق
            </button>
            <button
                onClick={onNext}
                className="px-8 py-3 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-300"
            >
                {questionNumber === totalQuestions ? 'إنهاء الاختبار' : 'السؤال التالي'}
            </button>
        </div>
    </Card>
  );
};

export default Quiz;