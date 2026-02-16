import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Crown, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
    user_id: string;
    total_score: number;
    quizzes_taken: number;
    username: string;
}

interface LeaderboardResultRow {
    user_id: string;
    score: number;
    profiles: { username: string } | { username: string }[] | null;
}

const getProfileUsername = (profile: LeaderboardResultRow['profiles']) => {
    if (!profile) return 'Unknown';
    if (Array.isArray(profile)) return profile[0]?.username ?? 'Unknown';
    return profile.username ?? 'Unknown';
};

export default function Leaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const { data, error } = await supabase
                .from('results')
                .select(`
                    id,
                    score,
                    user_id,
                    profiles (username)
                `);

            if (error) {
                console.error('Error fetching leaderboard:', error);
                setLoading(false);
                return;
            }

            const userStats: Record<string, LeaderboardEntry> = {};
            const rows = (data ?? []) as LeaderboardResultRow[];

            rows.forEach((r) => {
                const uid = r.user_id;
                const username = getProfileUsername(r.profiles);

                if (!userStats[uid]) {
                    userStats[uid] = {
                        user_id: uid,
                        username: username,
                        total_score: 0,
                        quizzes_taken: 0
                    };
                }
                userStats[uid].total_score += r.score;
                userStats[uid].quizzes_taken += 1;
            });

            const sorted = Object.values(userStats).sort((a, b) => b.total_score - a.total_score);
            setEntries(sorted);
            setLoading(false);
        };

        fetchLeaderboard();
    }, []);

    if (loading) return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    const topThree = entries.slice(0, 3);
    const rest = entries.slice(3);

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-12">
            <div className="text-center">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/20 text-yellow-400 mb-6 shadow-lg shadow-yellow-500/10 border border-yellow-500/20"
                >
                    <Trophy className="h-10 w-10" />
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                    Hall of Fame
                </h1>
                <p className="max-w-2xl mx-auto text-lg text-slate-400">
                    Celebrating the top performers in our community. Will you be next?
                </p>
            </div>

            {/* Podium Section */}
            {topThree.length > 0 && (
                <div className="flex justify-center items-end gap-4 sm:gap-8 min-h-[350px] px-4 mb-12">
                    {/* 2nd Place */}
                    {topThree[1] && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center w-1/3 max-w-[180px]"
                        >
                            <div className="mb-4 text-center w-full">
                                <div className="font-bold text-slate-200 truncate w-full mb-1 text-lg px-2">{topThree[1].username}</div>
                                <div className="inline-block text-sm font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                                    {topThree[1].total_score} pts
                                </div>
                            </div>
                            <div className="w-full bg-gradient-to-t from-slate-700 to-slate-600/50 backdrop-blur-sm rounded-t-2xl h-40 flex items-end justify-center pb-6 shadow-xl border-x border-t border-white/10 relative">
                                <span className="text-5xl font-bold text-white/50">2</span>
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                    <div className="h-12 w-12 rounded-full border-4 border-slate-700 bg-slate-800 flex items-center justify-center shadow-lg">
                                        <Medal className="h-6 w-6 text-slate-300" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 1st Place */}
                    {topThree[0] && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col items-center w-1/3 max-w-[200px] z-10"
                        >
                            <div className="mb-4 text-center w-full">
                                <Crown className="h-10 w-10 text-yellow-400 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce" />
                                <div className="font-bold text-xl text-white truncate w-full mb-1 px-2">{topThree[0].username}</div>
                                <div className="inline-block text-sm font-mono text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded border border-yellow-500/20">
                                    {topThree[0].total_score} pts
                                </div>
                            </div>
                            <div className="w-full bg-gradient-to-t from-yellow-600/20 to-yellow-500/10 backdrop-blur-md rounded-t-3xl h-52 flex items-end justify-center pb-6 shadow-[0_0_50px_-12px_rgba(234,179,8,0.3)] border-x border-t border-yellow-500/30 relative">
                                <span className="text-6xl font-bold text-yellow-500/50">1</span>
                            </div>
                        </motion.div>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col items-center w-1/3 max-w-[180px]"
                        >
                            <div className="mb-4 text-center w-full">
                                <div className="font-bold text-slate-200 truncate w-full mb-1 text-lg px-2">{topThree[2].username}</div>
                                <div className="inline-block text-sm font-mono text-amber-600 bg-amber-600/10 px-2 py-1 rounded border border-amber-600/20">
                                    {topThree[2].total_score} pts
                                </div>
                            </div>
                            <div className="w-full bg-gradient-to-t from-amber-800/40 to-amber-700/20 backdrop-blur-sm rounded-t-2xl h-32 flex items-end justify-center pb-6 shadow-xl border-x border-t border-white/10 relative">
                                <span className="text-5xl font-bold text-amber-600/50">3</span>
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                    <div className="h-12 w-12 rounded-full border-4 border-amber-800/40 bg-slate-800 flex items-center justify-center shadow-lg">
                                        <Medal className="h-6 w-6 text-amber-600" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* List for the Rest */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/10">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5">
                            <tr>
                                <th scope="col" className="px-6 py-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Rank</th>
                                <th scope="col" className="px-6 py-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Player</th>
                                <th scope="col" className="px-6 py-5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Quizzes</th>
                                <th scope="col" className="px-6 py-5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rest.length > 0 ? (
                                rest.map((entry, index) => {
                                    const rank = index + 4;
                                    return (
                                        <motion.tr
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                            key={entry.user_id}
                                            className="hover:bg-white/5 transition-colors group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold text-sm border border-slate-700 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                                                        {rank}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500/50 flex items-center justify-center text-white font-bold text-sm mr-4 shadow-lg ring-2 ring-transparent group-hover:ring-indigo-500/50 transition-all">
                                                        {entry.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                                                        {entry.username}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                                                {entry.quizzes_taken}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-sm font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40 transition-all">
                                                    {entry.total_score} pts
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            ) : (
                                entries.length <= 3 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            {entries.length === 0 ? "No results yet. Be the first to play!" : "Join the games to climb the leaderboard!"}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
