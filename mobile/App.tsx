import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <RootNavigator />
                {/* Ensure status bar contrast against our dark slate-950 background */}
                <StatusBar style="light" />
            </AuthProvider>
        </SafeAreaProvider>
    );
}
