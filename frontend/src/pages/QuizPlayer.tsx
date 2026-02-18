import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Check, X, Trophy, Home, Clock, ChevronRight, PlayCircle, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

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
}

interface Quiz {
    id: string;
    title: string;
    time_limit: number | null; // in minutes
}

const STORAGE_BUCKET = 'question-images-v2';

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

export default function QuizPlayer() {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isAnswerLocked, setIsAnswerLocked] = useState(false);
    const [score, setScore] = useState(0);
    const [showVideo, setShowVideo] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [shakeKey, setShakeKey] = useState(0);

    const correctSound = useRef<HTMLAudioElement | null>(null);
    const wrongSound = useRef<HTMLAudioElement | null>(null);

    const fetchQuizData = useCallback(async () => {
        if (!quizId) return;
        try {
            const { data: qData, error: qError } = await supabase
                .from('quizzes')
                .select('id, title, time_limit')
                .eq('id', quizId)
                .single();
            if (qError) throw qError;
            setQuiz(qData);

            if (qData.time_limit) {
                setTimeLeft(qData.time_limit * 60);
            }

            const { data: questionsData, error: questionsError } = await supabase
                .from('questions')
                .select(`
          id, text, image_url, video_url,
          options (id, text, is_correct)
        `)
                .eq('quiz_id', quizId)
                .order('order', { ascending: true });

            if (questionsError) throw questionsError;

            const normalizedQuestions = (questionsData ?? []).map((question) => {
                const resolvedUrl = getImageUrl(question.image_url || '');
                return {
                    ...question,
                    video_url: question.video_url || '',
                    image_url: resolvedUrl
                };
            });
            setQuestions(normalizedQuestions);
        } catch (error) {
            console.error('Error loading quiz:', error);
        } finally {
            setLoading(false);
        }
    }, [quizId]);

    useEffect(() => {
        correctSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
        wrongSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
        void fetchQuizData();
    }, [fetchQuizData]);

    const handleOptionSelect = (optionId: string) => {
        if (isAnswerLocked) return;
        setSelectedOptionId(optionId);
        setIsAnswerLocked(true);

        const question = questions[currentQuestionIndex];
        const option = question.options.find(o => o.id === optionId);
        const isCorrect = option?.is_correct;

        if (isCorrect) {
            setScore(s => s + 1);
            if (correctSound.current) {
                correctSound.current.currentTime = 0;
                correctSound.current.play().catch(() => { });
            }
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#a855f7', '#ec4899']
            });
        } else {
            setShakeKey(prev => prev + 1);
            if (wrongSound.current) {
                wrongSound.current.currentTime = 0;
                wrongSound.current.play().catch(() => { });
            }
        }

        setTimeout(() => {
            if (question.video_url) {
                setShowVideo(true);
            }
        }, 1500);
    };

    const finishQuiz = useCallback(async () => {
        if (quizCompleted) return;
        setQuizCompleted(true);

        if (!user || !quizId) return;

        const finalScore = score;
        const { error } = await supabase.from('results').insert({
            user_id: user.id,
            quiz_id: quizId,
            score: finalScore,
            total_questions: questions.length
        });

        if (error) {
            console.error('Error saving result:', error);
            alert(`Failed to save results: ${error.message}`);
        }
    }, [quizCompleted, user, quizId, score, questions.length]);

    const handleNextQuestion = () => {
        setShowVideo(false);
        setSelectedOptionId(null);
        setIsAnswerLocked(false);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            finishQuiz();
        }
    };

    useEffect(() => {
        if (!timeLeft || quizCompleted || loading) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    finishQuiz();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, quizCompleted, loading, finishQuiz]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const currentQuestion = questions[currentQuestionIndex];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="h-16 w-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
        </div>
    );

    if (!quiz || questions.length === 0) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Quiz not available</h2>
            <p className="text-slate-400 mb-8">This quiz might be empty or deleted.</p>
            <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium border border-white/10"
            >
                Back to Home
            </button>
        </div>
    );

    if (quizCompleted) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950" />

                <div className="relative w-full max-w-lg">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: 360 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="mx-auto h-28 w-28 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-amber-500/20"
                        >
                            <Trophy className="h-14 w-14 text-white" />
                        </motion.div>

                        <h2 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h2>
                        <p className="text-slate-400 mb-8">Great effort! Here is your final result.</p>

                        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
                            <span className="block text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Your Score</span>
                            <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                {score} <span className="text-2xl text-slate-500 font-bold">/ {questions.length}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/')}
                            className="w-full flex items-center justify-center px-6 py-4 rounded-xl text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/25 border border-transparent hover:border-indigo-400"
                        >
                            <Home className="h-5 w-5 mr-2" />
                            Back to Home
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    const getYouTubeVideoId = (url: string): string | null => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const getEmbedUrl = (url: string) => {
        const id = getYouTubeVideoId(url);
        return id ? `https://www.youtube.com/embed/${id}` : null;
    };

    const getYouTubeThumbnail = (url: string): string | null => {
        const id = getYouTubeVideoId(url);
        return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    };

    if (showVideo && currentQuestion.video_url) {
        const embedUrl = getEmbedUrl(currentQuestion.video_url);
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-8"
                >
                    <div className="aspect-video">
                        {embedUrl ? (
                            <iframe
                                src={embedUrl}
                                title="Concept Explanation"
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <AlertCircle className="w-8 h-8 mr-2" /> Invalid Video URL
                            </div>
                        )}
                    </div>
                </motion.div>
                <button
                    onClick={handleNextQuestion}
                    className="px-8 py-3 bg-white text-slate-900 font-bold rounded-full hover:bg-indigo-50 transition-colors flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 duration-200"
                >
                    Skip / Next Question
                    <ChevronRight className="ml-2 h-5 w-5" />
                </button>
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="relative bg-slate-900/50 backdrop-blur-md border-b border-white/5 z-10">
                <div className="max-w-4xl mx-auto flex justify-between items-center py-4 px-6">
                    <h1 className="text-lg font-bold text-slate-200 truncate max-w-xs sm:max-w-md flex items-center">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 mr-3 animate-pulse"></span>
                        {quiz.title}
                    </h1>
                    <div className="flex items-center space-x-6">
                        {timeLeft !== null && (
                            <div className={`flex items-center font-mono text-lg font-bold ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-indigo-400'}`}>
                                <Clock className="w-4 h-4 mr-2" />
                                {formatTime(timeLeft)}
                            </div>
                        )}
                        <div className="text-sm font-semibold text-slate-400 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                            {currentQuestionIndex + 1} <span className="text-slate-600 mx-1">/</span> {questions.length}
                        </div>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="h-1 bg-slate-800 w-full relative overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_10px_2px_rgba(168,85,247,0.4)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full max-w-3xl mx-auto p-4 pt-12 pb-12 flex flex-col justify-center relative z-10 transition-all">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestionIndex}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full"
                    >
                        <motion.div
                            key={shakeKey}
                            animate={shakeKey > 0 ? { x: [-10, 10, -10, 10, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-8 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Trophy className="w-48 h-48 text-white" />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-tight relative z-10">
                                {currentQuestion.text}
                            </h2>

                            {(() => {
                                const displayImageUrl = currentQuestion.video_url
                                    ? getYouTubeThumbnail(currentQuestion.video_url)
                                    : currentQuestion.image_url;
                                return displayImageUrl ? (
                                    <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative z-10 group">
                                        <img
                                            src={displayImageUrl}
                                            alt={`Question ${currentQuestionIndex + 1}`}
                                            className="w-full h-auto object-contain max-h-[400px] hover:scale-[1.02] transition-transform duration-500"
                                            onError={(e) => {
                                                console.error('Failed to load image:', displayImageUrl);
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                ) : null;
                            })()}

                            <div className="space-y-4 relative z-10">
                                {currentQuestion.options.map((option) => {
                                    let buttonClass = "w-full text-left p-5 rounded-2xl border transition-all duration-200 font-medium text-lg flex justify-between items-center group relative overflow-hidden ";

                                    if (isAnswerLocked) {
                                        if (option.id === selectedOptionId) {
                                            if (option.is_correct) {
                                                buttonClass += "bg-green-500/20 border-green-500/50 text-green-200 shadow-[0_0_20px_rgba(34,197,94,0.2)]";
                                            } else {
                                                buttonClass += "bg-red-500/20 border-red-500/50 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.2)]";
                                            }
                                        } else if (option.is_correct) {
                                            buttonClass += "bg-green-500/10 border-green-500/30 text-green-200/70";
                                        } else {
                                            buttonClass += "border-white/5 text-slate-500 opacity-50";
                                        }
                                    } else {
                                        buttonClass += "bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-400/50 text-slate-200 hover:text-white hover:shadow-lg hover:shadow-indigo-500/10";
                                    }

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleOptionSelect(option.id)}
                                            disabled={isAnswerLocked}
                                            className={buttonClass}
                                        >
                                            <span className="relative z-10 flex items-center">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 text-sm font-bold transition-colors ${isAnswerLocked && option.id === selectedOptionId
                                                    ? (option.is_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white')
                                                    : 'bg-white/10 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white'
                                                    }`}>
                                                    {option.text.charAt(0).toUpperCase()}
                                                </span>
                                                {option.text}
                                            </span>

                                            {isAnswerLocked && option.is_correct && <Check className="h-6 w-6 text-green-400" />}
                                            {isAnswerLocked && option.id === selectedOptionId && !option.is_correct && <X className="h-6 w-6 text-red-400" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>

                {/* Bottom Action Area */}
                <div className="h-20 flex items-center justify-center">
                    <AnimatePresence>
                        {isAnswerLocked && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <button
                                    onClick={handleNextQuestion}
                                    className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-1 flex items-center group ring-1 ring-white/10"
                                >
                                    {currentQuestionIndex === questions.length - 1 ? "Check Results" : (currentQuestion.video_url ? "Watch Explanation" : "Next Question")}

                                    {currentQuestion.video_url ? <PlayCircle className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" /> : <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
