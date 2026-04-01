import React from 'react';
import { View, StyleSheet, Text, FlatList, RefreshControl } from 'react-native';
import { useHistory } from '../../hooks/useHistory';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate, getQuizTitle } from '../../shared/utils';

export default function UserHistoryScreen() {
    const { user } = useAuth();
    const { results, loading, refetch } = useHistory(user?.id);

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.iconContainer}>
                <Ionicons name="time" size={28} color={theme.colors.primary[400]} />
            </View>
            <View>
                <Text style={styles.title}>My Results</Text>
                <Text style={styles.subtitle}>Track your performance and progress</Text>
            </View>
        </View>
    );

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="analytics" size={48} color={theme.colors.text.muted} />
                <Text style={styles.emptyText}>You haven't taken any quizzes yet.</Text>
                <Text style={styles.emptySubtext}>Jump into a quiz to start building your history!</Text>
            </View>
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        const percentage = Math.round((item.score / item.total_questions) * 100);
        let gradeColor = theme.colors.text.secondary;
        let gradeIcon: keyof typeof Ionicons.glyphMap = 'radio-button-off';
        let gradeBg = 'rgba(255,255,255,0.05)';

        if (percentage >= 80) {
            gradeColor = theme.colors.success.DEFAULT;
            gradeIcon = 'star';
            gradeBg = theme.colors.success.bg;
        } else if (percentage >= 50) {
            gradeColor = theme.colors.warning.DEFAULT;
            gradeIcon = 'checkmark-circle';
            gradeBg = theme.colors.warning.bg;
        } else {
            gradeColor = theme.colors.error.DEFAULT;
            gradeIcon = 'close-circle';
            gradeBg = theme.colors.error.bg;
        }

        return (
            <View style={styles.card}>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{getQuizTitle(item.quizzes)}</Text>
                    <View style={styles.dateRow}>
                        <Ionicons name="calendar-clear" size={14} color={theme.colors.text.muted} />
                        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                    </View>
                </View>

                <View style={styles.cardStats}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>SCORE</Text>
                        <Text style={styles.statScore}>
                            {item.score} <Text style={styles.statTotal}>/ {item.total_questions}</Text>
                        </Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>GRADE</Text>
                        <View style={styles.gradeRow}>
                            <Text style={[styles.statGrade, { color: gradeColor }]}>{percentage}%</Text>
                            <View style={[styles.gradeIconCont, { backgroundColor: gradeBg }]}>
                                <Ionicons name={gradeIcon} size={14} color={gradeColor} />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={theme.colors.primary[500]} />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.sm,
    },
    iconContainer: {
        padding: theme.spacing.sm,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
        marginRight: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
    },
    subtitle: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginBottom: theme.spacing.md,
        padding: theme.spacing.lg,
        flexDirection: 'column',
    },
    cardInfo: {
        marginBottom: theme.spacing.md,
    },
    cardTitle: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text.muted,
        marginLeft: 6,
    },
    cardStats: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: theme.colors.borderLight,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.muted,
        letterSpacing: 1,
        marginBottom: 4,
    },
    statScore: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
    },
    statTotal: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text.secondary,
    },
    gradeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statGrade: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.bold,
    },
    gradeIconCont: {
        padding: 4,
        borderRadius: 12,
        marginLeft: theme.spacing.xs,
    },
    emptyContainer: {
        padding: theme.spacing.xxxl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.xl,
        marginTop: theme.spacing.lg,
    },
    emptyText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.medium,
        marginTop: theme.spacing.md,
        textAlign: 'center',
    },
    emptySubtext: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.sm,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
    },
});
