import React, { useState, useCallback } from 'react';
import Card from './Card';
import { QuestionType } from '../types';
import type { QuizConfig } from '../types';

interface QuizConfiguratorProps {
  onStartQuiz: (config: QuizConfig) => void;
  onViewHistory: () => void;
  error: string | null;
}

const questionTypeOptions = [
  { id: QuestionType.MULTIPLE_CHOICE, label: 'اختر الإجابة الصحيحة' },
  { id: QuestionType.TRUE_FALSE, label: 'صح أم خطأ' },
  { id: QuestionType.FILL_IN_THE_BLANK, label: 'أكمل الفراغ' },
  { id: QuestionType.OPEN_ENDED, label: 'فسر ودلل' },
];

const timerOptions = [
    { value: null, label: 'غير محدود' },
    { value: 5, label: '5 دقائق' },
    { value: 15, label: '15 دقيقة' },
    { value: 30, label: '30 دقيقة' },
];

const QuizConfigurator: React.FC<QuizConfiguratorProps> = ({ onStartQuiz, onViewHistory, error }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [selectedTypes, setSelectedTypes] = useState<Set<QuestionType>>(
    new Set([QuestionType.MULTIPLE_CHOICE])
  );
  const [timer, setTimer] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleTypeChange = (type: QuestionType) => {
    setSelectedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length > 0) {
      onStartQuiz({
        files,
        numQuestions,
        questionTypes: Array.from(selectedTypes),
        timer,
      });
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="file-upload" className="block text-lg font-medium text-white mb-2">
            ارفع المحتوى
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-400">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-500 focus-within:outline-none">
                  <span>اختر ملفًا أو عدة ملفات</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.webp" multiple />
                </label>
                <p className="pl-1">أو اسحبها وأفلتها هنا</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF, PNG, JPG, WEBP
              </p>
            </div>
          </div>
          {files.length > 0 && (
            <div className="mt-2 text-sm text-green-400">
              <p className="font-semibold">الملفات المختارة:</p>
              <ul className="list-disc list-inside">
                {files.map((file) => (
                  <li key={file.name} className="truncate">{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="num-questions" className="block text-lg font-medium text-white mb-2">
            عدد الأسئلة
          </label>
          <input
            type="number"
            id="num-questions"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value, 10)))}
            min="1"
            max="20"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>

        <div>
            <label className="block text-lg font-medium text-white mb-2">أنواع الأسئلة</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {questionTypeOptions.map(option => (
                    <div key={option.id}>
                        <input 
                            type="checkbox" 
                            id={option.id} 
                            name={option.id} 
                            checked={selectedTypes.has(option.id)}
                            onChange={() => handleTypeChange(option.id)}
                            className="sr-only peer"
                        />
                        <label 
                            htmlFor={option.id}
                            className="block w-full text-center px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer transition-colors peer-checked:bg-purple-600 peer-checked:border-purple-500 hover:bg-gray-600"
                        >
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>
        </div>

        <div>
            <label className="block text-lg font-medium text-white mb-2">مدة الاختبار</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {timerOptions.map(option => (
                    <div key={String(option.value)}>
                    <input
                        type="radio"
                        id={`timer-${option.value}`}
                        name="timer"
                        value={String(option.value)}
                        checked={timer === option.value}
                        onChange={() => setTimer(option.value)}
                        className="sr-only peer"
                    />
                    <label
                        htmlFor={`timer-${option.value}`}
                        className="block w-full text-center px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer transition-colors peer-checked:bg-purple-600 peer-checked:border-purple-500 hover:bg-gray-600"
                    >
                        {option.label}
                    </label>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
            <button
                type="button"
                onClick={onViewHistory}
                className="w-full sm:w-1/3 px-4 py-3 font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors duration-300"
            >
                عرض السجل
            </button>
            <button
                type="submit"
                disabled={files.length === 0 || selectedTypes.size === 0}
                className="w-full sm:w-2/3 px-4 py-3 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-300"
            >
                إنشاء الاختبار
            </button>
        </div>
        {error && <p className="mt-2 text-red-400 text-center">{error}</p>}
      </form>
    </Card>
  );
};

export default QuizConfigurator;
