import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { theme } from '../../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: any;
}

export function Input({ label, error, style, containerStyle, ...props }: InputProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError,
                    style,
                ]}
                placeholderTextColor={theme.colors.text.muted}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md,
    },
    label: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.sm,
        fontWeight: theme.typography.weights.medium,
        marginBottom: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.xl,
        color: theme.colors.text.primary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 14, // Roughly matches py-3
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.medium,
    },
    inputError: {
        borderColor: theme.colors.error.DEFAULT,
    },
    errorText: {
        color: theme.colors.error.DEFAULT,
        fontSize: theme.typography.sizes.sm,
        marginTop: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
    },
});
