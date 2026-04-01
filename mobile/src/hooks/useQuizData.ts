import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Quiz, Question } from '../shared/types';
import { getImageUrl } from '../shared/utils';

export function useQuizData(quizId: string | undefined) {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchQuizData = useCallback(async () => {
        if (!quizId) return;
        setLoading(true);
        try {
            const { data: qData, error: qError } = await supabase
                .from('quizzes')
                .select('id, title, time_limit')
                .eq('id', quizId)
                .single();
            
            if (qError) throw qError;
            setQuiz(qData);

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
            console.warn('Error loading quiz:', error);
        } finally {
            setLoading(false);
        }
    }, [quizId]);

    return { quiz, questions, loading, fetchQuizData };
}
