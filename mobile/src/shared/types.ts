export interface UserProfile {
    id: string;
    username: string;
    role: 'admin' | 'user';
    created_at: string;
}

export interface Option {
    id: string;
    text: string;
    is_correct: boolean;
}

export interface Question {
    id: string;
    text: string;
    image_url: string;
    video_url: string;
    options: Option[];
}

export interface Quiz {
    id: string;
    title: string;
    time_limit: number | null; // in minutes
}

export interface Result {
    id: string;
    quiz_id: string;
    score: number;
    total_questions: number;
    created_at: string;
    quizzes: { title: string } | { title: string }[] | null;
}

export interface LeaderboardEntry {
    user_id: string;
    total_score: number;
    quizzes_taken: number;
    username: string;
}

export interface LeaderboardResultRow {
    user_id: string;
    score: number;
    profiles: { username: string } | { username: string }[] | null;
}
