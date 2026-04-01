import React, { useState } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export default function SignupScreen() {
    const navigation = useNavigation<SignupScreenNavigationProp>();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async () => {
        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError(null);

        const cleanUsername = username.trim().replace(/\s+/g, '');
        const email = `${cleanUsername}@quizapp.local`;

        const { error, data } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else if (data.user) {
            // Create user profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: data.user.id,
                    username: cleanUsername,
                    role: 'user'
                }]);

            if (profileError) {
                console.warn('Error creating profile:', profileError);
                // We're authed, but profile creation failed
            }
            // Router will automatically switch to MainTabs via RootNavigator because user is now set in AuthContext
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex1}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="person-add" size={32} color={theme.colors.secondary[400]} />
                        </View>
                        <Text style={styles.title}>Join Us</Text>
                        <Text style={styles.subtitle}>Create an account to start playing</Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Username"
                            placeholder="Choose a username"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Input
                            label="Password"
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color={theme.colors.error.DEFAULT} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <Button
                            title="Create Account"
                            onPress={handleSignup}
                            loading={loading}
                            style={styles.submitButton}
                            size="lg"
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <Text
                                style={styles.footerLink}
                                onPress={() => navigation.navigate('Login')}
                            >
                                Sign in
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    flex1: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
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
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.error.bg,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    errorText: {
        color: theme.colors.error.DEFAULT,
        marginLeft: theme.spacing.xs,
        flex: 1,
    },
    submitButton: {
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.secondary[500],
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.xl,
    },
    footerText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.sm,
    },
    footerLink: {
        color: theme.colors.secondary[400],
        fontSize: theme.typography.sizes.sm,
        fontWeight: theme.typography.weights.bold,
    },
});
