import { Stack } from 'expo-router';
import { useTheme } from '@theme/index';

export default function AuthLayout() {
    const { colors } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: colors.background,
                },
                // Auth screens usually have these animations
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
            }}
        >
            {/* Login Screen */}
            <Stack.Screen
                name="login"
                options={{
                    title: 'Sign In',
                }}
            />

            {/* Register Screen */}
            <Stack.Screen
                name="signup"
                options={{
                    title: 'Create Account',
                }}
            />
        </Stack>
    );
}