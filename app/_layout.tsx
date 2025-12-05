import { Stack } from 'expo-router';
import { useFonts, TitilliumWeb_400Regular, TitilliumWeb_600SemiBold, TitilliumWeb_700Bold } from '@expo-google-fonts/titillium-web';
import { ThemeProvider, useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';
import { UserProfileProvider } from '@/context/UserProfileContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Inner component that has access to theme
function RootLayoutNav() {
    const { isDark, colors } = useTheme();

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: {
                        backgroundColor: colors.background,
                    },
                    animation: 'fade',
                }}
            >
                <Stack.Screen
                    name="(auth)"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="scan-history"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="scan-details"
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack>
        </>
    );
}

// Root component that provides theme
export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        TitilliumWeb_400Regular,
        TitilliumWeb_600SemiBold,
        TitilliumWeb_700Bold,
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <AuthProvider>
            <UserProfileProvider>
                <GestureHandlerRootView style={styles.container}>
                    <SafeAreaProvider>
                        <ThemeProvider>
                            <RootLayoutNav />
                        </ThemeProvider>
                    </SafeAreaProvider>
                </GestureHandlerRootView>
            </UserProfileProvider>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});