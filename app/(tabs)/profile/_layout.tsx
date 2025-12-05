import { Stack } from 'expo-router';
import { useTheme } from '@/theme/index';

export default function ProfileStackLayout() {
    const { colors } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: colors.background,
                },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="edit-name" />
            <Stack.Screen name="ancestral-form" />
            <Stack.Screen name="ancestral-detail" />
            <Stack.Screen name="ancestral-list" />
            <Stack.Screen name="complete-profile" />
        </Stack>
    );
}

