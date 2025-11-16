import React, { useState } from 'react';
import type { CompletedQuiz } from '../types';
import { QuestionType } from '../types';
import Card from './Card';

interface QuizReviewProps {
  quiz: CompletedQuiz;
  onExit: () => void;
}

const QuizReview: React.FC<QuizReviewProps> = ({ quiz, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const question = quiz.questions[currentIndex];
  const userAnswer = quiz.userAnswers[currentIndex];
  const evaluationResult = quiz.evaluationResults[currentIndex];

  const getButtonClass = (option: string) => {
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
              <div
                key={index}
                className={`w-full text-right p-4 rounded-lg transition-all duration-200 cursor-default ${getButtonClass(option)}`}
              >
                <span dangerouslySetInnerHTML={{ __html: option }}></span>
              </div>
            ))}
          </div>
        );
      case QuestionType.FILL_IN_THE_BLANK:
      case QuestionType.OPEN_ENDED:
        return (
            <div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-1">إجابتك</label>
                    <div className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white">
                        {userAnswer || <span className="italic text-gray-500">لم تقدم إجابة</span>}
                    </div>
                </div>
                 {evaluationResult && (
                    <div className={`p-4 rounded-lg ${evaluationResult.isCorrect ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'} border`}>
                        {evaluationResult.feedback && <p className="font-semibold text-white mb-2">{evaluationResult.feedback}</p>}
                        <p className="text-gray-400">الإجابة الصحيحة:</p>
                        <p className="font-bold text-white">{evaluationResult.correctAnswer}</p>
                    </div>
                )}
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">مراجعة الاختبار</h2>
            <button
                onClick={onExit}
                className="px-4 py-2 font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
                &rarr; الخروج
            </button>
        </div>
      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-2">
            السؤال {currentIndex + 1} من {quiz.totalQuestions}
        </p>
        <h2 className="text-xl md:text-2xl font-semibold text-white leading-snug" dangerouslySetInnerHTML={{ __html: question.question }}></h2>
      </div>
      {renderQuestionBody()}
      <div className="mt-6 flex justify-between items-center">
            <button
                onClick={() => setCurrentIndex(i => i - 1)}
                disabled={currentIndex === 0}
                className="px-6 py-3 font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300"
            >
                السابق
            </button>
            <button
                onClick={() => setCurrentIndex(i => i + 1)}
                disabled={currentIndex === quiz.totalQuestions - 1}
                className="px-8 py-3 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300"
            >
                التالي
            </button>
        </div>
    </Card>
  );
};

export default QuizReview;
