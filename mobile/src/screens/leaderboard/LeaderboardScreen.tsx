import React from 'react';
import { View, StyleSheet, Text, FlatList, RefreshControl } from 'react-native';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function LeaderboardScreen() {
    const { entries, loading, refetch } = useLeaderboard();

    const topThree = entries.slice(0, 3);
    const rest = entries.slice(3);

    const renderPodium = () => {
        if (topThree.length === 0) return null;

        return (
            <View style={styles.podiumContainer}>
                {/* 2nd Place */}
                {topThree[1] && (
                    <View style={[styles.podiumItem, styles.podium2]}>
                        <View style={styles.podiumAvatarCont}>
                            <View style={[styles.podiumAvatar, { backgroundColor: theme.colors.surfaceLight }]}>
                                <Text style={styles.podiumAvatarText}>{topThree[1].username.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.medalBadge}>
                                <Ionicons name="medal" size={14} color="#94a3b8" />
                            </View>
                        </View>
                        <Text style={styles.podiumName} numberOfLines={1}>{topThree[1].username}</Text>
                        <Text style={styles.podiumScore}>{topThree[1].total_score} pts</Text>
                        <LinearGradient colors={['#475569', '#334155', 'transparent']} style={[styles.podiumBase, { height: 80 }]}>
                            <Text style={styles.podiumRank}>2</Text>
                        </LinearGradient>
                    </View>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                    <View style={[styles.podiumItem, styles.podium1]}>
                        <Ionicons name="recording" size={32} color="#facc15" style={{ marginBottom: 4 }} />
                        <View style={styles.podiumAvatarCont}>
                            <View style={[styles.podiumAvatar, { backgroundColor: 'rgba(250, 204, 21, 0.2)', borderColor: '#facc15', borderWidth: 2 }]}>
                                <Text style={[styles.podiumAvatarText, { color: '#facc15' }]}>{topThree[0].username.charAt(0).toUpperCase()}</Text>
                            </View>
                        </View>
                        <Text style={[styles.podiumName, { fontSize: 16 }]} numberOfLines={1}>{topThree[0].username}</Text>
                        <Text style={[styles.podiumScore, { color: '#facc15' }]}>{topThree[0].total_score} pts</Text>
                        <LinearGradient colors={['rgba(202, 138, 4, 0.4)', 'rgba(202, 138, 4, 0.1)', 'transparent']} style={[styles.podiumBase, { height: 120, borderColor: 'rgba(250, 204, 21, 0.3)' }]}>
                            <Text style={[styles.podiumRank, { color: 'rgba(250, 204, 21, 0.5)' }]}>1</Text>
                        </LinearGradient>
                    </View>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                    <View style={[styles.podiumItem, styles.podium3]}>
                        <View style={styles.podiumAvatarCont}>
                            <View style={[styles.podiumAvatar, { backgroundColor: 'rgba(217, 119, 6, 0.2)' }]}>
                                <Text style={[styles.podiumAvatarText, { color: '#d97706' }]}>{topThree[2].username.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.medalBadge}>
                                <Ionicons name="medal" size={14} color="#d97706" />
                            </View>
                        </View>
                        <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].username}</Text>
                        <Text style={[styles.podiumScore, { color: '#d97706' }]}>{topThree[2].total_score} pts</Text>
                        <LinearGradient colors={['rgba(180, 83, 9, 0.4)', 'rgba(180, 83, 9, 0.2)', 'transparent']} style={[styles.podiumBase, { height: 60 }]}>
                            <Text style={[styles.podiumRank, { color: 'rgba(217, 119, 6, 0.5)' }]}>3</Text>
                        </LinearGradient>
                    </View>
                )}
            </View>
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.iconContainer}>
                <Ionicons name="trophy" size={32} color="#facc15" />
            </View>
            <Text style={styles.title}>Hall of Fame</Text>
            <Text style={styles.subtitle}>Celebrating our top performers.</Text>
            {renderPodium()}

            {rest.length > 0 && (
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableCol, styles.colRank]}>Rank</Text>
                    <Text style={[styles.tableCol, styles.colPlayer]}>Player</Text>
                    <Text style={[styles.tableCol, styles.colQuizzes]}>Quizzes</Text>
                    <Text style={[styles.tableCol, styles.colScore]}>Score</Text>
                </View>
            )}
        </View>
    );

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="people" size={48} color={theme.colors.text.muted} />
                <Text style={styles.emptyText}>No results yet. Join the games!</Text>
            </View>
        );
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const rank = index + 4;
        return (
            <View style={styles.row}>
                <View style={[styles.colRank, styles.rankBadgeCont]}>
                    <View style={styles.rankBadge}>
                        <Text style={styles.rankBadgeText}>{rank}</Text>
                    </View>
                </View>
                <View style={[styles.colPlayer, styles.playerRow]}>
                    <View style={styles.listAvatar}>
                        <Text style={styles.listAvatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.playerName} numberOfLines={1}>{item.username}</Text>
                </View>
                <Text style={[styles.colQuizzes, styles.quizzesText]}>{item.quizzes_taken}</Text>
                <View style={styles.colScore}>
                    <View style={styles.scoreBadge}>
                        <Text style={styles.scoreBadgeText}>{item.total_score} pts</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={rest}
                keyExtractor={(item) => item.user_id}
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
        paddingBottom: theme.spacing.xxxl,
    },
    header: {
        padding: theme.spacing.lg,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(250, 204, 21, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.2)',
    },
    title: {
        fontSize: theme.typography.sizes.xxxl,
        fontWeight: theme.typography.weights.extrabold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xxl,
    },
    podiumContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.xl,
        width: '100%',
        minHeight: 220,
    },
    podiumItem: {
        flex: 1,
        alignItems: 'center',
    },
    podium1: {
        zIndex: 10,
        marginHorizontal: -10,
    },
    podium2: {
        zIndex: 1,
    },
    podium3: {
        zIndex: 1,
    },
    podiumAvatarCont: {
        position: 'relative',
        marginBottom: theme.spacing.sm,
    },
    podiumAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    podiumAvatarText: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
    },
    medalBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        padding: 2,
    },
    podiumName: {
        color: theme.colors.text.primary,
        fontWeight: theme.typography.weights.bold,
        fontSize: theme.typography.sizes.sm,
        marginBottom: 2,
        textAlign: 'center',
    },
    podiumScore: {
        color: theme.colors.primary[300],
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: theme.spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    podiumBase: {
        width: '100%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: theme.spacing.sm,
    },
    podiumRank: {
        fontSize: 40,
        fontWeight: theme.typography.weights.extrabold,
        color: 'rgba(255,255,255,0.2)',
    },
    tableHeader: {
        flexDirection: 'row',
        width: '100%',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: theme.colors.borderLight,
        marginTop: theme.spacing.lg,
    },
    tableCol: {
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.secondary,
    },
    colRank: { width: 50, textAlign: 'center' },
    colPlayer: { flex: 1, marginLeft: theme.spacing.md },
    colQuizzes: { width: 70, textAlign: 'center' },
    colScore: { width: 90, textAlign: 'right' },
    
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: theme.colors.borderLight,
        marginHorizontal: theme.spacing.lg,
    },
    rankBadgeCont: {
        alignItems: 'center',
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    rankBadgeText: {
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.weights.bold,
        fontSize: 12,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary[600],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    listAvatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    playerName: {
        color: theme.colors.text.primary,
        fontWeight: theme.typography.weights.medium,
        fontSize: theme.typography.sizes.sm,
        flex: 1,
    },
    quizzesText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.sm,
    },
    scoreBadge: {
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    scoreBadgeText: {
        color: theme.colors.primary[400],
        fontWeight: theme.typography.weights.bold,
        fontSize: 12,
    },
    emptyContainer: {
        padding: theme.spacing.xxxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.lg,
        marginTop: theme.spacing.md,
    },
});
