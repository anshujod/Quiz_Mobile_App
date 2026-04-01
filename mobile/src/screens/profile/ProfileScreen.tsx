import React from 'react';
import { View, StyleSheet, Text, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
    const { user, profile, signOut } = useAuth();

    const handleSignOut = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Sign Out", 
                    style: "destructive",
                    onPress: async () => {
                        await signOut();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>

                <View style={styles.profileCard}>
                    <LinearGradient
                        colors={[theme.colors.primary[500], theme.colors.secondary[600]]}
                        style={styles.avatarContainer}
                    >
                        <Text style={styles.avatarText}>
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </LinearGradient>

                    <View style={styles.userInfo}>
                        <Text style={styles.username}>{profile?.username || user?.email}</Text>
                        <Text style={styles.email}>{user?.email}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{profile?.role || 'user'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Setup</Text>
                    {profile?.role === 'admin' && (
                        <View style={styles.adminNote}>
                            <Ionicons name="sparkles" size={24} color={theme.colors.secondary[400]} />
                            <Text style={styles.adminNoteText}>
                                Admin features are now live! You can create and manage quizzes directly from the "Admin" tab.
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <Button 
                        title="Sign Out" 
                        onPress={handleSignOut}
                        variant="ghost"
                        icon={<Ionicons name="log-out" size={20} color={theme.colors.error.DEFAULT} />}
                        style={styles.signOutButton}
                    />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.lg,
    },
    header: {
        marginBottom: theme.spacing.xl,
    },
    headerTitle: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginBottom: theme.spacing.xxl,
    },
    avatarContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.lg,
    },
    avatarText: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: theme.typography.weights.bold,
        color: '#fff',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    email: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    roleText: {
        fontSize: 12,
        color: theme.colors.primary[300],
        textTransform: 'uppercase',
        fontWeight: theme.typography.weights.bold,
    },
    section: {
        marginBottom: theme.spacing.xxl,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    adminNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.2)',
    },
    adminNoteText: {
        flex: 1,
        marginLeft: theme.spacing.md,
        color: theme.colors.secondary[200],
        fontSize: theme.typography.sizes.sm,
        lineHeight: 20,
    },
    footer: {
        marginTop: 'auto',
        paddingTop: theme.spacing.xl,
    },
    signOutButton: {
        backgroundColor: theme.colors.error.bg,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
});
