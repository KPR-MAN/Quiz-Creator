import { GoogleGenAI, Type } from "@google/genai";
// FIX: Import EvaluationResult type to use in the return type of evaluateAnswer.
import type { QuizQuestion, QuestionType, EvaluationResult } from '../types';

// Helper to convert File to a Gemini FilePart
const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const quizSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: "The quiz question text, in Arabic."
      },
      type: {
        type: Type.STRING,
        enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'OPEN_ENDED'],
        description: "The type of the question."
      },
      options: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: "An array of possible answers in Arabic. For MULTIPLE_CHOICE, 4 options. For TRUE_FALSE, it must be ['صحيح', 'خطأ']. For FILL_IN_THE_BLANK and OPEN_ENDED, this can be an empty array."
      },
      correctAnswer: {
        type: Type.STRING,
        description: "The correct answer in Arabic. For MULTIPLE_CHOICE or TRUE_FALSE, it must be one of the strings from the 'options' array. For OPEN_ENDED, it should be a comprehensive, ideal answer."
      },
    },
    required: ["question", "type", "options", "correctAnswer"],
  },
};

const evaluationSchema = {
    type: Type.OBJECT,
    properties: {
      isCorrect: {
        type: Type.BOOLEAN,
        description: "Whether the user's answer is correct or semantically equivalent to the correct answer."
      },
      feedback: {
        type: Type.STRING,
        description: "A brief explanation in Arabic of why the answer is correct or incorrect."
      }
    },
    required: ['isCorrect', 'feedback']
};

export const evaluateAnswer = async (
  question: string,
  correctAnswer: string,
  userAnswer: string
// FIX: The function's return type is updated to match the EvaluationResult interface, ensuring it includes `correctAnswer`.
): Promise<EvaluationResult> => {
  try {
    const prompt = `
      أنت مساعد ذكاء اصطناعي يقوم بتقييم إجابات اختبار. قيم إجابة المستخدم بدقة.
      السؤال: "${question}"
      الإجابة الصحيحة النموذجية: "${correctAnswer}"
      إجابة المستخدم: "${userAnswer}"
      
      هل إجابة المستخدم صحيحة أو قريبة بما يكفي من المعنى لتعتبر صحيحة؟
      قدم تقييمك بصيغة JSON.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
      },
    });

    const jsonText = response.text.trim();
    const evaluationResult = JSON.parse(jsonText);
    
    // FIX: Add `correctAnswer` to the returned object to conform to the EvaluationResult type.
    return { ...evaluationResult, correctAnswer };

  } catch (error) {
    console.error("Error evaluating answer:", error);
    // FIX: Add `correctAnswer` to the error response object to conform to the EvaluationResult type.
    return { isCorrect: false, feedback: "حدث خطأ أثناء تقييم الإجابة.", correctAnswer };
  }
};

const getQuestionTypeInstruction = (types: QuestionType[]): string => {
    const typeNames = {
        MULTIPLE_CHOICE: 'اختر الإجابة الصحيحة',
        TRUE_FALSE: 'صح أم خطأ',
        FILL_IN_THE_BLANK: 'أكمل الفراغ',
        OPEN_ENDED: 'فسر ودلل'
    };
    const selectedTypes = types.map(t => typeNames[t]).join(', ');
    return `يجب أن يتضمن الاختبار أنواع الأسئلة التالية: ${selectedTypes}.`;
}

export const generateQuizQuestions = async (
    files: File[],
    numQuestions: number,
    questionTypes: QuestionType[]
): Promise<QuizQuestion[]> => {
  try {
    const fileParts = await Promise.all(files.map(fileToGenerativePart));
    
    const questionTypeInstruction = getQuestionTypeInstruction(questionTypes);

    const prompt = `
      بناءً على المستندات المرفقة، قم بإنشاء اختبار من ${numQuestions} سؤالاً باللغة العربية.
      ${questionTypeInstruction}
      - لأسئلة 'اختر الإجابة الصحيحة'، قدم 4 خيارات.
      - لأسئلة 'صح أم خطأ'، يجب أن تكون الخيارات 'صحيح' و 'خطأ' فقط.
      - لأسئلة 'أكمل الفراغ'، قم بصياغة السؤال بحيث يحتوي على فراغ للإجابة، ويجب أن تكون الإجابة الصحيحة هي الكلمة أو العبارة المفقودة.
      - لأسئلة 'فسر ودلل'، قم بصياغة سؤال يتطلب شرحًا مفصلاً، وقدم إجابة صحيحة شاملة.
      - تأكد من أن قيمة 'correctAnswer' تطابق تمامًا أحد الخيارات المقدمة لأسئلة الاختيار من متعدد والصح والخطأ.
      - يجب أن يكون الاختبار بأكمله (الأسئلة، الخيارات، والإجابات) باللغة العربية الفصحى.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [...fileParts, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    const jsonText = response.text.trim();
    const quizData = JSON.parse(jsonText) as QuizQuestion[];

    if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error("لم يتمكن الذكاء الاصطناعي من إنشاء أسئلة.");
    }
    
    return quizData.slice(0, numQuestions);

  } catch (error) {
    console.error("Error generating quiz questions:", error);
    if (error instanceof SyntaxError) {
        throw new Error("فشل في تحليل بيانات الاختبار. التنسيق المستلم من الواجهة البرمجية غير صالح.");
    }
    throw new Error("لا يمكن إنشاء الاختبار. يرجى تجربة ملف مختلف أو المحاولة مرة أخرى لاحقًا.");
  }
};
