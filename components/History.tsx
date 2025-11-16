import React from 'react';
import Card from './Card';
import type { CompletedQuiz } from '../types';

interface HistoryProps {
  history: CompletedQuiz[];
  onReview: (quizId: number) => void;
  onBack: () => void;
}

const History: React.FC<HistoryProps> = ({ history, onReview, onBack }) => {
  return (
    <Card>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">سجل الاختبارات</h2>
            <button
                onClick={onBack}
                className="px-4 py-2 font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
                &rarr; العودة
            </button>
        </div>
      {history.length === 0 ? (
        <p className="text-center text-gray-400 py-8">لم تكمل أي اختبارات بعد.</p>
      ) : (
        <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {history.slice().reverse().map((quiz) => (
            <li key={quiz.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs" title={quiz.fileNames.join(', ')}>
                  {quiz.fileNames.join(', ')}
                </p>
                <p className="text-sm text-gray-400">{quiz.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-lg text-purple-400">
                    {quiz.score}/{quiz.totalQuestions}
                </p>
                <button
                  onClick={() => onReview(quiz.id)}
                  className="px-4 py-2 font-semibold text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  مراجعة
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default History;
