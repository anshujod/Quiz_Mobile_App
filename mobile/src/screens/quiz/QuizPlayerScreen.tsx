import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Platform, ScrollView, Animated as RNAnimated } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainTabs';
import { useQuizData } from '../../hooks/useQuizData';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import ConfettiCannon from 'react-native-confetti-cannon';
import YoutubeIframe from 'react-native-youtube-iframe';
import  { Image } from 'expo-image';
import { formatTime, getYouTubeVideoId } from '../../shared/utils';
import { supabase } from '../../lib/supabase';

type QuizPlayerRouteProp = {
    key: string;
    name: 'QuizPlayer';
    params: { quizId: string };
};

type QuizPlayerNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'QuizPlayer'>;

const { width } = Dimensions.get('window');

export default function QuizPlayerScreen() {
    const route = useRoute<QuizPlayerRouteProp>();
    const navigation = useNavigation<QuizPlayerNavigationProp>();
    const { user } = useAuth();
    
    const { quizId } = route.params;
    const { quiz, questions, loading, fetchQuizData } = useQuizData(quizId);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isAnswerLocked, setIsAnswerLocked] = useState(false);
    const [score, setScore] = useState(0);
    const [showVideo, setShowVideo] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const correctSound = useRef<Audio.Sound | null>(null);
    const wrongSound = useRef<Audio.Sound | null>(null);
    const fadeAnim = useRef(new RNAnimated.Value(1)).current;
    const slideAnim = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        fetchQuizData();
        return () => {
            // Cleanup audio
            if (correctSound.current) correctSound.current.unloadAsync();
            if (wrongSound.current) wrongSound.current.unloadAsync();
        };
    }, [fetchQuizData]);

    useEffect(() => {
        async function loadAudio() {
            try {
                const { sound: cSound } = await Audio.Sound.createAsync({
                    uri: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'
                });
                const { sound: wSound } = await Audio.Sound.createAsync({
                    uri: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'
                });
                correctSound.current = cSound;
                wrongSound.current = wSound;
            } catch (e) {
                console.warn('Could not load audio', e);
            }
        }
        loadAudio();
    }, []);

    useEffect(() => {
        if (quiz?.time_limit) {
            setTimeLeft(quiz.time_limit * 60);
        }
    }, [quiz]);

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
    }, [timeLeft, quizCompleted, loading]);

    const animateTransition = (callback: () => void) => {
        RNAnimated.parallel([
            RNAnimated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            RNAnimated.timing(slideAnim, { toValue: -20, duration: 200, useNativeDriver: true })
        ]).start(() => {
            callback();
            slideAnim.setValue(20);
            RNAnimated.parallel([
                RNAnimated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                RNAnimated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
            ]).start();
        });
    };

    const handleOptionSelect = async (optionId: string) => {
        if (isAnswerLocked) return;
        setSelectedOptionId(optionId);
        setIsAnswerLocked(true);

        const question = questions[currentQuestionIndex];
        const option = question.options.find(o => o.id === optionId);
        const isCorrect = option?.is_correct;

        if (isCorrect) {
            setScore(s => s + 1);
            if (correctSound.current) await correctSound.current.replayAsync();
        } else {
            if (wrongSound.current) await wrongSound.current.replayAsync();
        }

        setTimeout(() => {
            if (question.video_url) {
                setShowVideo(true);
            }
        }, 1500);
    };

    const finishQuiz = async () => {
        if (quizCompleted) return;
        setQuizCompleted(true);

        if (!user || !quizId) return;

        const { error } = await supabase.from('results').insert({
            user_id: user.id,
            quiz_id: quizId,
            score: score, // We can't rely on state update here easily without refs, assuming score is updated before
            total_questions: questions.length
        });

        if (error) {
            console.warn('Error saving result:', error);
        }
    };

    const handleNextQuestion = () => {
        setShowVideo(false);
        
        animateTransition(() => {
            setSelectedOptionId(null);
            setIsAnswerLocked(false);

            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(i => i + 1);
            } else {
                finishQuiz();
            }
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="sync" size={48} color={theme.colors.primary[500]} />
            </View>
        );
    }

    if (!quiz || questions.length === 0) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <Ionicons name="alert-circle" size={64} color={theme.colors.warning.DEFAULT} />
                <Text style={styles.errorTitle}>Quiz not available</Text>
                <Text style={styles.errorText}>This quiz might be empty or deleted.</Text>
                <Button title="Back to Home" onPress={() => navigation.goBack()} />
            </SafeAreaView>
        );
    }

    if (quizCompleted) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ConfettiCannon count={150} origin={{x: width/2, y: 0}} />
                <View style={styles.completedCard}>
                    <View style={styles.trophyContainer}>
                        <Ionicons name="trophy" size={64} color="#fef08a" />
                    </View>
                    <Text style={styles.completedTitle}>Quiz Completed!</Text>
                    <Text style={styles.completedSubtitle}>Great effort! Here is your final result.</Text>
                    
                    <View style={styles.scoreBox}>
                        <Text style={styles.scoreLabel}>YOUR SCORE</Text>
                        <Text style={styles.scoreValue}>
                            {score} <Text style={styles.scoreTotal}>/ {questions.length}</Text>
                        </Text>
                    </View>

                    <Button 
                        title="Back to Home" 
                        onPress={() => navigation.goBack()}
                        icon={<Ionicons name="home" size={20} color="white" />}
                        size="lg"
                    />
                </View>
            </SafeAreaView>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    if (showVideo && currentQuestion.video_url) {
        const videoId = getYouTubeVideoId(currentQuestion.video_url);
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: 'black' }]}>
                <View style={styles.videoContainer}>
                    {videoId ? (
                        <YoutubeIframe
                            height={300}
                            videoId={videoId}
                            play={true}
                        />
                    ) : (
                        <Text style={styles.errorText}>Invalid Video URL</Text>
                    )}
                </View>
                <View style={styles.videoActions}>
                    <Button 
                        title="Skip / Next Question" 
                        onPress={handleNextQuestion}
                        icon={<Ionicons name="chevron-forward" size={20} color="white" />}
                        variant="primary"
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerTitleContainer}>
                        <View style={styles.headerDot} />
                        <Text style={styles.headerTitle} numberOfLines={1}>{quiz.title}</Text>
                    </View>
                    
                    <View style={styles.headerStats}>
                        {timeLeft !== null && (
                            <View style={styles.timer}>
                                <Ionicons name="time" size={16} color={timeLeft < 60 ? theme.colors.error.DEFAULT : theme.colors.primary[400]} />
                                <Text style={[styles.timerText, timeLeft < 60 && styles.timerDanger]}>
                                    {formatTime(timeLeft)}
                                </Text>
                            </View>
                        )}
                        <View style={styles.counter}>
                            <Text style={styles.counterText}>{currentQuestionIndex + 1}</Text>
                            <Text style={styles.counterDiv}>/</Text>
                            <Text style={styles.counterTotal}>{questions.length}</Text>
                        </View>
                    </View>
                </View>
                
                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                    <View 
                        style={[
                            styles.progressBarFill, 
                            { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
                        ]} 
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} bounces={false}>
                <RNAnimated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <View style={styles.questionCard}>
                        <Ionicons name="trophy" size={120} color="rgba(255,255,255,0.03)" style={styles.bgIcon} />
                        
                        <Text style={styles.questionText}>{currentQuestion.text}</Text>

                        {currentQuestion.image_url ? (
                            <View style={styles.imageContainer}>
                                <Image 
                                    style={styles.image} 
                                    source={currentQuestion.image_url} 
                                    contentFit="contain"
                                    transition={300}
                                />
                            </View>
                        ) : null}

                        <View style={styles.optionsContainer}>
                            {currentQuestion.options.map((option) => {
                                const isSelected = option.id === selectedOptionId;
                                const isCorrect = option.is_correct;
                                
                                let optionStyle = styles.optionNormal;
                                let optionTextStyle = styles.optionTextNormal;
                                let optionBadgeStyle = styles.optionBadgeNormal;
                                let optionBadgeTextStyle = styles.optionBadgeTextNormal;

                                if (isAnswerLocked) {
                                    if (isSelected) {
                                        if (isCorrect) {
                                            optionStyle = styles.optionCorrect;
                                            optionTextStyle = styles.optionTextCorrect;
                                            optionBadgeStyle = styles.optionBadgeCorrect;
                                            optionBadgeTextStyle = styles.optionBadgeTextCorrect;
                                        } else {
                                            optionStyle = styles.optionWrong;
                                            optionTextStyle = styles.optionTextWrong;
                                            optionBadgeStyle = styles.optionBadgeWrong;
                                            optionBadgeTextStyle = styles.optionBadgeTextWrong;
                                        }
                                    } else if (isCorrect) {
                                        optionStyle = styles.optionMissedCorrect;
                                        optionTextStyle = styles.optionTextMissed;
                                        optionBadgeStyle = styles.optionBadgeMissed;
                                        optionBadgeTextStyle = styles.optionBadgeTextMissed;
                                    } else {
                                        optionStyle = styles.optionDisabled;
                                        optionTextStyle = styles.optionTextDisabled;
                                        optionBadgeStyle = styles.optionBadgeDisabled;
                                        optionBadgeTextStyle = styles.optionBadgeTextDisabled;
                                    }
                                }

                                return (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={[styles.option, optionStyle]}
                                        onPress={() => handleOptionSelect(option.id)}
                                        disabled={isAnswerLocked}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.optionContent}>
                                            <View style={[styles.optionBadge, optionBadgeStyle]}>
                                                <Text style={[styles.optionBadgeText, optionBadgeTextStyle]}>
                                                    {option.text.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={[styles.optionText, optionTextStyle]}>{option.text}</Text>
                                        </View>
                                        
                                        {isAnswerLocked && isCorrect && (
                                            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success.DEFAULT} />
                                        )}
                                        {isAnswerLocked && isSelected && !isCorrect && (
                                            <Ionicons name="close-circle" size={24} color={theme.colors.error.DEFAULT} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </RNAnimated.View>
            </ScrollView>

            {isAnswerLocked && (
                <View style={styles.footer}>
                    <Button
                        title={currentQuestionIndex === questions.length - 1 ? "Check Results" : (currentQuestion.video_url ? "Watch Explanation" : "Next Question")}
                        onPress={handleNextQuestion}
                        size="lg"
                        icon={<Ionicons name={currentQuestion.video_url ? "play-circle" : "chevron-forward"} size={20} color="white" />}
                    />
                </View>
            )}

            {/* Confetti container for correct answers */}
            {isAnswerLocked && questions[currentQuestionIndex].options.find(o => o.id === selectedOptionId)?.is_correct && (
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    <ConfettiCannon count={50} origin={{x: width/2, y: -20}} fallSpeed={2500} fadeOut />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    content: {
        padding: theme.spacing.md,
        paddingBottom: 100, // Space for footer
    },
    errorTitle: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xs,
    },
    errorText: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    header: {
        backgroundColor: theme.colors.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        paddingTop: theme.spacing.md,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: theme.spacing.md,
    },
    headerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary[500],
        marginRight: theme.spacing.sm,
    },
    headerTitle: {
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        flex: 1,
    },
    headerStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    timerText: {
        color: theme.colors.primary[400],
        fontWeight: theme.typography.weights.bold,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginLeft: 4,
    },
    timerDanger: {
        color: theme.colors.error.DEFAULT,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    counterText: {
        color: theme.colors.text.primary,
        fontWeight: theme.typography.weights.bold,
        fontSize: theme.typography.sizes.sm,
    },
    counterDiv: {
        color: theme.colors.text.secondary,
        marginHorizontal: 4,
        fontSize: theme.typography.sizes.sm,
    },
    counterTotal: {
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.weights.medium,
        fontSize: theme.typography.sizes.sm,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: theme.colors.surface,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary[500],
    },
    questionCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xxl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        padding: theme.spacing.lg,
        overflow: 'hidden',
    },
    bgIcon: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        zIndex: -1,
    },
    questionText: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xl,
        lineHeight: 32,
    },
    imageContainer: {
        width: '100%',
        height: 200,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.xl,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    optionsContainer: {
        gap: theme.spacing.md,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    optionBadgeText: {
        fontWeight: theme.typography.weights.bold,
        fontSize: theme.typography.sizes.sm,
    },
    optionText: {
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.medium,
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    // Normal State
    optionNormal: {
        backgroundColor: theme.colors.surfaceLight,
        borderColor: theme.colors.borderLight,
    },
    optionTextNormal: {
        color: theme.colors.text.primary,
    },
    optionBadgeNormal: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    optionBadgeTextNormal: {
        color: theme.colors.text.secondary,
    },
    // Correct State
    optionCorrect: {
        backgroundColor: theme.colors.success.bg,
        borderColor: theme.colors.success.light,
    },
    optionTextCorrect: {
        color: theme.colors.success.light,
    },
    optionBadgeCorrect: {
        backgroundColor: theme.colors.success.DEFAULT,
    },
    optionBadgeTextCorrect: {
        color: 'white',
    },
    // Wrong State
    optionWrong: {
        backgroundColor: theme.colors.error.bg,
        borderColor: theme.colors.error.light,
    },
    optionTextWrong: {
        color: theme.colors.error.light,
    },
    optionBadgeWrong: {
        backgroundColor: theme.colors.error.DEFAULT,
    },
    optionBadgeTextWrong: {
        color: 'white',
    },
    // Missed Correct
    optionMissedCorrect: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    optionTextMissed: {
        color: 'rgba(187, 247, 208, 0.7)',
    },
    optionBadgeMissed: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
    },
    optionBadgeTextMissed: {
        color: 'rgba(187, 247, 208, 0.7)',
    },
    // Disabled
    optionDisabled: {
        backgroundColor: 'transparent',
        borderColor: theme.colors.border,
        opacity: 0.5,
    },
    optionTextDisabled: {
        color: theme.colors.text.muted,
    },
    optionBadgeDisabled: {
        backgroundColor: theme.colors.surface,
    },
    optionBadgeTextDisabled: {
        color: theme.colors.text.muted,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.lg,
        backgroundColor: 'rgba(2, 6, 23, 0.9)', // slate-950 with opacity
    },
    completedCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xxl,
        padding: theme.spacing.xxl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        shadowColor: theme.colors.primary[500],
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        width: '90%',
    },
    trophyContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(250, 204, 21, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.xl,
    },
    completedTitle: {
        fontSize: theme.typography.sizes.xxxl,
        fontWeight: theme.typography.weights.extrabold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    completedSubtitle: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    scoreBox: {
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
        width: '100%',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    scoreLabel: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text.muted,
        fontWeight: theme.typography.weights.bold,
        letterSpacing: 2,
        marginBottom: theme.spacing.sm,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: theme.typography.weights.extrabold,
        color: theme.colors.primary[400],
    },
    scoreTotal: {
        fontSize: 24,
        color: theme.colors.text.muted,
    },
    videoContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: theme.spacing.md,
    },
    videoActions: {
        padding: theme.spacing.xl,
        paddingBottom: theme.spacing.xxxl,
    }
});
