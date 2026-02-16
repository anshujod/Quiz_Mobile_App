import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Calendar, Trophy, Target, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Result {
    id: string;
    quiz_id: string;
    score: number;
    total_questions: number;
    created_at: string;
    quizzes: { title: string } | { title: string }[] | null;
}

const getQuizTitle = (quiz: Result['quizzes']) => {
    if (!quiz) return 'Unknown Quiz';
    if (Array.isArray(quiz)) return quiz[0]?.title ?? 'Unknown Quiz';
    return quiz.title ?? 'Unknown Quiz';
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function UserHistory() {
    const { user } = useAuth();
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('results')
                .select(`
                    id,
                    quiz_id,
                    score,
                    total_questions,
                    created_at,
                    quizzes (title)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching history:', error);
            } else {
                setResults((data ?? []) as Result[]);
            }
            setLoading(false);
        };

        fetchHistory();
    }, [user]);

    if (loading) return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                    <Trophy className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">My Results</h1>
                    <p className="text-slate-400 text-sm mt-1">Track your performance and progress</p>
                </div>
            </div>

            {results.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                    <Target className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">You haven't taken any quizzes yet.</p>
                    <p className="text-slate-500 text-sm">Jump into a quiz to start building your history!</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {results.map((result, index) => {
                        const percentage = Math.round((result.score / result.total_questions) * 100);
                        let gradeColor = "text-slate-400";
                        let gradeIcon = <Target className="h-5 w-5" />;

                        if (percentage >= 80) {
                            gradeColor = "text-green-400";
                            gradeIcon = <Star className="h-5 w-5" />;
                        } else if (percentage >= 50) {
                            gradeColor = "text-yellow-400";
                        } else {
                            gradeColor = "text-red-400";
                        }

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={result.id}
                                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                                        {getQuizTitle(result.quizzes)}
                                    </h3>
                                    <div className="flex items-center text-sm text-slate-400 space-x-4">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1.5 opacity-70" />
                                            {formatDate(result.created_at)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 sm:gap-12 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                    <div className="flex flex-col items-center min-w-[80px]">
                                        <div className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-semibold text-[10px]">Score</div>
                                        <div className="text-2xl font-bold text-white">
                                            {result.score} <span className="text-base text-slate-500 font-medium">/ {result.total_questions}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center min-w-[80px]">
                                        <div className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-semibold text-[10px]">Grade</div>
                                        <div className={`text-2xl font-bold flex items-center ${gradeColor}`}>
                                            {percentage}%
                                            <div className={`ml-2 p-1 rounded-full bg-white/5 ${gradeColor}`}>
                                                {gradeIcon}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
