import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../theme';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

export function Button({ 
    title, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    icon,
    style,
    disabled,
    ...props 
}: ButtonProps) {
    const getBgColor = () => {
        if (disabled) return theme.colors.surfaceLight;
        switch (variant) {
            case 'primary': return theme.colors.primary[600];
            case 'secondary': return theme.colors.surfaceLight;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.colors.text.muted;
        switch (variant) {
            case 'primary': return theme.colors.text.primary;
            case 'secondary': return theme.colors.text.primary;
            case 'outline': return theme.colors.primary[400];
            case 'ghost': return theme.colors.text.primary;
        }
    };

    const getBorder = () => {
        if (variant === 'outline') {
            return {
                borderWidth: 1,
                borderColor: disabled ? theme.colors.border : theme.colors.primary[500],
            };
        }
        return {};
    };

    const getPadding = () => {
        switch (size) {
            case 'sm': return { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm };
            case 'md': return { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md };
            case 'lg': return { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg };
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: getBgColor() },
                getBorder(),
                getPadding(),
                style as ViewStyle,
            ]}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            { color: getTextColor(), marginLeft: icon ? theme.spacing.xs : 0 },
                            size === 'lg' && { fontSize: theme.typography.sizes.lg },
                            size === 'sm' && { fontSize: theme.typography.sizes.sm },
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.xl,
    },
    text: {
        fontSize: theme.typography.sizes.md,
        fontWeight: theme.typography.weights.bold,
        textAlign: 'center',
    },
});
