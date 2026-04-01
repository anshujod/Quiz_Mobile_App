import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LeaderboardEntry, LeaderboardResultRow } from '../shared/types';
import { getProfileUsername } from '../shared/utils';

export function useLeaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('results')
                .select(`
                    id,
                    score,
                    user_id,
                    profiles (username)
                `);

            if (error) throw error;

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
        } catch (error) {
            console.warn('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    return { entries, loading, refetch: fetchLeaderboard };
}
