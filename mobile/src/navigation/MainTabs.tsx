import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

import HomeScreen from '../screens/home/HomeScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import UserHistoryScreen from '../screens/history/UserHistoryScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import QuizPlayerScreen from '../screens/quiz/QuizPlayerScreen';

import AdminStack from './AdminStack';
import { useAuth } from '../context/AuthContext';

export type HomeStackParamList = {
    HomeMain: undefined;
    QuizPlayer: { quizId: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeMain" component={HomeScreen} />
            <Stack.Screen name="QuizPlayer" component={QuizPlayerScreen} />
        </Stack.Navigator>
    );
}

export type MainTabsParamList = {
    HomeTab: undefined;
    LeaderboardTab: undefined;
    HistoryTab: undefined;
    NotificationsTab: undefined;
    ProfileTab: undefined;
    AdminTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'admin';

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';

                    if (route.name === 'HomeTab') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'LeaderboardTab') {
                        iconName = focused ? 'podium' : 'podium-outline';
                    } else if (route.name === 'HistoryTab') {
                        iconName = focused ? 'time' : 'time-outline';
                    } else if (route.name === 'NotificationsTab') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else if (route.name === 'AdminTab') {
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary[400],
                tabBarInactiveTintColor: theme.colors.text.muted,
                tabBarStyle: {
                    backgroundColor: theme.colors.background,
                    borderTopColor: theme.colors.border,
                },
                tabBarShowLabel: false,
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeStack} />
            <Tab.Screen name="LeaderboardTab" component={LeaderboardScreen} />
            <Tab.Screen name="HistoryTab" component={UserHistoryScreen} />
            {isAdmin && <Tab.Screen name="AdminTab" component={AdminStack} />}
            <Tab.Screen name="NotificationsTab" component={NotificationsScreen} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

