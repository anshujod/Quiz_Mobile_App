import React, { useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainTabs';
import { useQuizzes } from '../../hooks/useQuizzes';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

export default function HomeScreen() {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { quizzes, loading, refetch } = useQuizzes();

    // Re-fetch quizzes every time the Home tab comes into focus
    // This ensures newly created quizzes appear immediately
    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [])
    );

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <LinearGradient
                colors={['rgba(79, 70, 229, 0.5)', 'rgba(147, 51, 234, 0.5)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroBanner}
            >
                <View style={styles.heroContent}>
                    <View style={styles.badge}>
                        <Ionicons name="sparkles" size={14} color="#fde047" style={styles.badgeIcon} />
                        <Text style={styles.badgeText}>Interactive Learning Reimagined</Text>
                    </View>
                    <Text style={styles.heroTitle}>Level up with{'\n'}Cosmic Quizzes</Text>
                    <Text style={styles.heroSubtitle}>
                        Challenge yourself, track your progress, and climb the global leaderboard in a stunning new universe of knowledge.
                    </Text>
                </View>
            </LinearGradient>

            <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                    <Ionicons name="bulb" size={24} color={theme.colors.primary[400]} />
                </View>
                <Text style={styles.sectionTitle}>Featured Quizzes</Text>
            </View>
        </View>
    );

    const renderQuizCard = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('QuizPlayer', { quizId: item.id })}
        >
            <View style={styles.cardIndicator} />
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description || "No description provided."}
                </Text>
                <View style={styles.cardFooter}>
                    <View style={styles.playButton}>
                        <Ionicons name="play" size={16} color={theme.colors.text.primary} />
                        <Text style={styles.playButtonText}>Start Quiz</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.text.secondary} />
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="flash-off" size={48} color={theme.colors.text.muted} />
                <Text style={styles.emptyText}>No active quizzes found.</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={quizzes}
                keyExtractor={(item) => item.id}
                renderItem={renderQuizCard}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl 
                        refreshing={loading} 
                        onRefresh={refetch}
                        tintColor={theme.colors.primary[500]} 
                    />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    listContent: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xxxl,
    },
    headerContainer: {
        marginBottom: theme.spacing.lg,
    },
    heroBanner: {
        borderRadius: theme.borderRadius.xxl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginBottom: theme.spacing.xl,
    },
    heroContent: {
        padding: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginBottom: theme.spacing.md,
    },
    badgeIcon: {
        marginRight: theme.spacing.xs,
    },
    badgeText: {
        color: theme.colors.primary[200],
        fontSize: theme.typography.sizes.sm,
        fontWeight: theme.typography.weights.medium,
    },
    heroTitle: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: theme.typography.weights.extrabold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
        lineHeight: 32,
    },
    heroSubtitle: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text.secondary,
        lineHeight: 22,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    sectionIcon: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.lg,
        marginRight: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
    },
    cardIndicator: {
        height: 4,
        width: '100%',
        backgroundColor: theme.colors.primary[500],
        opacity: 0.7,
    },
    cardContent: {
        padding: theme.spacing.lg,
    },
    cardTitle: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    cardDescription: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.lg,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButtonText: {
        color: theme.colors.text.primary,
        fontWeight: theme.typography.weights.bold,
        marginLeft: theme.spacing.sm,
    },
    emptyContainer: {
        padding: theme.spacing.xxxl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginTop: theme.spacing.lg,
    },
    emptyText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.lg,
        marginTop: theme.spacing.md,
    },
});
