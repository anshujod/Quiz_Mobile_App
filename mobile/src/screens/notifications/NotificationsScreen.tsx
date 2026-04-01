import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Switch, Alert, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerForPushNotificationsAsync } from '../../services/pushNotifications';
import { Button } from '../../components/ui/Button';

export default function NotificationsScreen() {
    const [pushEnabled, setPushEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial check (simplified for now, ideally persist this in AsyncStorage or DB)
    useEffect(() => {
        // In a real app, check device permission status on mount
    }, []);

        const toggleSwitch = async () => {
        if (!pushEnabled) {
            setLoading(true);
            try {
                const token = await registerForPushNotificationsAsync();
                if (token === 'expo-go-mock-token') {
                    setPushEnabled(true);
                    Alert.alert('Simulated!', 'Since you are in Expo Go, push notifications are not supported. This toggle was simulated. To get real remote push notifications, please use a development build.');
                } else if (token === 'missing-project-id') {
                    Alert.alert('EAS Project Required', 'Your app needs to be linked to an Expo account to get a push token. Run `npx eas init` in your terminal to set up a Project ID in your app.json!');
                    setPushEnabled(false);
                } else if (token) {
                    setPushEnabled(true);
                    Alert.alert('Success', 'Push notifications enabled!');
                } else {
                    Alert.alert('Error', 'Failed to get push token. Please check device settings.');
                }
            } catch (e) {
                Alert.alert('Error', 'An error occurred while enabling notifications.');
            } finally {
                setLoading(false);
            }
        } else {
            // "Disabling" on mobile usually just means we stop sending from backend 
            // or unregister the token in our DB
            setPushEnabled(false);
            Alert.alert('Disabled', 'You will no longer receive push notifications (requires backend sync to fully enforce).');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="notifications" size={28} color={theme.colors.secondary[400]} />
                    </View>
                    <View>
                        <Text style={styles.title}>Notifications</Text>
                        <Text style={styles.subtitle}>Stay updated on new quizzes</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="phone-portrait-outline" size={24} color={theme.colors.text.primary} />
                        <Text style={styles.cardTitle}>Push Notifications</Text>
                    </View>
                    <Text style={styles.cardDesc}>
                        Receive alerts directly on your device when a new quiz is published or when you have new challenges.
                    </Text>
                    
                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Enable Alerts</Text>
                        <Switch
                            trackColor={{ false: theme.colors.surfaceLight, true: theme.colors.primary[500] }}
                            thumbColor={theme.colors.text.primary}
                            ios_backgroundColor={theme.colors.surfaceLight}
                            onValueChange={toggleSwitch}
                            value={pushEnabled}
                            disabled={loading}
                        />
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={theme.colors.text.muted} />
                    <Text style={styles.infoText}>
                        We respect your focus. Notifications are only sent for major events like new cosmic quiz drops or leaderboard changes.
                    </Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    iconContainer: {
        padding: theme.spacing.sm,
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
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
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    cardTitle: {
        fontSize: theme.typography.sizes.lg,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.sm,
    },
    cardDesc: {
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
        marginBottom: theme.spacing.xl,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    switchLabel: {
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.medium,
        color: theme.colors.text.primary,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    infoText: {
        flex: 1,
        fontSize: theme.typography.sizes.sm,
        color: theme.colors.text.muted,
        marginLeft: theme.spacing.sm,
        lineHeight: 20,
    },
});
