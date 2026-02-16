import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Play, Sparkles, Zap, Brain, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Quiz {
    id: string;
    title: string;
    description: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function Home() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const { data, error } = await supabase
                .from('quizzes')
                .select('*')
                .eq('is_published', true);

            if (error) throw error;
            setQuizzes(data || []);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-12 pb-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 shadow-2xl">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[400px] h-[400px] bg-indigo-500/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[300px] h-[300px] bg-purple-500/30 rounded-full blur-[80px]" />

                <div className="relative px-8 py-16 sm:px-12 sm:py-24 text-center sm:text-left">
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300 font-medium text-sm mb-6"
                        >
                            <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
                            Interactive Learning Reimagined
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight"
                        >
                            Level up with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                Cosmic Quizzes
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed"
                        >
                            Challenge yourself, track your progress, and climb the global leaderboard in a stunning new universe of knowledge.
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* Quiz Grid */}
            <div>
                <div className="flex items-center mb-8">
                    <div className="p-3 bg-indigo-500/20 rounded-xl mr-4 border border-indigo-500/30">
                        <Brain className="h-6 w-6 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Featured Quizzes</h2>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    {quizzes.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                            <Zap className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg">No active quizzes found.</p>
                        </div>
                    ) : (
                        quizzes.map((quiz) => (
                            <motion.div
                                key={quiz.id}
                                variants={itemVariants}
                                whileHover={{ y: -8 }}
                                className="group relative flex flex-col bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300"
                            >
                                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 group-hover:opacity-100 transition-opacity" />

                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                                        {quiz.title}
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-8 flex-1 leading-relaxed">
                                        {quiz.description || "No description provided."}
                                    </p>

                                    <div className="mt-auto">
                                        <Link
                                            to={`/quiz/${quiz.id}`}
                                            className="w-full inline-flex items-center justify-between px-6 py-4 rounded-xl text-sm font-bold text-white bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-500 transition-all group-hover:translate-x-1"
                                        >
                                            <span className="flex items-center">
                                                <Play className="h-4 w-4 mr-2 fill-current" />
                                                Start Quiz
                                            </span>
                                            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            </div>
        </div>
    );
}
