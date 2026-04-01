import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configure notification behavior
if (!isExpoGo) {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token: any | undefined;

    // Expo Go (app store/TestFlight) does not support remote push since SDK 53.
    // Skip registration there and rely on a dev build or store build instead.
    if (isExpoGo) {
        console.warn('Push notifications are disabled in Expo Go. Build a dev client or store build to test pushes.');
        return 'expo-go-mock-token';
    }

    const Notifications = require('expo-notifications');

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
    }
    
    // Use project ID for bare/expo config, handles standalone builds cleanly
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
        console.warn('No EAS projectId found; skipping push token registration.');
        return 'missing-project-id';
    }

    token = await Notifications.getExpoPushTokenAsync({ projectId });
    
    // Save to our backend using the existing endpoint, sending the string token
    if (!token?.data) {
        return undefined;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        
        await fetch(`${backendUrl}/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Flag so backend knows this is an expo token and not a web push sub
                subscription: { type: 'expo', token: token.data }, 
                userId: user?.id
            })
        });
        console.log('Registered Push Token: ', token.data);
    } catch (error) {
        console.warn('Error saving subscription to backend: ', error);
    }

    return token.data;
}
