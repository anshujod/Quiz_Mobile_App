import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Save, Image as ImageIcon, Video, ArrowLeft, Check, UploadCloud, X } from 'lucide-react';
import { motion } from 'framer-motion';

const STORAGE_BUCKET = 'question-images-v2';

interface Option {
    id: string;
    text: string;
    is_correct: boolean;
}

interface Question {
    id: string;
    text: string;
    image_url: string;
    video_url: string;
    options: Option[];
    order: number;
}

export default function CreateQuiz() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [quizTitle, setQuizTitle] = useState('');
    const [quizDescription, setQuizDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState<string>('');
    const [questions, setQuestions] = useState<Question[]>([
        {
            id: crypto.randomUUID(),
            text: '',
            image_url: '',
            video_url: '',
            options: [
                { id: crypto.randomUUID(), text: '', is_correct: false },
                { id: crypto.randomUUID(), text: '', is_correct: false },
            ],
            order: 0
        }
    ]);

    const imageInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: crypto.randomUUID(),
                text: '',
                image_url: '',
                video_url: '',
                options: [
                    { id: crypto.randomUUID(), text: '', is_correct: false },
                    { id: crypto.randomUUID(), text: '', is_correct: false },
                ],
                order: questions.length
            }
        ]);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const updateQuestion = (id: string, field: keyof Question, value: Question[keyof Question]) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
        );
    };

    const addOption = (questionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: [...q.options, { id: crypto.randomUUID(), text: '', is_correct: false }]
                };
            }
            return q;
        }));
    };

    const updateOption = (questionId: string, optionId: string, field: keyof Option, value: boolean | string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options.map(o => {
                        if (o.id === optionId) {
                            return { ...o, [field]: value };
                        }
                        return o;
                    })
                };
            }
            return q;
        }));
    };

    const removeOption = (questionId: string, optionIndex: number) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options.filter((_, i) => i !== optionIndex)
                };
            }
            return q;
        }));
    };

    const uploadQuestionImage = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            alert(`Error uploading image: ${uploadError.message}`);
            return null;
        }

        return filePath;
    };

    const handleImageChange = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const uploadedPath = await uploadQuestionImage(file);

        if (uploadedPath) {
            updateQuestion(questionId, 'image_url', uploadedPath);
        }
    };

    const getImageUrl = (rawImageUrl: string): string => {
        if (!rawImageUrl) return '';
        const value = rawImageUrl.trim();
        if (!value) return '';
        if (/^(data:|blob:)/i.test(value)) return value;
        if (/^https?:\/\//i.test(value)) return value;

        let storagePath = value.replace(/^\/+/, '').trim();
        if (storagePath.startsWith(`${STORAGE_BUCKET}/`)) {
            storagePath = storagePath.slice(STORAGE_BUCKET.length + 1);
        }
        if (storagePath.startsWith(`public/${STORAGE_BUCKET}/`)) {
            storagePath = storagePath.slice(`public/${STORAGE_BUCKET}/`.length);
        }

        const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(storagePath);

        return data?.publicUrl || value;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: quizData, error: quizError } = await supabase
                .from('quizzes')
                .insert({
                    title: quizTitle,
                    description: quizDescription,
                    created_by: user?.id,
                    time_limit: timeLimit ? parseInt(timeLimit) : null,
                    is_published: true
                })
                .select()
                .single();

            if (quizError) throw quizError;

            const questionsToInsert = questions.map((q, index) => ({
                quiz_id: quizData.id,
                text: q.text,
                image_url: q.image_url,
                video_url: q.video_url,
                order: index
            }));

            const { data: insertedQuestions, error: questionsError } = await supabase
                .from('questions')
                .insert(questionsToInsert)
                .select();

            if (questionsError) throw questionsError;

            // Insert options
            const optionsToInsert = [];
            for (let i = 0; i < questions.length; i++) {
                const questionId = insertedQuestions[i].id;
                const questionOptions = questions[i].options.map(o => ({
                    question_id: questionId,
                    text: o.text,
                    is_correct: o.is_correct
                }));
                optionsToInsert.push(...questionOptions);
            }

            const { error: optionsError } = await supabase
                .from('options')
                .insert(optionsToInsert);

            if (optionsError) throw optionsError;

            navigate('/admin');
        } catch (error: unknown) {
            console.error('Error creating quiz:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            alert(`Error creating quiz: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-24">
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Dashboard
                </button>
            </div>

            <div className="space-y-8">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl">
                    <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                        <Plus className="h-8 w-8 mr-3 text-indigo-400" />
                        Create New Quiz
                    </h1>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Quiz Title</label>
                            <input
                                type="text"
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Enter an engaging title..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                            <textarea
                                value={quizDescription}
                                onChange={(e) => setQuizDescription(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all h-24 resize-none"
                                placeholder="What is this quiz about?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Time Limit (minutes)</label>
                            <input
                                type="number"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(e.target.value)}
                                className="w-full max-w-xs bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Optional (e.g., 10)"
                                min="1"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {questions.map((question, qIndex) => (
                        <motion.div
                            key={question.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl relative group"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => removeQuestion(qIndex)}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Remove Question"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                                        Question {qIndex + 1}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    value={question.text}
                                    onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                    className="w-full bg-transparent border-b border-white/10 text-xl font-medium text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none py-2 transition-colors"
                                    placeholder="Enter your question here..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center">
                                        <ImageIcon className="h-4 w-4 mr-2" /> Question Image
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => imageInputRefs.current[question.id]?.click()}
                                            className="px-4 py-2 bg-slate-800 border border-white/10 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors flex items-center"
                                        >
                                            <UploadCloud className="h-4 w-4 mr-2" />
                                            {question.image_url ? 'Change Image' : 'Upload Image'}
                                        </button>
                                        <input
                                            type="file"
                                            ref={(el) => { imageInputRefs.current[question.id] = el; }}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(question.id, e)}
                                        />
                                        {question.image_url && (
                                            <button
                                                onClick={() => updateQuestion(question.id, 'image_url', '')}
                                                className="text-red-400 text-xs hover:underline"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    {question.image_url && (
                                        <div className="mt-3 relative rounded-lg overflow-hidden border border-white/10 w-full h-40 bg-black/40">
                                            <img
                                                src={getImageUrl(question.image_url)}
                                                alt="Question Preview"
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Video URL */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center">
                                        <Video className="h-4 w-4 mr-2" /> Explanation Video URL (YouTube)
                                    </label>
                                    <input
                                        type="url"
                                        value={question.video_url}
                                        onChange={(e) => updateQuestion(question.id, 'video_url', e.target.value)}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="https://youtube.com/..."
                                    />
                                </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-400 mb-2">Answer Options</label>
                                {question.options.map((option, oIndex) => (
                                    <div key={option.id} className="flex items-center gap-3 group/option">
                                        <div
                                            onClick={() => updateOption(question.id, option.id, 'is_correct', !option.is_correct)}
                                            className={`
                                                w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all
                                                ${option.is_correct
                                                    ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                                                    : 'border-slate-600 hover:border-slate-400'}
                                            `}
                                        >
                                            {option.is_correct && <Check className="h-3.5 w-3.5 text-white" />}
                                        </div>

                                        <input
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => updateOption(question.id, option.id, 'text', e.target.value)}
                                            className={`flex-1 bg-slate-900/30 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${option.is_correct ? 'border-green-500/30 bg-green-500/5' : ''}`}
                                            placeholder={`Option ${oIndex + 1}`}
                                        />

                                        <button
                                            onClick={() => removeOption(question.id, oIndex)}
                                            className="text-slate-600 hover:text-red-400 p-2 opacity-0 group-hover/option:opacity-100 transition-opacity"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => addOption(question.id)}
                                    className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center py-2"
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Add Option
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-4 pt-8">
                    <button
                        onClick={addQuestion}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors flex items-center w-full justify-center md:w-auto"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Question
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-xl hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                    >
                        {loading ? (
                            <>
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                                Saving Quiz...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
                                Create Quiz
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
