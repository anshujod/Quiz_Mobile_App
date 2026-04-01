import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CreateQuizScreen from '../screens/admin/CreateQuizScreen';

export type AdminStackParamList = {
    CreateQuiz: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CreateQuiz" component={CreateQuizScreen} />
        </Stack.Navigator>
    );
}
