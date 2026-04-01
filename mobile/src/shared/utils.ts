import { supabase } from '../lib/supabase';
import { STORAGE_BUCKET } from './constants';
import { LeaderboardResultRow, Result } from './types';

export const getImageUrl = (rawImageUrl: string): string => {
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

export const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const getEmbedUrl = (url: string) => {
    const id = getYouTubeVideoId(url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
};

export const getYouTubeThumbnail = (url: string): string | null => {
    const id = getYouTubeVideoId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

export const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getProfileUsername = (profile: LeaderboardResultRow['profiles']) => {
    if (!profile) return 'Unknown';
    if (Array.isArray(profile)) return profile[0]?.username ?? 'Unknown';
    return profile.username ?? 'Unknown';
};

export const getQuizTitle = (quiz: Result['quizzes']) => {
    if (!quiz) return 'Unknown Quiz';
    if (Array.isArray(quiz)) return quiz[0]?.title ?? 'Unknown Quiz';
    return quiz.title ?? 'Unknown Quiz';
};
