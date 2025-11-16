import React, { useState, useEffect } from 'react';
import Card from './Card';

interface ResultsProps {
  score: number;
  totalQuestions: number;
  fileNames: string[];
  onRestart: () => void;
}

const Results: React.FC<ResultsProps> = ({ score, totalQuestions, fileNames, onRestart }) => {
  const [isMounted, setIsMounted] = useState(false);
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getFeedbackMessage = () => {
    if (percentage === 100) return "علامة كاملة! أنت عبقري!";
    if (percentage >= 80) return "عمل ممتاز! أنت تعرف جيدًا.";
    if (percentage >= 60) return "عمل جيد! أداء قوي.";
    if (percentage >= 40) return "ليس سيئًا، ولكن هناك مجال للتحسين.";
    return "واصل المذاكرة! ستصل إلى هدفك.";
  };

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isMounted ? circumference - (percentage / 100) * circumference : circumference;

  return (
    <Card className="text-center">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">اكتمل الاختبار!</h2>
      <p className="text-gray-400 mb-4">لقد أنهيت الاختبار من الملفات: <span className="font-semibold text-white">{fileNames.join(', ')}</span>.</p>
      
      <div className="my-8 relative w-48 h-48 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 160 160">
            <circle
                className="text-gray-700"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                r={radius}
                cx="80"
                cy="80"
            />
            <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c084fc" /> {/* purple-400 */}
                    <stop offset="100%" stopColor="#db2777" /> {/* pink-600 */}
                </linearGradient>
            </defs>
            <circle
                transform="rotate(-90 80 80)"
                stroke="url(#progressGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx="80"
                cy="80"
                style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                    transition: 'stroke-dashoffset 1.5s ease-out'
                }}
            />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white">{percentage}%</span>
        </div>
      </div>
      
      <p className="text-lg text-gray-300 -mt-4 mb-2">نتيجتك: {score} / {totalQuestions}</p>
      <p className="text-xl italic text-gray-300 mb-8">{getFeedbackMessage()}</p>

      <button
        onClick={onRestart}
        className="w-full sm:w-auto px-8 py-3 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-300"
      >
        العب مرة أخرى
      </button>
    </Card>
  );
};

export default Results;
