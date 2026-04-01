import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Result } from '../shared/types';

export function useHistory(userId: string | undefined) {
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
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
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setResults((data ?? []) as Result[]);
        } catch (error) {
            console.warn('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [userId]);

    return { results, loading, refetch: fetchHistory };
}
