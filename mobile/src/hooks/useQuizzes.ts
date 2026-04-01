import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Quiz } from '../shared/types';

export function useQuizzes() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('quizzes')
                .select('*')
                .eq('is_published', true);

            if (error) throw error;
            setQuizzes(data || []);
            setError(null);
        } catch (err: any) {
            console.warn('Error fetching quizzes:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    return { quizzes, loading, error, refetch: fetchQuizzes };
}
